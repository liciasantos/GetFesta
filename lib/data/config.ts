import { query } from "@/lib/db";
import { POLITICA_PRIVACIDADE_PADRAO, TERMOS_USO_PADRAO } from "@/lib/legal-content";

export const CONFIG_COMO_FUNCIONA_BG = "como_funciona_bg";
export const CONFIG_BUSCA_BANNER_BG = "busca_banner_bg";
export const CONFIG_CTA_FORNECEDOR_BG = "cta_fornecedor_bg";
export const CONFIG_CTA_FORNECEDOR_COR = "cta_fornecedor_cor";
export const CONFIG_SOCIAL_INSTAGRAM = "social_instagram";
export const CONFIG_SOCIAL_TIKTOK = "social_tiktok";
export const CONFIG_SOCIAL_YOUTUBE = "social_youtube";
export const CONFIG_CONTATO_EMAIL = "contato_email";
export const CONFIG_CONTATO_TELEFONE = "contato_telefone";
export const CONFIG_CONTATO_WHATSAPP = "contato_whatsapp";
export const CONFIG_POLITICA_PRIVACIDADE = "politica_privacidade_texto";
export const CONFIG_TERMOS_USO = "termos_uso_texto";

const FALLBACKS: Record<string, string> = {
  [CONFIG_COMO_FUNCIONA_BG]: "/sitio-festa-infantil.webp",
  [CONFIG_BUSCA_BANNER_BG]: "/baloes-lilas.webp",
  [CONFIG_CTA_FORNECEDOR_BG]: "/festa-heroi.webp",
  [CONFIG_CTA_FORNECEDOR_COR]: "#1f2933",
  [CONFIG_CONTATO_EMAIL]: "contato@getfesta.com.br",
  [CONFIG_POLITICA_PRIVACIDADE]: POLITICA_PRIVACIDADE_PADRAO,
  [CONFIG_TERMOS_USO]: TERMOS_USO_PADRAO,
};

/** Le todas as configuracoes editaveis pelo admin de uma vez (imagens de
 * fundo, links sociais, dados de contato...), com fallback pro padrao
 * quando o admin nunca configurou - chaves sem fallback ficam "" (ex: link
 * social sem cadastro ainda = desabilitado). */
export async function getConfiguracoesSite(): Promise<Record<string, string>> {
  const rows = await query<{ chave: string; valor: string }>(`SELECT chave, valor FROM configuracoes_site`);
  const porChave = Object.fromEntries(rows.map((r) => [r.chave, r.valor]));
  return {
    [CONFIG_SOCIAL_INSTAGRAM]: "",
    [CONFIG_SOCIAL_TIKTOK]: "",
    [CONFIG_SOCIAL_YOUTUBE]: "",
    [CONFIG_CONTATO_TELEFONE]: "",
    [CONFIG_CONTATO_WHATSAPP]: "",
    ...FALLBACKS,
    ...porChave,
  };
}
