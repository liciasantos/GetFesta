// Rotaciona as tags de categoria dos pedidos pelas cores da paleta GetFesta
// (coral, dourado, azul, verde) - puramente visual, não carrega significado.
const PALETTE = [
  { bg: "bg-accent-soft", text: "text-accent-dark" },
  { bg: "bg-gold-soft", text: "text-[#8f6a00]" },
  { bg: "bg-info-soft", text: "text-info-dark" },
  { bg: "bg-ok-soft", text: "text-ok" },
] as const;

export function categoryColor(nameOrIndex: string | number): { bg: string; text: string } {
  if (typeof nameOrIndex === "number") return PALETTE[nameOrIndex % PALETTE.length];
  let hash = 0;
  for (let i = 0; i < nameOrIndex.length; i++) hash = (hash * 31 + nameOrIndex.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
