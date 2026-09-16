"use client";

import type { ReactNode } from "react";
import { registrarCliqueProdutoAction } from "@/lib/actions/produtos-afiliados";

/** Botão/link que sai pro Mercado Livre - registra o clique antes de abrir
 * (mesmo padrão do onClick em components/DestaquesGrid.tsx), sem bloquear a
 * navegação esperando a resposta. */
export default function LinkMercadoLivre({
  produtoId,
  href,
  className,
  children,
}: {
  produtoId: string;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      onClick={() => void registrarCliqueProdutoAction(produtoId)}
      className={className}
    >
      {children}
    </a>
  );
}
