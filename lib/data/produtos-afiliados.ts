import { query, queryOne } from "@/lib/db";

export type ProdutoAfiliado = {
  id: string;
  slug: string;
  nome: string;
  imagem_url: string | null;
  preco: string;
  categoria: string;
  tema: string | null;
  faixa_etaria: string | null;
  url_produto: string;
  url_afiliado: string | null;
  destaque: boolean;
};

const PRODUTO_CAMPOS =
  "id, slug, nome, imagem_url, preco, categoria, tema, faixa_etaria, url_produto, url_afiliado, destaque";

export type FiltrosProdutosAfiliados = {
  categoria?: string;
  tema?: string;
  faixaEtaria?: string;
  q?: string;
};

function condicoesFiltro(filtros: FiltrosProdutosAfiliados): { conditions: string[]; params: unknown[] } {
  const conditions: string[] = ["ativo = true"];
  const params: unknown[] = [];

  if (filtros.categoria) {
    params.push(filtros.categoria);
    conditions.push(`categoria = $${params.length}`);
  }
  if (filtros.tema) {
    params.push(filtros.tema);
    conditions.push(`tema ILIKE $${params.length}`);
  }
  if (filtros.faixaEtaria) {
    params.push(filtros.faixaEtaria);
    conditions.push(`faixa_etaria = $${params.length}`);
  }
  if (filtros.q) {
    params.push(`%${filtros.q}%`);
    conditions.push(`(nome ILIKE $${params.length} OR tema ILIKE $${params.length})`);
  }
  return { conditions, params };
}

/** Vitrine pública (hub, páginas de categoria/tema, busca) - só produtos
 * ativos. `destaque`/curadoria de "mais procurados" é manual, feita no admin
 * (não temos dado de vendas reais do Mercado Livre pra calcular isso). */
export async function listProdutosAfiliados(
  filtros: FiltrosProdutosAfiliados & { limit?: number; offset?: number } = {}
): Promise<ProdutoAfiliado[]> {
  const { conditions, params } = condicoesFiltro(filtros);
  const limit = filtros.limit ?? 24;
  const offset = filtros.offset ?? 0;
  params.push(limit, offset);
  return query<ProdutoAfiliado>(
    `SELECT ${PRODUTO_CAMPOS} FROM produtos_afiliados
     WHERE ${conditions.join(" AND ")}
     ORDER BY destaque DESC, criado_em DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
}

export async function countProdutosAfiliados(filtros: FiltrosProdutosAfiliados = {}): Promise<number> {
  const { conditions, params } = condicoesFiltro(filtros);
  const row = await queryOne<{ total: string }>(
    `SELECT count(*) AS total FROM produtos_afiliados WHERE ${conditions.join(" AND ")}`,
    params
  );
  return Number(row?.total ?? 0);
}

export async function getProdutoAfiliadoPorSlug(slug: string): Promise<ProdutoAfiliado | null> {
  return queryOne<ProdutoAfiliado>(`SELECT ${PRODUTO_CAMPOS} FROM produtos_afiliados WHERE slug = $1 AND ativo = true`, [
    slug,
  ]);
}

/** Produtos da mesma categoria (ou, na falta de mais opções, mesmo tema),
 * pra sugestão no rodapé da página de produto. */
export async function listProdutosRelacionados(produto: ProdutoAfiliado, limit = 4): Promise<ProdutoAfiliado[]> {
  return query<ProdutoAfiliado>(
    `SELECT ${PRODUTO_CAMPOS} FROM produtos_afiliados
     WHERE ativo = true AND id <> $1 AND (categoria = $2 OR tema = $3)
     ORDER BY (categoria = $2) DESC, destaque DESC, criado_em DESC
     LIMIT $4`,
    [produto.id, produto.categoria, produto.tema, limit]
  );
}

export async function listProdutosDestaque(limit = 8): Promise<ProdutoAfiliado[]> {
  return query<ProdutoAfiliado>(
    `SELECT ${PRODUTO_CAMPOS} FROM produtos_afiliados WHERE ativo = true AND destaque = true ORDER BY criado_em DESC LIMIT $1`,
    [limit]
  );
}

export type CategoriaComContagem = { categoria: string; total: number };

export async function listCategoriasComContagem(tema?: string): Promise<CategoriaComContagem[]> {
  const params: unknown[] = [];
  const condicaoTema = tema ? (params.push(tema), `AND tema ILIKE $${params.length}`) : "";
  return query<CategoriaComContagem>(
    `SELECT categoria, count(*)::int AS total FROM produtos_afiliados WHERE ativo = true ${condicaoTema} GROUP BY categoria`,
    params
  );
}

export type TemaComContagem = { tema: string; total: number };

export async function listTemasComContagem(limit = 12, categoria?: string): Promise<TemaComContagem[]> {
  const params: unknown[] = [];
  const condicaoCategoria = categoria ? (params.push(categoria), `AND categoria = $${params.length}`) : "";
  params.push(limit);
  return query<TemaComContagem>(
    `SELECT tema, count(*)::int AS total FROM produtos_afiliados
     WHERE ativo = true AND tema IS NOT NULL ${condicaoCategoria}
     GROUP BY tema ORDER BY total DESC, tema ASC LIMIT $${params.length}`,
    params
  );
}

/** Usado só pela página de favoritos (/produtos/favoritos), que guarda a
 * lista de slugs favoritados no localStorage do navegador (sem conta, sem
 * tabela nova) e busca os dados reais aqui na hora de exibir. */
export async function listProdutosPorSlugs(slugs: string[]): Promise<ProdutoAfiliado[]> {
  if (slugs.length === 0) return [];
  return query<ProdutoAfiliado>(
    `SELECT ${PRODUTO_CAMPOS} FROM produtos_afiliados WHERE ativo = true AND slug = ANY($1::text[])`,
    [slugs]
  );
}

/** Registra 1 visualização por carregamento da página de produto - mesmo
 * padrão de registrarVisualizacoesBannerCategoria (lib/data/banners.ts). */
export async function registrarVisualizacaoProduto(produtoId: string): Promise<void> {
  await query(`INSERT INTO produto_afiliado_eventos (produto_id, tipo) VALUES ($1, 'visualizacao')`, [produtoId]);
}
