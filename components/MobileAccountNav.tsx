"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import PainelMobileTabBar from "@/components/PainelMobileTabBar";
import ProfissionalGlobalTabBar from "@/components/ProfissionalGlobalTabBar";
import ClienteMobileTabBar from "@/components/painel/ClienteMobileTabBar";

/** Mantém a barra de navegação do rodapé (mobile) fixa em TODAS as páginas
 * enquanto empresa/profissional estiver logado - antes só aparecia dentro de
 * /painel (empresa) ou dentro da própria página de perfil (profissional).
 * Cliente tem a sua (Início/Convidados/Calculadora/Perfil). Some por completo
 * se deslogar (tipo null) - nunca aparece pra admin ou visitante. */
export default function MobileAccountNav({
  tipo,
  vagasBadge = 0,
  children,
}: {
  tipo: "cliente" | "empresa" | "profissional" | "admin" | null;
  vagasBadge?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();

  // modo foco: no formulário de pedido a barra sai (o botão "Continuar" ocupa
  // o rodapé e um toque sem querer não faz perder o que foi preenchido)
  if (pathname.startsWith("/publicar-pedido")) return <>{children}</>;

  if (tipo === "empresa") {
    return (
      <div className="pb-20 lg:pb-0">
        {children}
        <PainelMobileTabBar vagasBadge={vagasBadge} />
      </div>
    );
  }

  // /perfil-profissional já tem sua própria barra local (troca de aba sem
  // reload) - evita duas barras fixas sobrepostas na mesma tela.
  if (tipo === "profissional" && pathname !== "/perfil-profissional") {
    return (
      <div className="pb-20 lg:pb-0">
        {children}
        <ProfissionalGlobalTabBar vagasBadge={vagasBadge} />
      </div>
    );
  }

  if (tipo === "cliente") {
    return (
      <div className="pb-20 lg:pb-0">
        {children}
        <ClienteMobileTabBar />
      </div>
    );
  }

  return <>{children}</>;
}
