import Link from "next/link";
import { listCategorias, listCidades } from "@/lib/data/geo";
import { searchEmpresas } from "@/lib/data/empresas";
import { Badge, PlaceholderImg } from "@/components/ui";

export const dynamic = "force-dynamic";

const FAIXAS = [
  { value: "", label: "Qualquer orçamento" },
  { value: "ate_700", label: "Até R$ 700" },
  { value: "700_3000", label: "R$ 700 – R$ 3.000" },
  { value: "3000_8000", label: "R$ 3.000 – R$ 8.000" },
  { value: "acima_8000", label: "Acima de R$ 8.000" },
] as const;

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; cidadeId?: string; faixa?: string }>;
}) {
  const sp = await searchParams;
  const [categorias, cidades, empresas] = await Promise.all([
    listCategorias(),
    listCidades(),
    searchEmpresas({
      categoriaSlug: sp.categoria || undefined,
      cidadeId: sp.cidadeId ? Number(sp.cidadeId) : undefined,
      faixa: (sp.faixa as "ate_700" | "700_3000" | "3000_8000" | "acima_8000") || undefined,
    }),
  ]);

  return (
    <div>
      {/* BANNER — fundo full-bleed atras do titulo e da caixa de busca */}
      <div className="relative flex min-h-[280px] w-full items-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/busca-banner-bg.svg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* foto sutil por cima da cor de fundo, opacidade baixa pra não brigar com o texto */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/baloes-lilas.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

        <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
          <h1 className="text-2xl font-extrabold text-white sm:text-[28px]">Buscar fornecedores</h1>
          <p className="mt-1 text-[13.5px] text-white/85">Filtre por categoria, cidade e faixa de orçamento.</p>

          <form className="mt-5 grid grid-cols-1 gap-2.5 rounded-xl border border-border bg-surface p-4 shadow-card-hover sm:grid-cols-4">
            <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded-md border border-border px-2.5 py-2 text-sm">
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.nome}
                </option>
              ))}
            </select>
            <select name="cidadeId" defaultValue={sp.cidadeId ?? ""} className="rounded-md border border-border px-2.5 py-2 text-sm">
              <option value="">Todas as cidades</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <select name="faixa" defaultValue={sp.faixa ?? ""} className="rounded-md border border-border px-2.5 py-2 text-sm">
              {FAIXAS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-dark">Filtrar</button>
          </form>
        </div>
      </div>

      {/* RESULTADOS — fundo branco, separado do banner */}
      <div className="bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {empresas.map((e) => (
              <Link
                key={e.usuario_id}
                href={`/empresa/${e.usuario_id}`}
                className="card-hover overflow-hidden rounded-xl border border-border bg-surface hover:border-accent-soft-2"
              >
                {e.foto_capa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.foto_capa} alt={e.nome_fantasia} className="h-48 w-full object-cover" />
                ) : (
                  <PlaceholderImg className="h-48 w-full" />
                )}
                <div className="p-3">
                  <div className="text-[13px] font-bold">{e.nome_fantasia}</div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {e.categorias.join(", ") || "Fornecedor"} · {e.cidades.join(", ")}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    {e.nota_exibida ? `⭐ ${Number(e.nota_exibida).toFixed(1)} (${e.total_avaliacoes_exibido})` : "Empresa nova na GetFesta"}
                    {e.preco_a_partir_de ? ` · a partir de R$ ${Number(e.preco_a_partir_de).toLocaleString("pt-BR")}` : ""}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {e.aprovada_para_destaque && <Badge tone="ad">Destaque</Badge>}
                    {e.selo_verificado && <Badge tone="ok">Selo verificado</Badge>}
                    {!e.perfil_reivindicado && <Badge tone="warn">Perfil não confirmado</Badge>}
                  </div>
                </div>
              </Link>
            ))}
            {empresas.length === 0 && (
              <p className="col-span-full text-sm text-muted">
                Nenhum fornecedor encontrado por aqui ainda — que tal ampliar o raio de busca?
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
