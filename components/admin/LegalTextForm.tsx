"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarConfiguracaoSite } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";

export default function LegalTextForm({
  chave,
  label,
  atual,
}: {
  chave: string;
  label: string;
  atual: string;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(atual);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [isPending, startTransition] = useTransition();

  function salvar() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const res = await salvarConfiguracaoSite(chave, valor);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOk(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-[14px] font-bold">{label}</h2>
      <p className="mt-1 text-[12px] text-muted">
        Use linhas começando com "## " pra título de seção, "- " pra item de lista, "**texto**" pra negrito, e linha
        em branco pra separar parágrafos.
      </p>
      <textarea
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        rows={20}
        className="mt-3 w-full rounded-md border border-border px-3 py-2 font-mono text-[12.5px] leading-relaxed"
      />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" disabled={isPending} onClick={salvar} className={buttonClass("primary", "sm")}>
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        {ok && <span className="text-[12px] font-semibold text-ok">Salvo ✓</span>}
        {error && <span className="text-[12px] font-semibold text-accent-dark">{error}</span>}
      </div>
    </div>
  );
}
