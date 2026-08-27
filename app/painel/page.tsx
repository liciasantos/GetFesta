import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAssinaturaAtiva, getPainelKpis, listPlanosEmpresa, listVinculos } from "@/lib/data/painel";
import { listPedidosCompativeis } from "@/lib/data/pedidos";
import { getNomeFantasia } from "@/lib/data/empresas";
import { Badge } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { buildAnunciarBannerMailto } from "@/lib/mailto";
import WhatsAppButton from "@/components/WhatsAppButton";
import InteresseButton from "@/components/InteresseButton";
import PlanoSelector from "@/components/PlanoSelector";
import { budgetRangeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar");

  const [kpis, assinatura, leads, vinculos, nomeFantasia, planos] = await Promise.all([
    getPainelKpis(session.usuarioId),
    getAssinaturaAtiva(session.usuarioId),
    listPedidosCompativeis(session.usuarioId),
    listVinculos(session.usuarioId),
    getNomeFantasia(session.usuarioId),
    listPlanosEmpresa(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">{nomeFantasia ?? "Seu painel"} 👋</h1>
        <div className="flex items-center gap-4">
          <Link href="/painel/perfil" className="text-[12.5px] font-bold text-accent-dark underline">
            Editar perfil e fotos
          </Link>
          <Link href="/painel/vagas" className="text-[12.5px] font-bold text-accent-dark underline">
            Vagas para profissionais
          </Link>
          <Link href={`/empresa/${session.usuarioId}`} className="text-[12.5px] font-bold text-accent-dark underline">
            Ver meu perfil público
          </Link>
        </div>
      </div>

      {assinatura && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent-soft-2 bg-gradient-to-r from-accent-soft to-surface p-4">
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
            <PlanoSelector planos={planos} planoAtualId={assinatura.plano_id} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Kpi value={kpis.visualizacoes} label="Visualizações do perfil" />
        <Kpi value={kpis.cliquesWhatsapp} label="Cliques no WhatsApp" />
        <Kpi value={kpis.pedidosRecebidos} label="Pedidos recebidos" />
        <Kpi value={kpis.taxaRespostaPct ? `${Number(kpis.taxaRespostaPct)}%` : "—"} label="Taxa de resposta" />
        <Kpi value={kpis.tempoRespostaMedioMinutos ? `${kpis.tempoRespostaMedioMinutos} min` : "—"} label="Tempo médio de resposta" />
      </div>

      <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">
        Pedidos compatíveis com suas categorias e cidades
      </h2>
      <div className="overflow-hidden rounded-xl border border-border">
        {leads.length === 0 && <p className="p-4 text-[12.5px] text-muted">Nenhum pedido compatível por enquanto.</p>}
        {leads.map((lead) => (
          <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 last:border-b-0">
            <div className="text-[12.5px]">
              <span className="font-bold">{lead.tipo_evento}</span> · {lead.bairro_nome ?? lead.cidade_nome} ·{" "}
              {new Date(lead.data_evento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
              <div className="mt-1 flex flex-wrap gap-1">
                {lead.categorias.map((c) => (
                  <span key={c} className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold">
                    {c}
                  </span>
                ))}
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold">
                  {budgetRangeLabel(lead.orcamento_min ? Number(lead.orcamento_min) : null, lead.orcamento_max ? Number(lead.orcamento_max) : null)}
                </span>
              </div>
            </div>
            <div>
              {lead.interesse_status === "contato_liberado" ? (
                <WhatsAppButton empresaId={session.usuarioId} href={buildWhatsAppLink(lead.telefone_temp, `Olá ${lead.nome_temp}! Vi seu pedido na GetFesta.`)} label="Chamar no WhatsApp" />
              ) : (
                <InteresseButton pedidoId={lead.id} />
              )}
            </div>
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
