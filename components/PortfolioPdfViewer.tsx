"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui";

export default function PortfolioPdfViewer({ url, nome }: { url: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // converte a data URI num blob: URL - assim o iframe fica "mesma origem" da
  // pagina e o print() funciona sem cair na restricao de cross-origin que um
  // iframe com src="data:..." teria.
  useEffect(() => {
    if (!aberto) return;
    let objectUrl: string | null = null;
    let cancelado = false;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelado) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      });
    return () => {
      cancelado = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlobUrl(null);
    };
  }, [aberto, url]);

  function imprimir() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div>
      <button type="button" onClick={() => setAberto((v) => !v)} className={buttonClass("secondary", "sm")}>
        {aberto ? "Fechar portfólio/currículo" : `📄 Ver portfólio/currículo (${nome})`}
      </button>

      {aberto && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-surface-alt p-2">
            <button
              type="button"
              onClick={imprimir}
              disabled={!blobUrl}
              className="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
            >
              🖨️ Imprimir
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt"
            >
              ✕ Fechar
            </button>
          </div>
          {blobUrl ? (
            <iframe ref={iframeRef} src={blobUrl} title={nome} className="h-[70vh] w-full" />
          ) : (
            <div className="p-8 text-center text-[12.5px] text-muted">Carregando PDF...</div>
          )}
        </div>
      )}
    </div>
  );
}
