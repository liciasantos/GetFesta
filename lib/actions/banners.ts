"use server";

import { query } from "@/lib/db";

/** Cliques nos banners pagos (hero e "Destaques da semana"), separados dos
 * cliques de WhatsApp do perfil normal (ver registrarCliqueWhatsapp em
 * lib/actions/pedidos.ts) - alimentam o KPI "Cliques no banner" no painel de
 * quem contratou o anúncio (ver getPainelKpis). Sem checagem de sessão: o
 * clique pode vir de qualquer visitante, igual ao clique de WhatsApp. */
export async function registrarCliqueBannerHero(empresaId: string): Promise<void> {
  await query(`INSERT INTO empresa_eventos (empresa_id, tipo) VALUES ($1, 'clique_banner_hero')`, [empresaId]);
}

export async function registrarCliqueBannerCategoria(empresaId: string): Promise<void> {
  await query(`INSERT INTO empresa_eventos (empresa_id, tipo) VALUES ($1, 'clique_banner_categoria')`, [empresaId]);
}
