import { listCategorias, listCidades } from "@/lib/data/geo";
import RegistroEmpresaForm from "./RegistroEmpresaForm";

export default async function CadastroEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string; meses?: string }>;
}) {
  const [cidades, categorias, sp] = await Promise.all([listCidades(), listCategorias(), searchParams]);
  const planoIntencao = sp.plano ? Number(sp.plano) : undefined;
  const mesesIntencao = sp.meses ? Number(sp.meses) : undefined;

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Cadastre sua empresa</h1>
      <p className="mt-1 text-center text-sm text-muted">
        Cadastro gratuito — comece no plano Grátis agora e mude quando quiser no seu painel.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <RegistroEmpresaForm
          cidades={cidades}
          categorias={categorias}
          planoIntencao={planoIntencao}
          mesesIntencao={mesesIntencao}
        />
      </div>
    </div>
  );
}
