"use client";

import { useEffect, useState } from "react";

export default function GaleriaLightbox({ fotos }: { fotos: { id: string; url: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % fotos.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length));
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [openIndex, fotos.length]);

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {fotos.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="card-hover overflow-hidden rounded-md border border-border"
            aria-label={`Ver foto ${i + 1} em tamanho maior`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt={`Foto ${i + 1}`} className="h-[120px] w-full object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ×
          </button>

          {fotos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length));
                }}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:left-4"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Próxima foto"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? i : (i + 1) % fotos.length));
                }}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:right-4"
              >
                →
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[openIndex].url}
            alt={`Foto ${openIndex + 1}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          />

          {fotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[11.5px] font-semibold text-white">
              {openIndex + 1} / {fotos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
