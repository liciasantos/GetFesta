import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listPlanoPeriodosAdmin } from "@/lib/data/admin";
import { Badge, buttonClass } from "@/components/ui";
import PlanoPeriodoRowActions from "@/components/admin/PlanoPeriodoRowActions";

export const dynamic = "force-dynamic";

export default async function AdminPlanosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const periodos = await listPlanoPeriodosAdmin();
  const porPlano = new Map<string, typeof periodos>();
  for (const p of periodos) {
    const lista = porPlano.get(p.plano_nome) ?? [];
    lista.push(p);
    porPlano.set(p.plano_nome, lista);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <div className="mb-1 mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">Periodicidade e descontos</h1>
        <Link href="/admin/planos/nova" className={buttonClass("primary", "sm")}>
          + Nova periodicidade
        </Link>
      </div>
      <p className="text-sm text-muted">
        Preço com desconto por período de fechamento (3, 12, 24 meses...) — o preço efetivo é o valor mensal do plano
        menos o desconto; na renovação volta pro valor cheio.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {Array.from(porPlano.entries()).map(([planoNome, lista]) => (
          <div key={planoNome}>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted-2">{planoNome}</h2>
            <div className="flex flex-col gap-2">
              {lista.map((p) => {
                const precoComDesconto = Number(p.valor_mensal) * (1 - Number(p.desconto_pct) / 100);
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{p.meses === 1 ? "Mensal" : `${p.meses} meses`}</span>
                        {Number(p.desconto_pct) > 0 && <Badge tone="ad">{Number(p.desconto_pct).toFixed(0)}% OFF</Badge>}
                        <Badge tone={p.ativo ? "ok" : "warn"}>{p.ativo ? "Ativo" : "Desativado"}</Badge>
                      </div>
                      <p className="mt-1 text-[12px] text-muted">
                        R${" "}
                        {precoComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        /mês · renova por R${" "}
                        {Number(p.valor_mensal).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        /mês
                      </p>
                    </div>
                    <PlanoPeriodoRowActions periodoId={p.id} ativo={p.ativo} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {periodos.length === 0 && <p className="text-sm text-muted">Nenhuma periodicidade cadastrada ainda.</p>}
      </div>
    </div>
  );
}
