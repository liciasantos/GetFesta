"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  adicionarConvidadoSchema,
  atualizarAparenciaEventoRsvpSchema,
  buscarConvidadoPublicoSchema,
  confirmarConvidadoPublicoSchema,
  criarEventoRsvpSchema,
} from "@/lib/validators";
import { gerarSlugUnicoEventoRsvp } from "@/lib/slug";

export type RsvpActionState = { error?: string } | undefined;

export async function criarEventoRsvp(_prevState: RsvpActionState, formData: FormData): Promise<RsvpActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const parsed = criarEventoRsvpSchema.safeParse({
    titulo: formData.get("titulo"),
    dataEvento: formData.get("dataEvento"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const slug = await gerarSlugUnicoEventoRsvp(parsed.data.titulo);
  const evento = await queryOne<{ id: string }>(
    `INSERT INTO eventos_rsvp (cliente_id, titulo, data_evento, slug_publico) VALUES ($1,$2,$3,$4) RETURNING id`,
    [session.usuarioId, parsed.data.titulo, parsed.data.dataEvento, slug]
  );
  if (!evento) return { error: "Não foi possível criar a lista, tente novamente." };

  revalidatePath("/lista-convidados");
  redirect(`/lista-convidados/${evento.id}`);
}

export type ExcluirEventoRsvpResult = { error?: string; ok?: boolean };

export async function excluirEventoRsvp(eventoRsvpId: string): Promise<ExcluirEventoRsvpResult> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const evento = await queryOne<{ id: string }>(`SELECT id FROM eventos_rsvp WHERE id = $1 AND cliente_id = $2`, [
    eventoRsvpId,
    session.usuarioId,
  ]);
  if (!evento) return { error: "Lista não encontrada." };

  await query(`DELETE FROM eventos_rsvp WHERE id = $1`, [eventoRsvpId]);

  revalidatePath("/lista-convidados");
  return { ok: true };
}

/** Personaliza a página pública /rsvp/[slug]: cor de fundo e/ou imagem de
 * capa da festa. Os dois campos são opcionais e independentes - o form
 * manda os dois juntos, mas nada aqui obriga preencher ambos. */
export async function atualizarAparenciaEventoRsvp(
  _prevState: RsvpActionState,
  formData: FormData
): Promise<RsvpActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const parsed = atualizarAparenciaEventoRsvpSchema.safeParse({
    eventoRsvpId: formData.get("eventoRsvpId"),
    corFundo: formData.get("corFundo") || undefined,
    imagemCapa: formData.get("imagemCapa") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const evento = await queryOne<{ id: string; slug_publico: string }>(
    `SELECT id, slug_publico FROM eventos_rsvp WHERE id = $1 AND cliente_id = $2`,
    [parsed.data.eventoRsvpId, session.usuarioId]
  );
  if (!evento) return { error: "Lista não encontrada." };

  await query(`UPDATE eventos_rsvp SET cor_fundo = $1, imagem_capa = $2 WHERE id = $3`, [
    parsed.data.corFundo ?? null,
    parsed.data.imagemCapa ?? null,
    parsed.data.eventoRsvpId,
  ]);

  revalidatePath(`/lista-convidados/${parsed.data.eventoRsvpId}`);
  revalidatePath(`/rsvp/${evento.slug_publico}`);
  return undefined;
}

export async function adicionarConvidado(_prevState: RsvpActionState, formData: FormData): Promise<RsvpActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const parsed = adicionarConvidadoSchema.safeParse({
    eventoRsvpId: formData.get("eventoRsvpId"),
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    tipoConvidado: formData.get("tipoConvidado") || "adulto",
    idadeAnos: formData.get("idadeAnos") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const evento = await queryOne<{ id: string }>(`SELECT id FROM eventos_rsvp WHERE id = $1 AND cliente_id = $2`, [
    parsed.data.eventoRsvpId,
    session.usuarioId,
  ]);
  if (!evento) return { error: "Lista não encontrada." };

  await query(
    `INSERT INTO rsvp_convidados (evento_rsvp_id, nome, telefone, tipo_convidado, idade_anos) VALUES ($1,$2,$3,$4,$5)`,
    [
      parsed.data.eventoRsvpId,
      parsed.data.nome,
      parsed.data.telefone ?? null,
      parsed.data.tipoConvidado,
      parsed.data.tipoConvidado === "crianca" ? (parsed.data.idadeAnos ?? null) : null,
    ]
  );

  revalidatePath(`/lista-convidados/${parsed.data.eventoRsvpId}`);
  return undefined;
}

export type ConvidadoActionResult = { error?: string; ok?: boolean };

/** Garante que o convidado pertence a uma lista do cliente logado antes de
 * mexer nele - o id do convidado sozinho não prova posse. */
async function getEventoIdDoConvidadoDoCliente(convidadoId: string, clienteId: string): Promise<string | null> {
  const row = await queryOne<{ evento_rsvp_id: string }>(
    `SELECT c.evento_rsvp_id
     FROM rsvp_convidados c
     JOIN eventos_rsvp e ON e.id = c.evento_rsvp_id
     WHERE c.id = $1 AND e.cliente_id = $2`,
    [convidadoId, clienteId]
  );
  return row?.evento_rsvp_id ?? null;
}

/** Marca a resposta do convidado: true = confirmado, false = recusado, null
 * = volta pro estado "aguardando resposta". */
export async function atualizarConfirmacaoConvidado(
  convidadoId: string,
  confirmado: boolean | null
): Promise<ConvidadoActionResult> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const eventoId = await getEventoIdDoConvidadoDoCliente(convidadoId, session.usuarioId);
  if (!eventoId) return { error: "Convidado não encontrado." };

  await query(`UPDATE rsvp_convidados SET confirmado = $1, respondido_em = now() WHERE id = $2`, [
    confirmado,
    convidadoId,
  ]);

  revalidatePath(`/lista-convidados/${eventoId}`);
  return { ok: true };
}

export async function removerConvidado(convidadoId: string): Promise<ConvidadoActionResult> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const eventoId = await getEventoIdDoConvidadoDoCliente(convidadoId, session.usuarioId);
  if (!eventoId) return { error: "Convidado não encontrado." };

  await query(`DELETE FROM rsvp_convidados WHERE id = $1`, [convidadoId]);

  revalidatePath(`/lista-convidados/${eventoId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------
// PÁGINA PÚBLICA /rsvp/[slug] - sem login, acessada pelo convidado. Toda
// consulta/gravação aqui é escopada por slug_publico (nunca por cliente_id),
// já que quem chama não tem sessão.
// ---------------------------------------------------------------------

export type ConvidadoPublico = {
  id: string;
  nome: string;
  tipo_convidado: "adulto" | "crianca";
  idade_anos: number | null;
  confirmado: boolean | null;
};

/** Localiza o convite do próprio convidado pelo telefone que ele digitar -
 * evita expor a lista completa de convidados (privacidade dos outros
 * convidados) na página pública. */
export async function buscarConvidadoPublico(slug: string, telefone: string): Promise<ConvidadoPublico | null> {
  const parsed = buscarConvidadoPublicoSchema.safeParse({ slug, telefone });
  if (!parsed.success) return null;

  return queryOne<ConvidadoPublico>(
    `SELECT c.id, c.nome, c.tipo_convidado, c.idade_anos, c.confirmado
     FROM rsvp_convidados c
     JOIN eventos_rsvp e ON e.id = c.evento_rsvp_id
     WHERE e.slug_publico = $1 AND regexp_replace(c.telefone, '\\D', '', 'g') = regexp_replace($2, '\\D', '', 'g')
     LIMIT 1`,
    [parsed.data.slug, parsed.data.telefone]
  );
}

/** Confirma/recusa presença de um convidado já cadastrado pelo anfitrião -
 * chamada pelo próprio convidado, sem sessão, por isso reescopa por slug em
 * vez de cliente_id (mesmo padrão de getEventoIdDoConvidadoDoCliente, mas
 * pro lado público). */
export async function responderConvidadoPublico(
  convidadoId: string,
  slug: string,
  confirmado: boolean
): Promise<ConvidadoActionResult> {
  const convidado = await queryOne<{ id: string }>(
    `SELECT c.id FROM rsvp_convidados c JOIN eventos_rsvp e ON e.id = c.evento_rsvp_id
     WHERE c.id = $1 AND e.slug_publico = $2`,
    [convidadoId, slug]
  );
  if (!convidado) return { error: "Convidado não encontrado." };

  await query(`UPDATE rsvp_convidados SET confirmado = $1, respondido_em = now() WHERE id = $2`, [
    confirmado,
    convidadoId,
  ]);

  revalidatePath(`/rsvp/${slug}`);
  return { ok: true };
}

export type ConfirmarConvidadoPublicoResult = { error?: string; convidado?: ConvidadoPublico };

/** Registra alguém novo direto pela página pública - tanto o convidado que
 * "não estava na lista" quanto um acompanhante que o convidado principal
 * adiciona (ver contexto no schema). Em ambos os casos já entra
 * confirmado = true (a pessoa está se cadastrando justamente porque vai). */
export async function confirmarConvidadoPublico(
  _prevState: ConfirmarConvidadoPublicoResult | undefined,
  formData: FormData
): Promise<ConfirmarConvidadoPublicoResult> {
  const parsed = confirmarConvidadoPublicoSchema.safeParse({
    slug: formData.get("slug"),
    contexto: formData.get("contexto") || "principal",
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    tipoConvidado: formData.get("tipoConvidado") || "adulto",
    idadeAnos: formData.get("idadeAnos") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const evento = await queryOne<{ id: string }>(`SELECT id FROM eventos_rsvp WHERE slug_publico = $1`, [
    parsed.data.slug,
  ]);
  if (!evento) return { error: "Evento não encontrado." };

  const convidado = await queryOne<ConvidadoPublico>(
    `INSERT INTO rsvp_convidados (evento_rsvp_id, nome, telefone, tipo_convidado, idade_anos, confirmado, respondido_em)
     VALUES ($1,$2,$3,$4,$5,true,now())
     RETURNING id, nome, tipo_convidado, idade_anos, confirmado`,
    [
      evento.id,
      parsed.data.nome,
      parsed.data.telefone ?? null,
      parsed.data.tipoConvidado,
      parsed.data.tipoConvidado === "crianca" ? (parsed.data.idadeAnos ?? null) : null,
    ]
  );
  if (!convidado) return { error: "Não foi possível confirmar, tente novamente." };

  revalidatePath(`/rsvp/${parsed.data.slug}`);
  return { convidado };
}
