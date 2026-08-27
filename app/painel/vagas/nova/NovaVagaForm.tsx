"use client";

import { useActionState, useEffect, useState } from "react";
import { criarVaga, type VagaActionState } from "@/lib/actions/vagas";
import { getBairrosAction } from "@/lib/actions/geo";
import { buttonClass } from "@/components/ui";
import type { Cidade, Bairro } from "@/lib/data/geo";
import type { CategoriaProfissional } from "@/lib/data/profissionais";

export default function NovaVagaForm({ cidades, categorias }: { cidades: Cidade[]; categorias: CategoriaProfissional[] }) {
  const [state, formAction, pending] = useActionState<VagaActionState, FormData>(criarVaga, undefined);
  const [cidadeId, setCidadeId] = useState<number | "">("");
  const [bairros, setBairros] = useState<Bairro[]>([]);

  useEffect(() => {
    if (!cidadeId) {
      setBairros([]);
      return;
    }
    getBairrosAction(Number(cidadeId)).then(setBairros);
  }, [cidadeId]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cidade do evento">
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
          {/* campo real submetido no form - o select acima só controla o estado local pra buscar bairros */}
          <input type="hidden" name="cidadeId" value={cidadeId} />
        </Field>
        <Field label="Bairro (opcional)">
          <select name="bairroId" defaultValue="" className="rounded-md border border-border px-3 py-2.5 text-sm">
            <option value="">{bairros.length ? "Selecione" : "Escolha a cidade primeiro"}</option>
            {bairros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </Field>
      </div>

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
