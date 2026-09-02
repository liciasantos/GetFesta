import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listPedidosAdmin } from "@/lib/data/admin";
import PedidosAdminList from "@/components/admin/PedidosAdminList";

export const dynamic = "force-dynamic";

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
        em &quot;Meus pedidos&quot;). Remover apaga definitivamente.
      </p>

      <div className="mt-6">
        <PedidosAdminList pedidos={pedidos} />
      </div>
    </div>
  );
}
