"use client";

import { useActionState } from "react";
import { criarEventoRsvp, type RsvpActionState } from "@/lib/actions/rsvp";
import { buttonClass } from "@/components/ui";
import DateInputBR from "@/components/DateInputBR";

export default function NovoEventoRsvpForm() {
  const [state, formAction, pending] = useActionState<RsvpActionState, FormData>(criarEventoRsvp, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4">
      <p className="text-[12.5px] font-bold">Nova lista de convidados</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.6fr_1fr_auto]">
        <input
          name="titulo"
          required
          minLength={2}
          placeholder="Ex: Aniversário da Sofia"
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
        <DateInputBR name="dataEvento" required className="rounded-md border border-border px-3 py-2.5 text-sm" />
        <button type="submit" disabled={pending} className={buttonClass("primary", "md")}>
          {pending ? "Criando..." : "Criar lista"}
        </button>
      </div>
      {state?.error && <p className="text-[11.5px] font-semibold text-accent-dark">{state.error}</p>}
    </form>
  );
}
