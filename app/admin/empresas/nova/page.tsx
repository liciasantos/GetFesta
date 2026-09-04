import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCidades, listCategorias } from "@/lib/data/geo";
import NovaEmpresaForm from "@/components/admin/NovaEmpresaForm";

export const dynamic = "force-dynamic";

export default async function NovaEmpresaPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [cidades, categorias] = await Promise.all([listCidades(), listCategorias()]);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href="/admin/empresas" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Empresas cadastradas
      </Link>
      <h1 className="mb-1 mt-3 text-xl font-extrabold">Cadastrar empresa manualmente</h1>
      <p className="mb-6 text-sm text-muted">
        Pra quando você fechou o cadastro por telefone ou pessoalmente. Depois, a empresa entra com o e-mail e senha
        que você definir aqui pra completar o próprio perfil.
      </p>

      <div className="rounded-xl border border-border bg-surface p-5">
        <NovaEmpresaForm cidades={cidades} categorias={categorias} />
      </div>
    </div>
  );
}
