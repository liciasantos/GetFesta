import { listCategorias, listCidades } from "@/lib/data/geo";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { Icon } from "@/components/Icon";
import PublicarPedidoWizard from "./Wizard";

export const dynamic = "force-dynamic";

export default async function PublicarPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipoEvento?: string; cidadeId?: string; dataEvento?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const [cidades, categorias, contato] = await Promise.all([
    listCidades(),
    listCategorias(),
    session?.tipo === "cliente"
      ? queryOne<{ nome: string; telefone: string | null }>(
          `SELECT c.nome, u.telefone FROM clientes c JOIN usuarios u ON u.id = c.usuario_id WHERE c.usuario_id = $1`,
          [session.usuarioId]
        )
      : Promise.resolve(null),
  ]);

  return (
    // pb maior no celular: o botão "Continuar" fica fixo no rodapé
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
      <div className="mb-6 sm:mb-8 lg:max-w-[calc(100%-324px)]">
        <h1 className="font-display text-[24px] font-extrabold leading-tight sm:text-[28px]">Peça orçamentos para sua festa</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          {contato ? "Leva menos de 2 minutos." : "Leva menos de 2 minutos e não precisa criar conta."}
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-semibold text-text">
          {["Grátis", "Sem compromisso", "Respostas no WhatsApp"].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Icon name="check" className="h-4 w-4 text-ok" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <PublicarPedidoWizard
        cidades={cidades}
        categorias={categorias}
        prefill={{ tipoEvento: sp.tipoEvento, cidadeId: sp.cidadeId, dataEvento: sp.dataEvento }}
        contato={contato ? { nome: contato.nome, telefone: contato.telefone ?? "" } : null}
      />
    </div>
  );
}
