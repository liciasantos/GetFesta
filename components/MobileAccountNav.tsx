"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import PainelMobileTabBar from "@/components/PainelMobileTabBar";
import ProfissionalGlobalTabBar from "@/components/ProfissionalGlobalTabBar";

/** Mantém a barra de navegação do rodapé (mobile) fixa em TODAS as páginas
 * enquanto empresa/profissional estiver logado - antes só aparecia dentro de
 * /painel (empresa) ou dentro da própria página de perfil (profissional).
 * Some por completo se deslogar (tipo null) - nunca aparece pra cliente,
 * admin ou visitante. */
export default function MobileAccountNav({
  tipo,
  children,
}: {
  tipo: "cliente" | "empresa" | "profissional" | "admin" | null;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (tipo === "empresa") {
    return (
      <div className="pb-20 sm:pb-0">
        {children}
        <PainelMobileTabBar />
      </div>
    );
  }

  // /perfil-profissional já tem sua própria barra local (troca de aba sem
  // reload) - evita duas barras fixas sobrepostas na mesma tela.
  if (tipo === "profissional" && pathname !== "/perfil-profissional") {
    return (
      <div className="pb-20 sm:pb-0">
        {children}
        <ProfissionalGlobalTabBar />
      </div>
    );
  }

  return <>{children}</>;
}
