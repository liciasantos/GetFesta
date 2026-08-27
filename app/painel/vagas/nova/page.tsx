import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCidades } from "@/lib/data/geo";
import { listCategoriasProfissionais } from "@/lib/data/profissionais";
import NovaVagaForm from "./NovaVagaForm";

export const dynamic = "force-dynamic";

export default async function NovaVagaPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const [cidades, categorias] = await Promise.all([listCidades(), listCategoriasProfissionais()]);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Publicar vaga para profissional</h1>
        <Link href="/painel/vagas" className="text-[12.5px] font-bold text-accent-dark underline">
          ← Minhas vagas
        </Link>
      </div>
      <p className="text-sm text-muted">
        Profissionais compatíveis com a função e a cidade veem essa vaga no catálogo deles e podem se candidatar.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <NovaVagaForm cidades={cidades} categorias={categorias} />
      </div>
    </div>
  );
}
