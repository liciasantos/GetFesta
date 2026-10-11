"use client";

import { useActionState, useState } from "react";
import { criarEventoRsvp, type RsvpActionState } from "@/lib/actions/rsvp";
import { buttonClass } from "@/components/ui";
import { Icon } from "@/components/Icon";
import DateInputBR from "@/components/DateInputBR";

/** Criar lista de convidados. Com listas já existentes fica recolhido num
 * botão "Nova lista" (o foco da página passa a ser as listas); na primeira
 * vez (`destaque`) já vem aberto. */
export default function NovoEventoRsvpForm({ destaque = false }: { destaque?: boolean }) {
  const [state, formAction, pending] = useActionState<RsvpActionState, FormData>(criarEventoRsvp, undefined);
  const [aberto, setAberto] = useState(destaque);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className={buttonClass("primary", "md")}>
        <Icon name="plus" className="h-4 w-4" /> Nova lista de convidados
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-[15px] font-bold">{destaque ? "Crie sua primeira lista" : "Nova lista de convidados"}</p>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-[1.6fr_1fr_auto]">
        <label className="flex flex-col gap-1 text-[11px] font-bold uppercase text-muted">
          Nome da festa
          <input
            name="titulo"
            required
            minLength={2}
            placeholder="Ex: Aniversário da Sofia"
            className="rounded-lg border border-border px-3 py-2.5 text-base font-normal normal-case text-text sm:text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold uppercase text-muted">
          Data
          <DateInputBR
            name="dataEvento"
            required
            className="rounded-lg border border-border px-3 py-2.5 text-base font-normal normal-case text-text sm:text-sm"
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={pending} className={`${buttonClass("primary", "md")} flex-1 sm:flex-none`}>
            {pending ? "Criando..." : "Criar lista"}
          </button>
          {!destaque && (
            <button type="button" onClick={() => setAberto(false)} className={buttonClass("secondary", "md")}>
              Cancelar
            </button>
          )}
        </div>
      </div>
      {state?.error && <p className="mt-2 text-[12px] font-semibold text-accent-dark">{state.error}</p>}
    </form>
  );
}
