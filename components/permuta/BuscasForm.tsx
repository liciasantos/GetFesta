"use client";

import { useActionState } from "react";
import { salvarBuscas, type PermutaActionState } from "@/lib/actions/permuta";
import { buttonClass } from "@/components/ui";
import type { Categoria } from "@/lib/data/geo";

export default function BuscasForm({ categorias, selecionadas }: { categorias: Categoria[]; selecionadas: number[] }) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(salvarBuscas, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1.5 text-[12.5px] font-semibold has-[:checked]:border-info has-[:checked]:bg-info-soft has-[:checked]:text-info-dark"
          >
            <input type="checkbox" name="categoriaIds" value={c.id} defaultChecked={selecionadas.includes(c.id)} className="sr-only" />
            {c.nome}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Salvando..." : "Salvar o que busco"}
        </button>
        {state?.ok && <span className="text-[12px] font-semibold text-ok">Salvo!</span>}
        {state?.error && <span className="text-[12px] font-semibold text-danger-dark">{state.error}</span>}
      </div>
    </form>
  );
}
