"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { atualizarPerfilProfissional, type PerfilActionState } from "@/lib/actions/perfil";
import { getBairrosAction, criarBairroCustomAction } from "@/lib/actions/geo";
import { buttonClass } from "@/components/ui";
import type { Cidade, Bairro } from "@/lib/data/geo";
import type { CategoriaProfissional, PerfilProfissional } from "@/lib/data/profissionais";

const DISPONIBILIDADE_OPCOES: Array<{ value: "disponivel" | "indisponivel" | "nao_informado"; label: string }> = [
  { value: "disponivel", label: "Disponível" },
  { value: "indisponivel", label: "Indisponível" },
  { value: "nao_informado", label: "Não informar" },
];

const SEXO_OPCOES: Array<{ value: string; label: string }> = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "nao_binario", label: "Não binário" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" },
];

const BAIRRO_OUTRO = "outro";

export default function PerfilProfissionalForm({
  perfil,
  categorias,
  cidades,
}: {
  perfil: PerfilProfissional;
  categorias: CategoriaProfissional[];
  cidades: Cidade[];
}) {
  const [state, formAction, pending] = useActionState<PerfilActionState, FormData>(atualizarPerfilProfissional, undefined);
  const [cidadeId, setCidadeId] = useState<number | "">(perfil.cidade_id ?? "");
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [bairroSel, setBairroSel] = useState<number | "" | typeof BAIRRO_OUTRO>(perfil.bairro_id ?? "");
  const [bairroCustomNome, setBairroCustomNome] = useState("");
  const [medidasHabilitadas, setMedidasHabilitadas] = useState(perfil.medidas_habilitadas);
  const [, startTransition] = useTransition();
  const categoriasSelecionadas = new Set(perfil.categorias.map((c) => c.id));

  useEffect(() => {
    if (!cidadeId) {
      setBairros([]);
      return;
    }
    getBairrosAction(Number(cidadeId)).then(setBairros);
  }, [cidadeId]);

  async function handleSubmit(formData: FormData) {
    if (bairroSel === BAIRRO_OUTRO && cidadeId && bairroCustomNome.trim().length >= 2) {
      const bairro = await criarBairroCustomAction(Number(cidadeId), bairroCustomNome.trim());
      if (bairro) formData.set("bairroId", String(bairro.id));
      else formData.delete("bairroId");
    } else {
      formData.set("bairroId", bairroSel === BAIRRO_OUTRO ? "" : String(bairroSel));
    }
    startTransition(() => formAction(formData));
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Field label="Nome">
        <input name="nome" defaultValue={perfil.nome} required className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>

      <Field label="Sexo">
        <select name="sexo" defaultValue={perfil.sexo ?? ""} className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="">Prefiro não informar</option>
          {SEXO_OPCOES.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Cidade">
        <select
          value={cidadeId}
          onChange={(e) => setCidadeId(e.target.value ? Number(e.target.value) : "")}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        >
          <option value="">Selecione</option>
          {cidades.map((c) => (
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
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        >
          <option value="">{bairros.length ? "Selecione" : "Escolha a cidade primeiro"}</option>
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
            className="mt-2 rounded-md border border-border px-3 py-2.5 text-sm"
          />
        )}
      </Field>

      <Field label="Disponibilidade">
        <div className="flex gap-2">
          {DISPONIBILIDADE_OPCOES.map((op) => (
            <label
              key={op.value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border px-2 py-2 text-[12.5px] font-semibold has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-dark"
            >
              <input
                type="radio"
                name="disponibilidadeStatus"
                value={op.value}
                defaultChecked={perfil.disponibilidade_status === op.value}
                className="hidden"
              />
              {op.label}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Funções (selecione uma ou mais)">
        <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border p-2.5">
          {categorias.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-[12.5px]">
              <input type="checkbox" name="categoriaIds" value={c.id} defaultChecked={categoriasSelecionadas.has(c.id)} />
              {c.nome}
            </label>
          ))}
        </div>
      </Field>

      <div className="rounded-md border border-border p-2.5">
        <label className="flex items-center gap-1.5 text-[12.5px] font-semibold">
          <input
            type="checkbox"
            name="medidasHabilitadas"
            checked={medidasHabilitadas}
            onChange={(e) => setMedidasHabilitadas(e.target.checked)}
          />
          Habilitar medidas (uso opcional para ator/cosplayer — empresas costumam pedir)
        </label>
        {medidasHabilitadas && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Field label="Altura (cm)">
              <input name="alturaCm" type="number" min={0} defaultValue={perfil.altura_cm ?? ""} className="rounded-md border border-border px-3 py-2 text-sm" />
            </Field>
            <Field label="Peso (kg)">
              <input name="pesoKg" type="number" min={0} defaultValue={perfil.peso_kg ?? ""} className="rounded-md border border-border px-3 py-2 text-sm" />
            </Field>
            <Field label="Cintura (cm)">
              <input name="cinturaCm" type="number" min={0} defaultValue={perfil.cintura_cm ?? ""} className="rounded-md border border-border px-3 py-2 text-sm" />
            </Field>
            <Field label="Manequim">
              <input name="manequim" defaultValue={perfil.manequim ?? ""} placeholder="Ex: 40" className="rounded-md border border-border px-3 py-2 text-sm" />
            </Field>
            <Field label="Calçado">
              <input name="calcado" defaultValue={perfil.calcado ?? ""} placeholder="Ex: 38" className="rounded-md border border-border px-3 py-2 text-sm" />
            </Field>
          </div>
        )}
      </div>

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
