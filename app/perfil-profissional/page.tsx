import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuPerfilProfissional, listCategoriasProfissionais } from "@/lib/data/profissionais";
import { listCidades } from "@/lib/data/geo";
import { listVagasCompativeis } from "@/lib/data/vagas";
import { listBloqueiosIndisponibilidade } from "@/lib/data/disponibilidade";
import { getConfiguracoesSite, CONFIG_CONTATO_EMAIL } from "@/lib/data/config";
import AvatarUpload from "@/components/AvatarUpload";
import GaleriaManager from "@/components/GaleriaManager";
import DisponibilidadeCalendar from "@/components/DisponibilidadeCalendar";
import CandidatarVagaButton from "@/components/CandidatarVagaButton";
import AlterarSenhaForm from "@/components/AlterarSenhaForm";
import PortfolioPdfUpload from "@/components/PortfolioPdfUpload";
import VideoLinkManager from "@/components/VideoLinkManager";
import {
  adicionarFotoGaleriaProfissional,
  adicionarVideoLinkProfissional,
  atualizarFotoProfissional,
  removerFotoGaleriaProfissional,
  removerVideoLinkProfissional,
} from "@/lib/actions/perfil";
import { getLimitesProfissional } from "@/lib/data/limites-profissional";
import { Badge, buttonClass } from "@/components/ui";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import PerfilProfissionalForm from "./PerfilProfissionalForm";

export const dynamic = "force-dynamic";

const DISPONIBILIDADE_LABEL: Record<string, string> = {
  disponivel: "Disponível para novos eventos",
  indisponivel: "Indisponível no momento",
  nao_informado: "Não informado",
};

export default async function PerfilProfissionalPage() {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") redirect("/entrar");

  const [perfil, categorias, cidades, vagas, bloqueiosDisponibilidade, config, limites] = await Promise.all([
    getMeuPerfilProfissional(session.usuarioId),
    listCategoriasProfissionais(),
    listCidades(),
    listVagasCompativeis(session.usuarioId),
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-extrabold">Meu catálogo profissional</h1>
      <p className="mt-1 text-sm text-muted">
        Seu perfil não aparece para clientes finais — só empresas autenticadas na GetFesta podem ver e te contatar.
      </p>

      {/* Cadastro via Google não pede bairro/funcoes - avisa que falta completar */}
      {(!perfil.bairro_id || perfil.categorias.length === 0) && (
        <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-[#efece5] p-3 text-[12.5px] text-muted">
          ⚠️ Falta completar seu catálogo pra empresas te encontrarem:{" "}
          {!perfil.bairro_id && <b className="text-text">bairro</b>}
          {!perfil.bairro_id && perfil.categorias.length === 0 && " e "}
          {perfil.categorias.length === 0 && <b className="text-text">funções que você exerce</b>} — preencha no
          formulário abaixo.
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
        <AvatarUpload initialUrl={perfil.foto_perfil_url} name={perfil.nome} action={atualizarFotoProfissional} />
        <Badge tone={perfil.disponibilidade_status === "disponivel" ? "ok" : "muted"}>
          {DISPONIBILIDADE_LABEL[perfil.disponibilidade_status]}
        </Badge>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent bg-accent-soft p-5">
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

      <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">
        Vagas compatíveis com suas funções e cidade
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
              {vaga.ja_candidatado ? (
                <Badge tone="ok">Candidatura enviada</Badge>
              ) : (
                <CandidatarVagaButton vagaId={vaga.id} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Fotos (até {limites.maxFotos})</h2>
        <GaleriaManager
          fotos={perfil.galeria}
          onAdd={adicionarFotoGaleriaProfissional}
          onRemove={removerFotoGaleriaProfissional}
          limite={limites.maxFotos}
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

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Calendário de disponibilidade</h2>
        <DisponibilidadeCalendar bloqueiosIniciais={bloqueiosDisponibilidade} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <PerfilProfissionalForm perfil={perfil} categorias={categorias} cidades={cidades} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Alterar senha</h2>
        <AlterarSenhaForm />
      </div>
    </div>
  );
}
