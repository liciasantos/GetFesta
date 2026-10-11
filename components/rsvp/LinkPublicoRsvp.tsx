"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { buttonClass } from "@/components/ui";
import { SITE_URL } from "@/lib/site-url";

/** Convite da festa: link de confirmação com copiar, envio pelo WhatsApp
 * (escolhe o contato ou grupo no próprio app) e prévia da página. */
export default function LinkPublicoRsvp({ slug, titulo }: { slug: string; titulo: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${SITE_URL}/rsvp/${slug}`;
  const mensagem = `Você está convidado(a) para ${titulo}! 🎉 Confirma sua presença aqui: ${url}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (http sem permissão) - o link continua visível pra copiar na mão
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-[15px] font-bold">Convide pelo WhatsApp</h2>
      <p className="mt-0.5 text-[13px] text-muted">Quem abrir o link confirma presença e diz quem vai junto — sem cadastro.</p>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass("whatsapp", "md")} mt-3.5 w-full`}
      >
        <Icon name="chat" className="h-4 w-4" /> Enviar convite no WhatsApp
      </a>

      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-border bg-surface-alt/50 p-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">{url.replace(/^https?:\/\//, "")}</span>
        <button type="button" onClick={copiar} className="flex shrink-0 items-center gap-1.5 rounded-md bg-surface px-2.5 py-1.5 text-[12px] font-bold shadow-sm hover:bg-surface-alt">
          <Icon name={copiado ? "check" : "copy"} className="h-3.5 w-3.5" />
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-accent-dark hover:underline">
        <Icon name="eye" className="h-3.5 w-3.5" /> Ver como o convidado vê
      </a>
    </section>
  );
}
