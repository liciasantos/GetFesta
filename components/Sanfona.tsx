"use client";

import { useEffect, useRef } from "react";

/** Grupo recolhível (efeito sanfona) - começa fechado pra listas longas não
 * esticarem a página. Usa <details> nativo: teclado e leitor de tela já
 * funcionam. Os links de resumo da página (ex.: "14 encerradas" -> #encerradas)
 * abrem a sanfona sozinhos, senão o clique só rolaria até um bloco fechado. */
export default function Sanfona({
  id,
  titulo,
  descricao,
  total,
  children,
}: {
  id: string;
  titulo: string;
  descricao: string;
  total: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function abrirSeForOAlvo() {
      if (window.location.hash === `#${id}` && ref.current) ref.current.open = true;
    }
    abrirSeForOAlvo();
    window.addEventListener("hashchange", abrirSeForOAlvo);
    return () => window.removeEventListener("hashchange", abrirSeForOAlvo);
  }, [id]);

  return (
    <section id={id} className="mt-8 scroll-mt-24">
      <details ref={ref} className="group rounded-xl border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
          <span>
            <h2 className="text-[15px] font-extrabold">
              {titulo} <span className="font-semibold text-muted">({total})</span>
            </h2>
            <span className="mt-0.5 block text-[12.5px] text-muted">{descricao}</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="flex flex-col gap-3 border-t border-border p-4">{children}</div>
      </details>
    </section>
  );
}
