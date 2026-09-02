import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCategorias } from "@/lib/data/geo";
import { listEmpresasParaSelect } from "@/lib/data/admin";
import BannerForm from "@/components/admin/BannerForm";

export const dynamic = "force-dynamic";

export default async function NovoBannerPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [categorias, empresas] = await Promise.all([listCategorias(), listEmpresasParaSelect()]);

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href="/admin/banners" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Banner principal &amp; destaques
      </Link>
      <h1 className="mt-3 text-xl font-extrabold">Incluir anúncio</h1>
      <p className="mt-1 text-sm text-muted">
        Aparece no carrossel do banner principal da home e na seção &quot;Destaques da semana&quot;.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <BannerForm mode="criar" categorias={categorias} empresas={empresas} />
      </div>
    </div>
  );
}
