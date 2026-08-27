"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { criarBannerSchema } from "@/lib/validators";

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
