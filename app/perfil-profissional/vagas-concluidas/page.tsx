import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listVagasConcluidasProfissional, countVagasConcluidasProfissional } from "@/lib/data/vagas";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";
const POR_PAGINA = 10;

export default async function VagasConcluidasProfissionalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") redirect("/entrar");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [vagas, total] = await Promise.all([
    listVagasConcluidasProfissional(session.usuarioId, { limit: POR_PAGINA, offset: (page - 1) * POR_PAGINA }),
    countVagasConcluidasProfissional(session.usuarioId),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Vagas concluídas</h1>
        <Link href="/perfil-profissional" className="text-[12.5px] font-bold text-accent-dark underline">
          ← Voltar ao catálogo
        </Link>
      </div>

      {vagas.length === 0 ? (
        <p className="mt-6 text-[13px] text-muted">Nenhuma vaga concluída ainda.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          {vagas.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 border-b border-border p-3.5 text-[12.5px] last:border-b-0"
            >
              <div>
                <span className="font-bold">{v.categoria_nome}</span> · {v.empresa_nome_fantasia}
                <div className="text-[11px] text-muted-2">{formatDateBR(v.data_evento)}</div>
              </div>
              <span className="whitespace-nowrap text-[11px] font-semibold text-muted-2">
                {v.valor ? formatCurrencyBRL(v.valor) : "Valor a combinar"}
              </span>
            </div>
          ))}
        </div>
      )}

      <Pagination basePath="/perfil-profissional/vagas-concluidas" page={page} totalPages={totalPages} />
    </div>
  );
}
