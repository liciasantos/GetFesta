import type { ReactNode } from "react";
import PainelSidebar from "@/components/painel/PainelSidebar";

/** Casca do painel da empresa - adiciona a sidebar de navegação, só visível
 * em telas grandes (`lg:`). Sem `mx-auto`/`max-w`/padding aqui de propósito:
 * cada página do painel já tem seu próprio container de largura/margem, que
 * passa a centralizar dentro do espaço que sobra ao lado da sidebar - assim
 * não precisa mexer em nenhuma página existente por causa dela. No mobile a
 * navegação continua sendo só o rodapé fixo global (ver
 * components/MobileAccountNav.tsx), que não muda em nada aqui. */
export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:items-start lg:gap-6 lg:pl-6 lg:pt-8">
      <PainelSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
