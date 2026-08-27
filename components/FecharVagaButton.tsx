"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { marcarVagaNaoPreenchida, marcarVagaPreenchida } from "@/lib/actions/vagas";
import { buttonClass } from "@/components/ui";

export function FecharComCandidatoButton({ vagaId, profissionalId }: { vagaId: string; profissionalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        className={buttonClass("secondary", "sm")}
        onClick={() =>
          startTransition(async () => {
            const res = await marcarVagaPreenchida(vagaId, profissionalId);
            if (res.error) setError(res.error);
            else router.refresh();
          })
        }
      >
        {isPending ? "Salvando..." : "Fechei com este"}
      </button>
      {error && <p className="mt-1 text-[11px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}

export function NaoFechouButton({ vagaId }: { vagaId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="text-[12px] font-bold text-muted underline disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          await marcarVagaNaoPreenchida(vagaId);
          router.refresh();
        })
      }
    >
      {isPending ? "Salvando..." : "Não fechei com ninguém"}
    </button>
  );
}
