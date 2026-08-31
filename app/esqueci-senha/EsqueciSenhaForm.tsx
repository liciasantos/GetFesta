"use client";

import { useActionState } from "react";
import { solicitarResetSenha, type ActionState } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";

export default function EsqueciSenhaForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(solicitarResetSenha, undefined);

  if (state?.success) {
    return (
      <p className="rounded-lg border border-ok/30 bg-ok-soft p-3 text-[13px] text-ok">
        Se esse e-mail tiver uma conta na GetFesta, você vai receber um link pra redefinir a senha em instantes.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">E-mail</label>
        <input name="email" type="email" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </div>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Enviando..." : "Enviar link de redefinição"}
      </button>
    </form>
  );
}
