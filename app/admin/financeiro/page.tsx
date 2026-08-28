import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFluxoCaixaResumo, listPagamentosAdmin } from "@/lib/data/admin";
import { formatDateBR } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminFinanceiroPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [resumo, pagamentos] = await Promise.all([getFluxoCaixaResumo(), listPagamentosAdmin()]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>
      <h1 className="mb-1 mt-3 text-xl font-extrabold">Fluxo de caixa</h1>
      <p className="text-sm text-muted">
        Todo pagamento marcado como pago em "Pagamentos das empresas" entra aqui automaticamente.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Este mês</div>
          <div className="mt-1 font-display text-2xl font-extrabold text-accent-dark">{formatBRL(resumo.totalMes)}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Este ano</div>
          <div className="mt-1 font-display text-2xl font-extrabold">{formatBRL(resumo.totalAno)}</div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">Últimos pagamentos</h2>
      <div className="overflow-hidden rounded-xl border border-border">
        {pagamentos.map((p) => (
          <div key={p.id} className="flex items-center justify-between border-b border-border p-3 text-[12.5px] last:border-b-0">
            <div>
              <span className="font-bold">{p.empresa_nome}</span>{" "}
              <span className="text-muted">· {p.plano_nome}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted">{p.pago_em ? formatDateBR(p.pago_em) : "—"}</span>
              <span className="font-bold text-ok">{formatBRL(Number(p.valor))}</span>
            </div>
          </div>
        ))}
        {pagamentos.length === 0 && <p className="p-4 text-[12.5px] text-muted">Nenhum pagamento registrado ainda.</p>}
      </div>
    </div>
  );
}
