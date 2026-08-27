import { listCidades } from "@/lib/data/geo";
import { listCategoriasProfissionais } from "@/lib/data/profissionais";
import RegistroProfissionalForm from "./RegistroProfissionalForm";

export default async function CadastroProfissionalPage() {
  const [cidades, categorias] = await Promise.all([listCidades(), listCategoriasProfissionais()]);
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Crie seu catálogo profissional</h1>
      <p className="mt-1 text-center text-sm text-muted">
        Ator/atriz, animador, garçom, cozinheiro e outras funções de evento — empresas encontram você por aqui.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <RegistroProfissionalForm cidades={cidades} categorias={categorias} />
      </div>
    </div>
  );
}
