import Link from "next/link";
import { Icon } from "@/components/Icon";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMeusPedidos, type MeuPedido } from "@/lib/data/pedidos";
import { getMeuPerfilCliente } from "@/lib/data/clientes";
import { listMeusEventosRsvp, type EventoRsvpResumo } from "@/lib/data/rsvp";
import { listBannersAtivos, registrarVisualizacoesBannerCategoria } from "@/lib/data/banners";
import { Badge, buttonClass } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppButton from "@/components/WhatsAppButton";
import DestaquesGrid, { DestaquesKicker } from "@/components/DestaquesGrid";
import MarcarContratadoButton from "@/components/MarcarContratadoButton";
import { BarraConfirmacao, BlocoData, SecaoTitulo } from "@/components/cliente/ui";
import { budgetRangeLabel } from "@/lib/format";
import { diasAte, hojeBrasilia, rotuloContagem } from "@/lib/festa-datas";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "ok" | "muted" | "warn" }> = {
  aberto: { label: "Recebendo propostas", tone: "ok" },
  em_andamento: { label: "Em andamento", tone: "warn" },
  concluido: { label: "Contratado", tone: "muted" },
  expirado: { label: "Expirado", tone: "muted" },
  cancelado: { label: "Cancelado", tone: "muted" },
};

const ativo = (p: MeuPedido) => p.status === "aberto" || p.status === "em_andamento";

export default async function PainelClientePage() {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const [pedidos, perfil, listas, banners] = await Promise.all([
    listMeusPedidos(session.usuarioId),
    getMeuPerfilCliente(session.usuarioId),
    listMeusEventosRsvp(session.usuarioId),
    listBannersAtivos(),
  ]);
  await registrarVisualizacoesBannerCategoria(banners);

  const hoje = hojeBrasilia();
  const listasFuturas = listas
    .filter((l) => diasAte(l.data_evento, hoje) >= 0)
    .sort((a, b) => diasAte(a.data_evento, hoje) - diasAte(b.data_evento, hoje));
  const pedidosFuturos = pedidos
    .filter((p) => ativo(p) && diasAte(p.data_evento, hoje) >= 0)
    .sort((a, b) => diasAte(a.data_evento, hoje) - diasAte(b.data_evento, hoje));

  // a "próxima festa" é a lista de convidados mais próxima; sem lista, o pedido mais próximo
  const proximaLista = listasFuturas[0] ?? null;
  const proximoPedido = pedidosFuturos[0] ?? null;

  const primeiroNome = perfil?.nome?.split(" ")[0] ?? "";
  const propostas = pedidos.reduce((s, p) => s + (ativo(p) ? p.empresasInteressadas.length : 0), 0);
  const listaParaCalcular = listasFuturas.find((l) => l.adultos_previstos + l.criancas_previstas > 0) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
      {/* TOPO: saudação + próxima festa */}
      <div className="min-w-0 lg:col-start-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[24px] font-extrabold leading-tight sm:text-[26px]">
              {primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!"}
            </h1>
            <p className="mt-1 text-[14px] text-muted">Tudo da sua festa num lugar só.</p>
          </div>
          <Link href="/publicar-pedido" className={buttonClass("primary", "md")}>
            <Icon name="plus" className="h-4 w-4" /> Pedir orçamentos
          </Link>
        </div>

        {perfil && !perfil.cidade_id && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-note-border bg-note-bg p-3.5 text-[13px] text-note-text">
            <span>
              <Icon name="alert" className="mr-1.5 h-4 w-4" />
              Falta informar sua cidade pra gente mostrar fornecedores certos pra você.
            </span>
            <Link href="/meu-perfil" className="font-bold underline">
              Completar perfil
            </Link>
          </div>
        )}

        <div className="mt-5">
          {proximaLista || proximoPedido ? (
            <ProximaFesta lista={proximaLista} pedido={proximoPedido} temPedido={pedidos.length > 0} contratou={pedidos.some((p) => p.status === "concluido")} propostas={propostas} hoje={hoje} />
          ) : (
            <ComeceAqui />
          )}
        </div>
      </div>

      {/* COLUNA DA DIREITA (no celular vem logo depois da próxima festa) */}
      <aside className="mt-6 flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
        <ConvidadosCard listas={listasFuturas} />
        <CalculadoraCard lista={listaParaCalcular} />
      </aside>

      {/* PEDIDOS + DESTAQUES */}
      <div id="pedidos" className="mt-8 min-w-0 scroll-mt-6 lg:col-start-1 lg:row-start-2">
        <SecaoTitulo
          acao={
            pedidos.length > 0 && (
              <Link href="/publicar-pedido" className="text-[12.5px] font-bold text-accent-dark hover:underline">
                + Novo pedido
              </Link>
            )
          }
        >
          Meus pedidos de orçamento {pedidos.length > 0 && `(${pedidos.length})`}
        </SecaoTitulo>

        {pedidos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
              <Icon name="megaphone" className="h-6 w-6" />
            </span>
            <p className="mt-3 text-[15px] font-bold">Receba propostas de fornecedores</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
              Conte o que você precisa em 2 minutos. As empresas da sua região mostram interesse e você conversa direto no
              WhatsApp.
            </p>
            <Link href="/publicar-pedido" className={`${buttonClass("primary", "md")} mt-4`}>
              Publicar meu primeiro pedido
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pedidos.map((p) => (
              <PedidoCard key={p.id} pedido={p} hoje={hoje} />
            ))}
          </div>
        )}

        {banners.length > 0 && (
          <div className="mt-8">
            <DestaquesKicker />
            <div className="mt-3">
              <DestaquesGrid banners={banners} thumbSize="lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Passo({ feito, children, href, cta }: { feito: boolean; children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          feito ? "bg-ok text-white" : "border-2 border-white/30"
        }`}
      >
        {feito && <Icon name="check" className="h-3.5 w-3.5" />}
      </span>
      <span className={`min-w-0 flex-1 text-[13.5px] ${feito ? "text-white/60 line-through decoration-white/30" : "font-semibold"}`}>
        {children}
      </span>
      {!feito && href && cta && (
        <Link href={href} className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-bold hover:bg-white/20">
          {cta}
        </Link>
      )}
    </li>
  );
}

/** Cartão escuro da próxima festa: contagem regressiva + checklist do que
 * falta, com atalho pra cada passo. */
function ProximaFesta({
  lista,
  pedido,
  temPedido,
  contratou,
  propostas,
  hoje,
}: {
  lista: EventoRsvpResumo | null;
  pedido: MeuPedido | null;
  temPedido: boolean;
  contratou: boolean;
  propostas: number;
  hoje: string;
}) {
  const data = lista?.data_evento ?? pedido!.data_evento;
  const titulo = lista?.titulo ?? pedido!.tipo_evento;
  const dias = diasAte(data, hoje);
  const total = lista?.total_convidados ?? 0;
  const confirmados = lista?.total_confirmados ?? 0;
  const recusados = lista?.total_recusados ?? 0;
  const aguardando = total - confirmados - recusados;

  const passos = [
    temPedido,
    contratou,
    !!lista && total > 0,
    !!lista && total > 0 && aguardando === 0,
  ];
  const feitos = passos.filter(Boolean).length;

  return (
    <section className="overflow-hidden rounded-2xl bg-text text-white shadow-card">
      <div className="flex items-center gap-4 p-5 pb-4">
        <BlocoData data={data} tom="escuro" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">Sua próxima festa</p>
          <h2 className="truncate font-display text-[19px] font-extrabold leading-tight">{titulo}</h2>
          <p className="mt-0.5 text-[13px] font-semibold text-accent">{rotuloContagem(dias)}</p>
        </div>
      </div>

      {lista && total > 0 && (
        <div className="mx-5 mb-1 rounded-xl bg-white/5 p-3.5">
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span>
              <b className="font-display text-[18px]">{confirmados}</b> de {total} confirmaram presença
            </span>
            <Link href={`/lista-convidados/${lista.id}`} className="text-[12px] font-bold text-accent hover:underline">
              Ver lista
            </Link>
          </div>
          <BarraConfirmacao confirmados={confirmados} aguardando={aguardando} recusados={recusados} className="mt-2 bg-white/10" />
        </div>
      )}

      <div className="px-5 pb-3 pt-2">
        <div className="flex items-center justify-between text-[12px] text-white/60">
          <span>Preparativos</span>
          <span>
            {feitos} de {passos.length}
          </span>
        </div>
        <ul className="divide-y divide-white/10">
          <Passo feito={passos[0]} href="/publicar-pedido" cta="Pedir">
            Pedir orçamentos aos fornecedores
          </Passo>
          <Passo feito={passos[1]} href={propostas > 0 ? "#pedidos" : undefined} cta="Ver">
            {passos[1]
              ? "Fornecedor contratado"
              : propostas > 0
                ? `Escolher fornecedor · ${propostas} ${propostas === 1 ? "proposta" : "propostas"} esperando`
                : "Escolher fornecedor"}
          </Passo>
          <Passo feito={passos[2]} href={lista ? `/lista-convidados/${lista.id}` : "/lista-convidados"} cta={lista ? "Adicionar" : "Criar"}>
            Montar a lista de convidados
          </Passo>
          <Passo feito={passos[3]} href={lista ? `/lista-convidados/${lista.id}` : undefined} cta="Convidar">
            {lista && aguardando > 0 ? `Confirmar presenças · ${aguardando} sem resposta` : "Confirmar presenças"}
          </Passo>
        </ul>
      </div>
    </section>
  );
}

/** Sem festa nenhuma ainda: os três primeiros passos como atalhos. */
function ComeceAqui() {
  const itens = [
    { href: "/publicar-pedido", icon: "megaphone" as const, titulo: "Peça orçamentos", texto: "Fornecedores da sua região te respondem no WhatsApp." },
    { href: "/lista-convidados", icon: "users" as const, titulo: "Monte a lista de convidados", texto: "Compartilhe um link e veja quem confirmou." },
    { href: "/calculadora-eventos", icon: "calculator" as const, titulo: "Calcule comida e bebida", texto: "Saiba quanto comprar, sem faltar nem sobrar." },
  ];
  return (
    <section className="rounded-2xl bg-text p-5 text-white shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">Vamos começar</p>
      <h2 className="mt-1 font-display text-[19px] font-extrabold">Organize sua festa em 3 passos</h2>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {itens.map((i, n) => (
          <Link key={i.href} href={i.href} className="group rounded-xl bg-white/5 p-3.5 transition-colors hover:bg-white/10">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-strong text-white">
                <Icon name={i.icon} className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-bold text-white/50">Passo {n + 1}</span>
            </div>
            <p className="mt-2.5 text-[14px] font-bold">{i.titulo}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-white/65">{i.texto}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ConvidadosCard({ listas }: { listas: EventoRsvpResumo[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
          <Icon name="users" className="h-4 w-4" />
        </span>
        <h2 className="text-[14px] font-bold">Lista de convidados</h2>
      </div>
      {listas.length === 0 ? (
        <>
          <p className="text-[13px] leading-relaxed text-muted">
            Crie a lista, mande o link no WhatsApp e acompanhe quem confirmou — sem ninguém precisar de cadastro.
          </p>
          <Link href="/lista-convidados" className={`${buttonClass("secondary", "sm")} mt-3 w-full`}>
            Criar lista de convidados
          </Link>
        </>
      ) : (
        <div className="flex flex-col gap-2.5">
          {listas.slice(0, 2).map((l) => {
            const aguardando = l.total_convidados - l.total_confirmados - l.total_recusados;
            return (
              <Link key={l.id} href={`/lista-convidados/${l.id}`} className="rounded-xl bg-surface-alt/60 p-3 hover:bg-surface-alt">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-bold">{l.titulo}</span>
                  <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-muted-2" />
                </div>
                {l.total_convidados === 0 ? (
                  <p className="mt-1 text-[12.5px] text-muted">Nenhum convidado ainda</p>
                ) : (
                  <>
                    <BarraConfirmacao confirmados={l.total_confirmados} aguardando={aguardando} recusados={l.total_recusados} className="mt-2" />
                    <p className="mt-1.5 text-[12px] text-muted">
                      <b className="text-ok">{l.total_confirmados} confirmados</b> · {aguardando} aguardando
                    </p>
                  </>
                )}
              </Link>
            );
          })}
          <Link href="/lista-convidados" className="text-center text-[12.5px] font-bold text-accent-dark hover:underline">
            {listas.length > 2 ? `Ver todas as ${listas.length} listas` : "Gerenciar listas"}
          </Link>
        </div>
      )}
    </section>
  );
}

function CalculadoraCard({ lista }: { lista: EventoRsvpResumo | null }) {
  const pessoas = lista ? lista.adultos_previstos + lista.criancas_previstas : 0;
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
          <Icon name="calculator" className="h-4 w-4" />
        </span>
        <h2 className="text-[14px] font-bold">Quanto comprar?</h2>
      </div>
      <p className="text-[13px] leading-relaxed text-muted">
        {lista
          ? `Calcule comida e bebida para os ${pessoas} convidados previstos de "${lista.titulo}".`
          : "Informe os convidados e veja a lista de compras de comida e bebida."}
      </p>
      <Link
        href={lista ? `/calculadora-eventos?lista=${lista.id}` : "/calculadora-eventos"}
        className={`${buttonClass("secondary", "sm")} mt-3 w-full`}
      >
        Abrir calculadora
      </Link>
    </section>
  );
}

function PedidoCard({ pedido: p, hoje }: { pedido: MeuPedido; hoje: string }) {
  const st = STATUS[p.status] ?? { label: p.status, tone: "muted" as const };
  const dias = diasAte(p.data_evento, hoje);
  const interessadas = p.empresasInteressadas;
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex gap-3.5">
        <BlocoData data={p.data_evento} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-[15px] font-bold leading-snug">{p.tipo_evento}</h3>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
            <Icon name="pin" className="h-3.5 w-3.5" />
            {p.bairro_nome ?? p.cidade_nome}
            {ativo(p) && dias >= 0 && <span className="text-muted-2"> · {rotuloContagem(dias).toLowerCase()}</span>}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {p.categorias.map((c) => (
              <span key={c} className="rounded-full bg-surface-alt px-2 py-0.5 text-[11.5px] font-semibold">
                {c}
              </span>
            ))}
            <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11.5px] font-semibold text-muted">
              {budgetRangeLabel(p.orcamento_min ? Number(p.orcamento_min) : null, p.orcamento_max ? Number(p.orcamento_max) : null)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        {interessadas.length === 0 ? (
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="clock" className="h-4 w-4" />
            {ativo(p) ? "Aguardando empresas mostrarem interesse." : "Nenhuma empresa mostrou interesse."}
          </p>
        ) : (
          <>
            <p className="mb-2 text-[12.5px] font-bold">
              {interessadas.length} {interessadas.length === 1 ? "empresa interessada" : "empresas interessadas"}
            </p>
            <div className="flex flex-col gap-2">
              {interessadas.map((e) => (
                <div key={e.empresa_id} className="flex items-center gap-3 rounded-xl bg-surface-alt/60 p-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface font-display text-[14px] font-extrabold text-accent-dark">
                    {e.nome_fantasia[0]?.toUpperCase()}
                  </span>
                  <Link href={`/empresa/${e.empresa_slug}`} className="min-w-0 flex-1 truncate text-[13.5px] font-bold hover:underline">
                    {e.nome_fantasia}
                  </Link>
                  {e.telefone_contato && (
                    <WhatsAppButton empresaId={e.empresa_id} href={buildWhatsAppLink(e.telefone_contato)} label="WhatsApp" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {ativo(p) && (
        <div className="mt-3 border-t border-border pt-3">
          <MarcarContratadoButton pedidoId={p.id} />
        </div>
      )}
      {p.status === "concluido" && (
        <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[12.5px] font-semibold text-ok">
          <Icon name="check" className="h-4 w-4" />
          {p.encontrado_pelo_site ? "Contratado pela GetFesta" : "Contratado por outro meio"}
        </p>
      )}
    </article>
  );
}
