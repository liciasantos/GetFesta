"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarPedidoConcluido } from "@/lib/actions/pedidos";

export default function MarcarContratadoButton({ pedidoId }: { pedidoId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirmar(encontradoPeloSite: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await marcarPedidoConcluido(pedidoId, encontradoPeloSite);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-ok bg-ok-soft px-2.5 py-1 text-[11.5px] font-bold text-ok hover:bg-ok-soft/70"
      >
        Marcar como contratado
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-alt p-2.5">
      <p className="text-[12px] font-semibold">Você encontrou esse fornecedor pela GetFesta?</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => confirmar(true)}
          className="rounded-md bg-ok px-3 py-1.5 text-[11.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          Sim, pela GetFesta
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => confirmar(false)}
          className="rounded-md border border-border-strong px-3 py-1.5 text-[11.5px] font-bold hover:bg-surface disabled:opacity-50"
        >
          Não, por outro meio
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen(false)}
          className="rounded-md px-2 py-1.5 text-[11.5px] font-semibold text-muted hover:underline"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="mt-1.5 text-[11px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}
