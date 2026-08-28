"use client";

import { useActionState } from "react";
import { registrarEmpresa, type ActionState } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";
import type { Cidade, Categoria } from "@/lib/data/geo";

export default function RegistroEmpresaForm({
  cidades,
  categorias,
  planoIntencao,
  mesesIntencao,
}: {
  cidades: Cidade[];
  categorias: Categoria[];
  planoIntencao?: number;
  mesesIntencao?: number;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registrarEmpresa, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {planoIntencao && <input type="hidden" name="planoIntencao" value={planoIntencao} />}
      {mesesIntencao && <input type="hidden" name="mesesIntencao" value={mesesIntencao} />}
      <Field label="Nome fantasia">
        <input name="nomeFantasia" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Razão social">
        <input name="razaoSocial" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="CNPJ">
        <input name="cnpj" required placeholder="00.000.000/0000-00" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <p className="-mt-2 text-[11px] text-muted">
        Cadastro de empresa exige pessoa jurídica — MEI já tem CNPJ próprio e gratuito de emitir.
      </p>
      <Field label="E-mail">
        <input name="email" type="email" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Telefone de contato (WhatsApp)">
        <input name="telefoneContato" required placeholder="(21) 99999-9999" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Instagram (opcional)">
        <input name="instagram" placeholder="@suaempresa" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Cidade principal de atuação">
        <select name="cidadeId" required defaultValue="" className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="" disabled>
            Selecione
          </option>
          {cidades.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Categorias de serviço">
        <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border p-2.5">
          {categorias.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-[12.5px]">
              <input type="checkbox" name="categoriaIds" value={c.id} />
              {c.nome}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Senha">
        <input name="senha" type="password" required minLength={6} className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Criando conta..." : "Quero receber pedidos de festa"}
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
