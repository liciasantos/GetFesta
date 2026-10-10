"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { marcarVagasVistas } from "@/lib/actions/vagas";
import { TABS, type Tab } from "@/lib/profissional-tabs";
import NavBadge from "@/components/NavBadge";

const TabContext = createContext<{ tab: Tab; setTab: (t: Tab) => void; vagasBadge: number }>({
  tab: "perfil",
  setTab: () => {},
  vagasBadge: 0,
});

/** Shell de navegação por abas (Perfil/Galeria/Calendário/Vagas + Painel
 * inicial só no desktop) - no mobile troca de aba pela barra fixa do rodapé
 * (MobileTabBar), no desktop pela sidebar (components/painel/
 * ProfissionalPainelSidebar.tsx). Os dois só trocam o estado `tab` local -
 * mesma árvore de componentes, sem duplicar nenhum client component nem
 * refazer fetch, então não tem custo extra de performance nem de estado
 * dessincronizado entre abas. */
export function ProfissionalTabsProvider({
  children,
  initialTab = "perfil",
  vagasBadge = 0,
  vagasNaoVistas = 0,
}: {
  children: ReactNode;
  initialTab?: Tab;
  /** selo numérico ao lado de "Vagas" (selecionado em evento futuro + vagas novas não vistas) */
  vagasBadge?: number;
  /** quantas das vagas do selo são novas ainda não vistas - saem do selo ao abrir a aba Vagas */
  vagasNaoVistas?: number;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [vistas, setVistas] = useState(false);
  const marcou = useRef(false);

  // Abriu a aba Vagas: registra a visita (as etiquetas "Nova" continuam nesta
  // visita - só somem na próxima) e tira as novas do selo na hora.
  useEffect(() => {
    if (tab !== "vagas" || vagasNaoVistas === 0 || marcou.current) return;
    marcou.current = true;
    marcarVagasVistas().then(() => setVistas(true));
  }, [tab, vagasNaoVistas]);

  const badge = vistas ? Math.max(0, vagasBadge - vagasNaoVistas) : vagasBadge;
  return (
    <TabContext.Provider value={{ tab, setTab, vagasBadge: badge }}>
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

/** Largura do conteúdo: estreita (max-w-2xl) nas abas de formulário, mas na aba
 * Vagas, em tela grande, usa o espaço todo ao lado do menu pra caber as vagas em
 * duas colunas (ver components/VagasProfissionalLista.tsx). */
export function LarguraPorAba({ children }: { children: ReactNode }) {
  const { tab } = useContext(TabContext);
  return (
    <div className={`mx-auto px-6 py-10 ${tab === "vagas" ? "max-w-2xl lg:max-w-6xl" : "max-w-2xl"}`}>{children}</div>
  );
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
  const { tab, setTab, vagasBadge } = useContext(TabContext);
  return (
    <nav
      data-barra-inferior
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
              <span className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-accent-soft" : ""}`}>
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
