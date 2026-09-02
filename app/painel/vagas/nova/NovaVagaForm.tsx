"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { criarVaga, type VagaActionState } from "@/lib/actions/vagas";
import { getBairrosAction, criarBairroCustomAction } from "@/lib/actions/geo";
import { buttonClass } from "@/components/ui";
import type { Cidade, Bairro } from "@/lib/data/geo";
import { ESTADOS } from "@/lib/estados";
import type { CategoriaProfissional } from "@/lib/data/profissionais";

const BAIRRO_OUTRO = "outro";

export default function NovaVagaForm({ cidades, categorias }: { cidades: Cidade[]; categorias: CategoriaProfissional[] }) {
  const [state, formAction, pending] = useActionState<VagaActionState, FormData>(criarVaga, undefined);
  const [estado, setEstado] = useState("");
  const [cidadeId, setCidadeId] = useState<number | "">("");
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [bairroSel, setBairroSel] = useState<number | "" | typeof BAIRRO_OUTRO>("");
  const [bairroCustomNome, setBairroCustomNome] = useState("");
  const [, startTransition] = useTransition();
  const cidadesDoEstado = cidades.filter((c) => c.estado === estado);

  useEffect(() => {
    if (!cidadeId) return;
    getBairrosAction(Number(cidadeId)).then(setBairros);
  }, [cidadeId]);

  function handleEstadoChange(value: string) {
    setEstado(value);
    setCidadeId("");
    setBairros([]);
    setBairroSel("");
  }

  function handleCidadeChange(value: string) {
    setCidadeId(value ? Number(value) : "");
    setBairros([]);
  }

  async function handleSubmit(formData: FormData) {
    if (bairroSel === BAIRRO_OUTRO && cidadeId && bairroCustomNome.trim().length >= 2) {
      const bairro = await criarBairroCustomAction(Number(cidadeId), bairroCustomNome.trim());
      formData.set("bairroId", bairro ? String(bairro.id) : "");
    } else {
      formData.set("bairroId", bairroSel === BAIRRO_OUTRO ? "" : String(bairroSel));
    }
    startTransition(() => formAction(formData));
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Field label="Função que você precisa">
        <select name="categoriaProfissionalId" required defaultValue="" className="rounded-md border border-border px-3 py-2.5 text-sm">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <Field label="Cidade do evento">
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
          {/* campo real submetido no form - o select acima só controla o estado local pra buscar bairros */}
          <input type="hidden" name="cidadeId" value={cidadeId} />
        </Field>
        <Field label="Bairro (opcional)">
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
      </div>

      <Field label="Gênero desejado pra vaga">
        <select name="sexoDesejado" defaultValue="indiferente" className="rounded-md border border-border px-3 py-2.5 text-sm">
          <option value="indiferente">Indiferente</option>
          <option value="feminino">Feminino</option>
          <option value="masculino">Masculino</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data do evento">
          <input name="dataEvento" type="date" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Horário de início">
          <input name="horaInicio" type="time" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duração (horas)">
          <input
            name="duracaoHoras"
            type="number"
            min={0.5}
            step={0.5}
            required
            placeholder="Ex: 3"
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Valor do job (R$)">
          <input
            name="valor"
            type="number"
            min={0}
            step="0.01"
            placeholder="Deixe em branco para combinar"
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
      </div>

      <Field label="Detalhes da vaga">
        <textarea
          name="descricao"
          rows={4}
          required
          minLength={10}
          placeholder="Ex: Festa infantil tema safári, precisamos de um ator caracterizado de leão, interação com crianças de 3 a 8 anos."
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Publicando..." : "Publicar vaga"}
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
