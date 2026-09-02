export type StatusVencimento = "ok" | "atencao" | "vencido";

/** Classifica uma data de vencimento em 3 estados pra colorir no admin
 * (qualquer coisa mensal/paga: anuncio de banner, assinatura de empresa):
 * "ok" = mais de `diasAviso` dias pra vencer, "atencao" = vence em breve
 * (amarelo), "vencido" = já passou (vermelho). `null` = sem data de
 * vencimento (ex: plano sem fim definido) - trata como "ok". */
export function statusVencimento(fimEm: string | Date | null, diasAviso = 7): StatusVencimento {
  if (!fimEm) return "ok";
  const fim = typeof fimEm === "string" ? new Date(fimEm) : fimEm;
  const diffMs = fim.getTime() - Date.now();
  if (diffMs < 0) return "vencido";
  if (diffMs <= diasAviso * 24 * 60 * 60 * 1000) return "atencao";
  return "ok";
}
