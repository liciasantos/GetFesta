"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { registrarProfissional, type ActionState } from "@/lib/actions/auth";
import { getBairrosAction, criarBairroCustomAction } from "@/lib/actions/geo";
import { buttonClass } from "@/components/ui";
import AceiteTermosCheckbox from "@/components/AceiteTermosCheckbox";
import type { Cidade, Bairro } from "@/lib/data/geo";
import { ESTADOS } from "@/lib/estados";
import type { CategoriaProfissional } from "@/lib/data/profissionais";

const BAIRRO_OUTRO = "outro";

export default function RegistroProfissionalForm({
  cidades,
  categorias,
}: {
  cidades: Cidade[];
  categorias: CategoriaProfissional[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registrarProfissional, undefined);
  const [estado, setEstado] = useState("");
  const [cidadeId, setCidadeId] = useState<number | "">("");
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [bairroSel, setBairroSel] = useState<number | "" | typeof BAIRRO_OUTRO>("");
  const [bairroCustomNome, setBairroCustomNome] = useState("");
  const [, startTransition] = useTransition();
  const cidadesDoEstado = cidades.filter((c) => c.estado === estado);

  function handleEstadoChange(value: string) {
    setEstado(value);
    setCidadeId("");
    setBairros([]);
    setBairroSel("");
  }

  useEffect(() => {
    if (!cidadeId) return;
    getBairrosAction(Number(cidadeId)).then(setBairros);
  }, [cidadeId]);

  function handleCidadeChange(value: string) {
    setCidadeId(value ? Number(value) : "");
    setBairros([]);
  }

  async function handleSubmit(formData: FormData) {
    if (bairroSel === BAIRRO_OUTRO && cidadeId && bairroCustomNome.trim().length >= 2) {
      const bairro = await criarBairroCustomAction(Number(cidadeId), bairroCustomNome.trim());
      if (bairro) formData.set("bairroId", String(bairro.id));
    } else if (bairroSel !== BAIRRO_OUTRO) {
      formData.set("bairroId", String(bairroSel));
    }
    startTransition(() => formAction(formData));
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Field label="Nome">
        <input name="nome" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="E-mail">
        <input name="email" type="email" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Telefone (WhatsApp)">
        <input name="telefone" required placeholder="(21) 99999-9999" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>

      <Field label="Estado">
        <select
          value={estado}
          onChange={(e) => handleEstadoChange(e.target.value)}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        >
          <option value="">Selecione</option>
          {ESTADOS.map((e) => (
            <option key={e.sigla} value={e.sigla}>
              {e.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Cidade">
        <select
          value={cidadeId}
          onChange={(e) => handleCidadeChange(e.target.value)}
          disabled={!estado}
          className="rounded-md border border-border px-3 py-2.5 text-sm disabled:opacity-50"
        >
          <option value="">{estado ? "Selecione" : "Escolha o estado primeiro"}</option>
          {cidadesDoEstado.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Bairro">
        <select
          value={bairroSel}
          onChange={(e) => setBairroSel(e.target.value === BAIRRO_OUTRO ? BAIRRO_OUTRO : e.target.value ? Number(e.target.value) : "")}
          required
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        >
          <option value="" disabled>
            {bairros.length ? "Selecione" : "Escolha a cidade primeiro"}
          </option>
          {bairros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
          <option value={BAIRRO_OUTRO}>Outro (não está na lista)</option>
        </select>
        {bairroSel === BAIRRO_OUTRO && (
          <input
            value={bairroCustomNome}
            onChange={(e) => setBairroCustomNome(e.target.value)}
            placeholder="Digite o nome do bairro"
            required
            className="mt-2 rounded-md border border-border px-3 py-2.5 text-sm"
          />
        )}
      </Field>

      <Field label="Funções (selecione uma ou mais)">
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

      <label className="flex items-start gap-2 text-[11.5px] text-muted">
        <input type="checkbox" name="consentimento" required className="mt-0.5" />
        Autorizo o uso dos meus dados de cadastro (incluindo medidas, quando informadas) para fins de caracterização de
        personagem e contato por empresas na GetFesta, conforme a Política de Privacidade.
      </label>
      <AceiteTermosCheckbox />

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Criando catálogo..." : "Criar meu catálogo profissional"}
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
