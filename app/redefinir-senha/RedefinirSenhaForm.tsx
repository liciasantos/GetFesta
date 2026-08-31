"use client";

import { useActionState } from "react";
import Link from "next/link";
import { redefinirSenha, type ActionState } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";

export default function RedefinirSenhaForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(redefinirSenha, undefined);

  if (state?.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-ok/30 bg-ok-soft p-3 text-[13px] text-ok">
          Senha redefinida com sucesso ✓
        </p>
        <Link href="/entrar" className={buttonClass("primary")}>
          Entrar com a nova senha
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">Nova senha</label>
        <input
          name="novaSenha"
          type="password"
          required
          minLength={6}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold uppercase text-muted-2">Confirmar nova senha</label>
        <input
          name="confirmarSenha"
          type="password"
          required
          minLength={6}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </div>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}
