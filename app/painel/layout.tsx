import type { ReactNode } from "react";
import PainelMobileTabBar from "@/components/PainelMobileTabBar";

/** Casca do painel da empresa - só adiciona a barra fixa de navegação do
 * rodapé no mobile (Home/Perfil/Pedidos/Vagas); no desktop não muda nada,
 * cada página continua exatamente como era. */
export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-20 sm:pb-0">
      {children}
      <PainelMobileTabBar />
    </div>
  );
}
