export function formatCurrencyBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "sob consulta";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "sob consulta";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function formatDateBR(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Converte orcamento_min/max em faixa fixa pra exibir como chip (secao 6 do plano). */
export function budgetRangeLabel(min: number | null, max: number | null): string {
  if (min === null && max === null) return "A combinar";
  if (max !== null && max <= 700) return "Até R$ 700";
  if (max !== null && max <= 3000) return "R$ 700 – R$ 3.000";
  if (min !== null && min >= 8000) return "Acima de R$ 8.000";
  return "R$ 3.000 – R$ 8.000";
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}
