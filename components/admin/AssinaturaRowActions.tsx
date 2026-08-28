"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarAssinaturaAtrasada, marcarAssinaturaPaga, trocarPlanoManualAdmin } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import type { PlanoParaSelect } from "@/lib/data/admin";

export default function AssinaturaRowActions({
  empresaId,
  planoAtualId,
  planos,
}: {
  empresaId: string;
  planoAtualId: number | null;
  planos: PlanoParaSelect[];
}) {
  const [modo, setModo] = useState<"nenhum" | "pagar" | "trocar">("nenhum");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(promise: Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await promise;
      if (res?.error) {
        setError(res.error);
        return;
      }
      setModo("nenhum");
      router.refresh();
    });
  }

  if (modo === "pagar") {
    return (
      <form
        action={(formData) => run(marcarAssinaturaPaga(formData))}
        className="flex flex-wrap items-center gap-1.5"
      >
        <input type="hidden" name="empresaId" value={empresaId} />
        <select name="meses" defaultValue={1} className="rounded-md border border-border px-2 py-1 text-[11.5px]">
          <option value={1}>+1 mês</option>
          <option value={3}>+3 meses</option>
          <option value={12}>+12 meses</option>
          <option value={24}>+24 meses</option>
        </select>
        <button type="submit" disabled={isPending} className={buttonClass("primary", "sm")}>
          Confirmar
        </button>
        <button type="button" onClick={() => setModo("nenhum")} className="text-[11.5px] font-semibold text-muted hover:underline">
          Cancelar
        </button>
        {error && <p className="w-full text-[11px] font-semibold text-accent-dark">{error}</p>}
      </form>
    );
  }

  if (modo === "trocar") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {planos.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={isPending || p.id === planoAtualId}
            onClick={() => run(trocarPlanoManualAdmin(empresaId, p.id))}
            className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-40 ${
              p.id === planoAtualId ? "border-accent bg-accent-soft text-accent-dark" : "border-border-strong hover:bg-surface-alt"
            }`}
          >
            {p.nome}
          </button>
        ))}
        <button type="button" onClick={() => setModo("nenhum")} className="text-[11.5px] font-semibold text-muted hover:underline">
          Cancelar
        </button>
        {error && <p className="w-full text-[11px] font-semibold text-accent-dark">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={() => setModo("pagar")} className="rounded-md border border-ok bg-ok-soft px-2.5 py-1 text-[11.5px] font-bold text-ok">
        Marcar pago
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(marcarAssinaturaAtrasada(empresaId))}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
      >
        Marcar atrasado
      </button>
      <button type="button" onClick={() => setModo("trocar")} className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt">
        Trocar plano
      </button>
    </div>
  );
}
