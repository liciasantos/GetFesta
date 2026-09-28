"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { alternarOfertaAtiva, salvarOferta, type PermutaActionState } from "@/lib/actions/permuta";
import { buttonClass } from "@/components/ui";
import type { Categoria } from "@/lib/data/geo";
import type { OfertaPermuta } from "@/lib/data/permuta";

export default function OfertasManager({ ofertas, categorias }: { ofertas: OfertaPermuta[]; categorias: Categoria[] }) {
  const [editando, setEditando] = useState<OfertaPermuta | "nova" | null>(ofertas.length === 0 ? "nova" : null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {ofertas.map((o) => (
        <div
          key={o.id}
          className={`flex flex-wrap items-center gap-3 rounded-lg border p-3.5 ${o.ativa ? "border-border" : "border-dashed border-border opacity-60"}`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold">{o.titulo}</div>
            <div className="text-[12.5px] text-muted">
              {o.categoria_nome ?? "Sem categoria"} ·{" "}
              {o.valor_referencia.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
              {!o.ativa && " · pausada"}
            </div>
          </div>
          <button type="button" onClick={() => setEditando(o)} className={buttonClass("secondary", "sm")}>
            Editar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => void (await alternarOfertaAtiva(o.id)))}
            className={buttonClass("ghost", "sm")}
          >
            {o.ativa ? "Pausar" : "Reativar"}
          </button>
        </div>
      ))}

      {editando ? (
        <OfertaForm
          key={editando === "nova" ? "nova" : editando.id}
          oferta={editando === "nova" ? null : editando}
          categorias={categorias}
          onDone={() => setEditando(null)}
        />
      ) : (
        <button type="button" onClick={() => setEditando("nova")} className={`${buttonClass("ghost")} self-start`}>
          + Adicionar oferta
        </button>
      )}
    </div>
  );
}

function OfertaForm({
  oferta,
  categorias,
  onDone,
}: {
  oferta: OfertaPermuta | null;
  categorias: Categoria[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(salvarOferta, undefined);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-accent-soft-2 bg-bg p-4">
      {oferta && <input type="hidden" name="id" value={oferta.id} />}
      <label className="text-[12px] font-bold">
        Serviço que você oferece
        <input
          name="titulo"
          required
          defaultValue={oferta?.titulo ?? ""}
          placeholder='Ex: "Personagem vivo por 2 h", "Buffet infantil para 60 pessoas"'
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-[12px] font-bold">
          Categoria
          <select
            name="categoriaId"
            defaultValue={oferta?.categoria_id ?? ""}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal"
          >
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px] font-bold">
          Preço normal deste serviço (R$)
          <input
            name="valor"
            required
            inputMode="decimal"
            defaultValue={oferta ? String(oferta.valor_referencia) : ""}
            placeholder="Ex: 800"
            aria-describedby="ajuda-valor"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal"
          />
        </label>
      </div>
      <p id="ajuda-valor" className="-mt-1 rounded-md bg-surface-alt px-3 py-2 text-[12px] leading-relaxed text-muted">
        Quanto um cliente pagaria por <b className="text-text">exatamente este serviço</b>, do jeito que está descrito —
        não é o valor total da troca. Na hora da proposta o site compara o seu preço com o do serviço que você vai
        receber e mostra se a troca está equilibrada.
      </p>
      <label className="text-[12px] font-bold">
        O que está incluso (opcional)
        <textarea
          name="descricao"
          rows={3}
          defaultValue={oferta?.descricao ?? ""}
          placeholder="Duração, quantidade de pessoas, equipe, material..."
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal"
        />
      </label>
      {state?.error && <p className="text-[12px] font-semibold text-danger-dark">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Salvando..." : oferta ? "Salvar alterações" : "Adicionar"}
        </button>
        <button type="button" onClick={onDone} className={buttonClass("secondary", "sm")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
