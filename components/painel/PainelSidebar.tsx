"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS: Array<{ href: string; label: string; icon: string; match: (p: string) => boolean }> = [
  {
    href: "/painel",
    label: "Painel inicial",
    match: (p) => p === "/painel",
    icon: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`,
  },
  {
    href: "/painel/pedidos",
    label: "Pedidos compatíveis",
    match: (p) => p.startsWith("/painel/pedidos"),
    icon: `<path d="M4 12h4l2 3h4l2-3h4"/><path d="M4 12V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6"/><path d="M4 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/>`,
  },
  {
    href: "/painel/vagas",
    label: "Vagas para profissionais",
    match: (p) => p.startsWith("/painel/vagas"),
    icon: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>`,
  },
  {
    href: "/painel/anuncios",
    label: "Meus anúncios",
    match: (p) => p.startsWith("/painel/anuncios"),
    icon: `<path d="M3 10v4a1 1 0 0 0 1 1h2l8 4V5L6 9H4a1 1 0 0 0-1 1Z"/><path d="M17 9a3.5 3.5 0 0 1 0 6"/>`,
  },
  {
    href: "/painel/avaliacoes",
    label: "Avaliações",
    match: (p) => p.startsWith("/painel/avaliacoes"),
    icon: `<path d="M12 3.5 14.5 9l6 .7-4.4 4 1.2 5.8L12 16.6l-5.3 2.9 1.2-5.8-4.4-4 6-.7Z"/>`,
  },
  {
    href: "/painel/perfil",
    label: "Perfil da empresa",
    match: (p) => p.startsWith("/painel/perfil"),
    icon: `<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`,
  },
];

/** Navegação lateral do painel da empresa, só em telas grandes (`lg:`) - no
 * mobile a navegação continua sendo só o rodapé fixo global (ver
 * components/PainelMobileTabBar.tsx e components/MobileAccountNav.tsx),
 * então essa sidebar não duplica nada, só cobre o desktop, onde antes não
 * existia navegação nenhuma além dos links soltos dentro de cada página. */
export default function PainelSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-6 hidden w-[230px] shrink-0 flex-col gap-1 lg:flex"
      aria-label="Navegação do painel"
    >
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
