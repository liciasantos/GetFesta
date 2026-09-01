import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProfissionaisAdmin } from "@/lib/data/admin";
import ProfissionalRowActions from "@/components/admin/ProfissionalRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProfissionaisPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const profissionais = await listProfissionaisAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Profissionais cadastrados</h1>
      <p className="text-sm text-muted">
        Aprove pra destaque quem pagou o anúncio — aparece na seção &quot;Profissionais em destaque&quot; no painel das
        empresas compatíveis. A ordenação da busca normal já usa a nota média das avaliações das empresas.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {profissionais.map((p) => (
          <div
            key={p.usuario_id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/profissional/${p.slug}`} className="font-bold hover:underline" target="_blank">
                  {p.nome}
                </Link>
                {p.nota_media !== null && (
                  <span className="text-[11.5px] font-semibold text-accent-dark">
                    ⭐ {Number(p.nota_media).toFixed(1)} ({p.total_avaliacoes})
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] text-muted">
                {p.email ?? "sem e-mail"} · {p.categorias.join(", ") || "sem categoria"} · desde{" "}
                {new Date(p.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <ProfissionalRowActions
              profissionalId={p.usuario_id}
              nome={p.nome}
              aprovadaParaDestaque={p.aprovada_para_destaque}
            />
          </div>
        ))}
        {profissionais.length === 0 && <p className="text-sm text-muted">Nenhum profissional cadastrado ainda.</p>}
      </div>
    </div>
  );
}
