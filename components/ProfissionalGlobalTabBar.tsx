"use client";

import Link from "next/link";
import { TABS } from "@/lib/profissional-tabs";
import NavBadge from "@/components/NavBadge";

/** Barra fixa do rodapé pro profissional, igual à do painel da empresa mas
 * navegando de verdade (?tab=X) - usada em qualquer página FORA de
 * /perfil-profissional, já que lá dentro a própria página já tem sua barra
 * local (troca de aba sem reload, ver components/ProfissionalTabs.tsx). */
export default function ProfissionalGlobalTabBar({ vagasBadge = 0 }: { vagasBadge?: number }) {
  return (
    <nav
      data-barra-inferior
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(31,41,51,0.08)] lg:hidden"
      aria-label="Navegação do catálogo profissional"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-4">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/perfil-profissional?tab=${t.id}`}
            className="flex flex-col items-center gap-1 py-2 text-[11.5px] font-bold text-muted-2"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl">
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
              {t.id === "vagas" && <NavBadge count={vagasBadge} rotulo={["novidade em vagas", "novidades em vagas"]} variant="corner" />}
            </span>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
