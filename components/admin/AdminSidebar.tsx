"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; match: (p: string) => boolean };
type Grupo = { titulo: string | null; itens: Item[] };

const GRUPOS: Grupo[] = [
  {
    titulo: null,
    itens: [
      {
        href: "/admin",
        label: "Dashboard",
        match: (p) => p === "/admin",
        icon: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`,
      },
    ],
  },
  {
    titulo: "Conteúdo do site",
    itens: [
      {
        href: "/admin/hero",
        label: "Banner principal",
        match: (p) => p.startsWith("/admin/hero"),
        icon: `<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 16.5 8.5 12 12 15l3-3.2L20 16.8"/>`,
      },
      {
        href: "/admin/banners",
        label: "Destaques da semana",
        match: (p) => p.startsWith("/admin/banners"),
        icon: `<path d="M12 3.5 14.5 9l6 .7-4.4 4 1.2 5.8L12 16.6l-5.3 2.9 1.2-5.8-4.4-4 6-.7Z"/>`,
      },
      {
        href: "/admin/produtos-afiliados",
        label: "Produtos para sua festa",
        match: (p) => p.startsWith("/admin/produtos-afiliados"),
        icon: `<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
      },
      {
        href: "/admin/aparencia",
        label: "Aparência",
        match: (p) => p.startsWith("/admin/aparencia"),
        icon: `<path d="M14 3 21 10l-8 8-5-5 8-8Z"/><path d="M3 21l4-4"/>`,
      },
      {
        href: "/admin/site",
        label: "Site e contato",
        match: (p) => p.startsWith("/admin/site"),
        icon: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>`,
      },
      {
        href: "/admin/legal",
        label: "Privacidade e Termos",
        match: (p) => p.startsWith("/admin/legal"),
        icon: `<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z"/>`,
      },
    ],
  },
  {
    titulo: "Pessoas",
    itens: [
      {
        href: "/admin/clientes",
        label: "Clientes",
        match: (p) => p.startsWith("/admin/clientes"),
        icon: `<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`,
      },
      {
        href: "/admin/empresas",
        label: "Empresas",
        match: (p) => p.startsWith("/admin/empresas"),
        icon: `<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2"/>`,
      },
      {
        href: "/admin/profissionais",
        label: "Profissionais",
        match: (p) => p.startsWith("/admin/profissionais"),
        icon: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>`,
      },
      {
        href: "/admin/categorias-compativeis",
        label: "Compatibilidade",
        match: (p) => p.startsWith("/admin/categorias-compativeis"),
        icon: `<path d="M8 12h8"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/>`,
      },
      {
        href: "/admin/usuarios",
        label: "Usuários do admin",
        match: (p) => p.startsWith("/admin/usuarios"),
        icon: `<circle cx="8" cy="14" r="3"/><path d="M10.5 11.5 19 3M16 6l2 2M19 3l2 2"/>`,
      },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      {
        href: "/admin/planos",
        label: "Planos",
        match: (p) => p.startsWith("/admin/planos"),
        icon: `<path d="M20 12 12 20 4 12V4h8l8 8Z"/><circle cx="8" cy="8" r="1.5"/>`,
      },
      {
        href: "/admin/pagamentos",
        label: "Pagamentos",
        match: (p) => p.startsWith("/admin/pagamentos"),
        icon: `<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>`,
      },
      {
        href: "/admin/financeiro",
        label: "Fluxo de caixa",
        match: (p) => p.startsWith("/admin/financeiro"),
        icon: `<path d="M4 16l5-5 4 4 7-7"/><path d="M15 8h5v5"/>`,
      },
    ],
  },
  {
    titulo: "Moderação",
    itens: [
      {
        href: "/admin/pedidos",
        label: "Pedidos",
        match: (p) => p.startsWith("/admin/pedidos"),
        icon: `<path d="M4 12h4l2 3h4l2-3h4"/><path d="M4 12V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6"/><path d="M4 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/>`,
      },
    ],
  },
];

/** Navegação lateral de todo /admin, só em telas grandes (`lg:`) - mesmo
 * padrão de components/painel/PainelSidebar.tsx, mas agrupada por categoria
 * (14 seções não cabem numa lista só). Em telas menores cada página continua
 * com seu link "← Painel administrativo" de sempre. */
export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-6 hidden w-[240px] shrink-0 flex-col gap-4 lg:flex" aria-label="Navegação do admin">
      {GRUPOS.map((grupo, i) => (
        <div key={grupo.titulo ?? i} className="flex flex-col gap-1">
          {grupo.titulo && (
            <span className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-muted-2">{grupo.titulo}</span>
          )}
          {grupo.itens.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors ${
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
                  className="h-[18px] w-[18px] shrink-0"
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
