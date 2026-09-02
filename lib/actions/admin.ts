"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne, pool } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import {
  atualizarBannerHeroSchema,
  criarAdminSchema,
  criarBannerHeroSchema,
  criarBannerSchema,
  criarPlanoPeriodoSchema,
  marcarAssinaturaPagaSchema,
  trocarPlanoManualSchema,
} from "@/lib/validators";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") return null;
  return session;
}

export type BannerActionState = { error?: string; success?: boolean } | undefined;

export async function criarBanner(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = criarBannerSchema.safeParse({
    categoriaId: formData.get("categoriaId"),
    empresaId: formData.get("empresaId"),
    inicioEm: formData.get("inicioEm"),
    fimEm: formData.get("fimEm"),
    valorPago: formData.get("valorPago"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const proximaOrdem = await queryOne<{ max: number | null }>(`SELECT max(ordem) AS max FROM banners_categoria`);

  await query(
    `INSERT INTO banners_categoria (categoria_id, empresa_id, inicio_em, fim_em, valor_pago, ativo, ordem)
     VALUES ($1,$2,$3,$4,$5,true,$6)`,
    [
      parsed.data.categoriaId,
      parsed.data.empresaId,
      parsed.data.inicioEm,
      parsed.data.fimEm,
      parsed.data.valorPago,
      (proximaOrdem?.max ?? -1) + 1,
    ]
  );

  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export type SimpleActionResult = { error?: string; ok?: boolean };

export async function alternarBannerAtivo(bannerId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`UPDATE banners_categoria SET ativo = NOT ativo WHERE id = $1`, [bannerId]);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function removerBanner(bannerId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`DELETE FROM banners_categoria WHERE id = $1`, [bannerId]);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

// ---------------------------------------------------------------------
// BANNER PRINCIPAL (HERO) — 100% administrado, independente de empresa
// ---------------------------------------------------------------------

export async function criarBannerHero(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = criarBannerHeroSchema.safeParse({
    titulo: formData.get("titulo"),
    texto: formData.get("texto") || undefined,
    botaoLabel: formData.get("botaoLabel") || undefined,
    botaoUrl: formData.get("botaoUrl") || undefined,
    imagemFundo: formData.get("imagemFundo"),
    imagemFundoMobile: formData.get("imagemFundoMobile") || undefined,
    regiaoAlvo: formData.get("regiaoAlvo") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const proximaOrdem = await queryOne<{ max: number | null }>(`SELECT max(ordem) AS max FROM banners_hero`);

  await query(
    `INSERT INTO banners_hero (titulo, texto, botao_label, botao_url, imagem_fundo, imagem_fundo_mobile, regiao_alvo, ativo, ordem)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)`,
    [
      parsed.data.titulo,
      parsed.data.texto ?? null,
      parsed.data.botaoLabel ?? null,
      parsed.data.botaoUrl ?? null,
      parsed.data.imagemFundo,
      parsed.data.imagemFundoMobile ?? null,
      parsed.data.regiaoAlvo ?? null,
      (proximaOrdem?.max ?? -1) + 1,
    ]
  );

  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}

export async function atualizarBannerHero(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = atualizarBannerHeroSchema.safeParse({
    id: formData.get("id"),
    titulo: formData.get("titulo"),
    texto: formData.get("texto") || undefined,
    botaoLabel: formData.get("botaoLabel") || undefined,
    botaoUrl: formData.get("botaoUrl") || undefined,
    imagemFundo: formData.get("imagemFundo"),
    imagemFundoMobile: formData.get("imagemFundoMobile") || undefined,
    regiaoAlvo: formData.get("regiaoAlvo") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await query(
    `UPDATE banners_hero
     SET titulo = $1, texto = $2, botao_label = $3, botao_url = $4, imagem_fundo = $5, imagem_fundo_mobile = $6, regiao_alvo = $7
     WHERE id = $8`,
    [
      parsed.data.titulo,
      parsed.data.texto ?? null,
      parsed.data.botaoLabel ?? null,
      parsed.data.botaoUrl ?? null,
      parsed.data.imagemFundo,
      parsed.data.imagemFundoMobile ?? null,
      parsed.data.regiaoAlvo ?? null,
      parsed.data.id,
    ]
  );

  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}

export async function alternarBannerHeroAtivo(bannerId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`UPDATE banners_hero SET ativo = NOT ativo WHERE id = $1`, [bannerId]);
  revalidatePath("/admin/hero");
  revalidatePath("/");
  return { ok: true };
}

export async function removerBannerHero(bannerId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`DELETE FROM banners_hero WHERE id = $1`, [bannerId]);
  revalidatePath("/admin/hero");
  revalidatePath("/");
  return { ok: true };
}

export async function moverBannerHero(bannerId: string, direcao: "cima" | "baixo"): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const atual = await queryOne<{ id: string; ordem: number }>(`SELECT id, ordem FROM banners_hero WHERE id = $1`, [
    bannerId,
  ]);
  if (!atual) return { error: "Banner não encontrado." };

  const vizinho = await queryOne<{ id: string; ordem: number }>(
    direcao === "cima"
      ? `SELECT id, ordem FROM banners_hero WHERE ordem < $1 ORDER BY ordem DESC LIMIT 1`
      : `SELECT id, ordem FROM banners_hero WHERE ordem > $1 ORDER BY ordem ASC LIMIT 1`,
    [atual.ordem]
  );
  if (!vizinho) return { ok: true };

  await query(`UPDATE banners_hero SET ordem = $1 WHERE id = $2`, [vizinho.ordem, atual.id]);
  await query(`UPDATE banners_hero SET ordem = $1 WHERE id = $2`, [atual.ordem, vizinho.id]);

  revalidatePath("/admin/hero");
  revalidatePath("/");
  return { ok: true };
}

// ---------------------------------------------------------------------
// EMPRESAS — curadoria (selo, destaque) e remoção
// ---------------------------------------------------------------------

export async function alternarSeloVerificado(empresaId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`UPDATE empresas SET selo_verificado = NOT selo_verificado WHERE usuario_id = $1`, [empresaId]);
  revalidatePath("/admin/empresas");
  revalidatePath(`/empresa/${empresaId}`);
  return { ok: true };
}

export async function alternarAprovadaDestaque(empresaId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`UPDATE empresas SET aprovada_para_destaque = NOT aprovada_para_destaque WHERE usuario_id = $1`, [
    empresaId,
  ]);
  revalidatePath("/admin/empresas");
  revalidatePath("/");
  revalidatePath(`/empresa/${empresaId}`);
  return { ok: true };
}

export async function alternarAprovadaDestaqueProfissional(profissionalId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`UPDATE profissionais SET aprovada_para_destaque = NOT aprovada_para_destaque WHERE usuario_id = $1`, [
    profissionalId,
  ]);
  revalidatePath("/admin/profissionais");
  revalidatePath("/painel/vagas");
  return { ok: true };
}

/** Troca manualmente o plano do profissional (Grátis/Light/Premium) - ate o
 * Mercado Pago estar integrado, essa e a unica forma de ativar um plano
 * pago. Mesma logica de trocarPlanoManualAdmin (generica, so muda o usuario_id
 * apontado), so com os revalidatePath certos pro lado do profissional. Sem
 * fim_em (indefinido) porque o admin controla manualmente quando revogar. */
export async function trocarPlanoProfissionalAdmin(profissionalId: string, planoId: number): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = trocarPlanoManualSchema.safeParse({ empresaId: profissionalId, planoId });
  if (!parsed.success) return { error: "Dados inválidos." };

  await query(`INSERT INTO assinaturas (usuario_id, plano_id, status) VALUES ($1, $2, 'ativa')`, [
    parsed.data.empresaId,
    parsed.data.planoId,
  ]);

  revalidatePath("/admin/profissionais");
  revalidatePath("/perfil-profissional");
  return { ok: true };
}

/** Apaga o profissional e tudo que depende dele. A maioria das tabelas
 * (categorias, galeria, avaliacoes, vinculo, google agenda, disponibilidade,
 * candidaturas) referencia profissionais com ON DELETE CASCADE, mas
 * vagas_profissionais.profissional_selecionado_id, conversas.profissional_id
 * e assinaturas.usuario_id (plano manual concedido pelo admin, se houver) nao
 * tem cascade - precisa limpar essas antes do DELETE FROM usuarios. */
export async function removerProfissional(profissionalId: string): Promise<SimpleActionResult> {
  return removerProfissionaisEmLote([profissionalId]);
}

/** Mesma logica de removerProfissional, mas apagando varios de uma vez numa
 * unica transacao (usado pelo bulk-delete de /admin/profissionais). */
export async function removerProfissionaisEmLote(profissionalIds: string[]): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  if (profissionalIds.length === 0) return { error: "Nenhum profissional selecionado." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE vagas_profissionais SET profissional_selecionado_id = NULL WHERE profissional_selecionado_id = ANY($1::uuid[])`,
      [profissionalIds]
    );
    await client.query(`DELETE FROM conversas WHERE profissional_id = ANY($1::uuid[])`, [profissionalIds]);
    await client.query(`DELETE FROM assinaturas WHERE usuario_id = ANY($1::uuid[])`, [profissionalIds]);
    await client.query(`DELETE FROM usuarios WHERE id = ANY($1::uuid[])`, [profissionalIds]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Não foi possível remover — algum profissional ainda tem vínculos em outras áreas do sistema." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/profissionais");
  revalidatePath("/painel/vagas");
  return { ok: true };
}

// ---------------------------------------------------------------------
// CLIENTES — banir/reativar login e remoção
// ---------------------------------------------------------------------

export async function alternarBanidoCliente(clienteId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(
    `UPDATE usuarios SET banido = NOT banido, ativo = CASE WHEN banido THEN true ELSE false END
     WHERE id = $1 AND tipo = 'cliente'`,
    [clienteId]
  );
  revalidatePath("/admin/clientes");
  return { ok: true };
}

/** Apaga o cliente e tudo que depende dele. avaliacoes/avaliacoes_cliente/
 * eventos_rsvp exigem cliente_id NOT NULL (sem cascade) - precisam ser
 * apagadas. pedidos.cliente_id e conversas.cliente_id sao nullable
 * (justamente pra suportar pedido de convidado) - deixamos o pedido existir
 * mas sem vinculo com a conta removida. */
export async function removerCliente(clienteId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM avaliacoes WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM avaliacoes_cliente WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM eventos_rsvp WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM conversas WHERE cliente_id = $1`, [clienteId]);
    await client.query(`UPDATE pedidos SET cliente_id = NULL WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM usuarios WHERE id = $1`, [clienteId]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Não foi possível remover esse cliente - ele ainda tem vínculos em outras áreas do sistema." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/");
  return { ok: true };
}

/** Liga/desliga uma célula da matriz "função do profissional x categoria da
 * empresa" - define quem aparece em "buscar profissionais" no painel de cada
 * empresa (ver lib/data/profissionais.ts:listProfissionaisCompativeis). */
export async function alternarCompatibilidade(
  categoriaProfissionalId: number,
  categoriaId: number
): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const existe = await queryOne(
    `SELECT 1 FROM categoria_profissional_compatibilidade WHERE categoria_profissional_id = $1 AND categoria_id = $2`,
    [categoriaProfissionalId, categoriaId]
  );
  if (existe) {
    await query(
      `DELETE FROM categoria_profissional_compatibilidade WHERE categoria_profissional_id = $1 AND categoria_id = $2`,
      [categoriaProfissionalId, categoriaId]
    );
  } else {
    await query(
      `INSERT INTO categoria_profissional_compatibilidade (categoria_profissional_id, categoria_id) VALUES ($1,$2)`,
      [categoriaProfissionalId, categoriaId]
    );
  }

  revalidatePath("/admin/categorias-compativeis");
  revalidatePath("/painel/vagas");
  return { ok: true };
}

/** Apaga a empresa e tudo que depende dela. Varias tabelas referenciam
 * empresas/usuarios sem ON DELETE CASCADE (avaliacoes, creditos_compensacao,
 * banners_categoria, destaques, assinaturas, conversas) - precisa limpar
 * essas antes do DELETE FROM usuarios, senao a FK bloqueia. Tudo numa
 * transacao: ou remove tudo, ou nao remove nada. */
export async function removerEmpresa(empresaId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM creditos_compensacao WHERE empresa_id = $1
         OR pedido_interesse_id IN (SELECT id FROM pedido_interesses WHERE empresa_id = $1)`,
      [empresaId]
    );
    await client.query(`DELETE FROM avaliacoes WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM avaliacoes_cliente WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM banners_categoria WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM destaques WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM conversas WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM assinaturas WHERE usuario_id = $1`, [empresaId]);
    // usuarios -> empresas tem ON DELETE CASCADE, que arrasta o resto
    // (galeria, categorias, areas_atuacao, pacotes, vagas, etc.)
    await client.query(`DELETE FROM usuarios WHERE id = $1`, [empresaId]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Não foi possível remover essa empresa - ela ainda tem vínculos em outras áreas do sistema." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/empresas");
  revalidatePath("/");
  return { ok: true };
}

/** Troca a ordem do banner com o vizinho imediatamente anterior/seguinte -
 * simples o bastante pra não precisar de biblioteca de drag-and-drop. */
export async function moverBanner(bannerId: string, direcao: "cima" | "baixo"): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const atual = await queryOne<{ id: string; ordem: number }>(
    `SELECT id, ordem FROM banners_categoria WHERE id = $1`,
    [bannerId]
  );
  if (!atual) return { error: "Banner não encontrado." };

  const vizinho = await queryOne<{ id: string; ordem: number }>(
    direcao === "cima"
      ? `SELECT id, ordem FROM banners_categoria WHERE ordem < $1 ORDER BY ordem DESC LIMIT 1`
      : `SELECT id, ordem FROM banners_categoria WHERE ordem > $1 ORDER BY ordem ASC LIMIT 1`,
    [atual.ordem]
  );
  if (!vizinho) return { ok: true }; // já está na ponta, nada a fazer

  await query(`UPDATE banners_categoria SET ordem = $1 WHERE id = $2`, [vizinho.ordem, atual.id]);
  await query(`UPDATE banners_categoria SET ordem = $1 WHERE id = $2`, [atual.ordem, vizinho.id]);

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

// ---------------------------------------------------------------------
// APARENCIA — imagens de fundo trocaveis sem deploy
// ---------------------------------------------------------------------

/** Config generica chave/valor (imagens de fundo, links sociais, dados de
 * contato...). Valor vazio e valido pra texto (ex: link social desabilitado);
 * pra imagens quem chama (AparenciaImageForm) so envia depois de um resize
 * bem-sucedido, entao nunca manda vazio na pratica. */
export async function salvarConfiguracaoSite(chave: string, valor: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(
    `INSERT INTO configuracoes_site (chave, valor, atualizado_em) VALUES ($1, $2, now())
     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = now()`,
    [chave, valor]
  );

  revalidatePath("/admin/aparencia");
  revalidatePath("/admin/site");
  revalidatePath("/admin/legal");
  revalidatePath("/");
  revalidatePath("/busca");
  revalidatePath("/contato");
  revalidatePath("/privacidade");
  revalidatePath("/termos");
  return { ok: true };
}

// ---------------------------------------------------------------------
// PLANOS — periodicidade com desconto (3/12/24 meses etc.)
// ---------------------------------------------------------------------

export async function criarPlanoPeriodo(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = criarPlanoPeriodoSchema.safeParse({
    planoId: formData.get("planoId"),
    meses: formData.get("meses"),
    descontoPct: formData.get("descontoPct"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  try {
    await query(`INSERT INTO plano_periodos (plano_id, meses, desconto_pct) VALUES ($1,$2,$3)`, [
      parsed.data.planoId,
      parsed.data.meses,
      parsed.data.descontoPct,
    ]);
  } catch {
    return { error: "Já existe uma periodicidade com esse número de meses pra esse plano." };
  }

  revalidatePath("/admin/planos");
  redirect("/admin/planos");
}

export async function alternarPlanoPeriodoAtivo(periodoId: number): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`UPDATE plano_periodos SET ativo = NOT ativo WHERE id = $1`, [periodoId]);
  revalidatePath("/admin/planos");
  return { ok: true };
}

export async function removerPlanoPeriodo(periodoId: number): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`DELETE FROM plano_periodos WHERE id = $1`, [periodoId]);
  revalidatePath("/admin/planos");
  return { ok: true };
}

// ---------------------------------------------------------------------
// USUARIOS ADMIN — adicionar/remover quem tem acesso ao painel
// ---------------------------------------------------------------------

export async function criarAdmin(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = criarAdminSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const existente = await queryOne(`SELECT id FROM usuarios WHERE email = $1`, [parsed.data.email]);
  if (existente) return { error: "Já existe uma conta com esse e-mail." };

  const senhaHash = await hashPassword(parsed.data.senha);
  await query(`INSERT INTO usuarios (tipo, email, senha_hash, ativo) VALUES ('admin', $1, $2, true)`, [
    parsed.data.email,
    senhaHash,
  ]);

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

/** Nao deixa remover a si mesmo (evitaria o admin se travar fora do painel
 * sem querer) nem remover o ultimo admin restante (ninguem mais teria acesso). */
export async function removerAdmin(adminId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  if (session.usuarioId === adminId) return { error: "Você não pode remover a própria conta." };

  const total = await queryOne<{ total: string }>(`SELECT count(*) AS total FROM usuarios WHERE tipo = 'admin'`);
  if (Number(total?.total ?? 0) <= 1) return { error: "Precisa sobrar pelo menos um admin." };

  await query(`DELETE FROM usuarios WHERE id = $1 AND tipo = 'admin'`, [adminId]);
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ---------------------------------------------------------------------
// PAGAMENTOS — acompanhamento manual de assinaturas (ate a integracao real
// com o Mercado Pago existir - ver mercado_pago_assinatura_id em assinaturas)
// ---------------------------------------------------------------------

export async function marcarAssinaturaPaga(formData: FormData): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = marcarAssinaturaPagaSchema.safeParse({
    empresaId: formData.get("empresaId"),
    meses: formData.get("meses"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const atual = await queryOne<{ id: string; plano_id: number; valor_mensal: string }>(
    `SELECT a.id, a.plano_id, p.valor_mensal
     FROM assinaturas a JOIN planos p ON p.id = a.plano_id
     WHERE a.usuario_id = $1 ORDER BY a.criado_em DESC LIMIT 1`,
    [parsed.data.empresaId]
  );
  if (!atual) return { error: "Essa empresa ainda não tem assinatura." };

  await query(
    `UPDATE assinaturas SET status = 'ativa', fim_em = GREATEST(COALESCE(fim_em, now()), now()) + ($2::text || ' months')::interval
     WHERE id = $1`,
    [atual.id, parsed.data.meses]
  );

  // registra no fluxo de caixa (lib/data/admin.ts:getFluxoCaixaResumo/listPagamentosAdmin)
  await query(`INSERT INTO pagamentos (assinatura_id, valor, status, pago_em) VALUES ($1, $2, 'aprovado', now())`, [
    atual.id,
    Number(atual.valor_mensal) * parsed.data.meses,
  ]);

  revalidatePath("/admin/pagamentos");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  return { ok: true };
}

export async function marcarAssinaturaAtrasada(empresaId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(
    `UPDATE assinaturas SET status = 'atrasada'
     WHERE id = (SELECT id FROM assinaturas WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 1)`,
    [empresaId]
  );

  revalidatePath("/admin/pagamentos");
  return { ok: true };
}

export async function trocarPlanoManualAdmin(empresaId: string, planoId: number): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  const parsed = trocarPlanoManualSchema.safeParse({ empresaId, planoId });
  if (!parsed.success) return { error: "Dados inválidos." };

  await query(`INSERT INTO assinaturas (usuario_id, plano_id, status) VALUES ($1, $2, 'ativa')`, [
    parsed.data.empresaId,
    parsed.data.planoId,
  ]);

  revalidatePath("/admin/pagamentos");
  revalidatePath("/painel");
  return { ok: true };
}

// ---------------------------------------------------------------------
// MODERACAO DE PEDIDOS
// ---------------------------------------------------------------------

export async function alternarPedidoOculto(pedidoId: string): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };

  await query(`UPDATE pedidos SET oculto_admin = NOT oculto_admin WHERE id = $1`, [pedidoId]);
  revalidatePath("/admin/pedidos");
  revalidatePath("/");
  revalidatePath("/pedidos");
  return { ok: true };
}

export async function removerPedidoAdmin(pedidoId: string): Promise<SimpleActionResult> {
  return removerPedidosEmLote([pedidoId]);
}

/** avaliacoes/avaliacoes_cliente exigem pedido_id NOT NULL (sem cascade) -
 * precisam ser apagadas antes; conversas/eventos_rsvp sao nullable mas nao
 * tem cascade tambem, entao limpamos igual pra nao deixar lixo referenciando
 * um pedido que nao existe mais. pedido_categorias tem ON DELETE CASCADE. */
export async function removerPedidosEmLote(pedidoIds: string[]): Promise<SimpleActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Sessão inválida." };
  if (pedidoIds.length === 0) return { error: "Nenhum pedido selecionado." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM avaliacoes WHERE pedido_id = ANY($1::uuid[])`, [pedidoIds]);
    await client.query(`DELETE FROM avaliacoes_cliente WHERE pedido_id = ANY($1::uuid[])`, [pedidoIds]);
    await client.query(`DELETE FROM conversas WHERE pedido_id = ANY($1::uuid[])`, [pedidoIds]);
    await client.query(`DELETE FROM eventos_rsvp WHERE pedido_id = ANY($1::uuid[])`, [pedidoIds]);
    await client.query(`DELETE FROM pedidos WHERE id = ANY($1::uuid[])`, [pedidoIds]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Não foi possível remover — algum pedido ainda tem vínculos em outras áreas do sistema." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/");
  revalidatePath("/pedidos");
  return { ok: true };
}
