"use client";

import ComoFuncionaReels, { SceneIntro, SceneOutro, SceneStep, SceneTitleCard, type ReelScene } from "@/components/ComoFuncionaReels";

const SCENES: ReelScene[] = [
  {
    tone: "intro",
    render: () => (
      <SceneIntro
        pillText="Cadastro grátis"
        title="Cadastre sua empresa."
        subtitle="Apareça pra clientes da sua região e receba pedidos sem pagar por lead."
        ctaHref="/cadastro/empresa"
        ctaLabel="Cadastrar minha empresa →"
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
            O jeito fácil de encontrar <span className="text-accent">clientes pra sua festa</span>.
          </>
        }
        subtitle="Cadastre-se. Receba pedidos. Feche pelo WhatsApp."
      />
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={1} tone="blue" kicker="PRA CADASTRAR" title="Monte seu" highlight="perfil" subtitle="Escolha categorias, região de atuação e fotos — leva poucos minutos.">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Meu perfil</div>
          <div className="mt-2.5 flex items-center justify-between text-[13px]">
            <span className="text-muted">Categoria</span>
            <span className="font-bold text-text">Buffet</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[13px]">
            <span className="text-muted">Atende em</span>
            <span className="font-bold text-text">Niterói, RJ</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[11px] font-bold text-ok">
            ✓ Perfil publicado
          </div>
        </div>
      </SceneStep>
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={2} tone="pink" kicker="PRA RECEBER" title="Pedidos chegam" highlight="no painel" subtitle="Pedidos de clientes da sua região, sem leilão de lead e sem custo pra ver.">
        <div className="rounded-2xl border border-border bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-text">Aniversário infantil</span>
            <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10.5px] font-semibold text-muted">Até R$ 3.000</span>
          </div>
          <div className="mt-1 text-[11.5px] text-muted">Niterói, RJ · 12 de outubro</div>
          <button className="mt-3 w-full rounded-lg bg-accent-soft px-3 py-2 text-[12px] font-bold text-accent-dark">
            Manifestar interesse
          </button>
        </div>
      </SceneStep>
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={3} tone="purple" kicker="PRA FECHAR" title="Combine no" highlight="WhatsApp" subtitle="Interesse aceito, contato do cliente liberado na hora.">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="rounded-xl rounded-tl-sm bg-surface-alt px-3.5 py-2.5 text-[12.5px] leading-snug text-text">
            Olá! Vi que você tem interesse na minha festa, vamos combinar? 🎉
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
        title="Seus próximos clientes começam aqui."
        subtitle="Sem mensalidade pra começar. Leva 2 minutos."
        ctaHref="/cadastro/empresa"
        ctaLabel="Cadastrar minha empresa →"
        footerNote="getfesta.com.br · plano grátis pra sempre"
      />
    ),
  },
];

export default function ComoFuncionaEmpresaReels() {
  return <ComoFuncionaReels scenes={SCENES} />;
}
