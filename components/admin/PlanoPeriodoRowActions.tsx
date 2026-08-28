"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarPlanoPeriodoAtivo, removerPlanoPeriodo } from "@/lib/actions/admin";

export default function PlanoPeriodoRowActions({ periodoId, ativo }: { periodoId: number; ativo: boolean }) {
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
        onClick={() => run(() => alternarPlanoPeriodoAtivo(periodoId))}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
      >
        {ativo ? "Desativar" : "Ativar"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (window.confirm("Remover essa periodicidade?")) run(() => removerPlanoPeriodo(periodoId));
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-accent-dark hover:bg-accent-soft disabled:opacity-50"
      >
        Remover
      </button>
    </div>
  );
}
