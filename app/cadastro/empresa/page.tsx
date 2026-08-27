import { listCategorias, listCidades } from "@/lib/data/geo";
import RegistroEmpresaForm from "./RegistroEmpresaForm";

export default async function CadastroEmpresaPage() {
  const [cidades, categorias] = await Promise.all([listCidades(), listCategorias()]);
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Cadastre sua empresa</h1>
      <p className="mt-1 text-center text-sm text-muted">
        Primeiro mês grátis no plano Completo — sem cobrança até você decidir continuar.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <RegistroEmpresaForm cidades={cidades} categorias={categorias} />
      </div>
    </div>
  );
}
