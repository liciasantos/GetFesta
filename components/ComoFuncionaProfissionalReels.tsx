"use client";

import ComoFuncionaReels, { SceneIntro, SceneOutro, SceneStep, SceneTitleCard, type ReelScene } from "@/components/ComoFuncionaReels";

const SCENES: ReelScene[] = [
  {
    tone: "intro",
    render: () => (
      <SceneIntro
        pillText="Catálogo grátis"
        title="Monte seu catálogo."
        subtitle="Mostre seu talento e apareça pras empresas certas da sua região."
        ctaHref="/cadastro/profissional"
        ctaLabel="Criar meu catálogo →"
      />
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneTitleCard
        pillText="A GETFESTA CHEGOU"
        title={
          <>
            O jeito fácil de conseguir <span className="text-accent">freelas em festas</span>.
          </>
        }
        subtitle="Cadastre-se. Apareça pras empresas. Feche o job."
      />
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={1} tone="blue" kicker="PRA CADASTRAR" title="Monte seu" highlight="catálogo" subtitle="Fotos, funções que você exerce e sua cidade — leva poucos minutos.">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Meu catálogo</div>
          <div className="mt-2.5 flex items-center justify-between text-[13px]">
            <span className="text-muted">Função</span>
            <span className="font-bold text-text">Animador(a)</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[13px]">
            <span className="text-muted">Cidade</span>
            <span className="font-bold text-text">Niterói, RJ</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[11px] font-bold text-ok">
            ✓ Catálogo publicado
          </div>
        </div>
      </SceneStep>
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={2} tone="pink" kicker="PRA APARECER" title="Empresas te" highlight="encontram" subtitle="Só empresas autenticadas veem seu perfil — nunca aparece pra cliente final.">
        <div className="rounded-2xl border border-border bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-text">Garçom/garçonete</span>
            <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10.5px] font-semibold text-muted">Sábado à noite</span>
          </div>
          <div className="mt-1 text-[11.5px] text-muted">Niterói, RJ · 4h de duração</div>
          <button className="mt-3 w-full rounded-lg bg-accent-soft px-3 py-2 text-[12px] font-bold text-accent-dark">
            Candidatar-se
          </button>
        </div>
      </SceneStep>
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={3} tone="purple" kicker="PRA FECHAR" title="Combine no" highlight="WhatsApp" subtitle="Selecionado(a) pra vaga, contato liberado direto com a empresa.">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="rounded-xl rounded-tl-sm bg-surface-alt px-3.5 py-2.5 text-[12.5px] leading-snug text-text">
            Você foi selecionado(a) pra vaga! Vamos combinar os detalhes? 🎉
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ok px-3 py-2.5 text-[12.5px] font-bold text-white">
            Chamar no WhatsApp
          </button>
        </div>
      </SceneStep>
    ),
  },
  {
    tone: "outro",
    render: () => (
      <SceneOutro
        title="Seu próximo job começa aqui."
        subtitle="Sem mensalidade pra começar. Leva 2 minutos."
        ctaHref="/cadastro/profissional"
        ctaLabel="Criar meu catálogo →"
        footerNote="getfesta.com.br · plano grátis pra sempre"
      />
    ),
  },
];

export default function ComoFuncionaProfissionalReels() {
  return <ComoFuncionaReels scenes={SCENES} />;
}
