import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getVagaDaEmpresa } from "@/lib/data/vagas";
import { listCidades } from "@/lib/data/geo";
import { listCategoriasProfissionais } from "@/lib/data/profissionais";
import NovaVagaForm from "../../nova/NovaVagaForm";

export const dynamic = "force-dynamic";

export default async function EditarVagaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const { id } = await params;
  const vaga = await getVagaDaEmpresa(id, session.usuarioId);
  if (!vaga) notFound();
  // editar só faz sentido enquanto a vaga ainda está recebendo candidatos -
  // depois de preenchida/cancelada os candidatos já foram avisados e a
  // agenda bloqueada, então os dados ficam travados.
  if (vaga.status !== "aberta") redirect(`/painel/vagas/${id}`);

  const [cidades, categorias] = await Promise.all([listCidades(), listCategoriasProfissionais()]);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Editar vaga</h1>
        <Link href={`/painel/vagas/${id}`} className="text-[12.5px] font-bold text-accent-dark underline">
          ← Voltar
        </Link>
      </div>
      <p className="text-sm text-muted">
        Profissionais compatíveis com a função e a cidade veem essa vaga no catálogo deles e podem se candidatar.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <NovaVagaForm cidades={cidades} categorias={categorias} mode="editar" vaga={vaga} />
      </div>
    </div>
  );
}
