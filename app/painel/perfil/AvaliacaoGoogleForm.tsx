"use client";

import { useActionState, useTransition } from "react";
import { salvarAvaliacaoGoogle, removerAvaliacaoGoogle, type PerfilActionState } from "@/lib/actions/perfil";
import { buttonClass } from "@/components/ui";
import type { AvaliacaoGoogle } from "@/lib/data/empresas";

export default function AvaliacaoGoogleForm({ avaliacao }: { avaliacao: AvaliacaoGoogle | null }) {
  const [state, formAction, pending] = useActionState<PerfilActionState, FormData>(salvarAvaliacaoGoogle, undefined);
  const [removendo, startRemover] = useTransition();

  return (
    <div>
      <p className="mb-3 text-[12px] leading-relaxed text-muted">
        Como a GetFesta é nova, importe sua nota do Google Meu Negócio pra mostrar prova social enquanto você ainda
        não tem avaliações nativas na plataforma. Ela aparece com o selo <b>&quot;Nota no Google&quot;</b> e some
        automaticamente assim que você acumular avaliações próprias aqui.
      </p>

      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[12px] font-semibold text-muted">
            Nota média (0 a 5)
            <input
              type="number"
              name="notaMediaGoogle"
              min={0}
              max={5}
              step={0.1}
              defaultValue={avaliacao?.notaMediaGoogle ?? ""}
              required
              className="mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm"
            />
          </label>
          <label className="text-[12px] font-semibold text-muted">
            Total de avaliações
            <input
              type="number"
              name="totalAvaliacoesGoogle"
              min={0}
              step={1}
              defaultValue={avaliacao?.totalAvaliacoesGoogle ?? ""}
              required
              className="mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm"
            />
          </label>
        </div>

        <label className="text-[12px] font-semibold text-muted">
          Link do seu perfil no Google (Maps ou Google Meu Negócio)
          <input
            type="url"
            name="urlPerfilGoogle"
            placeholder="https://www.google.com/maps/place/..."
            defaultValue={avaliacao?.urlPerfilGoogle ?? ""}
            required
            className="mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm"
          />
        </label>

        {state?.error && <p className="text-[12px] text-danger-dark">{state.error}</p>}
        {state?.success && <p className="text-[12px] text-ok">Nota do Google salva com sucesso!</p>}

        <div className="mt-1 flex flex-wrap gap-2.5">
          <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
            {pending ? "Salvando..." : avaliacao ? "Atualizar nota" : "Importar nota do Google"}
          </button>
          {avaliacao && (
            <button
              type="button"
              disabled={removendo}
              onClick={() =>
                startRemover(async () => {
                  await removerAvaliacaoGoogle();
                })
              }
              className={buttonClass("ghost", "sm")}
            >
              {removendo ? "Removendo..." : "Remover"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
