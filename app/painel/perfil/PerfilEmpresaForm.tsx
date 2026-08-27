"use client";

import { useActionState } from "react";
import { atualizarPerfilEmpresa, type PerfilActionState } from "@/lib/actions/perfil";
import { buttonClass } from "@/components/ui";
import type { EmpresaPerfil } from "@/lib/data/empresas";

export default function PerfilEmpresaForm({ empresa }: { empresa: EmpresaPerfil }) {
  const [state, formAction, pending] = useActionState<PerfilActionState, FormData>(atualizarPerfilEmpresa, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Descrição">
        <textarea
          name="descricao"
          defaultValue={empresa.descricao ?? ""}
          rows={4}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Capacidade de convidados">
          <input
            name="capacidadeConvidados"
            type="number"
            min={0}
            defaultValue={empresa.capacidade_convidados ?? ""}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Preço a partir de (R$)">
          <input
            name="precoAPartirDe"
            type="number"
            min={0}
            step="0.01"
            defaultValue={empresa.preco_a_partir_de ?? ""}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
      </div>
      <Field label="Telefone de contato (WhatsApp)">
        <input
          name="telefoneContato"
          required
          defaultValue={empresa.telefone_contato ?? ""}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>
      <Field label="Instagram">
        <input
          name="instagram"
          defaultValue={empresa.instagram ?? ""}
          placeholder="@suaempresa"
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      {state?.success && <p className="text-[12.5px] font-semibold text-ok">Perfil atualizado.</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : "Salvar alterações"}
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
