import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { getRegiaoAtual } from "@/lib/actions/regiao";
import RegionPicker from "@/components/RegionPicker";
import AccessMenu from "@/components/AccessMenu";

/** Faixa fina acima do cabeçalho principal, só desktop (mobile continua com
 * tudo dentro do menu hambúrguer, sem esse problema de espaço) - assume
 * sozinha a parte de login/conta, liberando o cabeçalho principal de ter
 * que caber esses botões também (era a causa do "Entrar/Cadastrar"
 * desaparecer em telas de notebook). Fundo escuro (var(--color-text), o
 * mesmo tom de tinta usado no texto do site) e altura bem reduzida
 * (py-[1px]) pra ficar visualmente bem menor/subordinada ao cabeçalho
 * principal, como em referências de e-commerce (Revo etc.). Tudo alinhado
 * à direita (região + login), sem nada solto à esquerda. */
export default async function UtilityBar() {
  const [session, regiaoAtual] = await Promise.all([getSession(), getRegiaoAtual()]);

  return (
    <div className="hidden bg-[var(--color-text)] md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-8 px-6 py-[1px]">
        <RegionPicker regiaoAtual={regiaoAtual} />

        <div className="flex items-center gap-4">
          {session?.tipo === "empresa" && (
            <>
              <Link href="/painel" className="text-[12px] font-bold text-white hover:underline">
                Meu painel
              </Link>
              <form action={logoutAction}>
                <button className="text-[12px] font-semibold text-white/70 hover:text-white">Sair</button>
              </form>
            </>
          )}
          {session?.tipo === "cliente" && (
            <>
              <Link href="/meus-pedidos" className="text-[12px] font-bold text-white hover:underline">
                Meus pedidos
              </Link>
              <form action={logoutAction}>
                <button className="text-[12px] font-semibold text-white/70 hover:text-white">Sair</button>
              </form>
            </>
          )}
          {session?.tipo === "profissional" && (
            <>
              <Link href="/perfil-profissional" className="text-[12px] font-bold text-white hover:underline">
                Meu catálogo
              </Link>
              <form action={logoutAction}>
                <button className="text-[12px] font-semibold text-white/70 hover:text-white">Sair</button>
              </form>
            </>
          )}
          {!session && <AccessMenu />}
        </div>
      </div>
    </div>
  );
}
