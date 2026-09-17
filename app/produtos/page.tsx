import Link from "next/link";
import type { Metadata } from "next";
import {
  listProdutosAfiliados,
  listProdutosDestaque,
  listTemasComContagem,
} from "@/lib/data/produtos-afiliados";
import { CATEGORIAS_PRODUTOS } from "@/lib/produtos-afiliados-constantes";
import ProdutoCard from "@/components/produtos/ProdutoCard";
import { paginaMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = paginaMetadata({
  title: "Produtos para sua Festa: Fantasias e Acessórios | GetFesta",
  description:
    "Fantasias infantis, super-heróis, princesas, Halloween, Natal e acessórios selecionados pra sua festa — compre com segurança no Mercado Livre.",
});

export default async function ProdutosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  const [destaque, temas, resultadoBusca] = await Promise.all([
    q ? Promise.resolve([]) : listProdutosDestaque(8),
    q ? Promise.resolve([]) : listTemasComContagem(7),
    q ? listProdutosAfiliados({ q, limit: 24 }) : Promise.resolve([]),
  ]);

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border bg-surface-alt">
        <div className="mx-auto max-w-4xl px-6 pt-16 pb-10 text-center sm:pt-20">
          <span className="section-kicker justify-center">Para clientes</span>
          <h1 className="mt-4 font-display text-[28px] font-extrabold leading-[1.15] sm:text-[38px]">
            Produtos pra sua festa
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted sm:text-[16px]">
            Fantasias, acessórios e itens selecionados pra deixar seu evento ainda mais completo.
          </p>

          <form className="mx-auto mt-6 flex max-w-lg gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Busque por personagem, tema ou produto..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm"
            />
            <button className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-dark">
              Buscar
            </button>
          </form>

          <p className="mx-auto mt-4 max-w-lg text-[11.5px] leading-relaxed text-muted-2">
            Produtos selecionados pelo GetFesta — você será direcionado ao Mercado Livre pra concluir sua compra.
          </p>
        </div>
      </section>

      {q ? (
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-[15px] font-bold">
            {resultadoBusca.length} resultado{resultadoBusca.length === 1 ? "" : "s"} pra &quot;{q}&quot;
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {resultadoBusca.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
          {resultadoBusca.length === 0 && (
            <p className="mt-4 text-[13px] text-muted">
              Nada encontrado — tente outro termo, ou dê uma olhada nas categorias abaixo.
            </p>
          )}
        </section>
      ) : (
        <>
          {/* CATEGORIAS */}
          <section className="mx-auto max-w-6xl px-6 py-10">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Categorias</h2>
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
              {CATEGORIAS_PRODUTOS.map((c) => (
                <Link
                  key={c.slug}
                  href={`/produtos/categoria/${c.slug}`}
                  className="card-hover flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center"
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-[11.5px] font-bold leading-tight">{c.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* MAIS PROCURADOS */}
          {destaque.length > 0 && (
            <section className="border-t border-border bg-surface-alt px-6 py-10">
              <div className="mx-auto max-w-6xl">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Mais procurados</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {destaque.map((p) => (
                    <ProdutoCard key={p.id} produto={p} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* EXPLORE POR TEMA */}
          {temas.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 py-10">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Explore por tema</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {temas.map((t) => (
                  <Link
                    key={t.tema}
                    href={`/produtos/tema/${encodeURIComponent(t.tema.toLowerCase())}`}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-bold hover:border-accent-soft-2 hover:bg-accent-soft"
                  >
                    {t.tema}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {destaque.length === 0 && temas.length === 0 && (
            <p className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-muted">
              Nenhum produto cadastrado ainda — volte em breve!
            </p>
          )}
        </>
      )}
    </div>
  );
}
