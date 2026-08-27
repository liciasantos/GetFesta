"use client";

import { useActionState } from "react";
import { criarBanner, type BannerActionState } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import type { Categoria } from "@/lib/data/geo";
import type { EmpresaOption } from "@/lib/data/admin";

export default function NovoBannerForm({ categorias, empresas }: { categorias: Categoria[]; empresas: EmpresaOption[] }) {
  const [state, formAction, pending] = useActionState<BannerActionState, FormData>(criarBanner, undefined);
  const hoje = new Date().toISOString().slice(0, 10);
  const em30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Empresa anunciante">
        <select name="empresaId" required defaultValue="" className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="" disabled>
            Selecione
          </option>
          {empresas.map((e) => (
            <option key={e.usuario_id} value={e.usuario_id}>
              {e.nome_fantasia}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Categoria do banner">
        <select name="categoriaId" required defaultValue="" className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="" disabled>
            Selecione
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Início">
          <input name="inicioEm" type="date" required defaultValue={hoje} className="rounded-md border border-border px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Término">
          <input name="fimEm" type="date" required defaultValue={em30Dias} className="rounded-md border border-border px-3 py-2.5 text-sm" />
        </Field>
      </div>

      <Field label="Valor pago (R$)">
        <input name="valorPago" type="number" min={0} step="0.01" required defaultValue="500" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : "Incluir anúncio"}
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
