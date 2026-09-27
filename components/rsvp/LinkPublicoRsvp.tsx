"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { SITE_URL } from "@/lib/site-url";

export default function LinkPublicoRsvp({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${SITE_URL}/rsvp/${slug}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (ex: http sem permissão) - o link já aparece
      // selecionável na tela, então o usuário ainda consegue copiar na mão.
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="min-w-0">
        <p className="text-[12.5px] font-bold">Link de confirmação de presença</p>
        <p className="truncate text-[12px] text-accent-dark">{url}</p>
      </div>
      <button type="button" onClick={copiar} className={buttonClass("secondary", "sm")}>
        {copiado ? "Copiado! ✓" : "Copiar link"}
      </button>
    </div>
  );
}
