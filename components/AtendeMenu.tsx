"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/** Agrupa "Pra empresas"/"Pra profissionais" num só menu no cabeçalho
 * principal (Opção A do redesenho) - rótulo neutro em forma de pergunta
 * ("Trabalha com festas?") porque profissional freelancer não costuma se ver
 * como "fornecedor", só a empresa. A escolha de identidade real acontece aqui
 * dentro, em "Sou empresa"/"Sou profissional". Mesmo padrão de dropdown do
 * AccessMenu.tsx (open state + clique fora fecha). */
export default function AtendeMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 whitespace-nowrap hover:text-text"
      >
        Trabalha com festas?
        <svg viewBox="0 0 12 8" fill="none" className="h-2 w-2.5 shrink-0">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[230px] rounded-xl border border-border bg-surface p-1.5 shadow-card-hover">
          <Link
            href="/empresas"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-[13px] hover:bg-surface-alt"
          >
            <span className="font-bold text-text">Sou empresa</span>
            <span className="mt-0.5 block text-[11.5px] font-normal text-muted">Receba pedidos de clientes</span>
          </Link>
          <Link
            href="/profissionais"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-[13px] hover:bg-surface-alt"
          >
            <span className="font-bold text-text">Sou profissional</span>
            <span className="mt-0.5 block text-[11.5px] font-normal text-muted">Vagas freelance pra eventos</span>
          </Link>
        </div>
      )}
    </div>
  );
}
