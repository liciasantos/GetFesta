import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listPedidosAdmin } from "@/lib/data/admin";
import { Badge } from "@/components/ui";
import { formatDateBR } from "@/lib/format";
import PedidoRowActions from "@/components/admin/PedidoRowActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

export default async function AdminPedidosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const pedidos = await listPedidosAdmin();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Moderação de pedidos</h1>
      <p className="text-sm text-muted">
        Ocultar tira o pedido da vitrine pública e dos leads das empresas (o cliente continua vendo o próprio pedido
        em "Meus pedidos"). Remover apaga definitivamente.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {pedidos.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3.5"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{p.tipo_evento}</span>
                <Badge tone="muted">{STATUS_LABEL[p.status] ?? p.status}</Badge>
                {p.oculto_admin && <Badge tone="warn">Oculto</Badge>}
              </div>
              <p className="mt-1 text-[12px] text-muted">
                {p.nome_temp ?? "cliente"} · {p.cidade_nome} · {formatDateBR(p.data_evento)}
              </p>
            </div>
            <PedidoRowActions pedidoId={p.id} oculto={p.oculto_admin} />
          </div>
        ))}
        {pedidos.length === 0 && <p className="text-sm text-muted">Nenhum pedido publicado ainda.</p>}
      </div>
    </div>
  );
}
