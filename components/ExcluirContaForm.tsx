"use client";

import { useActionState, useState } from "react";
import { buttonClass } from "@/components/ui";
import type { ExcluirContaState } from "@/lib/actions/conta";

export default function ExcluirContaForm({
  action,
  aviso,
}: {
  action: (prevState: ExcluirContaState, formData: FormData) => Promise<ExcluirContaState>;
  aviso: string;
}) {
  const [state, formAction, pending] = useActionState<ExcluirContaState, FormData>(action, undefined);
  const [confirmacao, setConfirmacao] = useState("");
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className={buttonClass("danger", "sm")}>
        Excluir minha conta
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-[12.5px] leading-relaxed text-muted">{aviso}</p>
      <p className="text-[12.5px] font-semibold text-text">
        Para confirmar, digite <span className="font-mono font-extrabold text-danger-dark">EXCLUIR</span> abaixo:
      </p>
      <input
        name="confirmacao"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        autoComplete="off"
        className="rounded-md border border-border px-3 py-2.5 text-sm"
      />
      {state?.error && <p className="text-[12.5px] font-semibold text-danger-dark">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || confirmacao !== "EXCLUIR"}
          className={buttonClass("danger", "sm")}
        >
          {pending ? "Excluindo..." : "Confirmar exclusão definitiva"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setConfirmacao("");
          }}
          className={buttonClass("secondary", "sm")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
