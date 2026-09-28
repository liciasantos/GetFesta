import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPermutaConfig, hojeISO, sincronizarPermutas } from "@/lib/data/permuta";
import { avisarEmpresa } from "@/lib/permuta/notificacoes";

function somarDias(iso: string, dias: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

/**
 * Roda diariamente (ver vercel.json):
 *  - confirma automaticamente entregas vencidas e conclui acordos (mesma
 *    rotina que as páginas de permuta rodam ao abrir);
 *  - lembra quem recebeu um serviço ontem de confirmar e avaliar;
 *  - lembra quem presta um serviço daqui a 2 dias.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cfg = await getPermutaConfig();
  if (!cfg.ativa) return NextResponse.json({ ativa: false });
  await sincronizarPermutas(cfg);

  const hoje = hojeISO();
  const base = `SELECT e.acordo_id, e.prestador_id, e.beneficiario_id, e.titulo, to_char(e.data_evento, 'YYYY-MM-DD') AS data_evento,
                       p.nome_fantasia AS prestador_nome, b.nome_fantasia AS beneficiario_nome
                  FROM permuta_entregas e
                  JOIN permuta_acordos a ON a.id = e.acordo_id
                  JOIN empresas p ON p.usuario_id = e.prestador_id
                  JOIN empresas b ON b.usuario_id = e.beneficiario_id
                 WHERE a.status = 'em_execucao' AND e.status = 'agendada' AND e.data_evento = $1::date`;
  type Linha = {
    acordo_id: string;
    prestador_id: string;
    beneficiario_id: string;
    titulo: string;
    data_evento: string;
    prestador_nome: string;
    beneficiario_nome: string;
  };

  const paraConfirmar = await query<Linha>(base, [somarDias(hoje, -1)]);
  for (const l of paraConfirmar) {
    await avisarEmpresa(l.beneficiario_id, {
      tipo: "lembrete_confirmar",
      acordoId: l.acordo_id,
      de: l.prestador_nome,
      servico: l.titulo,
      data: l.data_evento,
    });
  }

  const chegando = await query<Linha>(base, [somarDias(hoje, 2)]);
  for (const l of chegando) {
    await avisarEmpresa(l.prestador_id, {
      tipo: "lembrete_entrega",
      acordoId: l.acordo_id,
      para: l.beneficiario_nome,
      servico: l.titulo,
      data: l.data_evento,
    });
  }

  return NextResponse.json({ lembretesConfirmar: paraConfirmar.length, lembretesEntrega: chegando.length });
}
