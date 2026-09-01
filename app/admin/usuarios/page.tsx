import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAdmins } from "@/lib/data/admin";
import AdminRowActions from "@/components/admin/AdminRowActions";
import NovoAdminForm from "./NovoAdminForm";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const admins = await listAdmins();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Usuários do admin</h1>
      <p className="text-sm text-muted">Quem tem acesso ao painel administrativo da GetFesta.</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {admins.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <span className="text-[13.5px] font-bold">{a.email ?? "sem e-mail"}</span>
            <AdminRowActions adminId={a.id} email={a.email} souEu={a.id === session.usuarioId} />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Adicionar novo admin</h2>
        <NovoAdminForm />
      </div>
    </div>
  );
}
