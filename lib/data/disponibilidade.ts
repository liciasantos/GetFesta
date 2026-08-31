import { query } from "@/lib/db";

export type BloqueioDisponibilidade = {
  id: string;
  data: string;
  horaInicio: string | null;
  horaFim: string | null;
};

/** Bloqueios futuros (a partir de hoje) que o profissional marcou no
 * calendário próprio - substitui a integração via Google Agenda/.ics.
 * horaInicio/horaFim nulos = dia inteiro indisponível; preenchidos = só
 * aquele intervalo do dia. */
export async function listBloqueiosIndisponibilidade(profissionalId: string): Promise<BloqueioDisponibilidade[]> {
  const rows = await query<{ id: string; data: string; hora_inicio: string | null; hora_fim: string | null }>(
    `SELECT id, data::text AS data,
            to_char(hora_inicio, 'HH24:MI') AS hora_inicio, to_char(hora_fim, 'HH24:MI') AS hora_fim
     FROM profissional_dias_indisponiveis
     WHERE profissional_id = $1 AND data >= CURRENT_DATE
     ORDER BY data ASC, hora_inicio ASC NULLS FIRST`,
    [profissionalId]
  );
  return rows.map((r) => ({ id: r.id, data: r.data, horaInicio: r.hora_inicio, horaFim: r.hora_fim }));
}
