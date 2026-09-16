"use server";

import { query } from "@/lib/db";
import { listProdutosPorSlugs, type ProdutoAfiliado } from "@/lib/data/produtos-afiliados";

/** Clique no "Ver no Mercado Livre" - sem checagem de sessão, mesmo padrão de
 * registrarCliqueBannerCategoria (lib/actions/banners.ts): qualquer visitante
 * pode disparar, chamado no onClick antes de abrir o link externo. */
export async function registrarCliqueProdutoAction(produtoId: string): Promise<void> {
  await query(`INSERT INTO produto_afiliado_eventos (produto_id, tipo) VALUES ($1, 'clique')`, [produtoId]);
}

/** Usado pela página /produtos/favoritos (client component) pra buscar os
 * dados reais dos produtos cujos slugs estão salvos no localStorage do
 * navegador - não existe tabela de favoritos, é tudo local por enquanto. */
export async function listProdutosPorSlugsAction(slugs: string[]): Promise<ProdutoAfiliado[]> {
  return listProdutosPorSlugs(slugs);
}
