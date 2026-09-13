import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getAssinaturaAtiva,
  getAtividadesRecentes,
  getPainelKpis,
  listPeriodosEmpresa,
  listPlanosEmpresa,
  listVinculos,
  type AtividadeRecente,
} from "@/lib/data/painel";
import { getPainelHeaderInfo } from "@/lib/data/empresas";
import { listPedidosCompativeis } from "@/lib/data/pedidos";
import { getConfiguracoesSite, CONFIG_CONTATO_WHATSAPP } from "@/lib/data/config";
import { Badge, buttonClass } from "@/components/ui";
import { buildAnunciarBannerMailto } from "@/lib/mailto";
import { timeAgo } from "@/lib/format";
import PlanoSelector from "@/components/PlanoSelector";
import PedidoLeadRow from "@/components/PedidoLeadRow";
import CompartilharPerfilButton from "@/components/CompartilharPerfilButton";

export const dynamic = "force-dynamic";
const PEDIDOS_RECENTES_LIMITE = 10;

const ATIVIDADE_INFO: Record<AtividadeRecente["tipo"], { icone: string; texto: string }> = {
  visualizacao_perfil: { icone: "👁️", texto: "Seu perfil foi visualizado" },
  clique_whatsapp: { icone: "💬", texto: "Alguém clicou no seu WhatsApp" },
  visualizacao_banner: { icone: "📣", texto: "Seu anúncio foi visualizado" },
  clique_banner: { icone: "📣", texto: "Alguém clicou no seu anúncio" },
  pedido_compativel: { icone: "📋", texto: "Novo pedido compatível encontrado" },
  candidatura_vaga: { icone: "🙋", texto: "Novo candidato numa vaga" },
};

export default async function PainelPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar");

  const [kpis, assinatura, vinculos, header, leads, planos, periodos, config, atividades] = await Promise.all([
    getPainelKpis(session.usuarioId),
    getAssinaturaAtiva(session.usuarioId),
    listVinculos(session.usuarioId),
    getPainelHeaderInfo(session.usuarioId),
    listPedidosCompativeis(session.usuarioId),
    listPlanosEmpresa(),
    listPeriodosEmpresa(),
    getConfiguracoesSite(),
    getAtividadesRecentes(session.usuarioId, 8),
  ]);
  const nomeFantasia = header?.nomeFantasia ?? null;
  const slug = header?.slug ?? null;
  const pedidosRecentes = leads.slice(0, PEDIDOS_RECENTES_LIMITE);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      <div className="min-w-0">
        {/* HERÓI MOBILE — igual ao do catálogo do profissional: fundo escuro
            encostado nas bordas, logo circular sobreposta, só com o atalho pro
            perfil público (editar/pedidos/vagas já ficam na barra de navegação
            do rodapé). Do sm: até o lg: (tablet), continua o cabeçalho de
            sempre; a partir do lg: a sidebar (components/painel/PainelSidebar)
            já cobre a navegação e a coluna direita cobre o plano. */}
        <div className="-mx-6 -mt-8 sm:hidden">
          <div className="h-24 bg-text" />
          <div className="bg-surface px-6 pb-5 text-center">
            <div className="relative -mt-[55px] inline-block">
              {header?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={header.logoUrl}
                  alt={nomeFantasia ?? ""}
                  className="h-[110px] w-[110px] rounded-full object-cover ring-4 ring-surface"
                />
              ) : (
                <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-accent-soft font-display text-3xl font-extrabold text-accent-dark ring-4 ring-surface">
                  {(nomeFantasia ?? "?")[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="mt-3 text-lg font-extrabold">{nomeFantasia ?? "Seu painel"}</h1>
            <Link href={`/empresa/${slug ?? session.usuarioId}`} className="mt-1 inline-block text-[12.5px] font-bold text-accent-dark">
              Visualizar meu perfil público →
            </Link>
          </div>
        </div>

        <div className="mb-4 hidden flex-wrap items-center justify-between gap-2 sm:flex lg:hidden">
          <h1 className="text-xl font-extrabold">{nomeFantasia ?? "Seu painel"} 👋</h1>
          <div className="flex items-center gap-4">
            <Link href="/painel/perfil" className="text-[12.5px] font-bold text-accent-dark underline">
              Editar perfil e fotos
            </Link>
            <Link href="/painel/pedidos" className="text-[12.5px] font-bold text-accent-dark underline">
              Pedidos compatíveis
            </Link>
            <Link href="/painel/vagas" className="text-[12.5px] font-bold text-accent-dark underline">
              Vagas para profissionais
            </Link>
            <Link href={`/empresa/${slug ?? session.usuarioId}`} className="text-[12.5px] font-bold text-accent-dark underline">
              Ver meu perfil público
            </Link>
          </div>
        </div>

        {/* a partir do lg: o cabeçalho vira só o saudação (nav e ver-perfil já
            estão na sidebar/coluna direita) */}
        <h1 className="mb-4 hidden text-xl font-extrabold lg:block">{nomeFantasia ?? "Seu painel"} 👋</h1>

        {assinatura && (
          <>
            {/* mobile: fundo chapado (sem degradê) + botões sólidos laranja */}
            <div className="mb-5 flex flex-col gap-3 rounded-xl bg-accent-soft p-4 sm:hidden">
              <div className="text-[12.5px]">
                Plano atual: <b className="text-[13.5px]">{assinatura.plano_nome}</b>{" "}
                <Badge tone={assinatura.status === "ativa" ? "ok" : "warn"}>{assinatura.status}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={buildAnunciarBannerMailto(nomeFantasia ?? "minha empresa", session.usuarioId)}
                  className={`${buttonClass("primary")} w-full text-center`}
                >
                  📣 Anunciar no banner principal
                </a>
                <Suspense fallback={<button className={`${buttonClass("primary")} w-full`}>Alterar Plano</button>}>
                  <PlanoSelector
                    planos={planos}
                    planoAtualId={assinatura.plano_id}
                    periodos={periodos}
                    whatsapp={config[CONFIG_CONTATO_WHATSAPP]}
                    nomeFantasia={nomeFantasia ?? "minha empresa"}
                    triggerVariant="primary"
                  />
                </Suspense>
              </div>
            </div>

            {/* tablet (sm até lg): como já era - a partir do lg: essas infos
                passam pra coluna direita */}
            <div className="mb-5 hidden flex-wrap items-center justify-between gap-2 rounded-xl border border-accent-soft-2 bg-gradient-to-r from-accent-soft to-surface p-4 sm:flex lg:hidden">
              <div className="text-[12.5px]">
                Plano atual: <b className="text-[13.5px]">{assinatura.plano_nome}</b>{" "}
                <Badge tone={assinatura.status === "ativa" ? "ok" : "warn"}>{assinatura.status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={buildAnunciarBannerMailto(nomeFantasia ?? "minha empresa", session.usuarioId)}
                  className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] font-bold hover:bg-surface-alt"
                >
                  📣 Anunciar no banner principal
                </a>
                <Suspense fallback={<button className={buttonClass("secondary", "sm")}>Alterar plano</button>}>
                  <PlanoSelector
                    planos={planos}
                    planoAtualId={assinatura.plano_id}
                    periodos={periodos}
                    whatsapp={config[CONFIG_CONTATO_WHATSAPP]}
                    nomeFantasia={nomeFantasia ?? "minha empresa"}
                  />
                </Suspense>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Kpi value={kpis.visualizacoes} variacaoPct={kpis.visualizacoesVariacaoPct} label="Visualizações do perfil" />
          <Kpi value={kpis.cliquesWhatsapp} variacaoPct={kpis.cliquesWhatsappVariacaoPct} label="Cliques no WhatsApp" />
          <Kpi value={kpis.visualizacoesBanner} variacaoPct={kpis.visualizacoesBannerVariacaoPct} label="Visualizações do banner" />
          <Kpi value={kpis.cliquesBanner} variacaoPct={kpis.cliquesBannerVariacaoPct} label="Cliques no banner" />
          <Kpi value={kpis.pedidosRecebidos} variacaoPct={kpis.pedidosRecebidosVariacaoPct} label="Pedidos recebidos" />
          <Kpi value={kpis.taxaRespostaPct ? `${Number(kpis.taxaRespostaPct)}%` : "—"} label="Taxa de resposta" />
          <Kpi value={kpis.tempoRespostaMedioMinutos ? `${kpis.tempoRespostaMedioMinutos} min` : "—"} label="Tempo médio de resposta" />
        </div>

        <div className="mb-2 mt-8 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-2">
            {PEDIDOS_RECENTES_LIMITE} últimos pedidos solicitados
          </h2>
          <Link href="/painel/pedidos" className="text-[11.5px] font-bold text-accent-dark underline">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          {pedidosRecentes.length === 0 && <p className="p-4 text-[12.5px] text-muted">Nenhum pedido compatível por enquanto.</p>}
          {pedidosRecentes.map((lead) => (
            <PedidoLeadRow key={lead.id} lead={lead} empresaId={session.usuarioId} />
          ))}
        </div>

        <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">Atividades recentes</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          {atividades.length === 0 && <p className="p-4 text-[12.5px] text-muted">Ainda sem atividade por aqui.</p>}
          {atividades.map((a, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border p-3 text-[12.5px] last:border-b-0">
              <span className="text-[15px]">{ATIVIDADE_INFO[a.tipo].icone}</span>
              <span className="flex-1">{ATIVIDADE_INFO[a.tipo].texto}</span>
              <span className="text-[11px] text-muted-2">{timeAgo(a.criado_em)}</span>
            </div>
          ))}
        </div>

        <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">Vínculos com profissionais</h2>
        <div className="flex flex-col gap-2">
          {vinculos.length === 0 && <p className="text-[12.5px] text-muted">Nenhum vínculo ainda.</p>}
          {vinculos.map((v) => (
            <div key={v.profissional_id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-[12.5px]">
              <span>{v.nome}</span>
              <Badge tone={v.status === "aceito" ? "ok" : "warn"}>{v.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* coluna direita - só a partir do lg: (na tablet/mobile essas infos já
          aparecem acima, no bloco de plano/cabeçalho). */}
      <div className="mt-8 hidden flex-col gap-4 lg:mt-0 lg:flex">
        {assinatura && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Plano atual</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[15px] font-extrabold">{assinatura.plano_nome}</span>
              <Badge tone={assinatura.status === "ativa" ? "ok" : "warn"}>{assinatura.status}</Badge>
            </div>
            <div className="mt-3">
              <Suspense fallback={<button className={`${buttonClass("primary", "sm")} w-full`}>Alterar plano</button>}>
                <PlanoSelector
                  planos={planos}
                  planoAtualId={assinatura.plano_id}
                  periodos={periodos}
                  whatsapp={config[CONFIG_CONTATO_WHATSAPP]}
                  nomeFantasia={nomeFantasia ?? "minha empresa"}
                  triggerVariant="primary"
                />
              </Suspense>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-accent bg-accent-soft p-4">
          <p className="text-[13px] font-bold text-accent-dark">📣 Destaque seu perfil</p>
          <p className="mt-1 text-[12px] text-accent-dark">
            Apareça no banner principal da home e conquiste mais clientes.
          </p>
          <a
            href={buildAnunciarBannerMailto(nomeFantasia ?? "minha empresa", session.usuarioId)}
            className={`${buttonClass("primary", "sm")} mt-3 w-full`}
          >
            Quero anunciar
          </a>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-2">Acesso rápido</p>
          <div className="flex flex-col gap-1.5">
            <Link href="/painel/perfil" className="text-[12.5px] font-bold text-accent-dark hover:underline">
              ✏️ Editar perfil e fotos
            </Link>
            <Link href={`/empresa/${slug ?? session.usuarioId}`} className="text-[12.5px] font-bold text-accent-dark hover:underline">
              🔗 Ver meu perfil público
            </Link>
            {slug && (
              <div className="mt-1">
                <CompartilharPerfilButton empresaSlug={slug} nomeFantasia={nomeFantasia ?? "minha empresa"} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ value, label, variacaoPct }: { value: string | number; label: string; variacaoPct?: number | null }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-xl font-extrabold text-accent-dark">{value}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold text-muted">{label}</div>
      {variacaoPct !== undefined && variacaoPct !== null && (
        <div className={`mt-1 text-[10.5px] font-bold ${variacaoPct >= 0 ? "text-ok" : "text-danger-dark"}`}>
          {variacaoPct >= 0 ? "↑" : "↓"} {Math.abs(variacaoPct)}% nos últimos 7 dias
        </div>
      )}
    </div>
  );
}
