import { logoutAction } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";
import AdminSidebar from "@/components/admin/AdminSidebar";

/** Layout próprio da área /admin - não usa o header público (a área é
 * escondida de propósito, sem link nenhum no site pra ela). Sidebar só em
 * telas grandes (ver AdminSidebar) - nas 14 seções, cada página mantém seu
 * próprio link "← Painel administrativo" de sempre pra quem está em telas
 * menores, então não fica sem navegação nenhuma. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-border bg-text px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-[13px] font-bold text-white">GetFesta · Admin</span>
          <form action={logoutAction}>
            <button className={buttonClass("ghost", "sm")}>Sair</button>
          </form>
        </div>
      </header>
      <div className="lg:flex lg:items-start lg:gap-6 lg:px-6 lg:pt-6">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
