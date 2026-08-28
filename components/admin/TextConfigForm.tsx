"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarConfiguracaoSite } from "@/lib/actions/admin";

export type TextConfigField = { chave: string; label: string; placeholder: string; atual: string };

export default function TextConfigForm({ titulo, descricao, campos }: { titulo: string; descricao: string; campos: TextConfigField[] }) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(Object.fromEntries(campos.map((c) => [c.chave, c.atual])));
  const [isPending, startTransition] = useTransition();
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function salvar() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      for (const campo of campos) {
        const res = await salvarConfiguracaoSite(campo.chave, valores[campo.chave] ?? "");
        if (res.error) {
          setError(res.error);
          return;
        }
      }
      setOk(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-[14px] font-bold">{titulo}</h2>
      <p className="mt-1 text-[12.5px] text-muted">{descricao}</p>

      <div className="mt-3 flex flex-col gap-2.5">
        {campos.map((campo) => (
          <label key={campo.chave} className="text-[11px] font-bold uppercase text-muted-2">
            {campo.label}
            <input
              value={valores[campo.chave]}
              onChange={(e) => setValores((v) => ({ ...v, [campo.chave]: e.target.value }))}
              placeholder={campo.placeholder}
              className="mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm font-normal normal-case"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={salvar}
        disabled={isPending}
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-[12.5px] font-bold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {isPending ? "Salvando..." : "Salvar"}
      </button>
      {ok && <span className="ml-2 text-[12px] font-semibold text-ok">Salvo!</span>}
      {error && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}
