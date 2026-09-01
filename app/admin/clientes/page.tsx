import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listClientesAdmin, getEstatisticasClientes } from "@/lib/data/admin";
import { Badge } from "@/components/ui";
import ClienteRowActions from "@/components/admin/ClienteRowActions";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [clientes, stats] = await Promise.all([listClientesAdmin(), getEstatisticasClientes()]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Clientes cadastrados</h1>
      <p className="text-sm text-muted">
        Banir suspende o login sem apagar os dados; remover apaga a conta definitivamente (pedidos já publicados
        continuam, só perdem o vínculo com a conta).
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Clientes cadastrados" value={stats.totalClientes} />
        <StatCard label="Pedidos publicados" value={stats.totalPedidos} destaque />
        <StatCard label="Pedidos (últimos 30 dias)" value={stats.pedidosUltimos30Dias} />
        <StatCard label="Clientes banidos" value={stats.clientesBanidos} />
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {clientes.map((c) => (
          <div
            key={c.usuario_id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{c.nome}</span>
                {c.banido && <Badge tone="warn">Banido</Badge>}
                {!c.ativo && !c.banido && <Badge tone="muted">Inativo</Badge>}
              </div>
              <p className="mt-1 text-[12px] text-muted">
                {c.email ?? "sem e-mail"} · {c.cidade_nome ?? "sem cidade"} · {c.total_pedidos}{" "}
                {c.total_pedidos === 1 ? "pedido publicado" : "pedidos publicados"} · desde{" "}
                {new Date(c.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <ClienteRowActions clienteId={c.usuario_id} nome={c.nome} banido={c.banido} />
          </div>
        ))}
        {clientes.length === 0 && <p className="text-sm text-muted">Nenhum cliente cadastrado ainda.</p>}
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
