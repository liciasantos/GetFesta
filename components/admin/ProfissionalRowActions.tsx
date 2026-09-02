"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarAprovadaDestaqueProfissional, alternarPremiumProfissional, removerProfissional } from "@/lib/actions/admin";

export default function ProfissionalRowActions({
  profissionalId,
  nome,
  aprovadaParaDestaque,
  premiumAtivo,
}: {
  profissionalId: string;
  nome: string;
  aprovadaParaDestaque: boolean;
  premiumAtivo: boolean;
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
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => alternarPremiumProfissional(profissionalId))}
        className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50 ${
          premiumAtivo ? "border-gold bg-gold-soft text-[#8a6300]" : "border-border-strong hover:bg-surface-alt"
        }`}
      >
        {premiumAtivo ? "✓ Premium concedido" : "Conceder premium"}
      </button>
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
