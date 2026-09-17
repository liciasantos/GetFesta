/** URL base do site em produção - usada pra montar links absolutos em coisas
 * que exigem URL completa (sitemap, robots.txt, metadataBase do Open
 * Graph/Twitter Card). Mesma variável de ambiente já usada pelo callback do
 * Google OAuth (ver lib/google-oauth.ts) - quando o domínio próprio
 * (getfesta.com.br) for configurado, troca só o valor de APP_URL na Vercel,
 * sem precisar mexer em código nenhum. */
export const SITE_URL = process.env.APP_URL ?? "https://getfesta-mvp.vercel.app";
