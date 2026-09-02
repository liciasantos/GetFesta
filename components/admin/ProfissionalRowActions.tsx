"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarAprovadaDestaqueProfissional, removerProfissional, trocarPlanoProfissionalAdmin } from "@/lib/actions/admin";
import type { PlanoParaSelect } from "@/lib/data/admin";

export default function ProfissionalRowActions({
  profissionalId,
  nome,
  aprovadaParaDestaque,
  planoAtualId,
  planos,
}: {
  profissionalId: string;
  nome: string;
  aprovadaParaDestaque: boolean;
  planoAtualId: number | null;
  planos: PlanoParaSelect[];
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
        onClick={() => run(() => alternarAprovadaDestaqueProfissional(profissionalId))}
        className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50 ${
          aprovadaParaDestaque ? "border-accent bg-accent-soft text-accent-dark" : "border-border-strong hover:bg-surface-alt"
        }`}
      >
        {aprovadaParaDestaque ? "✓ Em destaque" : "Aprovar p/ destaque"}
      </button>
      <select
        value={planoAtualId ?? ""}
        disabled={isPending}
        onChange={(e) => {
          const planoId = Number(e.target.value);
          if (planoId) run(() => trocarPlanoProfissionalAdmin(profissionalId, planoId));
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50"
      >
        <option value="" disabled>
          Plano...
        </option>
        {planos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (
            window.confirm(
              `Remover "${nome}" definitivamente? Isso apaga o perfil, galeria, avaliações e candidaturas desse profissional. Não pode ser desfeito.`
            )
          ) {
            run(() => removerProfissional(profissionalId));
          }
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-danger-dark hover:bg-danger-soft disabled:opacity-50"
      >
        Remover profissional
      </button>
    </div>
  );
}
