import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listEmpresasParaSelect } from "@/lib/data/admin";
import HeroBannerForm from "@/components/admin/HeroBannerForm";

export const dynamic = "force-dynamic";

export default async function NovoBannerHeroPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const empresas = await listEmpresasParaSelect();

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link href="/admin/hero" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Banner principal
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-extrabold">Novo banner principal</h1>
      <HeroBannerForm mode="criar" empresas={empresas} />
    </div>
  );
}
