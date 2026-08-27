import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-extrabold">Painel administrativo</h1>
      <p className="mt-1 text-sm text-muted">Área restrita — visível só pra quem tem login de admin.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/admin/banners" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Banner principal &amp; destaques</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Incluir anúncios, ativar/desativar e organizar a ordem de exibição no carrossel da home.
          </p>
        </Link>
      </div>
    </div>
  );
}
