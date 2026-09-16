import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProdutoAfiliadoForm from "@/components/admin/ProdutoAfiliadoForm";

export const dynamic = "force-dynamic";

export default async function NovoProdutoAfiliadoPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href="/admin/produtos-afiliados" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Produtos para sua festa
      </Link>
      <h1 className="mt-3 text-xl font-extrabold">Cadastrar produto</h1>
      <p className="mt-1 text-sm text-muted">
        Cole os dados do anúncio no Mercado Livre — o link de afiliado pode ficar em branco até a conta ser aprovada.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <ProdutoAfiliadoForm mode="criar" />
      </div>
    </div>
  );
}
