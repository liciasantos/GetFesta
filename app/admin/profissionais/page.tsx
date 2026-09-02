import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProfissionaisAdmin, listPlanosProfissionalParaSelect } from "@/lib/data/admin";
import ProfissionaisAdminList from "@/components/admin/ProfissionaisAdminList";

export const dynamic = "force-dynamic";

export default async function AdminProfissionaisPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [profissionais, planos] = await Promise.all([listProfissionaisAdmin(), listPlanosProfissionalParaSelect()]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Profissionais cadastrados</h1>
      <p className="text-sm text-muted">
        Aprove pra destaque quem pagou o anúncio — aparece na seção &quot;Profissionais em destaque&quot; no painel das
        empresas compatíveis. Troque o plano manualmente pra quem pagou Light ou Premium por fora (enquanto o Mercado
        Pago não está integrado).
      </p>

      <div className="mt-6">
        <ProfissionaisAdminList profissionais={profissionais} planos={planos} />
      </div>
    </div>
  );
}
