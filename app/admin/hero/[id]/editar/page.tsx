import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getHeroBannerAdmin, listEmpresasParaSelect } from "@/lib/data/admin";
import HeroBannerForm from "@/components/admin/HeroBannerForm";

export const dynamic = "force-dynamic";

export default async function EditarBannerHeroPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const { id } = await params;
  const [banner, empresas] = await Promise.all([getHeroBannerAdmin(id), listEmpresasParaSelect()]);
  if (!banner) notFound();

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link href="/admin/hero" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Banner principal
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-extrabold">Editar banner</h1>
      <HeroBannerForm mode="editar" banner={banner} empresas={empresas} />
    </div>
  );
}
