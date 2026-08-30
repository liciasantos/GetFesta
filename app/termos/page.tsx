import { getConfiguracoesSite, CONFIG_TERMOS_USO } from "@/lib/data/config";
import ConteudoLegal from "@/components/ConteudoLegal";

export const dynamic = "force-dynamic";

export default async function TermosPage() {
  const config = await getConfiguracoesSite();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-extrabold">Termos de uso</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: {new Date().toLocaleDateString("pt-BR")}.</p>

      <div className="mt-8">
        <ConteudoLegal texto={config[CONFIG_TERMOS_USO]} />
      </div>
    </div>
  );
}
