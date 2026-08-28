"use client";

import { useActionState, useState } from "react";
import { avaliarProfissional, type AvaliarProfissionalState } from "@/lib/actions/vagas";
import { buttonClass } from "@/components/ui";

export default function AvaliarProfissionalForm({
  vagaId,
  profissionalId,
  profissionalNome,
  avaliacaoAtual,
}: {
  vagaId: string;
  profissionalId: string;
  profissionalNome: string;
  avaliacaoAtual: { nota: number; comentario: string | null } | null;
}) {
  const [state, formAction, pending] = useActionState<AvaliarProfissionalState, FormData>(avaliarProfissional, undefined);
  const [nota, setNota] = useState(avaliacaoAtual?.nota ?? 0);

  if (state?.success || avaliacaoAtual) {
    const notaExibida = state?.success ? nota : avaliacaoAtual!.nota;
    return (
      <div className="mt-3 rounded-lg bg-accent-soft p-3">
        <p className="text-[12.5px] font-bold text-accent-dark">
          Você avaliou {profissionalNome}: {"⭐".repeat(notaExibida)}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 rounded-lg border border-border p-3">
      <input type="hidden" name="vagaId" value={vagaId} />
      <input type="hidden" name="profissionalId" value={profissionalId} />
      <input type="hidden" name="nota" value={nota} />
      <p className="text-[12.5px] font-bold">Avaliar {profissionalNome}</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNota(n)}
            className={`text-2xl leading-none ${n <= nota ? "opacity-100" : "opacity-30"}`}
            aria-label={`${n} estrelas`}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea
        name="comentario"
        placeholder="Comentário (opcional)"
        rows={2}
        className="mt-2 w-full rounded-md border border-border px-3 py-2 text-[12.5px]"
      />
      {state?.error && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending || nota === 0} className={`${buttonClass("primary", "sm")} mt-2`}>
        {pending ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
