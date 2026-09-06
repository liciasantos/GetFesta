import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listPedidosCompativeis } from "@/lib/data/pedidos";
import PedidoLeadRow from "@/components/PedidoLeadRow";

export const dynamic = "force-dynamic";

export default async function PainelPedidosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar");

  const leads = await listPedidosCompativeis(session.usuarioId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/painel" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Voltar
      </Link>

      <h1 className="mt-3 text-xl font-extrabold">Pedidos compatíveis</h1>
      <p className="mt-1 text-sm text-muted">Pedidos de clientes que combinam com suas categorias e cidades de atuação.</p>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        {leads.length === 0 && <p className="p-4 text-[12.5px] text-muted">Nenhum pedido compatível por enquanto.</p>}
        {leads.map((lead) => (
          <PedidoLeadRow key={lead.id} lead={lead} empresaId={session.usuarioId} />
        ))}
      </div>
    </div>
  );
}
