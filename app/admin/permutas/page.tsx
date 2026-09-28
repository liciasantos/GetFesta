import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  formatDataCurta,
  getPermutaConfig,
  getResumoPermutaAdmin,
  listAcordos,
  listEmpresasPermutaAdmin,
  sincronizarPermutas,
} from "@/lib/data/permuta";
import { STATUS_ACORDO_LABEL } from "@/lib/permuta/regras";
import { AlternarOfertaAdminButton, ControleEmpresaForm, PermutaConfigForm } from "@/components/admin/PermutaAdminForms";
import { NivelBadge, StatusAcordo, StatusEntrega, formatNota, formatValor } from "@/components/permuta/ui";

export const dynamic = "force-dynamic";

const ABAS = [
  { id: "visao", label: "Visão geral" },
  { id: "acordos", label: "Acordos" },
  { id: "empresas", label: "Empresas e ofertas" },
  { id: "regras", label: "Regras e configurações" },
];

export default async function AdminPermutasPage({ searchParams }: { searchParams: Promise<{ aba?: string; status?: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");
  const sp = await searchParams;
  const aba = ABAS.some((a) => a.id === sp.aba) ? sp.aba! : "visao";

  const cfg = await getPermutaConfig();
  await sincronizarPermutas(cfg);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>
      <div className="mb-1 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold">Permuta B2B</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.ativa ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger-dark"}`}>
          {cfg.ativa ? "Rede ativa" : "Rede desativada"}
        </span>
      </div>
      <p className="mb-5 text-sm text-muted">Troca de serviços entre empresas: acompanhe acordos, resolva disputas e ajuste todas as regras.</p>

      <nav className="mb-6 flex flex-wrap gap-1 rounded-xl bg-surface-alt p-1">
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`/admin/permutas?aba=${a.id}`}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-bold ${aba === a.id ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            {a.label}
          </Link>
        ))}
      </nav>

      {aba === "visao" && <Visao />}
      {aba === "acordos" && <Acordos status={sp.status} />}
      {aba === "empresas" && <Empresas />}
      {aba === "regras" && <PermutaConfigForm cfg={cfg} />}
    </div>
  );
}

async function Visao() {
  const [r, disputas] = await Promise.all([getResumoPermutaAdmin(), listAcordos(null, "em_disputa")]);
  if (!r) return null;
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");
  const assinados = r.em_execucao + r.concluidos + r.disputas;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Empresas participando" valor={`${r.participantes} de ${r.total_empresas}`} sub={`Adesão ${pct(r.participantes, r.total_empresas)} · ${r.empresas_com_oferta} com oferta`} />
        <Kpi label="Propostas abertas" valor={r.propostas} sub={`Conversão ${pct(assinados, assinados + r.recusados + r.propostas)}`} />
        <Kpi label="Em execução" valor={r.em_execucao} sub={`${r.concluidos} concluídas`} />
        <Kpi label="Furos" valor={r.furos} sub={`em ${r.entregas_confirmadas + r.furos} entregas`} alerta={r.furos > 0} />
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-[14px] font-bold">Disputas abertas ({disputas.length})</h2>
        {disputas.length === 0 ? (
          <p className="text-[13px] text-muted">Nenhuma disputa no momento.</p>
        ) : (
          <ul className="divide-y divide-border">
            {disputas.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3 text-[13px]">
                <div className="min-w-0 flex-1">
                  <b>
                    {a.proponente_nome} ⇄ {a.destinatario_nome}
                  </b>
                  <div className="truncate text-muted">{a.disputa_motivo}</div>
                </div>
                <Link href={`/admin/permutas/${a.id}`} className="font-bold text-accent-dark underline">
                  Resolver
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function Acordos({ status }: { status?: string }) {
  const acordos = await listAcordos(null, status && STATUS_ACORDO_LABEL[status] ? status : undefined);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-[12.5px] font-bold">
        <Link href="/admin/permutas?aba=acordos" className={!status ? "text-text underline" : "text-muted"}>
          Todos
        </Link>
        {Object.entries(STATUS_ACORDO_LABEL).map(([k, v]) => (
          <Link key={k} href={`/admin/permutas?aba=acordos&status=${k}`} className={status === k ? "text-text underline" : "text-muted"}>
            {v}
          </Link>
        ))}
      </div>
      {acordos.length === 0 ? (
        <p className="text-[13px] text-muted">Nenhum acordo.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {acordos.map((a) => (
            <Link key={a.id} href={`/admin/permutas/${a.id}`} className="card-hover flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-[13.5px]">
                  {a.proponente_nome} ⇄ {a.destinatario_nome}
                </b>
                <StatusAcordo status={a.status} />
                <span className="ml-auto text-[11.5px] text-muted">#{a.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[12.5px] sm:grid-cols-2">
                {[...a.entregas].sort((x, y) => x.ordem - y.ordem).map((e) => (
                  <div key={e.id} className="flex items-center gap-2">
                    <StatusEntrega status={a.status === "proposta" ? "proposta" : e.status} />
                    <span className="truncate">
                      {e.prestador_id === a.proponente_id ? a.proponente_nome : a.destinatario_nome} → {e.titulo} · {formatDataCurta(e.data_evento)}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

async function Empresas() {
  const cfg = await getPermutaConfig();
  const [empresas, ofertas] = await Promise.all([
    listEmpresasPermutaAdmin(cfg),
    query<{ id: string; empresa_id: string; titulo: string; valor_referencia: string; ativa: boolean }>(
      `SELECT id, empresa_id, titulo, valor_referencia, ativa FROM permuta_ofertas ORDER BY criado_em`
    ),
  ]);
  return (
    <div className="flex flex-col gap-2.5">
      {empresas.map((e) => {
        const minhas = ofertas.filter((o) => o.empresa_id === e.id);
        const p = e.perfil;
        return (
          <details key={e.id} className="rounded-xl border border-border bg-surface">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 text-[13px] [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <b>{e.nome_fantasia}</b>
                <div className="text-[12px] text-muted">{e.email}</div>
              </div>
              <NivelBadge nivel={p.nivel} />
              {p.controle.nivel_manual && <span className="text-[11px] text-muted">(manual)</span>}
              <span className="text-[12px] text-muted">
                {p.stats.concluidas} concluídas · {formatNota(p.stats.nota)} · {p.stats.ativos} abertas · {minhas.filter((o) => o.ativa).length} ofertas
              </span>
              {!p.participa ? (
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-bold text-muted">
                  {p.aderiu ? "Pausou a participação" : "Não participa"}
                </span>
              ) : p.controle.banida ? (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger-dark">Removida</span>
              ) : p.suspensa ? (
                <span className="rounded-full bg-note-bg px-2 py-0.5 text-[11px] font-bold text-note-text">Suspensa</span>
              ) : p.pendencias.length ? (
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-bold text-muted">Não elegível</span>
              ) : (
                <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">Participa</span>
              )}
            </summary>
            <div className="flex flex-col gap-4 border-t border-border p-4">
              {p.pendencias.length > 0 && (
                <ul className="list-disc pl-5 text-[12.5px] text-muted">
                  {p.pendencias.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}
              <div className="text-[12.5px] text-muted">
                Furos em 12 meses: {p.stats.furos12m} · Cancelamentos penalizados recentes: {p.stats.cancelamentosPenalizados} ·
                Fotos: {p.fotos} · CNPJ {p.cnpjValidado ? "validado" : "não validado"}
              </div>
              <ControleEmpresaForm
                empresaId={e.id}
                nivelManual={p.controle.nivel_manual}
                suspensaAte={p.controle.suspensa_ate ? new Date(p.controle.suspensa_ate).toISOString() : null}
                banida={p.controle.banida}
                observacao={p.controle.observacao}
              />
              {minhas.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase text-muted">Ofertas</div>
                  <ul className="flex flex-col gap-1.5">
                    {minhas.map((o) => (
                      <li key={o.id} className="flex items-center gap-3 text-[13px]">
                        <span className={`flex-1 ${o.ativa ? "" : "text-muted line-through"}`}>
                          {o.titulo} · {formatValor(Number(o.valor_referencia))}
                        </span>
                        <AlternarOfertaAdminButton ofertaId={o.id} ativa={o.ativa} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function Kpi({ label, valor, sub, alerta }: { label: string; valor: string | number; sub?: string; alerta?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${alerta ? "border-[#f1c9ca] bg-danger-soft" : "border-border bg-surface"}`}>
      <div className="text-[12px] font-semibold text-muted">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold">{valor}</div>
      {sub && <div className="text-[11.5px] text-muted">{sub}</div>}
    </div>
  );
}
