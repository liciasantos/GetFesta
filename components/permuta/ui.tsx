import { NIVEL_LABEL, STATUS_ACORDO_LABEL, STATUS_ENTREGA_LABEL, type NivelPermuta } from "@/lib/permuta/regras";

/** Pedaços visuais compartilhados pelas telas de permuta (painel e admin). */

export function EmpresaAvatar({
  id,
  nome,
  temLogo,
  size = 40,
}: {
  id: string;
  nome: string;
  temLogo: boolean;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (temLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/empresa/${id}/logo`} alt="" style={style} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-[13px] font-extrabold text-accent-dark"
    >
      {nome.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

const NIVEL_CLASSE: Record<NivelPermuta, string> = {
  novo: "bg-surface-alt text-muted border border-border",
  c: "bg-info-soft text-info-dark",
  b: "bg-gold-soft text-[#6b4b00]",
  a: "bg-text text-white",
};

export function NivelBadge({ nivel }: { nivel: NivelPermuta }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${NIVEL_CLASSE[nivel]}`}>
      {NIVEL_LABEL[nivel]}
    </span>
  );
}

const ACORDO_CLASSE: Record<string, string> = {
  proposta: "bg-info-soft text-info-dark",
  em_execucao: "bg-gold-soft text-[#6b4b00]",
  concluido: "bg-ok-soft text-ok",
  recusado: "bg-surface-alt text-muted border border-border",
  cancelado: "bg-surface-alt text-muted border border-border",
  em_disputa: "bg-danger-soft text-danger-dark",
};

export function StatusAcordo({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ACORDO_CLASSE[status] ?? ""}`}>
      {STATUS_ACORDO_LABEL[status] ?? status}
    </span>
  );
}

const ENTREGA_CLASSE: Record<string, string> = {
  agendada: "bg-surface-alt text-text border border-border",
  confirmada: "bg-ok-soft text-ok",
  nao_realizada: "bg-danger-soft text-danger-dark",
  em_disputa: "bg-danger-soft text-danger-dark",
  cancelada: "bg-surface-alt text-muted border border-border",
  proposta: "bg-info-soft text-info-dark",
};

export function StatusEntrega({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${ENTREGA_CLASSE[status] ?? ""}`}>
      {status === "proposta" ? "Em proposta" : (STATUS_ENTREGA_LABEL[status] ?? status)}
    </span>
  );
}

export function formatNota(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `★ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

export function formatValor(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function AvisoRedeFechada() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-alt px-3.5 py-2.5 text-[12.5px] text-muted">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
        <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
      </svg>
      Área exclusiva para empresas verificadas. Clientes não veem suas ofertas nem suas trocas.
    </div>
  );
}
