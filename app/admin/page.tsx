import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getContagemPerfis, getFluxoCaixaResumo } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [contagem, financeiro] = await Promise.all([getContagemPerfis(), getFluxoCaixaResumo()]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-extrabold">Painel administrativo</h1>
      <p className="mt-1 text-sm text-muted">Área restrita — visível só pra quem tem login de admin.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Clientes" value={contagem.clientes} />
        <StatCard label="Empresas" value={contagem.empresas} />
        <StatCard label="Profissionais" value={contagem.profissionais} />
        <StatCard label="Faturamento/mês" value={formatBRL(financeiro.totalMes)} destaque />
        <StatCard label="Faturamento/ano" value={formatBRL(financeiro.totalAno)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/admin/hero" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Banner principal da home</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Título, texto, botão e imagens (desktop/mobile) do carrossel no topo da home — 100% administrado.
          </p>
        </Link>
        <Link href="/admin/banners" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Destaques da semana</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Selecionar quais empresas aparecem em destaque por categoria — só entram quando pagam o anúncio.
          </p>
        </Link>
        <Link href="/admin/empresas" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Empresas cadastradas</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Dar selo de verificado, aprovar pra destaque, ou remover uma conta.
          </p>
        </Link>
        <Link href="/admin/profissionais" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Profissionais cadastrados</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Aprovar pra destaque quem pagou o anúncio na área "Vagas para profissionais" das empresas.
          </p>
        </Link>
        <Link href="/admin/categorias-compativeis" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Compatibilidade profissional × empresa</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Ajustar quais funções de profissional aparecem pra quais categorias de empresa.
          </p>
        </Link>
        <Link href="/admin/pedidos" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Moderação de pedidos</div>
          <p className="mt-1 text-[12.5px] text-muted">Ocultar ou remover um pedido de cliente.</p>
        </Link>
        <Link href="/admin/aparencia" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Aparência do site</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Trocar as imagens de fundo da seção "Como funciona" e do banner de busca.
          </p>
        </Link>
        <Link href="/admin/site" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Redes sociais e contato</div>
          <p className="mt-1 text-[12.5px] text-muted">Links do rodapé e dados da página "Contato".</p>
        </Link>
        <Link href="/admin/planos" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Periodicidade e descontos</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Criar planos por período (3, 12, 24 meses) com desconto pra quem fecha mais tempo.
          </p>
        </Link>
        <Link href="/admin/pagamentos" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Pagamentos das empresas</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Quem pagou, quem está atrasado, trocar plano manualmente, status do Mercado Pago.
          </p>
        </Link>
        <Link href="/admin/financeiro" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Fluxo de caixa</div>
          <p className="mt-1 text-[12.5px] text-muted">Quanto entrou no mês e no ano, histórico de pagamentos.</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, destaque = false }: { label: string; value: string | number; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${destaque ? "border-accent bg-accent-soft" : "border-border bg-surface"}`}>
      <div className={`font-display text-xl font-extrabold ${destaque ? "text-accent-dark" : ""}`}>{value}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-2">{label}</div>
    </div>
  );
}
