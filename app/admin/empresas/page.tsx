import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listEmpresasAdmin } from "@/lib/data/admin";
import { Badge } from "@/components/ui";
import EmpresaRowActions from "@/components/admin/EmpresaRowActions";

export const dynamic = "force-dynamic";

export default async function AdminEmpresasPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const empresas = await listEmpresasAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Empresas cadastradas</h1>
      <p className="text-sm text-muted">
        Dê o selo de verificado depois de avaliar a empresa, aprove pra entrar no ranking de destaque, ou remova uma
        conta problemática.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {empresas.map((e) => (
          <div key={e.usuario_id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/empresa/${e.usuario_id}`} className="font-bold hover:underline" target="_blank">
                  {e.nome_fantasia}
                </Link>
                {!e.ativo && <Badge tone="warn">Inativa</Badge>}
                {!e.perfil_reivindicado && <Badge tone="muted">Perfil não confirmado</Badge>}
              </div>
              <p className="mt-1 text-[12px] text-muted">
                {e.email ?? "sem e-mail"} · {e.cidades.join(", ") || "sem cidade"} · desde{" "}
                {new Date(e.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <EmpresaRowActions
              empresaId={e.usuario_id}
              nomeFantasia={e.nome_fantasia}
              seloVerificado={e.selo_verificado}
              aprovadaParaDestaque={e.aprovada_para_destaque}
            />
          </div>
        ))}
        {empresas.length === 0 && <p className="text-sm text-muted">Nenhuma empresa cadastrada ainda.</p>}
      </div>
    </div>
  );
}
