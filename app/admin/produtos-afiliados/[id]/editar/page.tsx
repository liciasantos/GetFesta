import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProdutoAfiliadoAdmin } from "@/lib/data/admin";
import ProdutoAfiliadoForm from "@/components/admin/ProdutoAfiliadoForm";

export const dynamic = "force-dynamic";

export default async function EditarProdutoAfiliadoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const { id } = await params;
  const produto = await getProdutoAfiliadoAdmin(id);
  if (!produto) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href="/admin/produtos-afiliados" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Produtos para sua festa
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-extrabold">Editar produto</h1>

      <div className="rounded-xl border border-border bg-surface p-5">
        <ProdutoAfiliadoForm mode="editar" produto={produto} />
      </div>
    </div>
  );
}
