import Script from "next/script";
import { getConfiguracoesSite, CONFIG_GOOGLE_ADS_CLIENT } from "@/lib/data/config";

/** Script de verificacao/carregamento do AdSense, presente em TODA pagina
 * (exigido pelo Google pra verificar a propriedade do site, independente de
 * ja existir algum bloco de anuncio configurado). strategy="beforeInteractive"
 * pra garantir que o Google consiga achar a tag no HTML renderizado no
 * servidor, dentro de <head>, e nao so depois da hidratacao no cliente. */
export default async function GoogleAdsenseHead() {
  const config = await getConfiguracoesSite();
  const clientId = config[CONFIG_GOOGLE_ADS_CLIENT];
  if (!clientId) return null;

  return (
    // beforeInteractive só é permitido no root layout - é exatamente onde estamos.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="beforeInteractive"
    />
  );
}
