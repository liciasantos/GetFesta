import { listCidades } from "@/lib/data/geo";
import RegistroClienteForm from "./RegistroClienteForm";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default async function CadastroClientePage() {
  const cidades = await listCidades();
  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Criar conta de cliente</h1>
      <p className="mt-1 text-center text-sm text-muted">Pra acompanhar seus pedidos e falar com as empresas.</p>
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <RegistroClienteForm cidades={cidades} />
        <GoogleAuthButton tipo="cliente" label="Cadastrar com Google" />
      </div>
    </div>
  );
}
