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
export const CONFIG_GOOGLE_ADS_CLIENT = "google_ads_client";
export const CONFIG_GOOGLE_ADS_SLOT = "google_ads_slot";
export const CONFIG_CLARITY_PROJECT_ID = "clarity_project_id";
export const CONFIG_PROFISSIONAIS_HERO_BG = "profissionais_hero_bg";
export const CONFIG_PROFISSIONAIS_HERO_IMAGEM = "profissionais_hero_imagem";
export const CONFIG_PROFISSIONAIS_HERO_TITULO = "profissionais_hero_titulo";
export const CONFIG_PROFISSIONAIS_HERO_SUBTITULO = "profissionais_hero_subtitulo";
export const CONFIG_EMPRESAS_HERO_BG = "empresas_hero_bg";
export const CONFIG_EMPRESAS_HERO_IMAGEM = "empresas_hero_imagem";
export const CONFIG_EMPRESAS_HERO_TITULO = "empresas_hero_titulo";
export const CONFIG_EMPRESAS_HERO_SUBTITULO = "empresas_hero_subtitulo";

const FALLBACKS: Record<string, string> = {
  [CONFIG_COMO_FUNCIONA_BG]: "/sitio-festa-infantil.webp",
  [CONFIG_BUSCA_BANNER_BG]: "/baloes-lilas.webp",
  [CONFIG_CTA_FORNECEDOR_BG]: "/festa-heroi.webp",
  [CONFIG_CTA_FORNECEDOR_COR]: "#1f2933",
  [CONFIG_CONTATO_EMAIL]: "contato@getfesta.com.br",
  [CONFIG_POLITICA_PRIVACIDADE]: POLITICA_PRIVACIDADE_PADRAO,
  [CONFIG_TERMOS_USO]: TERMOS_USO_PADRAO,
  [CONFIG_PROFISSIONAIS_HERO_BG]: "#1f2933",
  [CONFIG_PROFISSIONAIS_HERO_TITULO]: "Sua agenda cheia e seu talento em destaque.",
  [CONFIG_PROFISSIONAIS_HERO_SUBTITULO]:
    "Conecte-se com empresas que precisam do seu trabalho pontual. Gerencie seus dias livres numa única plataforma.",
  [CONFIG_EMPRESAS_HERO_BG]: "#1f2933",
  [CONFIG_EMPRESAS_HERO_IMAGEM]: "/festa-heroi.webp",
  [CONFIG_EMPRESAS_HERO_TITULO]: "Clientes da sua região estão procurando os seus serviços agora.",
  [CONFIG_EMPRESAS_HERO_SUBTITULO]: "Receba pedidos qualificados e negocie direto pelo WhatsApp. Sem comissão por festa fechada.",
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
    [CONFIG_GOOGLE_ADS_CLIENT]: "",
    [CONFIG_GOOGLE_ADS_SLOT]: "",
    [CONFIG_CLARITY_PROJECT_ID]: "",
    [CONFIG_PROFISSIONAIS_HERO_IMAGEM]: "",
    ...FALLBACKS,
    ...porChave,
  };
}
