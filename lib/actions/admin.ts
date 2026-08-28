"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne, pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { criarBannerHeroSchema, criarBannerSchema } from "@/lib/validators";

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
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const proximaOrdem = await queryOne<{ max: number | null }>(`SELECT max(ordem) AS max FROM banners_hero`);

  await query(
    `INSERT INTO banners_hero (titulo, texto, botao_label, botao_url, imagem_fundo, ativo, ordem)
     VALUES ($1,$2,$3,$4,$5,true,$6)`,
    [
      parsed.data.titulo,
      parsed.data.texto ?? null,
      parsed.data.botaoLabel ?? null,
      parsed.data.botaoUrl ?? null,
      parsed.data.imagemFundo,
      (proximaOrdem?.max ?? -1) + 1,
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
