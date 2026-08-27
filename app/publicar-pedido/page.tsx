import { listCategorias, listCidades } from "@/lib/data/geo";
import PublicarPedidoWizard from "./Wizard";

export const dynamic = "force-dynamic";

export default async function PublicarPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipoEvento?: string; cidadeId?: string; dataEvento?: string }>;
}) {
  const sp = await searchParams;
  const [cidades, categorias] = await Promise.all([listCidades(), listCategorias()]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-extrabold">Vamos montar seu pedido</h1>
        <p className="mt-1 text-sm text-muted">Leva menos de 2 minutos — você não precisa criar conta agora.</p>
      </div>
      <PublicarPedidoWizard
        cidades={cidades}
        categorias={categorias}
        prefill={{ tipoEvento: sp.tipoEvento, cidadeId: sp.cidadeId, dataEvento: sp.dataEvento }}
      />
    </div>
  );
}
