import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui";
import Logo from "@/components/Logo";
import MobileNav from "@/components/MobileNav";
import AccessMenu from "@/components/AccessMenu";

export default async function SiteHeader() {
  const session = await getSession();

  const loggedInLinks = (
    <>
      {session?.tipo === "empresa" && (
        <>
          <Link href="/painel" className={buttonClass("secondary", "sm")}>
            Meu painel
          </Link>
          <form action={logoutAction}>
            <button className={buttonClass("ghost", "sm")}>Sair</button>
          </form>
        </>
      )}
      {session?.tipo === "cliente" && (
        <>
          <Link href="/meus-pedidos" className={buttonClass("secondary", "sm")}>
            Meus pedidos
          </Link>
          <form action={logoutAction}>
            <button className={buttonClass("ghost", "sm")}>Sair</button>
          </form>
        </>
      )}
      {session?.tipo === "profissional" && (
        <>
          <Link href="/perfil-profissional" className={buttonClass("secondary", "sm")}>
            Meu catálogo
          </Link>
          <form action={logoutAction}>
            <button className={buttonClass("ghost", "sm")}>Sair</button>
          </form>
        </>
      )}
    </>
  );

  const navLinks = (
    <>
      <Link href="/busca" className="hover:text-text">
        Buscar fornecedores
      </Link>
      <Link href="/publicar-pedido" className="hover:text-text">
        Publicar pedido
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Logo />

        <nav className="hidden items-center gap-7 text-[13.5px] font-semibold text-muted md:flex">
          {navLinks}
          <div className="flex items-center gap-2.5 border-l border-border pl-6">
            {session ? (
              loggedInLinks
            ) : (
              <>
                <AccessMenu />
                <Link href="/publicar-pedido" className={buttonClass("primary", "sm")}>
                  Publicar pedido
                </Link>
              </>
            )}
          </div>
        </nav>

        <MobileNav>
          <div className="flex flex-col gap-3.5 text-[14px] font-semibold text-muted">{navLinks}</div>
          {session ? (
            <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4">{loggedInLinks}</div>
          ) : (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <AccessMenu inline />
              <Link href="/publicar-pedido" className={`${buttonClass("primary", "sm")} w-fit`}>
                Publicar pedido
              </Link>
            </div>
          )}
        </MobileNav>
      </div>
    </header>
  );
}
