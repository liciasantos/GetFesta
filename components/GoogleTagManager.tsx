import Script from "next/script";

const GTM_ID = "GTM-TCRN8BKS";

/** Google Tag Manager - strategy="beforeInteractive" faz o Next.js injetar
 * esse script no <head>, o mais cedo possível (antes de qualquer outro
 * script/hidratação), independente de onde o componente é renderizado na
 * árvore - é a forma recomendada pelo Next.js de carregar o GTM no App
 * Router. O <noscript> (fallback pra quem tem JS desabilitado) vai direto
 * em app/layout.tsx, logo após a abertura do <body>. */
export default function GoogleTagManagerScript() {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- regra pensada pro Pages Router (pages/_document.js); no App Router, colocar beforeInteractive aqui dentro de app/layout.tsx é o padrão documentado pelo próprio Next.js
    <Script id="gtm-script" strategy="beforeInteractive">
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
