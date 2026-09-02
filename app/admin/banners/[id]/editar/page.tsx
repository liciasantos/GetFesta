import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBannerAdmin, listEmpresasParaSelect } from "@/lib/data/admin";
import { listCategorias } from "@/lib/data/geo";
import BannerForm from "@/components/admin/BannerForm";

export const dynamic = "force-dynamic";

export default async function EditarBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const { id } = await params;
  const [banner, categorias, empresas] = await Promise.all([
    getBannerAdmin(id),
    listCategorias(),
    listEmpresasParaSelect(),
  ]);
  if (!banner) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href="/admin/banners" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Banner principal &amp; destaques
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-extrabold">Editar anúncio</h1>

      <div className="rounded-xl border border-border bg-surface p-5">
        <BannerForm
          mode="editar"
          banner={{
            ...banner,
            inicio_em_input: new Date(banner.inicio_em).toISOString().slice(0, 10),
            fim_em_input: new Date(banner.fim_em).toISOString().slice(0, 10),
          }}
          categorias={categorias}
          empresas={empresas}
        />
      </div>
    </div>
  );
}
