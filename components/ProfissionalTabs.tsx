"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Tab = "perfil" | "galeria" | "calendario" | "vagas";

const TabContext = createContext<{ tab: Tab; setTab: (t: Tab) => void }>({
  tab: "perfil",
  setTab: () => {},
});

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
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

/** Shell da navegação mobile por abas (Perfil/Galeria/Calendário/Vagas), com
 * barra fixa no rodapé. No desktop as abas são ignoradas: TabSection sempre
 * mostra o conteúdo (sm:block), então a página continua a rolagem única de
 * sempre — essa troca acontece só via CSS (mesma árvore de componentes, sem
 * duplicar nenhum client component nem refazer fetch), então não tem custo
 * extra de performance nem de estado dessincronizado entre abas. */
export function ProfissionalTabsProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("perfil");
  return (
    <TabContext.Provider value={{ tab, setTab }}>
      <div className="pb-20 sm:pb-0">{children}</div>
      <MobileTabBar />
    </TabContext.Provider>
  );
}

/** Pro cabeçalho mobile (fora do TabSection) saber qual aba está ativa e
 * poder trocar de aba - ex: o botão "Alterar o Plano" leva pra aba Perfil
 * de qualquer lugar. Só tem efeito visual dentro de blocos "sm:hidden": no
 * desktop essa leitura de estado não decide nada, pois nada usa a aba ativa
 * fora dos TabSection (que no desktop mostram tudo, sempre). */
export function useProfissionalTab() {
  return useContext(TabContext);
}

export function TabSection({ tab, children }: { tab: Tab; children: ReactNode }) {
  const { tab: active } = useContext(TabContext);
  return <div className={`${active === tab ? "block" : "hidden"} sm:block`}>{children}</div>;
}

function MobileTabBar() {
  const { tab, setTab } = useContext(TabContext);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(31,41,51,0.08)] sm:hidden"
      aria-label="Navegação do catálogo profissional"
    >
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2 text-[11.5px] font-bold ${
                isActive ? "text-accent-dark" : "text-muted-2"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-accent-soft" : ""}`}>
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
