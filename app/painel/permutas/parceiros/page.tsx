import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatDataCurta, listAcordos, montarParceiros, visaoDoAcordo } from "@/lib/data/permuta";
import { EmpresaAvatar, StatusEntrega, formatNota } from "@/components/permuta/ui";

export const dynamic = "force-dynamic";

export default async function ParceirosPage({ searchParams }: { searchParams: Promise<{ filtro?: string; q?: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");
  const sp = await searchParams;

  const acordos = (await listAcordos(session.usuarioId)).map((a) => visaoDoAcordo(a, session.usuarioId));
  const todos = montarParceiros(acordos);
  const pendentes = todos.filter((p) => p.devo > 0 || p.meDeve > 0);
  const q = (sp.q ?? "").trim().toLowerCase();
  const lista = (sp.filtro === "pendentes" ? pendentes : todos).filter((p) => !q || p.nome.toLowerCase().includes(q));

  const totalFez = todos.reduce((s, p) => s + p.fezParaEle, 0);
  const totalRecebeu = todos.reduce((s, p) => s + p.eleFezParaMim, 0);
  const totalConcluidas = todos.reduce((s, p) => s + p.permutasConcluidas, 0);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] text-muted">Todas as empresas com quem você já trocou serviços — e quem fez o evento de quem.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Empresas na sua rede" valor={todos.length} />
        <Stat label="Permutas concluídas" valor={totalConcluidas} />
        <Stat label="Eventos que você fez" valor={totalFez} cor="text-accent-dark" />
        <Stat label="Eventos feitos para você" valor={totalRecebeu} cor="text-info-dark" />
      </div>

      <form className="flex flex-wrap items-center gap-3" action="/painel/permutas/parceiros">
        <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
          <Link
            href="/painel/permutas/parceiros"
            className={`rounded-lg px-3 py-2 text-[12.5px] font-bold ${sp.filtro !== "pendentes" ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            Todas ({todos.length})
          </Link>
          <Link
            href="/painel/permutas/parceiros?filtro=pendentes"
            className={`rounded-lg px-3 py-2 text-[12.5px] font-bold ${sp.filtro === "pendentes" ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            Com entrega pendente ({pendentes.length})
          </Link>
        </div>
        {sp.filtro && <input type="hidden" name="filtro" value={sp.filtro} />}
        <div className="flex-1" />
        <label className="flex items-center gap-2">
          <span className="sr-only">Buscar empresa</span>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar empresa"
            className="w-56 rounded-md border border-border-strong bg-surface px-3 py-2 text-[13px]"
          />
        </label>
      </form>

      {lista.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center text-[13px] text-muted">
          {todos.length === 0 ? (
            <>
              Você ainda não trocou com ninguém.{" "}
              <Link href="/painel/permutas/vitrine" className="font-bold text-accent-dark underline">
                Encontre parceiros na vitrine
              </Link>
              .
            </>
          ) : (
            "Nenhuma empresa para esse filtro."
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[minmax(0,2fr)_90px_120px_120px_110px_140px] gap-3 bg-surface-alt px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-muted md:grid">
            <div>Empresa</div>
            <div>Permutas</div>
            <div>Você fez p/ ela</div>
            <div>Ela fez p/ você</div>
            <div>Última</div>
            <div>Nota mútua</div>
          </div>
          {lista.map((p) => (
            <details key={p.id} className="group border-t border-border first:border-t-0">
              <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-3 px-5 py-3.5 text-[13px] md:grid-cols-[minmax(0,2fr)_90px_120px_120px_110px_140px] [&::-webkit-details-marker]:hidden">
                <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                  <EmpresaAvatar id={p.id} nome={p.nome} temLogo={p.temLogo} size={36} />
                  <div className="min-w-0">
                    <div className="truncate font-bold">{p.nome}</div>
                    <div className="flex flex-wrap gap-1.5 text-[11.5px]">
                      {p.meDeve > 0 && <span className="rounded-full bg-ok-soft px-2 font-bold text-ok">Te deve {p.meDeve}</span>}
                      {p.devo > 0 && <span className="rounded-full bg-note-bg px-2 font-bold text-note-text">Você deve {p.devo}</span>}
                      <span className="text-muted group-open:hidden">Ver histórico ▾</span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-muted md:hidden">Permutas: </span>
                  <b>{p.permutasConcluidas}</b>
                  {p.acordosAtivos > 0 && <span className="text-muted"> +{p.acordosAtivos} ativa(s)</span>}
                </div>
                <div className="font-bold text-accent-dark">
                  <span className="font-normal text-muted md:hidden">Você fez: </span>→ {p.fezParaEle}
                </div>
                <div className="font-bold text-info-dark">
                  <span className="font-normal text-muted md:hidden">Ela fez: </span>← {p.eleFezParaMim}
                </div>
                <div className="text-muted">{p.ultima ? formatDataCurta(p.ultima) : "—"}</div>
                <div className="text-[12px] leading-snug text-muted">
                  Deu {formatNota(p.notaDada)}
                  <br />
                  Recebeu {formatNota(p.notaRecebida)}
                </div>
              </summary>
              <div className="mx-5 mb-4 rounded-xl bg-bg p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Histórico de eventos com {p.nome}</span>
                  <Link href={`/painel/permutas/nova?para=${p.id}`} className="text-[12.5px] font-bold text-accent-dark underline">
                    Propor de novo
                  </Link>
                </div>
                <ul className="divide-y divide-border">
                  {p.historico.map((h, i) => (
                    <li key={h.acordoId + i} className="grid grid-cols-[100px_1fr] items-center gap-2 py-2 text-[12.5px] sm:grid-cols-[110px_200px_1fr_110px_60px]">
                      <span className="text-muted">{formatDataCurta(h.data)}</span>
                      <span className={`font-bold ${h.direcao === "eu" ? "text-accent-dark" : "text-info-dark"}`}>
                        {h.direcao === "eu" ? `Você → ${p.nome}` : `${p.nome} → Você`}
                      </span>
                      <Link href={`/painel/permutas/acordos/${h.acordoId}`} className="underline">
                        {h.titulo}
                      </Link>
                      <StatusEntrega status={h.status} />
                      <span className="text-muted">{h.nota ? `★ ${h.nota}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, valor, cor = "text-text" }: { label: string; valor: number; cor?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[12px] font-semibold text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-extrabold ${cor}`}>{valor}</div>
    </div>
  );
}
