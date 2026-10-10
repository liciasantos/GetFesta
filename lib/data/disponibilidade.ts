import { query } from "@/lib/db";

export type BloqueioDisponibilidade = {
  id: string;
  data: string;
  horaInicio: string | null;
  horaFim: string | null;
  observacao: string | null;
  /** bloqueio criado ao ser escolhido numa vaga - o calendário mostra o nome
   * da vaga no lugar de "Indisponível" (a nota do profissional tem prioridade) */
  vaga?: { nome: string; empresa: string } | null;
};

/** Bloqueios futuros (a partir de hoje) que o profissional marcou no
 * calendário próprio - substitui a integração via Google Agenda/.ics.
 * horaInicio/horaFim nulos = dia inteiro indisponível; preenchidos = só
 * aquele intervalo do dia. observacao é uma nota livre e opcional. */
export async function listBloqueiosIndisponibilidade(profissionalId: string): Promise<BloqueioDisponibilidade[]> {
  const rows = await query<{
    id: string;
    data: string;
    hora_inicio: string | null;
    hora_fim: string | null;
    observacao: string | null;
    vaga_nome: string | null;
    empresa_nome: string | null;
  }>(
    `SELECT b.id, b.data::text AS data,
            to_char(b.hora_inicio, 'HH24:MI') AS hora_inicio, to_char(b.hora_fim, 'HH24:MI') AS hora_fim,
            b.observacao,
            COALESCE(NULLIF(trim(v.titulo), ''), cp.nome) AS vaga_nome, e.nome_fantasia AS empresa_nome
     FROM profissional_dias_indisponiveis b
     LEFT JOIN vagas_profissionais v ON v.id = b.vaga_id
     LEFT JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
     LEFT JOIN empresas e ON e.usuario_id = v.empresa_id
     WHERE b.profissional_id = $1 AND b.data >= CURRENT_DATE
     ORDER BY b.data ASC, b.hora_inicio ASC NULLS FIRST`,
    [profissionalId]
  );
  return rows.map((r) => ({
    id: r.id,
    data: r.data,
    horaInicio: r.hora_inicio,
    horaFim: r.hora_fim,
    observacao: r.observacao,
    vaga: r.vaga_nome ? { nome: r.vaga_nome, empresa: r.empresa_nome ?? "" } : null,
  }));
}
