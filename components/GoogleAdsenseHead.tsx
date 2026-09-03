import Script from "next/script";
import { getConfiguracoesSite, CONFIG_GOOGLE_ADS_CLIENT } from "@/lib/data/config";

/** Script de verificacao/carregamento do AdSense, presente em TODA pagina
 * (exigido pelo Google pra verificar a propriedade do site, independente de
 * ja existir algum bloco de anuncio configurado). strategy="afterInteractive"
 * (nao "beforeInteractive") pra nao bloquear a renderizacao/hidratacao da
 * pagina - o Google ainda enxerga a tag no HTML, so nao trava o carregamento
 * do resto do site esperando esse script de terceiro. */
export default async function GoogleAdsenseHead() {
  const config = await getConfiguracoesSite();
  const clientId = config[CONFIG_GOOGLE_ADS_CLIENT];
  if (!clientId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
