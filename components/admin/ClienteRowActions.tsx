"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarBanidoCliente, removerCliente } from "@/lib/actions/admin";

export default function ClienteRowActions({
  clienteId,
  nome,
  banido,
}: {
  clienteId: string;
  nome: string;
  banido: boolean;
}) {
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
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (banido || window.confirm(`Banir "${nome}"? Ele não vai mais conseguir entrar na conta até ser reativado.`)) {
            run(() => alternarBanidoCliente(clienteId));
          }
        }}
        className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50 ${
          banido ? "border-note-border bg-note-bg text-note-text" : "border-border-strong hover:bg-surface-alt"
        }`}
      >
        {banido ? "✓ Banido — clique pra reativar" : "Banir cliente"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (
            window.confirm(
              `Remover "${nome}" definitivamente? Isso apaga o perfil e avaliações desse cliente (os pedidos publicados continuam, só ficam sem o vínculo com essa conta). Não pode ser desfeito.`
            )
          ) {
            run(() => removerCliente(clienteId));
          }
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-danger-dark hover:bg-danger-soft disabled:opacity-50"
      >
        Remover cliente
      </button>
    </div>
  );
}
