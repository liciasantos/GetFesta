"use client";

import { useActionState } from "react";
import { login, type ActionState } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">E-mail</label>
        <input name="email" type="email" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">Senha</label>
        <input name="senha" type="password" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </div>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-[11.5px] text-muted">
        Demo: cliente@teste.com / teste123 · empresa: casadefestaslua@teste.com / teste123
      </p>
    </form>
  );
}
