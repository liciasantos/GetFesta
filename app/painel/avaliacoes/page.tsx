import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAvaliacoesEmpresa, countAvaliacoesEmpresa } from "@/lib/data/empresas";
import { formatDateBR } from "@/lib/format";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";
const POR_PAGINA = 10;

export default async function AvaliacoesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [avaliacoes, total] = await Promise.all([
    listAvaliacoesEmpresa(session.usuarioId, { limit: POR_PAGINA, offset: (page - 1) * POR_PAGINA }),
    countAvaliacoesEmpresa(session.usuarioId),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-xl font-extrabold">Avaliações</h1>
      <p className="mt-1 text-sm text-muted">
        O que os clientes disseram depois de contratar você — a identidade de quem avaliou não é exibida.
      </p>

      {avaliacoes.length === 0 ? (
        <p className="mt-6 text-[13px] text-muted">Nenhuma avaliação ainda.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {avaliacoes.map((a, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-gold">
                  {"★".repeat(a.nota)}
                  {"☆".repeat(5 - a.nota)}
                </span>
                <span className="text-[11px] font-semibold text-muted-2">{formatDateBR(a.criado_em)}</span>
              </div>
              {a.comentario && <p className="mt-2 text-[12.5px] leading-relaxed text-text">{a.comentario}</p>}
            </div>
          ))}
        </div>
      )}

      <Pagination basePath="/painel/avaliacoes" page={page} totalPages={totalPages} />

      <Link href="/painel" className="mt-6 inline-block text-[12.5px] font-bold text-accent-dark underline">
        ← Voltar ao painel
      </Link>
    </div>
  );
}
