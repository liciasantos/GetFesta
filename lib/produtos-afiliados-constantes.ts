// Taxonomia curada da vitrine "Produtos para sua festa" (fantasias e
// acessórios afiliados do Mercado Livre) - categoria é fixa (essas 7, do
// documento de estratégia), tema é texto livre no cadastro (qualquer
// personagem/ocasião), TEMAS_SUGERIDOS só alimenta os atalhos rápidos do hub.

export type CategoriaProdutoAfiliado = {
  slug: string;
  label: string;
  emoji: string;
};

export const CATEGORIAS_PRODUTOS: CategoriaProdutoAfiliado[] = [
  { slug: "fantasias", label: "Fantasias", emoji: "🎭" },
  { slug: "super-herois", label: "Super-heróis", emoji: "🦸" },
  { slug: "princesas", label: "Princesas", emoji: "👑" },
  { slug: "halloween", label: "Halloween", emoji: "👻" },
  { slug: "natal", label: "Natal", emoji: "🎄" },
  { slug: "acessorios", label: "Acessórios", emoji: "🎈" },
  { slug: "lembrancinhas", label: "Lembrancinhas", emoji: "🎁" },
];

export function labelCategoriaProduto(slug: string): string {
  return CATEGORIAS_PRODUTOS.find((c) => c.slug === slug)?.label ?? slug;
}

export const FAIXAS_ETARIAS_PRODUTOS: { value: string; label: string }[] = [
  { value: "infantil", label: "Infantil" },
  { value: "adulto", label: "Adulto" },
  { value: "todos", label: "Todas as idades" },
];

export const TEMAS_SUGERIDOS_PRODUTOS = ["Sonic", "Stitch", "Frozen", "Marvel", "Disney", "Halloween", "Natal"];
