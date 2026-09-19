"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirRegiaoAction } from "@/lib/actions/regiao";
import { ESTADOS } from "@/lib/estados";

/** Filtro de região da barra utilitária - escolhe um estado, salva num
 * cookie (lib/actions/regiao.ts) e recarrega a página server-side pra
 * /busca e a home já saírem filtradas por ele (ver app/busca/page.tsx e
 * app/page.tsx). `regiaoAtual` vem do cookie, lido no server e passado como
 * prop (client component não pode ler cookie httpOnly nem precisa - aqui
 * nem é httpOnly, mas mantém a leitura só no servidor por consistência). */
export default function RegionPicker({ regiaoAtual }: { regiaoAtual: string | null }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function escolher(sigla: string | null) {
    setOpen(false);
    startTransition(async () => {
      await definirRegiaoAction(sigla);
      router.refresh();
    });
  }

  const nomeAtual = ESTADOS.find((e) => e.sigla === regiaoAtual)?.nome ?? "Todas as regiões";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-white/90 hover:text-white disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 shrink-0">
          <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.3" />
        </svg>
        {nomeAtual}
        <svg viewBox="0 0 12 8" fill="none" className="h-2 w-2.5">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[280px] w-[220px] overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-card-hover">
          <button
            type="button"
            onClick={() => escolher(null)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] font-bold ${
              !regiaoAtual ? "bg-accent-soft text-accent-dark" : "text-text hover:bg-surface-alt"
            }`}
          >
            Todas as regiões
          </button>
          {ESTADOS.map((e) => (
            <button
              key={e.sigla}
              type="button"
              onClick={() => escolher(e.sigla)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] font-bold ${
                regiaoAtual === e.sigla ? "bg-accent-soft text-accent-dark" : "text-text hover:bg-surface-alt"
              }`}
            >
              {e.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
