import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCategorias, listCidades } from "@/lib/data/geo";
import { getPerfilPermuta, getPermutaConfig, getUsoPlanoPermuta, listBuscas, listOfertas, listVitrine } from "@/lib/data/permuta";
import { PERIODO_LIMITE_LABEL } from "@/lib/permuta/regras";
import { buttonClass } from "@/components/ui";
import { EmpresaAvatar, NivelBadge, formatNota, formatValor } from "@/components/permuta/ui";

export const dynamic = "force-dynamic";

export default async function VitrinePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; estado?: string; todas?: string }>;
}) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const sp = await searchParams;
  const categoriaId = sp.categoria ? Number(sp.categoria) : undefined;
  const estado = sp.estado || undefined;
  const soCombina = sp.todas !== "1";

  const cfg = await getPermutaConfig();
  const [empresas, categorias, cidades, minhasOfertas, minhasBuscas, perfil, uso] = await Promise.all([
    listVitrine(session.usuarioId, cfg, { categoriaId, estado, soCombina }),
    listCategorias(),
    listCidades(),
    listOfertas(session.usuarioId),
    listBuscas(session.usuarioId),
    getPerfilPermuta(session.usuarioId, cfg),
    getUsoPlanoPermuta(session.usuarioId, cfg),
  ]);
  const estados = [...new Set(cidades.map((c) => c.estado))].sort();
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { categoria: sp.categoria, estado: sp.estado, todas: sp.todas, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-accent-dark">Você oferece</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {minhasOfertas.length === 0 && <span className="text-[12.5px] text-muted">Nada cadastrado ainda</span>}
            {minhasOfertas.map((o) => (
              <span key={o.id} className="rounded-full border border-accent-soft-2 bg-accent-soft px-3 py-1 text-[12px] font-semibold text-[#7a2a12]">
                {o.titulo} · {formatValor(o.valor_referencia)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-info-dark">Você busca</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {minhasBuscas.length === 0 && <span className="text-[12.5px] text-muted">Nada cadastrado ainda</span>}
            {minhasBuscas.map((b) => (
              <span key={b.categoria_id} className="rounded-full bg-info-soft px-3 py-1 text-[12px] font-semibold text-info-dark">
                {b.nome}
              </span>
            ))}
          </div>
        </div>
        <Link href="/painel/permutas/ofertas" className="self-start text-[12.5px] font-bold text-accent-dark underline">
          Editar ofertas
        </Link>
      </section>

      <form className="flex flex-wrap items-end gap-3" action="/painel/permutas/vitrine">
        <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
          <Link
            href={`/painel/permutas/vitrine${qs({ todas: undefined })}`}
            className={`rounded-lg px-3 py-2 text-[12.5px] font-bold ${soCombina ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            Combinam comigo
          </Link>
          <Link
            href={`/painel/permutas/vitrine${qs({ todas: "1" })}`}
            className={`rounded-lg px-3 py-2 text-[12.5px] font-bold ${!soCombina ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            Todas as empresas
          </Link>
        </div>
        {!soCombina && <input type="hidden" name="todas" value="1" />}
        <div className="flex-1" />
        <label className="text-[11px] font-bold text-muted">
          Categoria
          <select name="categoria" defaultValue={sp.categoria ?? ""} className="mt-1 block rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text">
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-bold text-muted">
          Estado
          <select name="estado" defaultValue={sp.estado ?? ""} className="mt-1 block rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text">
            <option value="">Todos</option>
            {estados.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <button className={buttonClass("secondary", "sm")}>Filtrar</button>
      </form>

      {perfil && !perfil.podeAbrirNova && perfil.pendencias.length === 0 && (
        <p className="rounded-lg border border-note-border bg-note-bg px-3.5 py-2.5 text-[12.5px] text-note-text">
          Você está no limite de permutas simultâneas do seu nível. Dá para explorar, mas conclua uma permuta antes de
          propor outra.
        </p>
      )}

      {uso.limite !== null && (
        <p
          className={`rounded-lg border px-3.5 py-2.5 text-[12.5px] ${
            uso.usados >= uso.limite ? "border-[#f1c9ca] bg-danger-soft text-danger-dark" : "border-border bg-surface text-muted"
          }`}
        >
          Plano {uso.planoNome}: {uso.usados} de {uso.limite} empresas {PERIODO_LIMITE_LABEL[cfg.periodoLimitePlano]}.
          {uso.usados >= uso.limite ? " Você só pode propor para empresas com quem já trocou nesse período." : ""}{" "}
          <Link href="/painel" className="font-bold underline">
            Fazer upgrade
          </Link>
        </p>
      )}

      {empresas.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center text-[13px] text-muted">
          {soCombina
            ? "Nenhuma empresa combina com suas tags ainda. Veja todas as empresas ou ajuste o que você busca."
            : "Nenhuma empresa com ofertas ativas para esses filtros."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {empresas.map((e) => (
            <article key={e.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <EmpresaAvatar id={e.id} nome={e.nome_fantasia} temLogo={e.tem_logo} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[14.5px] font-bold">{e.nome_fantasia}</h2>
                  <div className="truncate text-[12px] text-muted">
                    {e.categorias.slice(0, 2).join(", ") || "—"}
                    {e.cidade ? ` · ${e.cidade}` : ""}
                  </div>
                </div>
                <NivelBadge nivel={e.perfil.nivel} />
              </div>
              {(e.oferece_o_que_busco || e.busca_o_que_ofereco) && (
                <span
                  className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    e.oferece_o_que_busco && e.busca_o_que_ofereco
                      ? "bg-ok-soft text-ok"
                      : e.oferece_o_que_busco
                        ? "bg-info-soft text-info-dark"
                        : "bg-gold-soft text-[#6b4b00]"
                  }`}
                >
                  {e.oferece_o_que_busco && e.busca_o_que_ofereco
                    ? "Combina nos dois sentidos"
                    : e.oferece_o_que_busco
                      ? "Oferece o que você busca"
                      : "Busca o que você oferece"}
                </span>
              )}
              <div className="flex flex-col gap-1 text-[12.5px] leading-relaxed">
                <div>
                  <b className="text-accent-dark">Oferece </b>
                  {e.ofertas.map((o) => `${o.titulo} (${formatValor(o.valor_referencia)})`).join(" · ")}
                </div>
                <div>
                  <b className="text-info-dark">Busca </b>
                  {e.buscas.join(", ") || "—"}
                </div>
              </div>
              <div className="text-[12px] text-muted">
                {e.perfil.stats.concluidas} {e.perfil.stats.concluidas === 1 ? "permuta" : "permutas"} · {formatNota(e.perfil.stats.nota)}
                {e.trocas_comigo > 0 ? ` · já trocou com você ${e.trocas_comigo}x` : ""}
              </div>
              <div className="mt-auto flex gap-2">
                <Link href={`/empresa/${e.slug}`} className={`${buttonClass("secondary", "sm")} flex-1`}>
                  Ver perfil
                </Link>
                {uso.podeTrocarCom(e.id) ? (
                  <Link href={`/painel/permutas/nova?para=${e.id}`} className={`${buttonClass("primary", "sm")} flex-1`}>
                    Propor troca
                  </Link>
                ) : (
                  <Link href="/painel" className={`${buttonClass("ghost", "sm")} flex-1`} title="Limite de empresas do seu plano atingido">
                    Upgrade para trocar
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
