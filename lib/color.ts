/** Converte um hex (#RGB ou #RRGGBB) em rgba() para permitir opacidade em
 * cores administráveis (vindas do banco, não dá pra usar arbitrary values
 * do Tailwind pra isso). Hex inválido cai em preto. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || "").replace("#", "").trim();
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
