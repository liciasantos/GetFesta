import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  countProdutosAfiliados,
  listProdutosAfiliados,
  listTemasComContagem,
} from "@/lib/data/produtos-afiliados";
import { CATEGORIAS_PRODUTOS, FAIXAS_ETARIAS_PRODUTOS } from "@/lib/produtos-afiliados-constantes";
import ProdutoCard from "@/components/produtos/ProdutoCard";
import { buttonClass } from "@/components/ui";
import { paginaMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const POR_PAGINA = 12;

type Params = { categoria: string };
type SearchParams = { tema?: string; faixaEtaria?: string; page?: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = CATEGORIAS_PRODUTOS.find((c) => c.slug === slug);
  if (!categoria) return {};
  return paginaMetadata({
    title: `${categoria.label} pra Festa: Produtos Selecionados | GetFesta`,
    description: `${categoria.label} selecionadas pra sua festa — compare opções e compre com segurança no Mercado Livre.`,
  });
}

export default async function CategoriaProdutosPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { categoria: slug } = await params;
  const categoria = CATEGORIAS_PRODUTOS.find((c) => c.slug === slug);
  if (!categoria) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filtros = { categoria: slug, tema: sp.tema || undefined, faixaEtaria: sp.faixaEtaria || undefined };

  const [produtos, total, temas] = await Promise.all([
    listProdutosAfiliados({ ...filtros, limit: POR_PAGINA, offset: (page - 1) * POR_PAGINA }),
    countProdutosAfiliados(filtros),
    listTemasComContagem(10, slug),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA));

  function hrefComFiltro(mudancas: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (sp.tema) params.set("tema", sp.tema);
    if (sp.faixaEtaria) params.set("faixaEtaria", sp.faixaEtaria);
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

      <h1 className="mt-3 text-xl font-extrabold">
        {categoria.emoji} {categoria.label}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {categoria.label} selecionadas pra sua festa — compare opções e compre com segurança no Mercado Livre.
      </p>

      {/* FILTROS */}
      <div className="mt-5 flex flex-wrap gap-2">
        {temas.length > 0 && (
          <>
            <Link
              href={hrefComFiltro({ tema: undefined, page: undefined })}
              className={!sp.tema ? buttonClass("primary", "sm") : buttonClass("secondary", "sm")}
            >
              Todos os temas
            </Link>
            {temas.map((t) => (
              <Link
                key={t.tema}
                href={hrefComFiltro({ tema: t.tema, page: undefined })}
                className={sp.tema === t.tema ? buttonClass("primary", "sm") : buttonClass("secondary", "sm")}
              >
                {t.tema}
              </Link>
            ))}
          </>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={hrefComFiltro({ faixaEtaria: undefined, page: undefined })}
          className={!sp.faixaEtaria ? buttonClass("primary", "sm") : buttonClass("secondary", "sm")}
        >
          Todas as idades
        </Link>
        {FAIXAS_ETARIAS_PRODUTOS.map((f) => (
          <Link
            key={f.value}
            href={hrefComFiltro({ faixaEtaria: f.value, page: undefined })}
            className={sp.faixaEtaria === f.value ? buttonClass("primary", "sm") : buttonClass("secondary", "sm")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* GRADE */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {produtos.map((p) => (
          <ProdutoCard key={p.id} produto={p} />
        ))}
      </div>
      {produtos.length === 0 && (
        <p className="mt-6 text-[13px] text-muted">Nenhum produto encontrado com esses filtros.</p>
      )}

      {/* PAGINAÇÃO — preserva os filtros ativos, por isso não reaproveita components/Pagination.tsx */}
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
