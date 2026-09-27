import { query, queryOne } from "@/lib/db";

export type EventoRsvpResumo = {
  id: string;
  titulo: string;
  data_evento: string;
  slug_publico: string;
  criado_em: string;
  cor_fundo: string | null;
  imagem_capa: string | null;
  total_convidados: number;
  total_confirmados: number;
  total_recusados: number;
  total_adultos: number;
  total_criancas: number;
};

const EVENTO_RSVP_RESUMO_SELECT = `
  SELECT
    e.id, e.titulo, e.data_evento, e.slug_publico, e.criado_em, e.cor_fundo, e.imagem_capa,
    count(c.id)::int AS total_convidados,
    count(c.id) FILTER (WHERE c.confirmado = true)::int AS total_confirmados,
    count(c.id) FILTER (WHERE c.confirmado = false)::int AS total_recusados,
    count(c.id) FILTER (WHERE c.tipo_convidado = 'adulto')::int AS total_adultos,
    count(c.id) FILTER (WHERE c.tipo_convidado = 'crianca')::int AS total_criancas
  FROM eventos_rsvp e
  LEFT JOIN rsvp_convidados c ON c.evento_rsvp_id = e.id
`;

/** Lista das listas de convidados do cliente logado, mais recente primeiro. */
export async function listMeusEventosRsvp(clienteId: string): Promise<EventoRsvpResumo[]> {
  return query<EventoRsvpResumo>(
    `${EVENTO_RSVP_RESUMO_SELECT} WHERE e.cliente_id = $1 GROUP BY e.id ORDER BY e.data_evento DESC`,
    [clienteId]
  );
}

/** Busca uma lista de convidados garantindo que pertence ao cliente logado
 * (evita que um cliente acesse /lista-convidados/[id] de outro pelo id). */
export async function getMeuEventoRsvp(id: string, clienteId: string): Promise<EventoRsvpResumo | null> {
  return queryOne<EventoRsvpResumo>(`${EVENTO_RSVP_RESUMO_SELECT} WHERE e.id = $1 AND e.cliente_id = $2 GROUP BY e.id`, [
    id,
    clienteId,
  ]);
}

export type Convidado = {
  id: string;
  nome: string;
  telefone: string | null;
  tipo_convidado: "adulto" | "crianca";
  idade_anos: number | null;
  confirmado: boolean | null;
  respondido_em: string | null;
};

export async function listConvidados(eventoRsvpId: string): Promise<Convidado[]> {
  return query<Convidado>(
    `SELECT id, nome, telefone, tipo_convidado, idade_anos, confirmado, respondido_em
     FROM rsvp_convidados
     WHERE evento_rsvp_id = $1
     ORDER BY nome`,
    [eventoRsvpId]
  );
}

export type EventoRsvpPublico = {
  id: string;
  titulo: string;
  data_evento: string;
  slug_publico: string;
  anfitriao_nome: string;
  cor_fundo: string | null;
  imagem_capa: string | null;
};

/** Versão pública (sem dados do cliente além do primeiro nome, pra saudação
 * tipo "Você foi convidado por Fulano") - usada na página /rsvp/[slug], que
 * qualquer convidado acessa sem login. Nunca expor telefone/e-mail do
 * cliente aqui. */
export async function getEventoRsvpPorSlug(slug: string): Promise<EventoRsvpPublico | null> {
  return queryOne<EventoRsvpPublico>(
    `SELECT e.id, e.titulo, e.data_evento, e.slug_publico, e.cor_fundo, e.imagem_capa,
            split_part(c.nome, ' ', 1) AS anfitriao_nome
     FROM eventos_rsvp e
     JOIN clientes c ON c.usuario_id = e.cliente_id
     WHERE e.slug_publico = $1`,
    [slug]
  );
}
