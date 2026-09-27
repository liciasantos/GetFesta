"use client";

import { useActionState } from "react";
import { atualizarAparenciaEventoRsvp, type RsvpActionState } from "@/lib/actions/rsvp";
import { buttonClass } from "@/components/ui";
import ImageFieldUpload from "@/components/ImageFieldUpload";

const COR_PADRAO = "#fbf5ee";

export default function AparenciaEventoRsvpForm({
  eventoRsvpId,
  corFundo,
  imagemCapa,
}: {
  eventoRsvpId: string;
  corFundo: string | null;
  imagemCapa: string | null;
}) {
  const [state, formAction, pending] = useActionState<RsvpActionState, FormData>(atualizarAparenciaEventoRsvp, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <p className="text-[12.5px] font-bold">Personalizar página de confirmação</p>
        <p className="mt-0.5 text-[11.5px] text-muted">
          Escolha uma cor de fundo e/ou uma foto da festa pra deixar o link que você compartilha com a sua cara.
        </p>
      </div>

      <ImageFieldUpload
        name="imagemCapa"
        initialUrl={imagemCapa}
        label="Imagem no topo da página (opcional)"
        targetWidth={1200}
        targetHeight={500}
        hint="ou arraste a imagem aqui — recomendado ~1200×500px, landscape"
      />

      <div>
        <label className="text-[12px] font-semibold text-muted">Cor de fundo (opcional)</label>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="color"
            name="corFundo"
            defaultValue={corFundo ?? COR_PADRAO}
            className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
          />
          <span className="text-[11.5px] text-muted-2">Aplicada no fundo da página que os convidados abrem</span>
        </div>
      </div>

      <input type="hidden" name="eventoRsvpId" value={eventoRsvpId} />
      {state?.error && <p className="text-[11.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${buttonClass("secondary", "sm")} self-start`}>
        {pending ? "Salvando..." : "Salvar aparência"}
      </button>
    </form>
  );
}
