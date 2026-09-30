"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { retirarCandidatura } from "@/lib/actions/vagas";

/** "Retirar candidatura" do profissional. Se ele já foi selecionado, vira
 * "Desistir da vaga" com um aviso mais forte - a empresa é avisada e a vaga
 * reabre pra outros candidatos. */
export default function RetirarCandidaturaButton({ vagaId, selecionado }: { vagaId: string; selecionado: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function retirar() {
    const msg = selecionado
      ? "Desistir desta vaga? A empresa já tinha escolhido você: ela será avisada por e-mail, a vaga volta a ficar aberta para outros candidatos e o horário é liberado na sua agenda."
      : "Retirar sua candidatura desta vaga? A empresa deixa de ver você entre os candidatos. Você pode se candidatar de novo enquanto a vaga estiver aberta.";
    if (!window.confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      const res = await retirarCandidatura(vagaId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={isPending}
        onClick={retirar}
        className="text-[11.5px] font-bold text-muted underline hover:text-danger-dark disabled:opacity-50"
      >
        {isPending ? "Retirando..." : selecionado ? "Desistir da vaga" : "Retirar candidatura"}
      </button>
      {error && <p className="mt-1 text-[11px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}
