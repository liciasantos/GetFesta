"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { alterarPlanoEmpresa } from "@/lib/actions/perfil";
import { buttonClass } from "@/components/ui";
import type { PlanoEmpresa } from "@/lib/data/painel";

export default function PlanoSelector({ planos, planoAtualId }: { planos: PlanoEmpresa[]; planoAtualId: number | null }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function trocarPlano(planoId: number) {
    setError(null);
    startTransition(async () => {
      const res = await alterarPlanoEmpresa(planoId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={buttonClass("secondary", "sm")}>
        Alterar plano
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border border-border bg-surface p-2 shadow-card-hover">
          {planos.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={isPending || p.id === planoAtualId}
              onClick={() => trocarPlano(p.id)}
              className={`flex w-full flex-col rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold hover:bg-surface-alt disabled:cursor-default disabled:opacity-60 ${
                p.id === planoAtualId ? "bg-accent-soft text-accent-dark" : ""
              }`}
            >
              <span className="flex items-center justify-between">
                <span>{p.nome}</span>
                <span className="text-muted">
                  {p.id === planoAtualId
                    ? "atual"
                    : `R$ ${Number(p.valor_mensal).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês`}
                </span>
              </span>
              <span className="text-[10.5px] font-normal text-muted-2">
                {p.limite_orcamentos_mes === null
                  ? "Orçamentos ilimitados"
                  : `${p.limite_orcamentos_mes} orçamentos/mês`}
              </span>
            </button>
          ))}
          {error && <p className="px-3 py-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
        </div>
      )}
    </div>
  );
}
