"use client";

import { useActionState } from "react";
import { alterarSenhaPropria, type ActionState } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";

export default function AlterarSenhaForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(alterarSenhaPropria, undefined);

  return (
    <form
      action={formAction}
      key={state?.success ? "sucesso" : "form"}
      className="flex flex-col gap-3"
    >
      <Field label="Senha atual">
        <input name="senhaAtual" type="password" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Nova senha">
        <input
          name="senhaNova"
          type="password"
          required
          minLength={6}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Confirmar nova senha">
        <input
          name="confirmarSenha"
          type="password"
          required
          minLength={6}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      {state?.success && <p className="text-[12.5px] font-semibold text-ok">Senha alterada com sucesso ✓</p>}
      <button type="submit" disabled={pending} className={`${buttonClass("secondary", "sm")} self-start`}>
        {pending ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold uppercase text-muted-2">{label}</label>
      {children}
    </div>
  );
}
