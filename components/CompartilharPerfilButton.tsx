"use client";

import { buttonClass } from "@/components/ui";

/** Mesmo padrão de compartilhamento do CompartilharVagaButton, só que pro
 * link do perfil público da própria empresa (usado no "Acesso rápido" do
 * painel) - duplica a lógica em vez de generalizar um componente genérico
 * porque são só ~15 linhas e os dois têm mensagens/parâmetros diferentes. */
export default function CompartilharPerfilButton({ empresaSlug, nomeFantasia }: { empresaSlug: string; nomeFantasia: string }) {
  async function compartilhar() {
    const url = `${window.location.origin}/empresa/${empresaSlug}`;
    const texto = `Conheça a ${nomeFantasia} na GetFesta:\n\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: texto, url });
        return;
      } catch {
        return;
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={compartilhar} className={`${buttonClass("secondary", "sm")} w-full justify-start`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
        <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
      </svg>
      Compartilhar meu perfil
    </button>
  );
}
