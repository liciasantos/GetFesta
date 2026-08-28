"use client";

import { useActionState } from "react";
import { criarPlanoPeriodo, type BannerActionState } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import type { PlanoParaSelect } from "@/lib/data/admin";

export default function NovoPlanoPeriodoForm({ planos }: { planos: PlanoParaSelect[] }) {
  const [state, formAction, pending] = useActionState<BannerActionState, FormData>(criarPlanoPeriodo, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Plano">
        <select name="planoId" required defaultValue="" className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="" disabled>
            Selecione
          </option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Meses">
        <input name="meses" type="number" min={1} max={60} required defaultValue={3} className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>

      <Field label="Desconto (%)">
        <input
          name="descontoPct"
          type="number"
          min={0}
          max={100}
          step="0.01"
          required
          defaultValue={10}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : "Criar periodicidade"}
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
