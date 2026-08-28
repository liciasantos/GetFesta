"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarBannerHeroAtivo, moverBannerHero, removerBannerHero } from "@/lib/actions/admin";

export default function HeroBannerRowActions({
  bannerId,
  ativo,
  isPrimeiro,
  isUltimo,
}: {
  bannerId: string;
  ativo: boolean;
  isPrimeiro: boolean;
  isUltimo: boolean;
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
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={isPending || isPrimeiro}
        onClick={() => run(() => moverBannerHero(bannerId, "cima"))}
        aria-label="Mover pra cima"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-alt disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={isPending || isUltimo}
        onClick={() => run(() => moverBannerHero(bannerId, "baixo"))}
        aria-label="Mover pra baixo"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-alt disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => alternarBannerHeroAtivo(bannerId))}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
      >
        {ativo ? "Desativar" : "Ativar"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (window.confirm("Remover esse banner definitivamente?")) run(() => removerBannerHero(bannerId));
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-accent-dark hover:bg-accent-soft disabled:opacity-50"
      >
        Remover
      </button>
    </div>
  );
}
