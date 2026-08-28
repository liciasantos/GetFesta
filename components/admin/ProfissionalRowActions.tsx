"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarAprovadaDestaqueProfissional } from "@/lib/actions/admin";

export default function ProfissionalRowActions({
  profissionalId,
  aprovadaParaDestaque,
}: {
  profissionalId: string;
  aprovadaParaDestaque: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await alternarAprovadaDestaqueProfissional(profissionalId);
      if (res?.error) window.alert(res.error);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={run}
      className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50 ${
        aprovadaParaDestaque ? "border-accent bg-accent-soft text-accent-dark" : "border-border-strong hover:bg-surface-alt"
      }`}
    >
      {aprovadaParaDestaque ? "✓ Em destaque" : "Aprovar p/ destaque"}
    </button>
  );
}
