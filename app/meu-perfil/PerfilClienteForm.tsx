"use client";

import { useActionState } from "react";
import { atualizarPerfilCliente, type PerfilActionState } from "@/lib/actions/perfil";
import { buttonClass } from "@/components/ui";
import type { Cidade } from "@/lib/data/geo";
import { ESTADOS } from "@/lib/estados";
import type { PerfilCliente } from "@/lib/data/clientes";

export default function PerfilClienteForm({ perfil, cidades }: { perfil: PerfilCliente; cidades: Cidade[] }) {
  const [state, formAction, pending] = useActionState<PerfilActionState, FormData>(atualizarPerfilCliente, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Nome">
        <input name="nome" defaultValue={perfil.nome} required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Cidade">
        <select name="cidadeId" defaultValue={perfil.cidade_id ?? ""} className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="">Selecione (opcional)</option>
          {ESTADOS.map((estado) => {
            const cidadesDoEstado = cidades.filter((c) => c.estado === estado.sigla);
            if (cidadesDoEstado.length === 0) return null;
            return (
              <optgroup key={estado.sigla} label={estado.nome}>
                {cidadesDoEstado.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
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
