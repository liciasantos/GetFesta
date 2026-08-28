"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import type { PlanoEmpresa, PlanoPeriodoEmpresa } from "@/lib/data/painel";

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ResumoContratacaoForm({
  plano,
  periodos,
  beneficios,
}: {
  plano: PlanoEmpresa;
  periodos: PlanoPeriodoEmpresa[];
  beneficios: readonly string[];
}) {
  const [periodo, setPeriodo] = useState<PlanoPeriodoEmpresa | null>(periodos[0] ?? null);

  const valorCheio = periodo ? Number(plano.valor_mensal) * periodo.meses : 0;
  const desconto = periodo ? Number(periodo.desconto_pct) : 0;
  const valorFinal = valorCheio * (1 - desconto / 100);

  const query = periodo ? `plano=${plano.id}&meses=${periodo.meses}` : `plano=${plano.id}`;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-[15px] font-bold">Plano {plano.nome}</h2>
      <ul className="mt-3 flex flex-col gap-2 text-[12.5px] leading-relaxed">
        {beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-0.5 text-ok">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-muted-2">Escolha o período</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {periodos.map((p) => {
          const cheio = Number(plano.valor_mensal) * p.meses;
          const desc = Number(p.desconto_pct);
          const final = cheio * (1 - desc / 100);
          const selecionado = periodo?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-semibold ${
                selecionado ? "border-accent bg-accent-soft text-accent-dark" : "border-border hover:bg-surface-alt"
              }`}
            >
              <span>
                {p.meses} {p.meses === 1 ? "mês" : "meses"}
                {desc > 0 && <span className="ml-1.5 text-[10.5px] font-bold text-ok">-{desc}%</span>}
              </span>
              <span>{formatBRL(final)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-surface-alt px-3.5 py-3">
        <span className="text-[12.5px] font-bold">Total</span>
        <span className="font-display text-lg font-extrabold">{formatBRL(valorFinal)}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        A ativação acontece assim que confirmarmos o pagamento com você pelo WhatsApp — nada é cobrado automaticamente ainda.
      </p>

      <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5">
        <p className="text-[12px] text-muted">Pra continuar, entre com sua conta ou crie uma conta de empresa gratuita.</p>
        <Link href={`/entrar?tipo=empresa&${query}`} className={buttonClass("secondary")}>
          Já tenho conta — Entrar
        </Link>
        <Link href={`/cadastro/empresa?${query}`} className={buttonClass("primary")}>
          Criar conta grátis e continuar
        </Link>
      </div>
    </div>
  );
}
