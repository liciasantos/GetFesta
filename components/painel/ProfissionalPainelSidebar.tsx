"use client";

import { useProfissionalTab } from "@/components/ProfissionalTabs";
import { TABS, type Tab } from "@/lib/profissional-tabs";

const ITENS: Array<{ id: Tab; label: string; icon: string }> = [
  {
    id: "painel",
    label: "Painel inicial",
    icon: `<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`,
  },
  ...TABS,
];

/** Navegação lateral do catálogo profissional, só em telas grandes (`lg:`) -
 * mesmo padrão visual de components/painel/PainelSidebar.tsx (empresa), mas
 * troca de seção via estado (setTab) em vez de rota, já que aqui é tudo uma
 * página só (ver components/ProfissionalTabs.tsx). No mobile a navegação
 * continua sendo só a barra fixa do rodapé (MobileTabBar, dentro do próprio
 * ProfissionalTabs.tsx), que não ganha o item "Painel inicial" de propósito -
 * ele só existe no desktop. */
export default function ProfissionalPainelSidebar() {
  const { tab, setTab } = useProfissionalTab();

  return (
    <nav className="sticky top-6 hidden w-[230px] shrink-0 flex-col gap-1 lg:flex" aria-label="Navegação do catálogo profissional">
      {ITENS.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-bold transition-colors ${
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
          </button>
        );
      })}
    </nav>
  );
}
