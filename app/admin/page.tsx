import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getCadastrosPorDia,
  getContagemPerfisComVariacao,
  getFaturamentoPorMes,
  getFluxoCaixaResumoComVariacao,
} from "@/lib/data/admin";
import { formatCurrencyBRL } from "@/lib/format";
import BarChart from "@/components/admin/BarChart";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [contagem, financeiro, cadastrosPorDia, faturamentoPorMes] = await Promise.all([
    getContagemPerfisComVariacao(),
    getFluxoCaixaResumoComVariacao(),
    getCadastrosPorDia(14),
    getFaturamentoPorMes(6),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-extrabold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Visão geral — as 14 seções do admin agora ficam na sidebar ao lado.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi value={contagem.clientes.total} label="Clientes" variacaoPct={contagem.clientes.variacaoPct} />
        <Kpi value={contagem.empresas.total} label="Empresas" variacaoPct={contagem.empresas.variacaoPct} />
        <Kpi value={contagem.profissionais.total} label="Profissionais" variacaoPct={contagem.profissionais.variacaoPct} />
        <Kpi
          value={formatCurrencyBRL(financeiro.totalMes)}
          label="Faturamento/mês"
          variacaoPct={financeiro.variacaoPct}
          destaque
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Novos cadastros (14 dias)</h2>
          <div className="mt-4">
            <BarChart pontos={cadastrosPorDia} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Faturamento (6 meses)</h2>
          <div className="mt-4">
            <BarChart pontos={faturamentoPorMes} formatValue={formatCurrencyBRL} />
          </div>
        </div>
      </div>

      <h2 className="mb-2 mt-8 text-[13px] font-bold uppercase tracking-wide text-muted-2">Atalhos rápidos</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/admin/pedidos" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Moderação de pedidos</div>
          <p className="mt-1 text-[12.5px] text-muted">Ocultar ou remover um pedido de cliente.</p>
        </Link>
        <Link href="/admin/pagamentos" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Pagamentos das empresas</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Quem pagou, quem está atrasado, trocar plano manualmente, status do Mercado Pago.
          </p>
        </Link>
        <Link href="/admin/produtos-afiliados" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Produtos para sua festa</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Cadastrar e gerenciar fantasias e acessórios afiliados do Mercado Livre.
          </p>
        </Link>
        <Link href="/admin/empresas" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Empresas cadastradas</div>
          <p className="mt-1 text-[12.5px] text-muted">Dar selo de verificado, aprovar pra destaque, ou remover uma conta.</p>
        </Link>
      </div>
    </div>
  );
}

function Kpi({
  value,
  label,
  variacaoPct,
  destaque = false,
}: {
  value: string | number;
  label: string;
  variacaoPct: number | null;
  destaque?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${destaque ? "border-accent bg-accent-soft" : "border-border bg-surface"}`}>
      <div className={`font-display text-xl font-extrabold ${destaque ? "text-accent-dark" : ""}`}>{value}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-2">{label}</div>
      {variacaoPct !== null && (
        <div className={`mt-1 text-[10.5px] font-bold ${variacaoPct >= 0 ? "text-ok" : "text-danger-dark"}`}>
          {variacaoPct >= 0 ? "↑" : "↓"} {Math.abs(variacaoPct)}% nos últimos 7 dias
        </div>
      )}
    </div>
  );
}
