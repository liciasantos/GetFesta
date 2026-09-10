"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  desfazerSelecaoCandidato,
  finalizarVagaAntecipadamente,
  marcarVagaNaoPreenchida,
  selecionarCandidatoVaga,
} from "@/lib/actions/vagas";
import { buttonClass } from "@/components/ui";

export function SelecionarCandidatoButton({ vagaId, profissionalId }: { vagaId: string; profissionalId: string }) {
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
            const res = await selecionarCandidatoVaga(vagaId, profissionalId);
            if (res.error) setError(res.error);
            else router.refresh();
          })
        }
      >
        {isPending ? "Salvando..." : "Selecionar"}
      </button>
      {error && <p className="mt-1 text-[11px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}

/** Desfaz a seleção de UM candidato - pede confirmação primeiro, já que
 * libera o bloqueio de agenda dele e, se a vaga estava com todas as posições
 * preenchidas, reabre pra novos candidatos. */
export function DesfazerSelecaoButton({ vagaId, profissionalId }: { vagaId: string; profissionalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-[12px] font-bold text-accent-dark underline"
      >
        Desfazer seleção
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border-strong bg-surface-alt p-2.5">
      <p className="text-[11.5px] text-muted">
        Isso libera o horário na agenda desse profissional e reabre a posição pra novos candidatos. Tem certeza?
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await desfazerSelecaoCandidato(vagaId, profissionalId);
              if (res.error) setError(res.error);
              else router.refresh();
            })
          }
          className="rounded-md bg-accent px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {isPending ? "Removendo..." : "Sim, desfazer"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirmando(false)}
          className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}

/** Fecha a vaga mesmo sem preencher todas as posições desejadas (ex.:
 * precisava de 3, achou só 2 e já está satisfeita). */
export function FinalizarVagaButton({ vagaId }: { vagaId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        className="text-[12px] font-bold text-accent-dark underline disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            const res = await finalizarVagaAntecipadamente(vagaId);
            if (res.error) setError(res.error);
            else router.refresh();
          })
        }
      >
        {isPending ? "Salvando..." : "Finalizar vaga com os selecionados até agora"}
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
