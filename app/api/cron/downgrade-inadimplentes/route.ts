import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

/**
 * Roda diariamente (ver vercel.json). Empresas com assinatura paga com mais
 * de 5 dias de atraso (status IN ('ativa','atrasada') e fim_em vencido ha
 * mais de 5 dias) voltam automaticamente pro plano Gratis - ate a integracao
 * de pagamento real existir, "atraso" e definido manualmente pelo admin em
 * /admin/pagamentos (marcarAssinaturaAtrasada) ou pelo simples vencimento de
 * fim_em sem renovacao.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const planoGratis = await queryOne<{ id: number }>(`SELECT id FROM planos WHERE tipo = 'empresa_gratis' LIMIT 1`);
  if (!planoGratis) return NextResponse.json({ error: "plano gratis nao encontrado" }, { status: 500 });

  const vencidas = await query<{ usuario_id: string; assinatura_id: string }>(
    `SELECT DISTINCT ON (a.usuario_id) a.usuario_id, a.id AS assinatura_id
     FROM assinaturas a
     JOIN planos p ON p.id = a.plano_id
     WHERE a.status IN ('ativa', 'atrasada')
       AND p.tipo::text LIKE 'empresa_%' AND p.tipo != 'empresa_gratis'
       AND a.fim_em IS NOT NULL
       AND a.fim_em < now() - interval '5 days'
     ORDER BY a.usuario_id, a.criado_em DESC`
  );

  for (const v of vencidas) {
    await query(`UPDATE assinaturas SET status = 'expirada' WHERE id = $1`, [v.assinatura_id]);
    await query(`INSERT INTO assinaturas (usuario_id, plano_id, status) VALUES ($1, $2, 'ativa')`, [
      v.usuario_id,
      planoGratis.id,
    ]);
  }

  return NextResponse.json({ rebaixadas: vencidas.length });
}
