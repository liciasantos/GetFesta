"use client";

import { useActionState } from "react";
import { completarCpf } from "@/lib/actions/cpf";
import { buttonClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

export default function CompletarCpfForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(completarCpf, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">CPF</label>
        <input name="cpf" required placeholder="000.000.000-00" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </div>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : "Confirmar e continuar"}
      </button>
    </form>
  );
}
