"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarConfiguracaoSite } from "@/lib/actions/admin";

export default function AparenciaColorForm({
  chave,
  label,
  descricao,
  atual,
}: {
  chave: string;
  label: string;
  descricao: string;
  atual: string;
}) {
  const router = useRouter();
  const [cor, setCor] = useState(atual);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function salvar(novaCor: string) {
    setCor(novaCor);
    setError(null);
    startTransition(async () => {
      const res = await salvarConfiguracaoSite(chave, novaCor);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-[14px] font-bold">{label}</h2>
      <p className="mt-1 text-[12.5px] text-muted">{descricao}</p>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(cor) ? cor : "#1f2933"}
          onChange={(e) => salvar(e.target.value)}
          disabled={isPending}
          className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
        <input
          type="text"
          value={cor}
          onChange={(e) => setCor(e.target.value)}
          onBlur={(e) => salvar(e.target.value)}
          disabled={isPending}
          placeholder="#1f2933"
          className="w-32 rounded-md border border-border px-3 py-2 text-sm"
        />
        {isPending && <span className="text-[11.5px] font-semibold text-muted">Salvando...</span>}
      </div>
      {error && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}
