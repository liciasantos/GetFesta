import Link from "next/link";
import { PlaceholderImg } from "@/components/ui";
import { formatCurrencyBRL } from "@/lib/format";
import { labelCategoriaProduto } from "@/lib/produtos-afiliados-constantes";
import type { ProdutoAfiliado } from "@/lib/data/produtos-afiliados";
import FavoritarProdutoButton from "@/components/produtos/FavoritarProdutoButton";
import LinkMercadoLivre from "@/components/produtos/LinkMercadoLivre";

/** Card usado em todas as grades da vitrine (hub, categoria, tema, busca,
 * favoritos, relacionados) - a foto/nome leva pro preview interno
 * (/produtos/[slug], bom pra SEO), e o botão "Ver no Mercado Livre" já sai
 * direto pro anúncio, pra quem não precisa do preview. */
export default function ProdutoCard({ produto }: { produto: ProdutoAfiliado }) {
  return (
    <div className="card-hover flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative">
        <Link href={`/produtos/${produto.slug}`}>
          {produto.imagem_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={produto.imagem_url} alt={produto.nome} className="aspect-square w-full object-cover" />
          ) : (
            <PlaceholderImg className="aspect-square w-full" />
          )}
        </Link>
        <div className="absolute right-2 top-2">
          <FavoritarProdutoButton slug={produto.slug} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[10px] font-bold uppercase tracking-wide text-accent-dark">
          {labelCategoriaProduto(produto.categoria)}
        </span>
        <Link href={`/produtos/${produto.slug}`} className="text-[13px] font-bold leading-tight hover:underline">
          {produto.nome}
        </Link>
        <span className="font-display text-[17px] font-extrabold text-text">{formatCurrencyBRL(Number(produto.preco))}</span>

        <LinkMercadoLivre
          produtoId={produto.id}
          href={produto.url_afiliado || produto.url_produto}
          className="mt-auto inline-flex items-center justify-center gap-1 rounded-lg bg-accent px-3 py-2 text-[12.5px] font-bold text-white hover:bg-accent-dark"
        >
          Ver no Mercado Livre ↗
        </LinkMercadoLivre>
      </div>
    </div>
  );
}
