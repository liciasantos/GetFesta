import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listPlanosEmpresaParaSelect } from "@/lib/data/admin";
import NovoPlanoPeriodoForm from "./NovoPlanoPeriodoForm";

export const dynamic = "force-dynamic";

export default async function NovoPlanoPeriodoPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const planos = (await listPlanosEmpresaParaSelect()).filter((p) => p.tipo !== "empresa_gratis");

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link href="/admin/planos" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Periodicidade e descontos
      </Link>
      <h1 className="mb-4 mt-3 text-xl font-extrabold">Nova periodicidade</h1>
      <NovoPlanoPeriodoForm planos={planos} />
    </div>
  );
}
