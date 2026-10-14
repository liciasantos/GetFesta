import type { ReactNode } from "react";
import PainelSidebar from "@/components/painel/PainelSidebar";
import { getSession } from "@/lib/auth";
import { getVagasBadgeCount } from "@/lib/data/vagas";
import WhatsAppConvite from "@/components/WhatsAppConvite";

/** Casca do painel da empresa - adiciona a sidebar de navegação, só visível
 * em telas grandes (`lg:`). Sem `mx-auto`/`max-w`/padding aqui de propósito:
 * cada página do painel já tem seu próprio container de largura/margem, que
 * passa a centralizar dentro do espaço que sobra ao lado da sidebar - assim
 * não precisa mexer em nenhuma página existente por causa dela. No mobile a
 * navegação continua sendo só o rodapé fixo global (ver
 * components/MobileAccountNav.tsx), que não muda em nada aqui. */
export default async function PainelLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const vagasBadge = session?.tipo === "empresa" ? await getVagasBadgeCount("empresa", session.usuarioId) : 0;
  return (
    <div className="lg:flex lg:items-start lg:gap-6 lg:pl-6 lg:pt-8">
      <PainelSidebar vagasBadge={vagasBadge} />
      <div className="min-w-0 flex-1">{children}</div>
      {session?.tipo === "empresa" && (
        <WhatsAppConvite usuarioId={session.usuarioId} tipo="empresa" perfilHref="/painel/perfil#whatsapp" />
      )}
    </div>
  );
}
