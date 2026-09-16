import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProdutoAfiliadoPorSlug,
  listProdutosRelacionados,
  registrarVisualizacaoProduto,
} from "@/lib/data/produtos-afiliados";
import { CATEGORIAS_PRODUTOS, FAIXAS_ETARIAS_PRODUTOS, labelCategoriaProduto } from "@/lib/produtos-afiliados-constantes";
import { formatCurrencyBRL } from "@/lib/format";
import { PlaceholderImg, Badge } from "@/components/ui";
import ProdutoCard from "@/components/produtos/ProdutoCard";
import FavoritarProdutoButton from "@/components/produtos/FavoritarProdutoButton";
import LinkMercadoLivre from "@/components/produtos/LinkMercadoLivre";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const produto = await getProdutoAfiliadoPorSlug(slug);
  if (!produto) return {};
  return {
    title: `${produto.nome} — ${formatCurrencyBRL(Number(produto.preco))} | GetFesta`,
    description: `${produto.nome}: veja detalhes e compre com segurança no Mercado Livre através da GetFesta.`,
  };
}

export default async function ProdutoAfiliadoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const produto = await getProdutoAfiliadoPorSlug(slug);
  if (!produto) notFound();

  const relacionados = await listProdutosRelacionados(produto, 4);
  await registrarVisualizacaoProduto(produto.id);

  const faixaLabel = FAIXAS_ETARIAS_PRODUTOS.find((f) => f.value === produto.faixa_etaria)?.label;
  const categoriaInfo = CATEGORIAS_PRODUTOS.find((c) => c.slug === produto.categoria);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/produtos" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Produtos pra sua festa
      </Link>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="relative">
          {produto.imagem_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={produto.imagem_url} alt={produto.nome} className="aspect-square w-full rounded-xl object-cover" />
          ) : (
            <PlaceholderImg className="aspect-square w-full rounded-xl" />
          )}
          <div className="absolute right-3 top-3">
            <FavoritarProdutoButton slug={produto.slug} />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="muted">
              {categoriaInfo?.emoji} {labelCategoriaProduto(produto.categoria)}
            </Badge>
            {produto.tema && <Badge tone="muted">{produto.tema}</Badge>}
            {faixaLabel && <Badge tone="muted">{faixaLabel}</Badge>}
          </div>

          <h1 className="mt-3 text-xl font-extrabold leading-tight">{produto.nome}</h1>
          <p className="mt-2 font-display text-[26px] font-extrabold text-accent-dark">
            {formatCurrencyBRL(Number(produto.preco))}
          </p>

          <LinkMercadoLivre
            produtoId={produto.id}
            href={produto.url_afiliado || produto.url_produto}
            className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-accent px-5 py-3 text-[14px] font-bold text-white hover:bg-accent-dark"
          >
            Ver no Mercado Livre ↗
          </LinkMercadoLivre>

          <p className="mt-4 max-w-sm text-[11.5px] leading-relaxed text-muted-2">
            Produto selecionado pelo GetFesta — você será direcionado ao Mercado Livre pra concluir sua compra com
            segurança.
          </p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="mt-12">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Produtos relacionados</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {relacionados.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
