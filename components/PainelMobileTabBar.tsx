"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: Array<{ href: string; label: string; icon: string; match: (p: string) => boolean }> = [
  {
    href: "/painel",
    label: "Home",
    match: (p) => p === "/painel",
    icon: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`,
  },
  {
    href: "/painel/perfil",
    label: "Perfil",
    match: (p) => p.startsWith("/painel/perfil"),
    icon: `<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`,
  },
  {
    href: "/painel/pedidos",
    label: "Pedidos",
    match: (p) => p.startsWith("/painel/pedidos"),
    icon: `<path d="M4 12h4l2 3h4l2-3h4"/><path d="M4 12V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6"/><path d="M4 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/>`,
  },
  {
    href: "/painel/vagas",
    label: "Vagas",
    match: (p) => p.startsWith("/painel/vagas"),
    icon: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>`,
  },
];

/** Navegação fixa no rodapé do painel da empresa, só no mobile - ao contrário
 * do catálogo do profissional (que é uma página só com abas via CSS), aqui
 * cada item é uma rota de verdade (Home/Perfil/Pedidos/Vagas já são páginas
 * separadas), então a navegação é feita com <Link> normal + usePathname pra
 * destacar a aba ativa, sem precisar de nenhum estado client extra. */
export default function PainelMobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Navegação do painel"
    >
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${
                active ? "text-accent-dark" : "text-muted-2"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                dangerouslySetInnerHTML={{ __html: t.icon }}
              />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
