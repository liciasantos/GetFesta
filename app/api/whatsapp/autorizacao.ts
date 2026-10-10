import { timingSafeEqual } from "node:crypto";

/** Confere o segredo compartilhado com o servidor do WAHA (WHATSAPP_SECRET).
 * Sem a variável configurada, as rotas ficam fechadas. */
export function segredoConfere(recebido: string | null | undefined): boolean {
  const esperado = process.env.WHATSAPP_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
