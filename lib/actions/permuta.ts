"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { query, queryOne, pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { detectContactLeak } from "@/lib/contact-filter";
import {
  diasAte,
  getAcordo,
  getPerfilPermuta,
  getPermutaConfig,
  getUsoPlanoPermuta,
  hojeISO,
  sincronizarPermutas,
} from "@/lib/data/permuta";
import {
  CONFIG_PERMUTA,
  NIVEIS,
  PERIODO_LIMITE_LABEL,
  PERMUTA_CONFIG_PADRAO,
  type PeriodoLimitePlano,
  type PermutaConfig,
} from "@/lib/permuta/regras";

export type PermutaActionState = { error?: string; ok?: boolean } | undefined;

async function requireEmpresa() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return null;
  return session;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") return null;
  return session;
}

function revalidarPermutas(acordoId?: string) {
  revalidatePath("/painel/permutas", "layout");
  revalidatePath("/admin/permutas", "layout");
  if (acordoId) revalidatePath(`/painel/permutas/acordos/${acordoId}`);
}

async function mensagemSistema(acordoId: string, texto: string) {
  await query(`INSERT INTO permuta_mensagens (acordo_id, remetente_id, conteudo) VALUES ($1, NULL, $2)`, [acordoId, texto]);
}

/** Enquanto o acordo não foi assinado pelas duas, nada de telefone/e-mail/link
 * nos textos - mesma regra (e mesmo log de auditoria) de pedidos e mensagens. */
async function bloquearContato(usuarioId: string, textos: (string | null | undefined)[]): Promise<string | null> {
  for (const t of textos) {
    if (!t) continue;
    const r = detectContactLeak(t);
    if (r.blocked) {
      await query(
        `INSERT INTO tentativas_contato_bloqueadas (usuario_id, origem, trecho_detectado) VALUES ($1, 'permuta', $2)`,
        [usuarioId, t.slice(0, 300)]
      );
      return "Contatos (telefone, e-mail, links) só são liberados depois que as duas empresas assinam o acordo.";
    }
  }
  return null;
}

/** Limite do plano: com quantas empresas diferentes a empresa pode trocar.
 * Repetir uma empresa que já conta no período não gasta vaga. */
async function checarLimitePlano(
  empresaId: string,
  parceiroId: string,
  cfg: PermutaConfig,
  excluirAcordoId?: string
): Promise<string | null> {
  const uso = await getUsoPlanoPermuta(empresaId, cfg, excluirAcordoId);
  if (uso.podeTrocarCom(parceiroId)) return null;
  return `Seu plano ${uso.planoNome} permite trocar com até ${uso.limite} ${uso.limite === 1 ? "empresa" : "empresas"} ${PERIODO_LIMITE_LABEL[cfg.periodoLimitePlano]} e esse limite já foi atingido. Faça upgrade do plano no Painel inicial para trocar com mais empresas.`;
}

// ---------------------------------------------------------------------
// ADESAO (opt-in)
// ---------------------------------------------------------------------

export async function ativarParticipacao(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  if (formData.get("aceite") !== "on") return { error: "Confirme que leu e concorda com as regras da rede de permutas." };
  await query(
    `INSERT INTO permuta_participantes (empresa_id, ativa, aceitou_regras_em) VALUES ($1, TRUE, now())
     ON CONFLICT (empresa_id) DO UPDATE SET ativa = TRUE, pausada_em = NULL, aceitou_regras_em = now()`,
    [session.usuarioId]
  );
  revalidarPermutas();
  redirect("/painel/permutas/ofertas?bemvindo=1");
}

/** Pausar tira a empresa da vitrine e impede novas propostas; acordos que já
 * estão em andamento continuam normalmente até o fim. */
export async function pausarParticipacao(): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  await query(`UPDATE permuta_participantes SET ativa = FALSE, pausada_em = now() WHERE empresa_id = $1`, [session.usuarioId]);
  revalidarPermutas();
  return { ok: true };
}

export async function reativarParticipacao(): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  await query(`UPDATE permuta_participantes SET ativa = TRUE, pausada_em = NULL WHERE empresa_id = $1`, [session.usuarioId]);
  revalidarPermutas();
  return { ok: true };
}

// ---------------------------------------------------------------------
// OFERTAS E BUSCAS
// ---------------------------------------------------------------------

const ofertaSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(3, "Descreva o serviço em pelo menos 3 letras").max(120),
  categoriaId: z.coerce.number().int().positive().optional(),
  descricao: z.string().trim().max(1000).optional(),
  valor: z.coerce.number({ message: "Informe o valor de referência" }).min(0).max(1_000_000),
});

export async function salvarOferta(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const parsed = ofertaSchema.safeParse({
    id: formData.get("id") || undefined,
    titulo: formData.get("titulo"),
    categoriaId: formData.get("categoriaId") || undefined,
    descricao: formData.get("descricao") || undefined,
    valor: String(formData.get("valor") ?? "").replace(/\./g, "").replace(",", "."),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const bloqueio = await bloquearContato(session.usuarioId, [parsed.data.titulo, parsed.data.descricao]);
  if (bloqueio) return { error: bloqueio };

  const d = parsed.data;
  if (d.id) {
    await query(
      `UPDATE permuta_ofertas SET titulo = $1, categoria_id = $2, descricao = $3, valor_referencia = $4
        WHERE id = $5 AND empresa_id = $6`,
      [d.titulo, d.categoriaId ?? null, d.descricao ?? null, d.valor, d.id, session.usuarioId]
    );
  } else {
    await query(
      `INSERT INTO permuta_ofertas (empresa_id, titulo, categoria_id, descricao, valor_referencia) VALUES ($1,$2,$3,$4,$5)`,
      [session.usuarioId, d.titulo, d.categoriaId ?? null, d.descricao ?? null, d.valor]
    );
  }
  revalidarPermutas();
  return { ok: true };
}

export async function alternarOfertaAtiva(ofertaId: string): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  await query(`UPDATE permuta_ofertas SET ativa = NOT ativa WHERE id = $1 AND empresa_id = $2`, [ofertaId, session.usuarioId]);
  revalidarPermutas();
  return { ok: true };
}

export async function salvarBuscas(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const ids = formData
    .getAll("categoriaIds")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM permuta_buscas WHERE empresa_id = $1`, [session.usuarioId]);
    for (const id of ids) {
      await client.query(`INSERT INTO permuta_buscas (empresa_id, categoria_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
        session.usuarioId,
        id,
      ]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  revalidarPermutas();
  return { ok: true };
}

// ---------------------------------------------------------------------
// PROPOSTA / CONTRAPROPOSTA / ASSINATURA
// ---------------------------------------------------------------------

const dataFutura = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe as datas dos dois eventos")
  .refine((v) => v >= hojeISO(), "As datas dos eventos precisam ser de hoje em diante");

const termosSchema = z.object({
  dataMinha: dataFutura,
  dataParceiro: dataFutura,
  localMinha: z.string().trim().max(160).optional(),
  localParceiro: z.string().trim().max(160).optional(),
  escopoMinha: z.string().trim().min(5, "Descreva o que está incluso na sua entrega").max(2000),
  escopoParceiro: z.string().trim().min(5, "Descreva o que você espera receber").max(2000),
  compensacao: z.string().trim().max(500).optional(),
});

const propostaSchema = termosSchema.extend({
  destinatarioId: z.string().min(1),
  minhaOfertaId: z.string().min(1, "Escolha o que você oferece"),
  ofertaParceiroId: z.string().min(1, "Escolha o que você quer em troca"),
  primeiro: z.enum(["eu", "parceiro", "data"]),
  aceite: z.literal("on", { message: "Confirme que leu as regras da permuta" }),
});

function lerTermos(formData: FormData) {
  return {
    dataMinha: formData.get("dataMinha"),
    dataParceiro: formData.get("dataParceiro"),
    localMinha: formData.get("localMinha") || undefined,
    localParceiro: formData.get("localParceiro") || undefined,
    escopoMinha: formData.get("escopoMinha"),
    escopoParceiro: formData.get("escopoParceiro"),
    compensacao: formData.get("compensacao") || undefined,
  };
}

export async function criarProposta(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const parsed = propostaSchema.safeParse({
    ...lerTermos(formData),
    destinatarioId: formData.get("destinatarioId"),
    minhaOfertaId: formData.get("minhaOfertaId"),
    ofertaParceiroId: formData.get("ofertaParceiroId"),
    primeiro: formData.get("primeiro") || "data",
    aceite: formData.get("aceite") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const d = parsed.data;
  if (d.destinatarioId === session.usuarioId) return { error: "Não é possível propor troca para a própria empresa." };

  const cfg = await getPermutaConfig();
  const [eu, parceiro] = await Promise.all([
    getPerfilPermuta(session.usuarioId, cfg),
    getPerfilPermuta(d.destinatarioId, cfg),
  ]);
  if (!eu || !parceiro) return { error: "Empresa não encontrada." };
  if (!eu.participa) return { error: "Ative sua participação na rede de permutas para propor trocas." };
  if (eu.pendencias.length) return { error: eu.pendencias[0] };
  if (!eu.podeAbrirNova)
    return { error: `Você já tem ${eu.stats.ativos} permutas abertas, o limite do seu nível. Conclua uma para abrir outra.` };
  if (!parceiro.participa || parceiro.pendencias.length)
    return { error: "Esta empresa não está disponível para permutas no momento." };
  const limitePlano = await checarLimitePlano(session.usuarioId, d.destinatarioId, cfg);
  if (limitePlano) return { error: limitePlano };

  const [minha, dele] = await Promise.all([
    queryOne<{ titulo: string; valor_referencia: string }>(
      `SELECT titulo, valor_referencia FROM permuta_ofertas WHERE id = $1 AND empresa_id = $2 AND ativa`,
      [d.minhaOfertaId, session.usuarioId]
    ),
    queryOne<{ titulo: string; valor_referencia: string }>(
      `SELECT titulo, valor_referencia FROM permuta_ofertas WHERE id = $1 AND empresa_id = $2 AND ativa`,
      [d.ofertaParceiroId, d.destinatarioId]
    ),
  ]);
  if (!minha || !dele) return { error: "Oferta não encontrada — recarregue a página." };

  const bloqueio = await bloquearContato(session.usuarioId, [d.escopoMinha, d.escopoParceiro, d.compensacao, d.localMinha, d.localParceiro]);
  if (bloqueio) return { error: bloqueio };

  const euPrimeiro = d.primeiro === "eu" || (d.primeiro === "data" && d.dataMinha <= d.dataParceiro);

  const client = await pool.connect();
  let acordoId: string;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO permuta_acordos (proponente_id, destinatario_id, compensacao, ultima_edicao_por, assinado_proponente_em)
       VALUES ($1, $2, $3, $1, now()) RETURNING id`,
      [session.usuarioId, d.destinatarioId, d.compensacao ?? null]
    );
    acordoId = rows[0].id;
    const insert = `INSERT INTO permuta_entregas
      (acordo_id, ordem, prestador_id, beneficiario_id, oferta_id, titulo, escopo, valor_referencia, data_evento, local_evento)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
    await client.query(insert, [
      acordoId, euPrimeiro ? 1 : 2, session.usuarioId, d.destinatarioId, d.minhaOfertaId,
      minha.titulo, d.escopoMinha, minha.valor_referencia, d.dataMinha, d.localMinha ?? null,
    ]);
    await client.query(insert, [
      acordoId, euPrimeiro ? 2 : 1, d.destinatarioId, session.usuarioId, d.ofertaParceiroId,
      dele.titulo, d.escopoParceiro, dele.valor_referencia, d.dataParceiro, d.localParceiro ?? null,
    ]);
    await client.query(
      `INSERT INTO permuta_mensagens (acordo_id, remetente_id, conteudo) VALUES ($1, NULL, 'Proposta enviada e assinada pelo proponente.')`,
      [acordoId]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  revalidarPermutas();
  redirect(`/painel/permutas/acordos/${acordoId}`);
}

type AcordoBasico = {
  id: string;
  status: string;
  proponente_id: string;
  destinatario_id: string;
  versao: number;
  assinado_proponente_em: string | null;
  assinado_destinatario_em: string | null;
};

async function carregarAcordoDaEmpresa(acordoId: string, empresaId: string) {
  return queryOne<AcordoBasico>(
    `SELECT id, status, proponente_id, destinatario_id, versao, assinado_proponente_em, assinado_destinatario_em
       FROM permuta_acordos WHERE id = $1 AND $2 IN (proponente_id, destinatario_id)`,
    [acordoId, empresaId]
  );
}

/** Contraproposta: qualquer uma das duas pode mudar datas/escopo enquanto não
 * estiver assinado pelas duas. Quem edita assina a nova versão; a assinatura
 * do outro lado é zerada e ele precisa revisar de novo. */
export async function editarTermos(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const acordoId = String(formData.get("acordoId") ?? "");
  const a = await carregarAcordoDaEmpresa(acordoId, session.usuarioId);
  if (!a) return { error: "Acordo não encontrado." };
  if (a.status !== "proposta") return { error: "Os termos só podem ser alterados antes das duas assinaturas." };

  const parsed = termosSchema.safeParse(lerTermos(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const d = parsed.data;
  const bloqueio = await bloquearContato(session.usuarioId, [d.escopoMinha, d.escopoParceiro, d.compensacao, d.localMinha, d.localParceiro]);
  if (bloqueio) return { error: bloqueio };

  const souProponente = a.proponente_id === session.usuarioId;
  const parceiroId = souProponente ? a.destinatario_id : a.proponente_id;
  if (!souProponente) {
    // contraproposta de quem recebeu = assinatura dele na nova versão
    const limitePlano = await checarLimitePlano(session.usuarioId, parceiroId, await getPermutaConfig(), acordoId);
    if (limitePlano) return { error: limitePlano };
  }
  await query(
    `UPDATE permuta_entregas SET data_evento = $1, local_evento = $2, escopo = $3 WHERE acordo_id = $4 AND prestador_id = $5`,
    [d.dataMinha, d.localMinha ?? null, d.escopoMinha, acordoId, session.usuarioId]
  );
  await query(
    `UPDATE permuta_entregas SET data_evento = $1, local_evento = $2, escopo = $3 WHERE acordo_id = $4 AND prestador_id = $5`,
    [d.dataParceiro, d.localParceiro ?? null, d.escopoParceiro, acordoId, parceiroId]
  );
  await query(
    `UPDATE permuta_acordos SET versao = versao + 1, compensacao = $1, ultima_edicao_por = $2, atualizado_em = now(),
       assinado_proponente_em = CASE WHEN $3 THEN now() ELSE NULL END,
       assinado_destinatario_em = CASE WHEN $3 THEN NULL ELSE now() END
     WHERE id = $4`,
    [d.compensacao ?? null, session.usuarioId, souProponente, acordoId]
  );
  await mensagemSistema(acordoId, `Contraproposta: termos alterados (versão ${a.versao + 1}). A outra empresa precisa revisar e assinar.`);
  revalidarPermutas(acordoId);
  return { ok: true };
}

export async function assinarAcordo(acordoId: string): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const a = await carregarAcordoDaEmpresa(acordoId, session.usuarioId);
  if (!a) return { error: "Acordo não encontrado." };
  if (a.status !== "proposta") return { error: "Este acordo não está aguardando assinatura." };

  const cfg = await getPermutaConfig();
  const eu = await getPerfilPermuta(session.usuarioId, cfg);
  if (!eu) return { error: "Empresa não encontrada." };
  if (!eu.participa) return { error: "Reative sua participação na rede de permutas para assinar." };
  if (eu.pendencias.length) return { error: eu.pendencias[0] };
  // quem recebeu a proposta só gasta vaga do plano ao assinar
  if (a.destinatario_id === session.usuarioId) {
    const limitePlano = await checarLimitePlano(session.usuarioId, a.proponente_id, cfg, acordoId);
    if (limitePlano) return { error: limitePlano };
  }
  // esta proposta já conta nos meus "ativos" - o limite é violado só se passar dele
  if (eu.limite !== null && eu.stats.ativos > eu.limite)
    return { error: `Você atingiu o limite de ${eu.limite} permutas simultâneas do seu nível.` };

  const souProponente = a.proponente_id === session.usuarioId;
  const col = souProponente ? "assinado_proponente_em" : "assinado_destinatario_em";
  const entregas = await query<{ data_evento: string }>(
    `SELECT to_char(data_evento, 'YYYY-MM-DD') AS data_evento FROM permuta_entregas WHERE acordo_id = $1`,
    [acordoId]
  );
  if (entregas.some((e) => e.data_evento < hojeISO()))
    return { error: "Uma das datas já passou. Proponha novas datas antes de assinar." };

  await query(`UPDATE permuta_acordos SET ${col} = now(), atualizado_em = now() WHERE id = $1`, [acordoId]);
  const atualizado = await queryOne<{ ambos: boolean }>(
    `UPDATE permuta_acordos SET status = CASE WHEN assinado_proponente_em IS NOT NULL AND assinado_destinatario_em IS NOT NULL
        THEN 'em_execucao'::status_acordo_permuta ELSE status END
      WHERE id = $1 RETURNING (assinado_proponente_em IS NOT NULL AND assinado_destinatario_em IS NOT NULL) AS ambos`,
    [acordoId]
  );
  await mensagemSistema(
    acordoId,
    atualizado?.ambos
      ? "Acordo assinado pelas duas empresas. Contatos liberados — bom evento!"
      : "Acordo assinado. Aguardando a outra empresa."
  );
  revalidarPermutas(acordoId);
  return { ok: true };
}

/** Destinatário recusa a proposta; proponente retira a própria proposta. */
export async function recusarProposta(acordoId: string, motivo: string): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const a = await carregarAcordoDaEmpresa(acordoId, session.usuarioId);
  if (!a) return { error: "Acordo não encontrado." };
  if (a.status !== "proposta") return { error: "Só propostas ainda não assinadas pelas duas podem ser recusadas." };
  const status = a.destinatario_id === session.usuarioId ? "recusado" : "cancelado";
  await query(
    `UPDATE permuta_acordos SET status = $1, encerrado_por = $2, motivo_encerramento = $3, atualizado_em = now() WHERE id = $4`,
    [status, session.usuarioId, motivo.trim().slice(0, 500) || null, acordoId]
  );
  await query(`UPDATE permuta_entregas SET status = 'cancelada' WHERE acordo_id = $1`, [acordoId]);
  await mensagemSistema(acordoId, status === "recusado" ? "Proposta recusada." : "Proposta retirada pelo proponente.");
  revalidarPermutas(acordoId);
  return { ok: true };
}

/** Cancelar um acordo já assinado só é possível enquanto nenhuma entrega foi
 * feita - depois disso o outro lado já pagou com o próprio serviço, então o
 * caminho é disputa (ou o parceiro indicar substituto pelo chat). Fora da
 * janela configurada, o cancelamento derruba o nível temporariamente. */
export async function cancelarAcordo(acordoId: string, motivo: string): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const a = await carregarAcordoDaEmpresa(acordoId, session.usuarioId);
  if (!a) return { error: "Acordo não encontrado." };
  if (a.status !== "em_execucao") return { error: "Este acordo não pode ser cancelado." };
  if (motivo.trim().length < 5) return { error: "Explique em poucas palavras o motivo do cancelamento." };
  const entregas = await query<{ status: string; data_evento: string }>(
    `SELECT status, to_char(data_evento, 'YYYY-MM-DD') AS data_evento FROM permuta_entregas WHERE acordo_id = $1`,
    [acordoId]
  );
  if (entregas.some((e) => e.status === "confirmada"))
    return { error: "Uma entrega já foi feita. Para encerrar, abra uma disputa ou combine um substituto com o parceiro." };

  const cfg = await getPermutaConfig();
  const proxima = Math.min(...entregas.map((e) => diasAte(e.data_evento)));
  const foraJanela = proxima < cfg.janelaCancelamentoDias;
  await query(
    `UPDATE permuta_acordos SET status = 'cancelado', encerrado_por = $1, motivo_encerramento = $2,
       cancelado_fora_janela = $3, atualizado_em = now() WHERE id = $4`,
    [session.usuarioId, motivo.trim().slice(0, 500), foraJanela, acordoId]
  );
  await query(`UPDATE permuta_entregas SET status = 'cancelada' WHERE acordo_id = $1`, [acordoId]);
  await mensagemSistema(
    acordoId,
    foraJanela
      ? `Acordo cancelado a ${proxima} dia(s) da entrega — fora da janela de ${cfg.janelaCancelamentoDias} dias.`
      : "Acordo cancelado dentro da janela, sem penalidade."
  );
  revalidarPermutas(acordoId);
  return { ok: true };
}

// ---------------------------------------------------------------------
// CHECK-IN, AVALIACAO, DISPUTA, MENSAGENS
// ---------------------------------------------------------------------

const avaliacaoSchema = z.object({
  entregaId: z.string().min(1),
  nota: z.coerce.number().int().min(1, "Dê uma nota de 1 a 5").max(5),
  pontual: z.enum(["sim", "nao"]),
  comentario: z.string().trim().max(1000).optional(),
});

/** Quem recebeu o serviço confirma que ele aconteceu e avalia na mesma tela.
 * Se a entrega já foi confirmada automaticamente (prazo esgotado), só grava
 * a avaliação. */
export async function confirmarEntrega(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const parsed = avaliacaoSchema.safeParse({
    entregaId: formData.get("entregaId"),
    nota: formData.get("nota"),
    pontual: formData.get("pontual") || "sim",
    comentario: formData.get("comentario") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const d = parsed.data;

  const e = await queryOne<{ acordo_id: string; status: string; prestador_id: string; data_evento: string; acordo_status: string }>(
    `SELECT e.acordo_id, e.status, e.prestador_id, to_char(e.data_evento, 'YYYY-MM-DD') AS data_evento, a.status AS acordo_status
       FROM permuta_entregas e JOIN permuta_acordos a ON a.id = e.acordo_id
      WHERE e.id = $1 AND e.beneficiario_id = $2`,
    [d.entregaId, session.usuarioId]
  );
  if (!e) return { error: "Entrega não encontrada." };
  if (e.status === "agendada") {
    if (e.acordo_status !== "em_execucao") return { error: "Este acordo não está em execução." };
    if (e.data_evento > hojeISO()) return { error: "A confirmação abre no dia do evento." };
    await query(`UPDATE permuta_entregas SET status = 'confirmada', confirmada_em = now() WHERE id = $1`, [d.entregaId]);
  } else if (e.status !== "confirmada") {
    return { error: "Esta entrega não pode ser avaliada." };
  }
  await query(
    `INSERT INTO permuta_avaliacoes (entrega_id, avaliador_id, avaliado_id, nota, pontual, comentario)
     VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (entrega_id, avaliador_id) DO NOTHING`,
    [d.entregaId, session.usuarioId, e.prestador_id, d.nota, d.pontual === "sim", d.comentario ?? null]
  );
  await mensagemSistema(e.acordo_id, `Entrega confirmada e avaliada com nota ${d.nota}.`);
  await sincronizarPermutas(await getPermutaConfig());
  revalidarPermutas(e.acordo_id);
  return { ok: true };
}

export async function abrirDisputa(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const acordoId = String(formData.get("acordoId") ?? "");
  const entregaId = String(formData.get("entregaId") ?? "") || null;
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (motivo.length < 10) return { error: "Descreva o problema (pelo menos 10 caracteres)." };
  const a = await carregarAcordoDaEmpresa(acordoId, session.usuarioId);
  if (!a) return { error: "Acordo não encontrado." };
  if (a.status !== "em_execucao" && a.status !== "concluido") return { error: "Não é possível abrir disputa neste acordo." };

  await query(
    `UPDATE permuta_acordos SET status = 'em_disputa', disputa_aberta_por = $1, disputa_motivo = $2, atualizado_em = now() WHERE id = $3`,
    [session.usuarioId, motivo.slice(0, 2000), acordoId]
  );
  if (entregaId) {
    await query(`UPDATE permuta_entregas SET status = 'em_disputa' WHERE id = $1 AND acordo_id = $2 AND status <> 'cancelada'`, [
      entregaId,
      acordoId,
    ]);
  }
  await mensagemSistema(acordoId, "Disputa aberta. O acordo fica congelado até a equipe GetFesta analisar.");
  revalidarPermutas(acordoId);
  return { ok: true };
}

export async function enviarMensagemPermuta(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireEmpresa();
  if (!session) return { error: "Sessão inválida." };
  const acordoId = String(formData.get("acordoId") ?? "");
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { error: "Escreva uma mensagem." };
  if (conteudo.length > 2000) return { error: "Mensagem muito longa." };
  const a = await carregarAcordoDaEmpresa(acordoId, session.usuarioId);
  if (!a) return { error: "Acordo não encontrado." };
  if (a.status === "recusado" || a.status === "cancelado") return { error: "Este acordo foi encerrado." };
  if (a.status === "proposta") {
    const bloqueio = await bloquearContato(session.usuarioId, [conteudo]);
    if (bloqueio) return { error: bloqueio };
  }
  await query(`INSERT INTO permuta_mensagens (acordo_id, remetente_id, conteudo) VALUES ($1,$2,$3)`, [
    acordoId,
    session.usuarioId,
    conteudo,
  ]);
  revalidarPermutas(acordoId);
  return { ok: true };
}

// ---------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------

function num(formData: FormData, chave: string, padrao: number, min = 0, max = 100000) {
  const v = Number(String(formData.get(chave) ?? "").replace(",", "."));
  if (!Number.isFinite(v)) return padrao;
  return Math.min(max, Math.max(min, v));
}

export async function salvarConfigPermuta(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  const p = PERMUTA_CONFIG_PADRAO;
  const bool = (k: string) => formData.get(k) === "on";
  const cfg: PermutaConfig = {
    ativa: bool("ativa"),
    exigirCnpjValidado: bool("exigirCnpjValidado"),
    minFotosPortfolio: num(formData, "minFotosPortfolio", p.minFotosPortfolio, 0, 100),
    limitesPlano: {
      gratis: num(formData, "plano_gratis", p.limitesPlano.gratis, 0, 10000),
      light: num(formData, "plano_light", p.limitesPlano.light, 0, 10000),
      completo: num(formData, "plano_completo", p.limitesPlano.completo, 0, 10000),
    },
    periodoLimitePlano: (["mes", "simultaneo", "total"] as const).includes(formData.get("periodoLimitePlano") as PeriodoLimitePlano)
      ? (formData.get("periodoLimitePlano") as PeriodoLimitePlano)
      : p.periodoLimitePlano,
    limites: {
      novo: num(formData, "limite_novo", p.limites.novo, 0, 100),
      c: num(formData, "limite_c", p.limites.c, 0, 100),
      b: num(formData, "limite_b", p.limites.b, 0, 100),
      a: num(formData, "limite_a", p.limites.a, 0, 100),
    },
    requisitos: {
      c: { concluidas: num(formData, "req_c_concluidas", p.requisitos.c.concluidas, 0, 1000), nota: num(formData, "req_c_nota", p.requisitos.c.nota, 0, 5) },
      b: { concluidas: num(formData, "req_b_concluidas", p.requisitos.b.concluidas, 0, 1000), nota: num(formData, "req_b_nota", p.requisitos.b.nota, 0, 5) },
      a: { concluidas: num(formData, "req_a_concluidas", p.requisitos.a.concluidas, 0, 1000), nota: num(formData, "req_a_nota", p.requisitos.a.nota, 0, 5) },
    },
    janelaCancelamentoDias: num(formData, "janelaCancelamentoDias", p.janelaCancelamentoDias, 0, 365),
    horasConfirmacaoAutomatica: num(formData, "horasConfirmacaoAutomatica", p.horasConfirmacaoAutomatica, 1, 24 * 60),
    diasPenalidadeCancelamento: num(formData, "diasPenalidadeCancelamento", p.diasPenalidadeCancelamento, 0, 3650),
    furosParaSuspender: num(formData, "furosParaSuspender", p.furosParaSuspender, 1, 100),
    diasSuspensao: num(formData, "diasSuspensao", p.diasSuspensao, 1, 3650),
    exibirSeloPerfilPublico: bool("exibirSeloPerfilPublico"),
    secaoEmpresasVisivel: bool("secaoEmpresasVisivel"),
    secaoEmpresasTitulo: String(formData.get("secaoEmpresasTitulo") ?? "").trim() || p.secaoEmpresasTitulo,
    secaoEmpresasTexto: String(formData.get("secaoEmpresasTexto") ?? "").trim() || p.secaoEmpresasTexto,
  };
  const req = cfg.requisitos;
  if (!(req.c.concluidas <= req.b.concluidas && req.b.concluidas <= req.a.concluidas))
    return { error: "Os requisitos de permutas concluídas precisam crescer de C para B para A." };

  await query(
    `INSERT INTO configuracoes_site (chave, valor, atualizado_em) VALUES ($1, $2, now())
     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = now()`,
    [CONFIG_PERMUTA, JSON.stringify(cfg)]
  );
  revalidarPermutas();
  revalidatePath("/empresas");
  revalidatePath("/");
  return { ok: true };
}

export async function salvarControleEmpresaPermuta(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  const empresaId = String(formData.get("empresaId") ?? "");
  const nivelRaw = String(formData.get("nivelManual") ?? "");
  const nivel = (NIVEIS as string[]).includes(nivelRaw) ? nivelRaw : null;
  const suspensaAte = String(formData.get("suspensaAte") ?? "");
  const banida = formData.get("banida") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim().slice(0, 1000) || null;
  await query(
    `INSERT INTO permuta_empresa_admin (empresa_id, nivel_manual, suspensa_ate, banida, observacao, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (empresa_id) DO UPDATE SET nivel_manual = $2, suspensa_ate = $3, banida = $4, observacao = $5, atualizado_em = now()`,
    [empresaId, nivel, /^\d{4}-\d{2}-\d{2}$/.test(suspensaAte) ? suspensaAte : null, banida, observacao]
  );
  revalidarPermutas();
  return { ok: true };
}

/** Admin decide o que aconteceu com cada entrega do acordo em disputa. Furo
 * confirmado (não realizada) aplica a suspensão configurada ao prestador; se
 * ele já tinha furos suficientes antes, é removido da rede. */
export async function resolverDisputa(_prev: PermutaActionState, formData: FormData): Promise<PermutaActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  const acordoId = String(formData.get("acordoId") ?? "");
  const resolucao = String(formData.get("resolucao") ?? "").trim();
  if (resolucao.length < 5) return { error: "Registre a decisão (aparece para as duas empresas)." };
  const acordo = await getAcordo(acordoId);
  if (!acordo) return { error: "Acordo não encontrado." };
  const cfg = await getPermutaConfig();

  const validos = ["agendada", "confirmada", "nao_realizada", "cancelada"];
  for (const e of acordo.entregas) {
    const novo = String(formData.get(`entrega_${e.id}`) ?? e.status);
    if (!validos.includes(novo)) return { error: "Status de entrega inválido." };
    if (novo !== e.status) {
      await query(
        `UPDATE permuta_entregas SET status = $1, confirmada_em = CASE WHEN $1 = 'confirmada' THEN COALESCE(confirmada_em, now()) ELSE confirmada_em END WHERE id = $2`,
        [novo, e.id]
      );
    }
    if (novo === "nao_realizada" && e.status !== "nao_realizada") {
      const furos = await queryOne<{ total: number }>(
        `SELECT count(*)::int AS total FROM permuta_entregas WHERE prestador_id = $1 AND status = 'nao_realizada'
            AND data_evento > now() - interval '12 months'`,
        [e.prestador_id]
      );
      const total = furos?.total ?? 1;
      if (total > cfg.furosParaSuspender) {
        await query(
          `INSERT INTO permuta_empresa_admin (empresa_id, banida, observacao) VALUES ($1, TRUE, 'Banida automaticamente por reincidência de furo')
           ON CONFLICT (empresa_id) DO UPDATE SET banida = TRUE, atualizado_em = now()`,
          [e.prestador_id]
        );
      } else if (total >= cfg.furosParaSuspender) {
        await query(
          `INSERT INTO permuta_empresa_admin (empresa_id, suspensa_ate) VALUES ($1, now() + make_interval(days => $2::int))
           ON CONFLICT (empresa_id) DO UPDATE SET suspensa_ate = now() + make_interval(days => $2::int), atualizado_em = now()`,
          [e.prestador_id, cfg.diasSuspensao]
        );
      }
    }
  }
  const status = await queryOne<{ s: string }>(
    `SELECT CASE
        WHEN bool_and(status = 'confirmada') THEN 'concluido'
        WHEN bool_or(status IN ('agendada', 'em_disputa')) THEN 'em_execucao'
        ELSE 'cancelado' END AS s
       FROM permuta_entregas WHERE acordo_id = $1`,
    [acordoId]
  );
  await query(
    `UPDATE permuta_acordos SET status = $1::status_acordo_permuta, disputa_resolucao = $2, atualizado_em = now() WHERE id = $3`,
    [status?.s ?? "em_execucao", resolucao.slice(0, 2000), acordoId]
  );
  await query(`UPDATE permuta_entregas SET status = 'agendada' WHERE acordo_id = $1 AND status = 'em_disputa'`, [acordoId]);
  await mensagemSistema(acordoId, `Decisão da equipe GetFesta: ${resolucao.slice(0, 500)}`);
  revalidarPermutas(acordoId);
  return { ok: true };
}

export async function cancelarAcordoAdmin(acordoId: string, motivo: string): Promise<PermutaActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  await query(
    `UPDATE permuta_acordos SET status = 'cancelado', encerrado_por = $1, motivo_encerramento = $2, atualizado_em = now() WHERE id = $3`,
    [session.usuarioId, motivo.trim().slice(0, 500) || "Cancelado pela equipe GetFesta", acordoId]
  );
  await query(`UPDATE permuta_entregas SET status = 'cancelada' WHERE acordo_id = $1 AND status IN ('agendada', 'em_disputa')`, [acordoId]);
  await mensagemSistema(acordoId, `Acordo cancelado pela equipe GetFesta. ${motivo.trim().slice(0, 300)}`);
  revalidarPermutas(acordoId);
  return { ok: true };
}

export async function alternarOfertaAdmin(ofertaId: string): Promise<PermutaActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  await query(`UPDATE permuta_ofertas SET ativa = NOT ativa WHERE id = $1`, [ofertaId]);
  revalidarPermutas();
  return { ok: true };
}
