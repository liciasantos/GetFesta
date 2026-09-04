"use client";

import { useState } from "react";
import { useActionState } from "react";
import { criarEmpresaManual } from "@/lib/actions/admin";
import type { BannerActionState } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import type { Cidade, Categoria } from "@/lib/data/geo";
import { ESTADOS } from "@/lib/estados";

export default function NovaEmpresaForm({ cidades, categorias }: { cidades: Cidade[]; categorias: Categoria[] }) {
  const [state, formAction, pending] = useActionState<BannerActionState, FormData>(criarEmpresaManual, undefined);
  const [estado, setEstado] = useState("");
  const [cidadeId, setCidadeId] = useState("");
  const cidadesDoEstado = cidades.filter((c) => c.estado === estado);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Nome fantasia">
        <input name="nomeFantasia" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Razão social">
        <input name="razaoSocial" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="CNPJ">
        <input name="cnpj" required placeholder="00.000.000/0000-00" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="E-mail (login da empresa)">
        <input name="email" type="email" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Senha (login da empresa)">
        <input name="senha" type="password" required minLength={6} className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <p className="-mt-2 text-[11px] text-muted">
        Repasse esse e-mail e senha pra empresa entrar e editar o próprio perfil (fotos, descrição, etc.) em{" "}
        <code className="rounded bg-surface-alt px-1">/entrar</code>.
      </p>
      <Field label="Telefone de contato (WhatsApp)">
        <input name="telefoneContato" required placeholder="(21) 99999-9999" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Instagram (opcional)">
        <input name="instagram" placeholder="@empresa" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Estado de atuação">
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setCidadeId("");
          }}
          required
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        >
          <option value="" disabled>
            Selecione
          </option>
          {ESTADOS.map((e) => (
            <option key={e.sigla} value={e.sigla}>
              {e.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Cidade principal de atuação">
        <select
          name="cidadeId"
          value={cidadeId}
          onChange={(e) => setCidadeId(e.target.value)}
          required
          disabled={!estado}
          className="rounded-md border border-border px-3 py-2.5 text-sm disabled:opacity-50"
        >
          <option value="" disabled>
            {estado ? "Selecione" : "Escolha o estado primeiro"}
          </option>
          {cidadesDoEstado.map((c) => (
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

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Cadastrando..." : "Cadastrar empresa"}
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
