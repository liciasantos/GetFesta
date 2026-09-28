import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  acoesPendentes,
  diasAte,
  formatDataCurta,
  getPerfilPermuta,
  getPermutaConfig,
  getUsoPlanoPermuta,
  listAcordos,
  listVitrine,
  saldo,
  visaoDoAcordo,
  type AcordoVisao,
  type EntregaPermuta,
} from "@/lib/data/permuta";
import { NIVEIS, NIVEL_LABEL, PERIODO_LIMITE_LABEL } from "@/lib/permuta/regras";
import { buttonClass } from "@/components/ui";
import { AvisoRedeFechada, EmpresaAvatar, NivelBadge, StatusAcordo, StatusEntrega, formatNota } from "@/components/permuta/ui";

export const dynamic = "force-dynamic";

export default async function PermutasPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const cfg = await getPermutaConfig();
  const [perfil, acordosRaw, matches, uso] = await Promise.all([
    getPerfilPermuta(session.usuarioId, cfg),
    listAcordos(session.usuarioId),
    listVitrine(session.usuarioId, cfg, { soCombina: true }),
    getUsoPlanoPermuta(session.usuarioId, cfg),
  ]);
  if (!perfil) redirect("/painel");

  const acordos = acordosRaw.map((a) => visaoDoAcordo(a, session.usuarioId));
  const ativos = acordos.filter((a) => ["proposta", "em_execucao", "em_disputa"].includes(a.status));
  const acoes = acoesPendentes(acordos);
  const { devo, devem } = saldo(acordos);
  const proximoNivel = NIVEIS[NIVEIS.indexOf(perfil.nivel) + 1] as "c" | "b" | "a" | undefined;
  const req = proximoNivel ? cfg.requisitos[proximoNivel] : null;
  const faltam = req ? Math.max(0, req.concluidas - perfil.stats.concluidas) : 0;

  return (
    <div className="flex flex-col gap-5">
      <AvisoRedeFechada />

      {perfil.pendencias.length > 0 && (
        <div className="rounded-xl border border-note-border bg-note-bg p-4 text-[13px] text-note-text">
          <b>Para participar da rede de permutas falta:</b>
          <ul className="mt-1.5 list-disc pl-5">
            {perfil.pendencias.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Link href="/painel/perfil" className="mt-2 inline-block font-bold underline">
            Completar perfil
          </Link>
        </div>
      )}
      {perfil.ofertas === 0 && perfil.pendencias.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-soft-2 bg-accent-soft p-4 text-[13px]">
          <span>
            <b>Cadastre o que você oferece</b> para aparecer na vitrine e receber propostas de outras empresas.
          </span>
          <Link href="/painel/permutas/ofertas" className={buttonClass("primary", "sm")}>
            Cadastrar ofertas
          </Link>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Acordos ativos" valor={String(ativos.length)} />
            <Kpi label="Você deve" valor={`${devo} ${devo === 1 ? "entrega" : "entregas"}`} tom="warn" />
            <Kpi label="Te devem" valor={`${devem} ${devem === 1 ? "entrega" : "entregas"}`} tom="ok" />
            <Kpi label="Permutas concluídas" valor={String(perfil.stats.concluidas)} />
          </div>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold">Precisa da sua ação</h2>
              {acoes.length > 0 && (
                <span className="rounded-full bg-accent-dark px-2 py-0.5 text-[11px] font-extrabold text-white">{acoes.length}</span>
              )}
            </div>
            {acoes.length === 0 ? (
              <p className="text-[13px] text-muted">Nada pendente por aqui.</p>
            ) : (
              <ul className="divide-y divide-border">
                {acoes.map((a) => (
                  <li key={a.tipo + a.acordoId} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold">{a.titulo}</div>
                      <div className="text-[12.5px] text-muted">{a.descricao}</div>
                    </div>
                    <Link href={`/painel/permutas/acordos/${a.acordoId}`} className={buttonClass("ghost", "sm")}>
                      {a.cta}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold">Acordos em andamento</h2>
              <Link href="/painel/permutas/parceiros" className="text-[12.5px] font-bold text-accent-dark underline">
                Histórico completo
              </Link>
            </div>
            {ativos.length === 0 ? (
              <p className="text-[13px] text-muted">
                Nenhum acordo aberto.{" "}
                <Link href="/painel/permutas/vitrine" className="font-bold text-accent-dark underline">
                  Encontre parceiros na vitrine
                </Link>
                .
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {ativos.map((a) => (
                  <AcordoCard key={a.id} a={a} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="mt-5 flex flex-col gap-5 lg:mt-0">
          <section className="rounded-xl bg-text p-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft font-display text-2xl font-extrabold text-[#6b4b00]">
                {perfil.nivel === "novo" ? "N" : perfil.nivel.toUpperCase()}
              </span>
              <div>
                <div className="text-[12px] text-white/70">Seu nível de confiança</div>
                <div className="font-display text-lg font-extrabold">{NIVEL_LABEL[perfil.nivel]}</div>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-white/85">
              {perfil.stats.concluidas} {perfil.stats.concluidas === 1 ? "permuta concluída" : "permutas concluídas"} · nota {formatNota(perfil.stats.nota)} ·{" "}
              {perfil.stats.totalAvaliacoes} avaliações
            </p>
            {proximoNivel && req && (
              <p className="mt-2 text-[12.5px] text-white/75">
                Para o {NIVEL_LABEL[proximoNivel]}: {faltam > 0 ? `faltam ${faltam} permuta(s) concluída(s)` : "permutas ok"}
                {req.concluidas > 0 ? ` e nota ${req.nota.toLocaleString("pt-BR")}+` : ""}.
              </p>
            )}
            <div className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-[12.5px]">
              {perfil.limite === null
                ? `${perfil.stats.ativos} permutas abertas · sem limite no seu nível`
                : perfil.stats.ativos >= perfil.limite
                  ? `${perfil.stats.ativos} permutas abertas — o limite do seu nível é ${perfil.limite}. Conclua uma para abrir outra.`
                  : `${perfil.stats.ativos} de ${perfil.limite} permutas simultâneas em uso`}
            </div>
            {perfil.controle.nivel_manual && (
              <p className="mt-2 text-[11.5px] text-white/60">Nível definido pela equipe GetFesta.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold">Seu plano: {uso.planoNome}</h2>
              {uso.plano !== "completo" && (
                <Link href="/painel" className="text-[12.5px] font-bold text-accent-dark underline">
                  Fazer upgrade
                </Link>
              )}
            </div>
            {uso.limite === null ? (
              <p className="mt-2 text-[13px] text-muted">Trocas com empresas ilimitadas.</p>
            ) : (
              <>
                <p className="mt-2 text-[13px]">
                  <b>
                    {uso.usados} de {uso.limite}
                  </b>{" "}
                  empresas {PERIODO_LIMITE_LABEL[cfg.periodoLimitePlano]}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className={`h-2 ${uso.usados >= uso.limite ? "bg-danger" : "bg-accent-dark"}`}
                    style={{ width: `${Math.min(100, (uso.usados / uso.limite) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[12px] text-muted">
                  {uso.usados >= uso.limite
                    ? "Limite atingido: você ainda pode trocar de novo com essas mesmas empresas. Para novas empresas, faça upgrade."
                    : "Trocar de novo com a mesma empresa não conta como nova."}
                </p>
              </>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold">Combinam com você</h2>
              <Link href="/painel/permutas/vitrine" className="text-[12.5px] font-bold text-accent-dark underline">
                Vitrine
              </Link>
            </div>
            {matches.length === 0 ? (
              <p className="text-[12.5px] text-muted">
                Cadastre o que você oferece e o que busca em{" "}
                <Link href="/painel/permutas/ofertas" className="font-bold text-accent-dark underline">
                  Minhas ofertas
                </Link>{" "}
                para receber sugestões.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {matches.slice(0, 3).map((m) => (
                  <li key={m.id} className="flex flex-col gap-1.5 py-3">
                    <div className="flex items-center gap-2.5">
                      <EmpresaAvatar id={m.id} nome={m.nome_fantasia} temLogo={m.tem_logo} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-bold">{m.nome_fantasia}</div>
                        <NivelBadge nivel={m.perfil.nivel} />
                      </div>
                    </div>
                    <div className="text-[12px] text-muted">
                      {m.oferece_o_que_busco && m.busca_o_que_ofereco
                        ? "Combina nos dois sentidos"
                        : m.oferece_o_que_busco
                          ? "Oferece o que você busca"
                          : "Busca o que você oferece"}
                    </div>
                    <Link href={`/painel/permutas/nova?para=${m.id}`} className="text-[12.5px] font-bold text-accent-dark underline">
                      Propor troca
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ label, valor, tom }: { label: string; valor: string; tom?: "ok" | "warn" }) {
  const cls =
    tom === "ok"
      ? "border-[#bfe0cb] bg-ok-soft text-ok"
      : tom === "warn"
        ? "border-note-border bg-note-bg text-note-text"
        : "border-border bg-surface text-muted";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-[12px] font-semibold">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold text-text">{valor}</div>
    </div>
  );
}

function Perna({ e, eu, parceiro, statusAcordo }: { e?: EntregaPermuta; eu: boolean; parceiro: string; statusAcordo: string }) {
  if (!e) return null;
  const dias = diasAte(e.data_evento);
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-bg p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-bold text-muted">{eu ? `Você → ${parceiro}` : `${parceiro} → Você`}</span>
        <StatusEntrega status={statusAcordo === "proposta" ? "proposta" : e.status} />
      </div>
      <div className="text-[13px] font-semibold">{e.titulo}</div>
      <div className="text-[12px] text-muted">
        {formatDataCurta(e.data_evento)}
        {e.status === "agendada" && dias >= 0 && dias <= 60 ? ` · em ${dias} dia(s)` : ""}
      </div>
    </div>
  );
}

function AcordoCard({ a }: { a: AcordoVisao }) {
  return (
    <Link
      href={`/painel/permutas/acordos/${a.id}`}
      className="card-hover flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <div className="flex items-center gap-3">
        <EmpresaAvatar id={a.parceiroId} nome={a.parceiroNome} temLogo={a.parceiroTemLogo} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold">{a.parceiroNome}</div>
          <div className="text-[12px] text-muted">
            {a.status === "proposta"
              ? a.minhaAssinatura
                ? "Aguardando a assinatura do parceiro"
                : "Aguardando a sua assinatura"
              : a.minhaEntrega?.status === "agendada"
                ? "Você deve 1 entrega"
                : a.entregaParceiro?.status === "agendada"
                  ? "Te deve 1 entrega"
                  : ""}
          </div>
        </div>
        <StatusAcordo status={a.status} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[...a.entregas].sort((x, y) => x.ordem - y.ordem).map((e) => (
          <Perna key={e.id} e={e} eu={e.prestador_id !== a.parceiroId} parceiro={a.parceiroNome} statusAcordo={a.status} />
        ))}
      </div>
    </Link>
  );
}
