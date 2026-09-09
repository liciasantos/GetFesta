"use client";

import Link from "next/link";
import { TABS } from "@/lib/profissional-tabs";

/** Barra fixa do rodapé pro profissional, igual à do painel da empresa mas
 * navegando de verdade (?tab=X) - usada em qualquer página FORA de
 * /perfil-profissional, já que lá dentro a própria página já tem sua barra
 * local (troca de aba sem reload, ver components/ProfissionalTabs.tsx). */
export default function ProfissionalGlobalTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(31,41,51,0.08)] sm:hidden"
      aria-label="Navegação do catálogo profissional"
    >
      <div className="grid grid-cols-4">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/perfil-profissional?tab=${t.id}`}
            className="flex flex-col items-center gap-1 py-2 text-[11.5px] font-bold text-muted-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[27px] w-[27px]"
                dangerouslySetInnerHTML={{ __html: t.icon }}
              />
            </span>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
