import { logoutAction } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";

/** Layout próprio da área /admin - não usa o header público (a área é
 * escondida de propósito, sem link nenhum no site pra ela). Só o botão de
 * sair fica aqui, já que o header público não trata sessão tipo "admin". */
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
      {children}
    </div>
  );
}
