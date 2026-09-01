"use client";

import { useActionState } from "react";
import { criarAdmin, type BannerActionState } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import PasswordInput from "@/components/PasswordInput";

export default function NovoAdminForm() {
  const [state, formAction, pending] = useActionState<BannerActionState, FormData>(criarAdmin, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">E-mail</label>
        <input name="email" type="email" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">Senha</label>
        <PasswordInput name="senha" required autoComplete="new-password" />
      </div>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : "Adicionar admin"}
      </button>
    </form>
  );
}
