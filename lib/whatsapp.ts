/** Gera o link wa.me a partir de um telefone brasileiro (com ou sem formatacao). */
export function buildWhatsAppLink(telefone: string, mensagem?: string): string {
  const digits = telefone.replace(/\D/g, "");
  const comDDI = digits.startsWith("55") ? digits : `55${digits}`;
  const base = `https://wa.me/${comDDI}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}
