import WhatsAppButton from "@/components/WhatsAppButton";
import InteresseButton from "@/components/InteresseButton";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { budgetRangeLabel } from "@/lib/format";
import type { PedidoLead } from "@/lib/data/pedidos";

/** Uma linha de "pedido compatível" pra empresa - usada tanto no resumo da
 * Home do painel (10 últimos) quanto na lista completa em /painel/pedidos,
 * pra não duplicar esse JSX nos dois lugares. */
export default function PedidoLeadRow({ lead, empresaId }: { lead: PedidoLead; empresaId: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 last:border-b-0">
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
          <WhatsAppButton empresaId={empresaId} href={buildWhatsAppLink(lead.telefone_temp, `Olá ${lead.nome_temp}! Vi seu pedido na GetFesta.`)} label="Chamar no WhatsApp" />
        ) : (
          <InteresseButton pedidoId={lead.id} />
        )}
      </div>
    </div>
  );
}
