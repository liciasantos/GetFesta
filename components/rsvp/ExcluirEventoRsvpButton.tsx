"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirEventoRsvp } from "@/lib/actions/rsvp";

export default function ExcluirEventoRsvpButton({ eventoRsvpId }: { eventoRsvpId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className="text-[11.5px] font-bold text-muted underline">
        Excluir lista
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await excluirEventoRsvp(eventoRsvpId);
            if (res.error) setError(res.error);
            else router.refresh();
          })
        }
        className="rounded-md bg-danger-dark px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-danger-dark/90 disabled:opacity-50"
      >
        {isPending ? "Excluindo..." : "Confirmar exclusão"}
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className="text-[11.5px] font-bold text-muted underline">
        Cancelar
      </button>
      {error && <span className="text-[11px] font-semibold text-accent-dark">{error}</span>}
    </span>
  );
}
