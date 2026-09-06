import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAssinaturaAtiva, getPainelKpis, listPeriodosEmpresa, listPlanosEmpresa, listVinculos } from "@/lib/data/painel";
import { getPainelHeaderInfo } from "@/lib/data/empresas";
import { listPedidosCompativeis } from "@/lib/data/pedidos";
import { getConfiguracoesSite, CONFIG_CONTATO_WHATSAPP } from "@/lib/data/config";
import { Badge, buttonClass } from "@/components/ui";
import { buildAnunciarBannerMailto } from "@/lib/mailto";
import PlanoSelector from "@/components/PlanoSelector";
import PedidoLeadRow from "@/components/PedidoLeadRow";

export const dynamic = "force-dynamic";
const PEDIDOS_RECENTES_LIMITE = 10;

export default async function PainelPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar");

  const [kpis, assinatura, vinculos, header, leads, planos, periodos, config] = await Promise.all([
    getPainelKpis(session.usuarioId),
    getAssinaturaAtiva(session.usuarioId),
    listVinculos(session.usuarioId),
    getPainelHeaderInfo(session.usuarioId),
    listPedidosCompativeis(session.usuarioId),
    listPlanosEmpresa(),
    listPeriodosEmpresa(),
    getConfiguracoesSite(),
  ]);
  const nomeFantasia = header?.nomeFantasia ?? null;
  const slug = header?.slug ?? null;
  const pedidosRecentes = leads.slice(0, PEDIDOS_RECENTES_LIMITE);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* HERÓI MOBILE — igual ao do catálogo do profissional: fundo escuro
          encostado nas bordas, logo circular sobreposta, só com o atalho pro
          perfil público (editar/pedidos/vagas já ficam na barra de navegação
          do rodapé). No desktop o cabeçalho de sempre continua abaixo. */}
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

      <div className="mb-4 hidden flex-wrap items-center justify-between gap-2 sm:flex">
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

          {/* desktop: como já era */}
          <div className="mb-5 hidden flex-wrap items-center justify-between gap-2 rounded-xl border border-accent-soft-2 bg-gradient-to-r from-accent-soft to-surface p-4 sm:flex">
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

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Kpi value={kpis.visualizacoes} label="Visualizações do perfil" />
        <Kpi value={kpis.cliquesWhatsapp} label="Cliques no WhatsApp" />
        <Kpi value={kpis.pedidosRecebidos} label="Pedidos recebidos" />
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
  );
}

function Kpi({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-xl font-extrabold text-accent-dark">{value}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold text-muted">{label}</div>
    </div>
  );
}
