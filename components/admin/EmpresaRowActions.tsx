"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { alternarAprovadaDestaque, alternarSeloVerificado, removerEmpresa } from "@/lib/actions/admin";

export default function EmpresaRowActions({
  empresaId,
  nomeFantasia,
  seloVerificado,
  aprovadaParaDestaque,
}: {
  empresaId: string;
  nomeFantasia: string;
  seloVerificado: boolean;
  aprovadaParaDestaque: boolean;
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
        onClick={() => run(() => alternarSeloVerificado(empresaId))}
        className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50 ${
          seloVerificado ? "border-ok bg-ok-soft text-ok" : "border-border-strong hover:bg-surface-alt"
        }`}
      >
        {seloVerificado ? "✓ Selo verificado" : "Dar selo verificado"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => alternarAprovadaDestaque(empresaId))}
        className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-50 ${
          aprovadaParaDestaque ? "border-accent bg-accent-soft text-accent-dark" : "border-border-strong hover:bg-surface-alt"
        }`}
      >
        {aprovadaParaDestaque ? "✓ Aprovada p/ destaque" : "Aprovar p/ destaque"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (
            window.confirm(
              `Remover "${nomeFantasia}" definitivamente? Isso apaga o perfil, galeria, avaliações, banners e assinatura dessa empresa. Não pode ser desfeito.`
            )
          ) {
            run(() => removerEmpresa(empresaId));
          }
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-danger-dark hover:bg-danger-soft disabled:opacity-50"
      >
        Remover empresa
      </button>
    </div>
  );
}
