"use client";

import { useActionState, useState, useTransition } from "react";
import { ativarParticipacao, pausarParticipacao, reativarParticipacao, type PermutaActionState } from "@/lib/actions/permuta";
import { buttonClass } from "@/components/ui";

export function AtivarParticipacaoForm() {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(ativarParticipacao, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex items-start gap-2 text-[13px] leading-relaxed">
        <input type="checkbox" name="aceite" className="mt-1" />
        <span>
          Li e concordo com as regras da rede: cumprir as entregas combinadas nos acordos, confirmar e avaliar cada evento
          e manter a conversa pela plataforma até as duas assinaturas.
        </span>
      </label>
      {state?.error && <p className="text-[12.5px] font-semibold text-danger-dark">{state.error}</p>}
      <button disabled={pending} className={`${buttonClass("primary", "lg")} self-start`}>
        {pending ? "Ativando..." : "Quero participar da rede de permutas"}
      </button>
    </form>
  );
}

export function PausarParticipacao({ ativa }: { ativa: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  if (!ativa) {
    return (
      <button
        disabled={pending}
        onClick={() => startTransition(async () => void (await reativarParticipacao()))}
        className={buttonClass("primary", "sm")}
      >
        Reativar participação
      </button>
    );
  }
  return confirmando ? (
    <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
      <span>Sua empresa sai da vitrine e não recebe novas propostas. Acordos em andamento continuam.</span>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => void (await pausarParticipacao()))}
        className={buttonClass("danger", "sm")}
      >
        Pausar
      </button>
      <button onClick={() => setConfirmando(false)} className={buttonClass("secondary", "sm")}>
        Voltar
      </button>
    </div>
  ) : (
    <button onClick={() => setConfirmando(true)} className={buttonClass("secondary", "sm")}>
      Pausar participação
    </button>
  );
}
