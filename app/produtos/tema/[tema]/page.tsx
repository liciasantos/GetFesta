import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  countProdutosAfiliados,
  listCategoriasComContagem,
  listProdutosAfiliados,
} from "@/lib/data/produtos-afiliados";
import { CATEGORIAS_PRODUTOS, labelCategoriaProduto } from "@/lib/produtos-afiliados-constantes";
import ProdutoCard from "@/components/produtos/ProdutoCard";
import { buttonClass } from "@/components/ui";
import { paginaMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const POR_PAGINA = 12;

type Params = { tema: string };
type SearchParams = { categoria?: string; page?: string };

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tema: temaSlug } = await params;
  const tema = capitalizar(decodeURIComponent(temaSlug));
  return paginaMetadata({
    title: `Fantasias e Produtos ${tema} pra Festa | GetFesta`,
    description: `Fantasias e acessórios do tema ${tema} selecionados pra sua festa — compre com segurança no Mercado Livre.`,
  });
}

export default async function TemaProdutosPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { tema: temaSlug } = await params;
  const tema = capitalizar(decodeURIComponent(temaSlug));

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filtros = { tema, categoria: sp.categoria || undefined };

  const [produtos, total, categorias] = await Promise.all([
    listProdutosAfiliados({ ...filtros, limit: POR_PAGINA, offset: (page - 1) * POR_PAGINA }),
    countProdutosAfiliados(filtros),
    listCategoriasComContagem(tema),
  ]);
  if (total === 0 && page === 1) notFound();
  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA));

  function hrefComFiltro(mudancas: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (sp.categoria) params.set("categoria", sp.categoria);
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/produtos" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Produtos pra sua festa
      </Link>

      <h1 className="mt-3 text-xl font-extrabold">Tudo de {tema} pra sua festa</h1>
      <p className="mt-1 text-sm text-muted">
        Fantasias e acessórios do tema {tema} selecionados pra sua festa — compre com segurança no Mercado Livre.
      </p>

      {categorias.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={hrefComFiltro({ categoria: undefined, page: undefined })}
            className={!sp.categoria ? buttonClass("primary", "sm") : buttonClass("secondary", "sm")}
          >
            Todas as categorias
          </Link>
          {categorias.map((c) => (
            <Link
              key={c.categoria}
              href={hrefComFiltro({ categoria: c.categoria, page: undefined })}
              className={sp.categoria === c.categoria ? buttonClass("primary", "sm") : buttonClass("secondary", "sm")}
            >
              {CATEGORIAS_PRODUTOS.find((cat) => cat.slug === c.categoria)?.emoji} {labelCategoriaProduto(c.categoria)}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {produtos.map((p) => (
          <ProdutoCard key={p.id} produto={p} />
        ))}
      </div>
      {produtos.length === 0 && (
        <p className="mt-6 text-[13px] text-muted">Nenhum produto encontrado com esses filtros.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={hrefComFiltro({ page: String(page - 1) })} className={buttonClass("secondary", "sm")}>
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[12px] font-semibold text-muted-2">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={hrefComFiltro({ page: String(page + 1) })} className={buttonClass("secondary", "sm")}>
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
