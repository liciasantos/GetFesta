import Script from "next/script";
import { getConfiguracoesSite, CONFIG_CLARITY_PROJECT_ID } from "@/lib/data/config";

/** Microsoft Clarity (heatmap/gravacao de sessao) - so injeta o script se o
 * admin cadastrou o Project ID em /admin/site. */
export default async function ClarityScript() {
  const config = await getConfiguracoesSite();
  const projectId = config[CONFIG_CLARITY_PROJECT_ID];
  if (!projectId) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}
