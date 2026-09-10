"use client";

import { buttonClass } from "@/components/ui";

export default function CompartilharVagaButton({
  vagaId,
  mensagem,
  variant = "secondary",
}: {
  vagaId: string;
  mensagem: string;
  variant?: "primary" | "secondary";
}) {
  async function compartilhar() {
    const url = `${window.location.origin}/vaga/${vagaId}`;
    const texto = `${mensagem}\n\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: texto, url });
        return;
      } catch {
        // usuário cancelou o compartilhamento nativo - não faz nada
        return;
      }
    }

    // sem suporte a compartilhamento nativo (a maioria dos desktops) -
    // abre direto o WhatsApp com a mensagem pronta (wa.me sem número deixa
    // a pessoa escolher com quem falar, ver https://faq.whatsapp.com).
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={compartilhar} className={buttonClass(variant, "sm")}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
      Compartilhar vaga
    </button>
  );
}
