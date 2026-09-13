"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { TABS, type Tab } from "@/lib/profissional-tabs";

const TabContext = createContext<{ tab: Tab; setTab: (t: Tab) => void }>({
  tab: "perfil",
  setTab: () => {},
});

/** Shell de navegação por abas (Perfil/Galeria/Calendário/Vagas + Painel
 * inicial só no desktop) - no mobile troca de aba pela barra fixa do rodapé
 * (MobileTabBar), no desktop pela sidebar (components/painel/
 * ProfissionalPainelSidebar.tsx). Os dois só trocam o estado `tab` local -
 * mesma árvore de componentes, sem duplicar nenhum client component nem
 * refazer fetch, então não tem custo extra de performance nem de estado
 * dessincronizado entre abas. */
export function ProfissionalTabsProvider({ children, initialTab = "perfil" }: { children: ReactNode; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
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
  return <div className={active === tab ? "block" : "hidden"}>{children}</div>;
}

/** Atalho usado no "Painel inicial" (desktop) pra pular direto pra outra
 * seção, sem precisar passar pela sidebar. */
export function TabShortcutButton({ tabId, label }: { tabId: Tab; label: string }) {
  const { setTab } = useContext(TabContext);
  return (
    <button
      type="button"
      onClick={() => setTab(tabId)}
      className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] font-bold hover:bg-surface-alt"
    >
      {label}
    </button>
  );
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
