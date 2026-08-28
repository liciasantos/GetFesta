import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompatibilidadeMatriz } from "@/lib/data/admin";
import CompatibilidadeMatrix from "@/components/admin/CompatibilidadeMatrix";

export const dynamic = "force-dynamic";

export default async function AdminCategoriasCompativeisPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const matriz = await getCompatibilidadeMatriz();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Compatibilidade entre profissionais e empresas</h1>
      <p className="mb-6 text-sm text-muted">
        Marque quais categorias de empresa fazem sentido pra cada função de profissional — isso controla quem
        aparece em "Buscar profissionais" no painel de cada empresa (ex.: um Cozinheiro faz sentido pra Buffet, não
        pra Fotografia). Clicar já salva na hora.
      </p>

      <CompatibilidadeMatrix
        categoriasProfissionais={matriz.categoriasProfissionais}
        categorias={matriz.categorias}
        paresIniciais={matriz.pares}
      />
    </div>
  );
}
