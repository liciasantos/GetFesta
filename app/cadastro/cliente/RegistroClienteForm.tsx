"use client";

import { useActionState } from "react";
import { registrarCliente, type ActionState } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";
import type { Cidade } from "@/lib/data/geo";

export default function RegistroClienteForm({ cidades }: { cidades: Cidade[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registrarCliente, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Nome"><input name="nome" required className="rounded-md border border-border px-3 py-2.5 text-sm" /></Field>
      <Field label="E-mail"><input name="email" type="email" required className="rounded-md border border-border px-3 py-2.5 text-sm" /></Field>
      <Field label="Telefone"><input name="telefone" required placeholder="(21) 99999-9999" className="rounded-md border border-border px-3 py-2.5 text-sm" /></Field>
      <Field label="Cidade">
        <select name="cidadeId" className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="">Selecione (opcional)</option>
          {cidades.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </Field>
      <Field label="Senha"><input name="senha" type="password" required minLength={6} className="rounded-md border border-border px-3 py-2.5 text-sm" /></Field>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Criando conta..." : "Criar minha conta"}
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
