import { query } from "@/lib/db";

/** Dias futuros (a partir de hoje) que o profissional marcou como indisponível
 * no calendário próprio - substitui a integração via Google Agenda/.ics. */
export async function listDiasIndisponiveis(profissionalId: string): Promise<string[]> {
  const rows = await query<{ data: string }>(
    `SELECT data::text AS data FROM profissional_dias_indisponiveis
     WHERE profissional_id = $1 AND data >= CURRENT_DATE
     ORDER BY data ASC`,
    [profissionalId]
  );
  return rows.map((r) => r.data);
}
