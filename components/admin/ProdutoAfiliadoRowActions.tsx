"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  alternarProdutoAfiliadoAtivo,
  alternarProdutoAfiliadoDestaque,
  removerProdutoAfiliado,
} from "@/lib/actions/admin";

export default function ProdutoAfiliadoRowActions({
  produtoId,
  ativo,
  destaque,
}: {
  produtoId: string;
  ativo: boolean;
  destaque: boolean;
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
      <Link
        href={`/admin/produtos-afiliados/${produtoId}/editar`}
        aria-label="Editar produto"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-alt"
      >
        ✏️
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => alternarProdutoAfiliadoDestaque(produtoId))}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
      >
        {destaque ? "Tirar destaque" : "Destacar"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => alternarProdutoAfiliadoAtivo(produtoId))}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
      >
        {ativo ? "Desativar" : "Ativar"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (window.confirm("Remover esse produto definitivamente?")) run(() => removerProdutoAfiliado(produtoId));
        }}
        className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-accent-dark hover:bg-accent-soft disabled:opacity-50"
      >
        Remover
      </button>
    </div>
  );
}
