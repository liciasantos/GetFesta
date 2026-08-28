"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarPedidoOculto, removerPedidoAdmin } from "@/lib/actions/admin";

export default function PedidoRowActions({ pedidoId, oculto }: { pedidoId: string; oculto: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string } | undefined>) {
    startTransition(async () => {
      const res = await action();
      if (res?.error) window.alert(res.error);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => alternarPedidoOculto(pedidoId))}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
      >
        {oculto ? "Mostrar" : "Ocultar"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (window.confirm("Remover esse pedido definitivamente? Não pode ser desfeito.")) {
            run(() => removerPedidoAdmin(pedidoId));
          }
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-danger-dark hover:bg-danger-soft disabled:opacity-50"
      >
        Remover
      </button>
    </div>
  );
}
