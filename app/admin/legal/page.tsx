import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getConfiguracoesSite, CONFIG_POLITICA_PRIVACIDADE, CONFIG_TERMOS_USO } from "@/lib/data/config";
import LegalTextForm from "@/components/admin/LegalTextForm";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const config = await getConfiguracoesSite();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Política de Privacidade e Termos de Uso</h1>
      <p className="mb-6 text-sm text-muted">
        Esse texto aparece em /privacidade e /termos, e é o que a pessoa aceita no checkbox de cadastro. Recomendo
        pedir revisão de um advogado antes de fazer mudanças relevantes.
      </p>

      <div className="flex flex-col gap-5">
        <LegalTextForm
          chave={CONFIG_POLITICA_PRIVACIDADE}
          label="Política de Privacidade"
          atual={config[CONFIG_POLITICA_PRIVACIDADE]}
        />
        <LegalTextForm chave={CONFIG_TERMOS_USO} label="Termos de Uso" atual={config[CONFIG_TERMOS_USO]} />
      </div>
    </div>
  );
}
