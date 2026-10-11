"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: Array<{ href: string; label: string; icon: string; match: (p: string) => boolean }> = [
  {
    href: "/meus-pedidos",
    label: "Início",
    match: (p) => p === "/meus-pedidos",
    icon: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`,
  },
  {
    href: "/lista-convidados",
    label: "Convidados",
    match: (p) => p.startsWith("/lista-convidados"),
    icon: `<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c0-3.1 2.5-5.5 5.5-5.5s5.5 2.4 5.5 5.5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.3 14.2c2.6.3 4.7 2.5 4.7 5.3"/>`,
  },
  {
    href: "/calculadora-eventos",
    label: "Calculadora",
    match: (p) => p.startsWith("/calculadora-eventos"),
    icon: `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>`,
  },
  {
    href: "/meu-perfil",
    label: "Perfil",
    match: (p) => p.startsWith("/meu-perfil"),
    icon: `<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`,
  },
];

/** Barra fixa do rodapé (celular e tablet, até o menu lateral aparecer no lg) da área do cliente - mesmo padrão de
 * PainelMobileTabBar (empresa): cada aba é uma rota de verdade. */
export default function ClienteMobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      data-barra-inferior
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(31,41,51,0.08)] lg:hidden"
      aria-label="Navegação da sua área"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 py-2 text-[11.5px] font-bold ${active ? "text-accent-dark" : "text-muted-2"}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-accent-soft" : ""}`}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[26px] w-[26px]"
                  dangerouslySetInnerHTML={{ __html: t.icon }}
                />
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
