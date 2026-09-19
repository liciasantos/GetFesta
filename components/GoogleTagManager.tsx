import Script from "next/script";

const GTM_ID = "GTM-TCRN8BKS";

/** Google Tag Manager - strategy="afterInteractive" (em vez de
 * "beforeInteractive") pra não travar a thread principal antes da página
 * hidratar - o Clarity mostrou LCP ~7s e INP ~1s, e o GTM beforeInteractive
 * era o único script bloqueante entre os três instalados (AdSense e Clarity
 * já usavam afterInteractive). GTM funciona igual com afterInteractive, só
 * carrega um pouco depois do primeiro paint em vez de antes dele. */
export default function GoogleTagManagerScript() {
  return (
    <Script id="gtm-script" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

export function GoogleTagManagerNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
