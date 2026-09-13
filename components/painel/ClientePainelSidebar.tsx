"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS: Array<{ href: string; label: string; icon: string; match: (p: string) => boolean }> = [
  {
    href: "/meus-pedidos",
    label: "Painel inicial",
    match: (p) => p === "/meus-pedidos",
    icon: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`,
  },
  {
    href: "/meu-perfil",
    label: "Meu perfil",
    match: (p) => p.startsWith("/meu-perfil"),
    icon: `<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`,
  },
  {
    href: "/calculadora-eventos",
    label: "Calculadora de festa",
    match: (p) => p.startsWith("/calculadora-eventos"),
    icon: `<path d="M6 3.5h12a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M8 7.5h8M8.5 11.2h.01M12 11.2h.01M15.5 11.2h.01M8.5 14.8h.01M12 14.8h.01M15.5 14.8h.01"/>`,
  },
];

/** Navegação lateral do painel do cliente, só em telas grandes (`lg:`) - mesmo
 * padrão de components/painel/PainelSidebar.tsx (empresa). No mobile o
 * cliente não tem barra fixa nenhuma hoje (ver MobileAccountNav.tsx), então
 * essa sidebar não duplica nem substitui nada, só cobre o desktop. */
export default function ClientePainelSidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-6 hidden w-[230px] shrink-0 flex-col gap-1 lg:flex" aria-label="Navegação do painel">
      {ITENS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-bold transition-colors ${
              active ? "bg-accent-soft text-accent-dark" : "text-muted hover:bg-surface-alt hover:text-text"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[19px] w-[19px] shrink-0"
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
