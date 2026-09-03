"use client";

import { useEffect } from "react";

/** Renderiza o bloco de anuncio e dispara o push que manda o Google
 * preencher o slot. O script do AdSense em si ja e carregado uma unica vez,
 * sitewide, por GoogleAdsenseHead (dentro de <head>) - nao recarrega aqui
 * pra nao duplicar. */
export default function GoogleAdUnit({ clientId, slotId }: { clientId: string; slotId: string }) {
  useEffect(() => {
    try {
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || [];
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({});
    } catch {
      // Google ainda nao carregou / bloqueado por ad-blocker - sem problema
    }
  }, []);

  return (
    // min-height reserva o espaco antes do Google preencher o anuncio, pra
    // nao empurrar o resto da pagina quando o iframe aparecer (CLS).
    <ins
      className="adsbygoogle"
      style={{ display: "block", minHeight: 100 }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
