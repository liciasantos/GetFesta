import { blocoData } from "@/lib/festa-datas";

/** Peças visuais da área do cliente (painel, convidados, calculadora). */

export function SecaoTitulo({ children, acao }: { children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted-2">{children}</h2>
      {acao}
    </div>
  );
}

/** Bloco "25 / OUT" dos cartões de festa e pedido. */
export function BlocoData({ data, tom = "claro" }: { data: string | Date; tom?: "claro" | "escuro" }) {
  const { dia, mes } = blocoData(data);
  return (
    <div
      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none ${
        tom === "escuro" ? "bg-white/10 text-white" : "bg-accent-soft text-accent-dark"
      }`}
    >
      <span className="font-display text-[20px] font-extrabold">{dia}</span>
      <span className="mt-0.5 text-[10.5px] font-bold uppercase tracking-wide">{mes}</span>
    </div>
  );
}

/** Barra empilhada de confirmações: confirmados (verde), aguardando (cinza),
 * não vão (vermelho claro). */
export function BarraConfirmacao({
  confirmados,
  aguardando,
  recusados,
  className = "",
}: {
  confirmados: number;
  aguardando: number;
  recusados: number;
  className?: string;
}) {
  const total = confirmados + aguardando + recusados;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  return (
    <div className={`flex h-2 w-full overflow-hidden rounded-full bg-surface-alt ${className}`} aria-hidden>
      <span className="h-full bg-ok" style={{ width: `${pct(confirmados)}%` }} />
      <span className="h-full bg-border-strong" style={{ width: `${pct(aguardando)}%` }} />
      <span className="h-full bg-danger-soft" style={{ width: `${pct(recusados)}%` }} />
    </div>
  );
}
