"use client";

import { registrarCliqueWhatsapp } from "@/lib/actions/pedidos";
import { buttonClass } from "@/components/ui";

export default function WhatsAppButton({
  empresaId,
  href,
  label = "Chamar no WhatsApp",
}: {
  empresaId: string;
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // dispara e nao espera - nao deve atrasar a navegacao para o WhatsApp
        void registrarCliqueWhatsapp(empresaId);
      }}
      className={buttonClass("primary")}
    >
      💬 {label}
    </a>
  );
}
