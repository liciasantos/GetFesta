import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { enfileirarLembretes } from "@/lib/whatsapp/avisos";
import { getWhatsAppConfig, processarFila } from "@/lib/whatsapp/fila";
import { segredoConfere } from "../autorizacao";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHAVE_LEMBRETES = "whatsapp_lembretes_dia";

/**
 * Chamado a cada minuto pelo cron do servidor do WAHA:
 *   curl -H "Authorization: Bearer $WHATSAPP_SECRET" https://SITE/api/whatsapp/processar
 * Uma vez por dia (a partir das 9h de Brasília) enfileira os lembretes de
 * véspera; em toda chamada envia o que estiver na fila por até ~50s.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!segredoConfere(auth)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cfg = await getWhatsAppConfig();
  let lembretes = 0;
  if (cfg.ativo && cfg.lembretes) {
    const agora = await queryOne<{ dia: string; hora: number }>(
      `SELECT to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS dia,
              extract(hour FROM now() AT TIME ZONE 'America/Sao_Paulo')::int AS hora`
    );
    const ultimo = await queryOne<{ valor: string }>(`SELECT valor FROM configuracoes_site WHERE chave = $1`, [CHAVE_LEMBRETES]);
    if (agora && agora.hora >= 9 && ultimo?.valor !== agora.dia) {
      await query(
        `INSERT INTO configuracoes_site (chave, valor, atualizado_em) VALUES ($1, $2, now())
         ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = now()`,
        [CHAVE_LEMBRETES, agora.dia]
      );
      lembretes = await enfileirarLembretes();
    }
  }

  const r = await processarFila(50_000);
  return NextResponse.json({ ...r, lembretesEnfileirados: lembretes });
}

export const POST = GET;
