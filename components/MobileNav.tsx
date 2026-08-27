"use client";

import { useState } from "react";

export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg border border-border-strong"
      >
        <span className={`h-[1.5px] w-4 bg-text transition-transform ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
        <span className={`h-[1.5px] w-4 bg-text transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`h-[1.5px] w-4 bg-text transition-transform ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full flex flex-col gap-4 border-b border-border bg-surface px-6 py-5 shadow-[var(--shadow-card)]"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
