// Dados das abas do catálogo profissional (Perfil/Galeria/Calendário/Vagas) -
// em módulo à parte (sem "use client") pra poder ser importado tanto por
// Server Components (app/perfil-profissional/page.tsx, validação do ?tab=)
// quanto por Client Components (components/ProfissionalTabs.tsx,
// components/ProfissionalGlobalTabBar.tsx).
export type Tab = "perfil" | "galeria" | "calendario" | "vagas";

export const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  {
    id: "perfil",
    label: "Perfil",
    icon: `<circle cx="12" cy="8.2" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`,
  },
  {
    id: "galeria",
    label: "Galeria",
    icon: `<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 16.5 8.5 12 12 15l3-3.2L20 16.8"/>`,
  },
  {
    id: "calendario",
    label: "Calendário",
    icon: `<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/><path d="M7.5 13.2h.01M12 13.2h.01M16.5 13.2h.01M7.5 16.8h.01M12 16.8h.01"/>`,
  },
  {
    id: "vagas",
    label: "Vagas",
    icon: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>`,
  },
];
