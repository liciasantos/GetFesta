import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { getPerfilPermuta, getPermutaConfig, getUsoPlanoPermuta, listOfertas } from "@/lib/data/permuta";
import { PERIODO_LIMITE_LABEL } from "@/lib/permuta/regras";
import PropostaForm from "@/components/permuta/PropostaForm";
import { NivelBadge } from "@/components/permuta/ui";

export const dynamic = "force-dynamic";

export default async function NovaPropostaPage({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");
  const { para } = await searchParams;
  if (!para || !/^[0-9a-f-]{36}$/i.test(para)) redirect("/painel/permutas/vitrine");
  if (para === session.usuarioId) redirect("/painel/permutas/vitrine");

  const cfg = await getPermutaConfig();
  const parceiro = await queryOne<{ nome_fantasia: string }>(`SELECT nome_fantasia FROM empresas WHERE usuario_id = $1`, [para]);
  if (!parceiro) notFound();

  const [minhas, deles, eu, perfilParceiro, uso] = await Promise.all([
    listOfertas(session.usuarioId),
    listOfertas(para),
    getPerfilPermuta(session.usuarioId, cfg),
    getPerfilPermuta(para, cfg),
    getUsoPlanoPermuta(session.usuarioId, cfg),
  ]);

  const limitePlano = !uso.podeTrocarCom(para);
  const bloqueio =
    eu && !eu.participa
      ? "Ative sua participação na rede de permutas para propor trocas."
      : limitePlano
        ? `Seu plano ${uso.planoNome} permite trocar com até ${uso.limite} empresas ${PERIODO_LIMITE_LABEL[cfg.periodoLimitePlano]} e esse limite já foi atingido. Faça upgrade para trocar com mais empresas.`
        : eu && eu.pendencias.length
      ? eu.pendencias[0]
      : eu && !eu.podeAbrirNova
        ? `Você está no limite de ${eu.limite} permutas simultâneas do seu nível. Conclua uma para propor outra.`
        : perfilParceiro && (!perfilParceiro.participa || perfilParceiro.pendencias.length)
          ? "Esta empresa não está disponível para permutas no momento."
          : minhas.length === 0
            ? "Cadastre pelo menos uma oferta em Minhas ofertas antes de propor uma troca."
            : deles.length === 0
              ? "Esta empresa não tem ofertas ativas."
              : null;

  return (
    <div className="flex flex-col gap-4">
      <nav className="text-[12.5px] text-muted">
        <Link href="/painel/permutas/vitrine" className="font-bold text-accent-dark underline">
          Vitrine de trocas
        </Link>{" "}
        / Nova proposta
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold">Propor troca para {parceiro.nome_fantasia}</h2>
        {perfilParceiro && <NivelBadge nivel={perfilParceiro.nivel} />}
      </div>
      {bloqueio ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-note-border bg-note-bg p-4 text-[13px] text-note-text">
          <span>{bloqueio}</span>
          {limitePlano && (
            <Link href="/painel" className="font-bold underline">
              Ver planos
            </Link>
          )}
        </div>
      ) : (
        <PropostaForm
          destinatarioId={para}
          parceiroNome={parceiro.nome_fantasia}
          minhas={minhas}
          deles={deles}
          janelaDias={cfg.janelaCancelamentoDias}
          horasConfirmacao={cfg.horasConfirmacaoAutomatica}
          limite={eu?.limite ?? null}
          ativos={eu?.stats.ativos ?? 0}
        />
      )}
    </div>
  );
}
