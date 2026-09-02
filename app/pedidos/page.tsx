import { listPedidosFeed } from "@/lib/data/pedidos";
import { listCategorias, listCidades } from "@/lib/data/geo";
import { ESTADOS } from "@/lib/estados";
import { budgetRangeLabel, timeAgo } from "@/lib/format";
import { maskContactLeak } from "@/lib/contact-filter";
import { categoryColor } from "@/lib/category-colors";

export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; cidadeId?: string; data?: string }>;
}) {
  const sp = await searchParams;
  const [pedidos, categorias, cidades] = await Promise.all([
    listPedidosFeed({
      limit: 60,
      categoriaSlug: sp.categoria || undefined,
      cidadeId: sp.cidadeId ? Number(sp.cidadeId) : undefined,
      dataAPartirDe: sp.data || undefined,
    }),
    listCategorias(),
    listCidades(),
  ]);
  const filtroAtivo = !!(sp.categoria || sp.cidadeId || sp.data);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-xl font-extrabold">Pedidos publicados</h1>
      <p className="mt-1 text-sm text-muted">Visível para qualquer visitante — sem nome, sem contato.</p>

      <form className="mt-5 flex flex-wrap items-end gap-2.5 rounded-xl border border-border bg-surface p-4">
        <Field label="Data (a partir de)">
          <input
            type="date"
            name="data"
            defaultValue={sp.data ?? ""}
            className="rounded-md border border-border px-2.5 py-2 text-sm"
          />
        </Field>
        <Field label="Local">
          <select name="cidadeId" defaultValue={sp.cidadeId ?? ""} className="rounded-md border border-border px-2.5 py-2 text-sm">
            <option value="">Todas as cidades</option>
            {ESTADOS.map((estado) => {
              const cidadesDoEstado = cidades.filter((c) => c.estado === estado.sigla);
              if (cidadesDoEstado.length === 0) return null;
              return (
                <optgroup key={estado.sigla} label={estado.nome}>
                  {cidadesDoEstado.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </Field>
        <Field label="Tipo de serviço">
          <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded-md border border-border px-2.5 py-2 text-sm">
            <option value="">Todos os serviços</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          aria-label="Buscar"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md bg-accent text-white hover:bg-accent-dark"
        >
          <SearchIcon />
        </button>
        {filtroAtivo && (
          <a href="/pedidos" className="text-[12px] font-bold text-muted underline">
            Limpar filtros
          </a>
        )}
      </form>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pedidos.map((p, i) => {
          const color = categoryColor(p.categorias[0] ?? i);
          const hoje = new Date();
          const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
          const vencido = new Date(p.data_evento) < hojeUTC;
          return (
          <div
            key={p.id}
            className={`rounded-xl border p-4 ${
              vencido ? "border-border bg-surface-alt/60 grayscale opacity-60" : "border-border bg-surface"
            }`}
          >
            {vencido && (
              <span className="mb-1.5 inline-flex rounded-full bg-muted-2/20 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-2">
                Data já passou
              </span>
            )}
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-bold ${color.bg} ${color.text}`}>
              {p.categorias[0] ?? p.tipo_evento}
            </span>
            <h3 className="mt-3 text-[17px] font-bold leading-tight">{p.tipo_evento}</h3>
            <p className="mt-1 text-[11.5px] font-semibold text-muted">
              {p.bairro_nome ?? p.cidade_nome} ·{" "}
              {new Date(p.data_evento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
            </p>
            <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted">{maskContactLeak(p.descricao)}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.categorias.map((c, ci) => {
                const tagColor = categoryColor(c ?? ci);
                return (
                  <span key={c} className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tagColor.bg} ${tagColor.text}`}>
                    {c}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-border pt-2.5">
              <span className="text-[10.5px] font-bold text-accent-dark">
                {budgetRangeLabel(p.orcamento_min ? Number(p.orcamento_min) : null, p.orcamento_max ? Number(p.orcamento_max) : null)}
              </span>
              <span className="text-[10px] font-semibold text-muted-2">{timeAgo(p.criado_em)}</span>
            </div>
          </div>
          );
        })}
        {pedidos.length === 0 && (
          <p className="col-span-full text-sm text-muted">
            {filtroAtivo
              ? "Nenhum pedido encontrado com esses filtros — tente ampliar a busca."
              : "Nenhum pedido publicado ainda — que tal ser o primeiro?"}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10.5px] font-bold uppercase text-muted-2">{label}</label>
      {children}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M18 18L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
