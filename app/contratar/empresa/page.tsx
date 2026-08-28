import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listPeriodosEmpresa, listPlanosEmpresa } from "@/lib/data/painel";
import { PLANOS_BENEFICIOS } from "@/lib/planos-beneficios";
import ResumoContratacaoForm from "@/components/ResumoContratacaoForm";

export const dynamic = "force-dynamic";

export default async function ContratarEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const [session, sp] = await Promise.all([getSession(), searchParams]);

  // ja logada como empresa: nao faz sentido passar pela tela de resumo de
  // novo, vai direto pro seletor de plano do painel (mesmo fluxo de quem
  // clica "Contratar" logada, na home).
  if (session?.tipo === "empresa") {
    redirect(sp.plano ? `/painel?plano=${sp.plano}` : "/painel");
  }

  const planoId = sp.plano ? Number(sp.plano) : null;
  const [planos, periodosTodos] = await Promise.all([listPlanosEmpresa(), listPeriodosEmpresa()]);
  const plano = planoId ? planos.find((p) => p.id === planoId) : undefined;

  // sem plano valido ou plano gratis (nao tem periodo/cobranca) - manda pro
  // cadastro normal em vez de quebrar a pagina.
  if (!plano || Number(plano.valor_mensal) === 0) {
    redirect("/cadastro/empresa");
  }

  const periodos = periodosTodos.filter((p) => p.plano_id === plano.id);
  const beneficios = PLANOS_BENEFICIOS.find((p) => p.nome === plano.nome)?.beneficios ?? [];

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Resumo da contratação</h1>
      <p className="mt-1 text-center text-sm text-muted">Confira os detalhes antes de continuar.</p>
      <div className="mt-6">
        <ResumoContratacaoForm plano={plano} periodos={periodos} beneficios={beneficios} />
      </div>
      <p className="mt-4 text-center text-[12px] text-muted">
        Mudou de ideia?{" "}
        <Link href="/cadastro/empresa" className="font-bold text-accent-dark underline">
          Cadastrar no plano Grátis
        </Link>
        .
      </p>
    </div>
  );
}
