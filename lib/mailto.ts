const CONTATO_EMAIL = "contato@getfesta.com.br";

/** Link mailto pra empresa solicitar o banner principal - sem backend de
 * e-mail configurado ainda, então a solicitação vai direto pro cliente de
 * e-mail da empresa, endereçada pra GetFesta. */
export function buildAnunciarBannerMailto(nomeFantasia: string, empresaId: string): string {
  const assunto = `Quero anunciar no banner principal — ${nomeFantasia}`;
  const corpo = `Olá! Sou a empresa ${nomeFantasia} (ID ${empresaId}) e tenho interesse em anunciar no banner principal da home da GetFesta.\n\nAguardo contato com valores e disponibilidade.`;
  return `mailto:${CONTATO_EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

/** Link mailto pra empresa finalizar a contratacao de um plano pago -
 * fallback usado quando o WhatsApp de suporte (CONFIG_CONTATO_WHATSAPP)
 * ainda nao foi configurado no admin, ver PlanoSelector.tsx. */
export function buildContratarPlanoMailto(nomeFantasia: string, planoNome: string, meses: number): string {
  const assunto = `Quero contratar o plano ${planoNome} — ${nomeFantasia}`;
  const corpo = `Olá! Sou ${nomeFantasia} e quero contratar o plano ${planoNome} por ${meses} ${
    meses === 1 ? "mês" : "meses"
  } pra finalizar o pagamento e ativar no GetFesta.`;
  return `mailto:${CONTATO_EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
