"use client";

import ComoFuncionaReels, { SceneIntro, SceneOutro, SceneStep, SceneTitleCard, type ReelScene } from "@/components/ComoFuncionaReels";

const SCENES: ReelScene[] = [
  {
    tone: "intro",
    render: () => (
      <SceneIntro
        pillText="É de graça"
        title="Peça sua festa."
        subtitle="Publique o que você precisa e receba propostas de fornecedores no WhatsApp."
        ctaHref="/#publicar-pedido"
        ctaLabel="Publicar pedido grátis →"
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
            O jeito fácil de achar quem faz <span className="text-accent">sua festa acontecer</span>.
          </>
        }
        subtitle="Publique o pedido. Receba propostas. Combine no WhatsApp."
      />
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={1} tone="blue" kicker="PRA PUBLICAR" title="Publique seu" highlight="pedido" subtitle="Tipo de festa, data e o que procura — leva 2 minutos, sem criar conta.">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Novo pedido</div>
          <div className="mt-2.5 flex items-center justify-between text-[13px]">
            <span className="text-muted">Tipo de festa</span>
            <span className="font-bold text-text">Aniversário infantil</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[13px]">
            <span className="text-muted">Data</span>
            <span className="font-bold text-text">12 de outubro</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[13px]">
            <span className="text-muted">Cidade</span>
            <span className="font-bold text-text">Niterói, RJ</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[11px] font-bold text-ok">
            ✓ Publicado
          </div>
        </div>
      </SceneStep>
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={2} tone="pink" kicker="PRA RECEBER" title="Empresas te" highlight="respondem" subtitle="Fornecedores da sua região avaliam e manifestam interesse.">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-3.5 shadow-sm">
            <div>
              <div className="text-[13px] font-bold text-text">Buffet Doce Vida</div>
              <div className="text-[11.5px] text-muted">⭐ 4.9 · Niterói</div>
            </div>
            <span className="rounded-lg bg-accent-soft px-2.5 py-1.5 text-[11px] font-bold text-accent-dark">Interesse</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-3.5 shadow-sm">
            <div>
              <div className="text-[13px] font-bold text-text">Studio Balão Mágico</div>
              <div className="text-[11.5px] text-muted">⭐ 4.8 · São Gonçalo</div>
            </div>
            <span className="rounded-lg bg-accent-soft px-2.5 py-1.5 text-[11px] font-bold text-accent-dark">Interesse</span>
          </div>
          <div className="text-center text-[11.5px] font-bold text-accent-dark">3 propostas recebidas</div>
        </div>
      </SceneStep>
    ),
  },
  {
    tone: "cream",
    render: () => (
      <SceneStep n={3} tone="purple" kicker="PRA COMBINAR" title="Combine no" highlight="WhatsApp" subtitle="Interesse aceito, contato liberado direto no WhatsApp.">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="rounded-xl rounded-tl-sm bg-surface-alt px-3.5 py-2.5 text-[12.5px] leading-snug text-text">
            Olá! Vi seu pedido de festa infantil, posso te ajudar 🎈
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
        title="Sua festa começa aqui."
        subtitle="Sem custo pra quem contrata. Leva 2 minutos."
        ctaHref="/#publicar-pedido"
        ctaLabel="Publicar pedido grátis →"
        footerNote="getfesta.com.br · sem cadastro pra começar"
      />
    ),
  },
];

export default function ComoFuncionaClienteReels() {
  return <ComoFuncionaReels scenes={SCENES} />;
}
