"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/painel/permutas", label: "Visão geral", match: (p: string) => p === "/painel/permutas" || p.startsWith("/painel/permutas/acordos") },
  { href: "/painel/permutas/vitrine", label: "Vitrine de trocas", match: (p: string) => p.startsWith("/painel/permutas/vitrine") || p.startsWith("/painel/permutas/nova") },
  { href: "/painel/permutas/parceiros", label: "Rede de parceiros", match: (p: string) => p.startsWith("/painel/permutas/parceiros") },
  { href: "/painel/permutas/ofertas", label: "Minhas ofertas", match: (p: string) => p.startsWith("/painel/permutas/ofertas") },
  { href: "/painel/permutas/como-funciona", label: "Como funciona", match: (p: string) => p.startsWith("/painel/permutas/como-funciona") },
];

/** Abas internas da seção Permutas - no desktop a sidebar do painel já mostra
 * "Permutas", essas abas cuidam da navegação entre as páginas (e são a única
 * navegação da seção no mobile). */
export default function PermutaTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Seções da permuta" className="-mx-6 mb-5 overflow-x-auto px-6">
      <div className="flex w-max gap-1 rounded-xl bg-surface-alt p-1">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-bold ${
                active ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
