/** Contagem regressiva das festas na área do cliente. Datas DATE do Postgres
 * chegam como Date (meia-noite local) ou string YYYY-MM-DD - normaliza pro dia
 * e compara com "hoje" no fuso de Brasília. Server e client. */

export function diaIso(d: string | Date): string {
  return (typeof d === "string" ? d : d.toISOString()).slice(0, 10);
}

export function hojeBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** dias de hoje até a data (negativo = já passou) */
export function diasAte(data: string | Date, hoje = hojeBrasilia()): number {
  const [a, b] = [diaIso(data), hoje].map((s) => {
    const [y, m, dd] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, dd);
  });
  return Math.round((a - b) / 86_400_000);
}

export function rotuloContagem(dias: number): string {
  if (dias === 0) return "É hoje!";
  if (dias === 1) return "É amanhã";
  if (dias > 1) return `Faltam ${dias} dias`;
  if (dias === -1) return "Foi ontem";
  return `Foi há ${-dias} dias`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** { dia: "25", mes: "out" } pro bloco de data dos cartões */
export function blocoData(data: string | Date): { dia: string; mes: string; ano: string } {
  const [y, m, d] = diaIso(data).split("-");
  return { dia: d, mes: MESES[Number(m) - 1], ano: y };
}
