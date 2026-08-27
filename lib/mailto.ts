const CONTATO_EMAIL = "contato@getfesta.com.br";

/** Link mailto pra empresa solicitar o banner principal - sem backend de
 * e-mail configurado ainda, então a solicitação vai direto pro cliente de
 * e-mail da empresa, endereçada pra GetFesta. */
export function buildAnunciarBannerMailto(nomeFantasia: string, empresaId: string): string {
  const assunto = `Quero anunciar no banner principal — ${nomeFantasia}`;
  const corpo = `Olá! Sou a empresa ${nomeFantasia} (ID ${empresaId}) e tenho interesse em anunciar no banner principal da home da GetFesta.\n\nAguardo contato com valores e disponibilidade.`;
  return `mailto:${CONTATO_EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
