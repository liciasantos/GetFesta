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
        <Link href="/admin/hero" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Banner principal da home</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Título, texto, botão e imagem de fundo do carrossel no topo da home — 100% administrado.
          </p>
        </Link>
        <Link href="/admin/banners" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Destaques da semana</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Selecionar quais empresas aparecem em destaque por categoria — só entram quando pagam o anúncio.
          </p>
        </Link>
        <Link href="/admin/empresas" className="card-hover rounded-xl border border-border bg-surface p-5">
          <div className="text-[14px] font-bold">Empresas cadastradas</div>
          <p className="mt-1 text-[12.5px] text-muted">
            Dar selo de verificado, aprovar pra destaque, ou remover uma conta.
          </p>
        </Link>
      </div>
    </div>
  );
}
