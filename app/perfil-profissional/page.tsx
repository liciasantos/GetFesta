import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuPerfilProfissional, listCategoriasProfissionais } from "@/lib/data/profissionais";
import { listCidades } from "@/lib/data/geo";
import { listVagasCompativeis, listVagasConcluidasProfissional } from "@/lib/data/vagas";
import { listBloqueiosIndisponibilidade } from "@/lib/data/disponibilidade";
import { getConfiguracoesSite, CONFIG_CONTATO_EMAIL } from "@/lib/data/config";
import AvatarUpload from "@/components/AvatarUpload";
import GaleriaManager from "@/components/GaleriaManager";
import DisponibilidadeCalendar from "@/components/DisponibilidadeCalendar";
import CandidatarVagaButton from "@/components/CandidatarVagaButton";
import AlterarSenhaForm from "@/components/AlterarSenhaForm";
import ExcluirContaForm from "@/components/ExcluirContaForm";
import PortfolioPdfUpload from "@/components/PortfolioPdfUpload";
import VideoLinkManager from "@/components/VideoLinkManager";
import {
  adicionarFotoGaleriaProfissional,
  adicionarVideoLinkProfissional,
  atualizarFotoProfissional,
  removerFotoGaleriaProfissional,
  removerVideoLinkProfissional,
} from "@/lib/actions/perfil";
import { excluirContaProfissional } from "@/lib/actions/conta";
import { getLimitesProfissional } from "@/lib/data/limites-profissional";
import { Badge, buttonClass } from "@/components/ui";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import PerfilProfissionalForm from "./PerfilProfissionalForm";
import { ProfissionalTabsProvider, TabSection } from "@/components/ProfissionalTabs";
import { TABS, type Tab } from "@/lib/profissional-tabs";
import PerfilProfissionalMobileHeader from "@/components/PerfilProfissionalMobileHeader";
import Link from "next/link";

export const dynamic = "force-dynamic";
const VAGAS_CONCLUIDAS_RESUMO = 5;

const DISPONIBILIDADE_LABEL: Record<string, string> = {
  disponivel: "Disponível para novos eventos",
  indisponivel: "Indisponível no momento",
  nao_informado: "Não informado",
};

export default async function PerfilProfissionalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") redirect("/entrar");

  const sp = await searchParams;
  const initialTab: Tab = TABS.some((t) => t.id === sp.tab) ? (sp.tab as Tab) : "perfil";

  const [perfil, categorias, cidades, vagas, vagasConcluidas, bloqueiosDisponibilidade, config, limites] = await Promise.all([
    getMeuPerfilProfissional(session.usuarioId),
    listCategoriasProfissionais(),
    listCidades(),
    listVagasCompativeis(session.usuarioId),
    listVagasConcluidasProfissional(session.usuarioId, { limit: VAGAS_CONCLUIDAS_RESUMO }),
    listBloqueiosIndisponibilidade(session.usuarioId),
    getConfiguracoesSite(),
    getLimitesProfissional(session.usuarioId),
  ]);
  if (!perfil) redirect("/entrar");

  const emailContato = config[CONFIG_CONTATO_EMAIL];
  const assuntoDestaque = encodeURIComponent("Quero destacar meu perfil na GetFesta");
  const corpoDestaque = encodeURIComponent(
    `Olá! Sou ${perfil.nome} e quero saber mais sobre como destacar meu perfil profissional na GetFesta.`
  );

  // Cadastro via Google não pede bairro/funcoes - avisa que falta completar.
  // Reaproveitado no cabeçalho desktop (abaixo) e no mobile (dentro do
  // PerfilProfissionalMobileHeader), pra não duplicar a lógica da condição.
  const avisoCatalogoIncompleto =
    !perfil.bairro_id || perfil.categorias.length === 0 ? (
      <div className="rounded-lg border border-dashed border-border-strong bg-[#efece5] p-3 text-[12.5px] text-muted">
        ⚠️ Falta completar seu catálogo pra empresas te encontrarem:{" "}
        {!perfil.bairro_id && <b className="text-text">bairro</b>}
        {!perfil.bairro_id && perfil.categorias.length === 0 && " e "}
        {perfil.categorias.length === 0 && <b className="text-text">funções que você exerce</b>} — preencha no
        formulário abaixo.
      </div>
    ) : null;

  // Aviso separado do de cima: esse é sobre segurança da conta (evitar
  // perfil falso), não sobre aparecer melhor pra empresa - contas antigas
  // sem CPF continuam funcionando normalmente, só com esse lembrete.
  const avisoCpfFaltando = !perfil.cpf ? (
    <div className="rounded-lg border border-dashed border-border-strong bg-[#efece5] p-3 text-[12.5px] text-muted">
      ⚠️ Falta completar seu <b className="text-text">CPF</b> pra manter sua conta segura contra perfis falsos —
      preencha no formulário abaixo.
    </div>
  ) : null;

  const avisoCompletarCatalogo =
    avisoCatalogoIncompleto || avisoCpfFaltando ? (
      <>
        {avisoCatalogoIncompleto}
        {avisoCpfFaltando && <div className={avisoCatalogoIncompleto ? "mt-2" : ""}>{avisoCpfFaltando}</div>}
      </>
    ) : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="hidden sm:block">
        <h1 className="text-xl font-extrabold">Meu catálogo profissional</h1>
        <p className="mt-1 text-sm text-muted">
          Seu perfil não aparece para clientes finais — só empresas autenticadas na GetFesta podem ver e te contatar.
        </p>
        {avisoCompletarCatalogo && <div className="mt-4">{avisoCompletarCatalogo}</div>}
      </div>

      <ProfissionalTabsProvider initialTab={initialTab}>
      <PerfilProfissionalMobileHeader
        nome={perfil.nome}
        fotoPerfilUrl={perfil.foto_perfil_url}
        disponibilidadeLabel={DISPONIBILIDADE_LABEL[perfil.disponibilidade_status]}
        aviso={avisoCompletarCatalogo}
        atualizarFoto={atualizarFotoProfissional}
      />

      <TabSection tab="perfil">
      <div className="mt-6 hidden items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 sm:flex">
        <AvatarUpload initialUrl={perfil.foto_perfil_url} name={perfil.nome} action={atualizarFotoProfissional} />
        <Badge tone={perfil.disponibilidade_status === "disponivel" ? "ok" : "muted"}>
          {DISPONIBILIDADE_LABEL[perfil.disponibilidade_status]}
        </Badge>
      </div>

      <div id="plano-upsell" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent bg-accent-soft p-5">
        <div>
          <h2 className="text-[14px] font-bold text-accent-dark">
            {limites.planoTipo === "premium"
              ? "✨ Você está no plano Premium"
              : limites.planoTipo === "light"
                ? "✨ Você está no plano Light — quer mais?"
                : "✨ Torne-se Light ou Premium e se destaque"}
          </h2>
          <p className="mt-1 text-[12.5px] text-accent-dark">
            {limites.planoTipo === "premium"
              ? "Você tem direito a 10 fotos, 1 PDF, 3 vídeos e pode entrar em contato com as empresas pelo WhatsApp."
              : limites.planoTipo === "light"
                ? "Você tem direito a 6 fotos e 1 PDF. No Premium (R$18/mês) são 10 fotos, 3 vídeos e contato direto com empresas via WhatsApp."
                : "Plano Light (R$9,90/mês): 6 fotos + 1 PDF. Plano Premium (R$18/mês): 10 fotos, 1 PDF, 3 vídeos e contato direto com empresas via WhatsApp."}
            {limites.viaBonusLancamento && limites.bonusExpiraEm && (
              <>
                {" "}
                Você está no bônus de lançamento (Light grátis) até {formatDateBR(limites.bonusExpiraEm)}.
              </>
            )}
          </p>
        </div>
        <a
          href={`mailto:${emailContato}?subject=${assuntoDestaque}&body=${corpoDestaque}`}
          className={buttonClass("primary", "sm")}
        >
          Entrar em contato por e-mail
        </a>
      </div>
      </TabSection>

      <TabSection tab="vagas">
      <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">
        Vagas compatíveis e minhas candidaturas
      </h2>
      <div className="overflow-hidden rounded-xl border border-border">
        {vagas.length === 0 && <p className="p-4 text-[12.5px] text-muted">Nenhuma vaga compatível por enquanto.</p>}
        {vagas.map((vaga) => (
          <div key={vaga.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 last:border-b-0">
            <div className="text-[12.5px]">
              <span className="font-bold">{vaga.categoria_nome}</span> · {vaga.bairro_nome ?? vaga.cidade_nome} ·{" "}
              {formatDateBR(vaga.data_evento)} · {vaga.hora_inicio.slice(0, 5)} · {Number(vaga.duracao_horas)}h
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold">
                  {vaga.valor ? formatCurrencyBRL(vaga.valor) : "Valor a combinar"}
                </span>
              </div>
              <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted">{vaga.descricao}</p>
            </div>
            <div>
              {vaga.candidatura_status === "selecionado" ? (
                <Badge tone="ok">🎉 Selecionado!</Badge>
              ) : vaga.status === "cancelada" ? (
                <Badge tone="muted">Vaga encerrada</Badge>
              ) : vaga.candidatura_status === "recusado" ? (
                <Badge tone="muted">Não foi dessa vez</Badge>
              ) : vaga.ja_candidatado ? (
                <Badge tone="ok">Candidatura enviada</Badge>
              ) : (
                <CandidatarVagaButton vagaId={vaga.id} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-2">Vagas concluídas</h2>
          <Link href="/perfil-profissional/vagas-concluidas" className="text-[11.5px] font-bold text-accent-dark underline">
            Ver histórico completo →
          </Link>
        </div>
        {vagasConcluidas.length === 0 ? (
          <p className="text-[12.5px] text-muted">Nenhuma vaga concluída ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {vagasConcluidas.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 text-[12.5px]">
                <div>
                  <span className="font-bold">{v.categoria_nome}</span> · {v.empresa_nome_fantasia}
                  <div className="text-[11px] text-muted-2">{formatDateBR(v.data_evento)}</div>
                </div>
                <span className="whitespace-nowrap text-[11px] font-semibold text-muted-2">
                  {v.valor ? formatCurrencyBRL(v.valor) : "Valor a combinar"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </TabSection>

      <TabSection tab="galeria">
      <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">Portfolio</h2>
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Fotos (até {limites.maxFotos})</h2>
        <GaleriaManager
          fotos={perfil.galeria}
          onAdd={adicionarFotoGaleriaProfissional}
          onRemove={removerFotoGaleriaProfissional}
          limite={limites.maxFotos}
          colsMobile={2}
        />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Portfólio/currículo (PDF)</h2>
        <PortfolioPdfUpload nomeAtual={perfil.portfolio_pdf_nome} elegivel={limites.podePdf} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Vídeos de performance (Premium)</h2>
        <VideoLinkManager
          videos={perfil.videoLinks}
          limite={limites.maxVideos}
          onAdd={adicionarVideoLinkProfissional}
          onRemove={removerVideoLinkProfissional}
        />
      </div>
      </TabSection>

      <TabSection tab="calendario">
      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Calendário de disponibilidade</h2>
        <DisponibilidadeCalendar bloqueiosIniciais={bloqueiosDisponibilidade} />
      </div>
      </TabSection>

      <TabSection tab="perfil">
      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <PerfilProfissionalForm perfil={perfil} categorias={categorias} cidades={cidades} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Alterar senha</h2>
        <AlterarSenhaForm />
      </div>

      <div className="mt-5 rounded-xl border border-danger-soft bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-danger-dark">Excluir conta</h2>
        <ExcluirContaForm
          action={excluirContaProfissional}
          aviso="Essa ação é definitiva: seu catálogo, galeria, avaliações, vagas e assinatura serão apagados e não podem ser recuperados."
        />
      </div>
      </TabSection>
      </ProfissionalTabsProvider>
    </div>
  );
}
