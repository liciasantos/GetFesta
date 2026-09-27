"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Tone = "intro" | "cream" | "outro";

const SCENE_MS = 3400;

const GRADIENT = "linear-gradient(160deg, #ff8fd1 0%, #c26bff 55%, #7c5cff 100%)";

const TONE_STYLE: Record<Tone, React.CSSProperties> = {
  intro: { backgroundImage: GRADIENT },
  cream: { backgroundColor: "var(--color-surface-alt)" },
  outro: { backgroundImage: GRADIENT },
};

export const STEP_ACCENT = {
  blue: { color: "var(--color-info-dark)", soft: "var(--color-info-soft)" },
  pink: { color: "var(--color-accent-dark)", soft: "var(--color-accent-soft)" },
  purple: { color: "#6d28d9", soft: "#f1e8ff" },
} satisfies Record<string, { color: string; soft: string }>;

export type StepTone = keyof typeof STEP_ACCENT;

export function Balloon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icone-getfesta.svg" alt="" className={className} style={style} />
  );
}

export function Pill({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <span
      style={style}
      className={`inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-[12px] font-extrabold ${className}`}
    >
      {children}
    </span>
  );
}

export function StepBadge({ n, tone }: { n: 1 | 2 | 3; tone: StepTone }) {
  return (
    <span
      style={{ backgroundColor: STEP_ACCENT[tone].color }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
    >
      {n}
    </span>
  );
}

/** Cena de abertura (fundo gradiente) - selo + título + CTA. Usada pro
 * primeiro quadro de cada versão (cliente/empresa/profissional). */
export function SceneIntro({
  pillText,
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: {
  pillText: string;
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <Pill style={{ backgroundColor: "rgba(255,255,255,0.25)" }} className="text-white">
        {pillText}
      </Pill>
      <div className="flex flex-col items-center gap-1">
        <Balloon className="h-14 w-14" style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))" } as React.CSSProperties} />
        <h3 className="font-display text-[34px] font-extrabold leading-[1.05] text-white">{title}</h3>
      </div>
      <p className="max-w-[230px] text-[14px] leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
        {subtitle}
      </p>
      <Link
        href={ctaHref}
        style={{ color: "var(--color-text)" }}
        className="rounded-xl bg-white px-5 py-3 text-[13.5px] font-extrabold shadow-lg transition-transform hover:scale-[1.03]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

/** Cartão de "logo + manifesto" (fundo creme) - segunda cena, antes dos
 * passos numerados. `title` aceita JSX pra permitir destacar um trecho com
 * cor de acento (ver usos em cada persona). */
export function SceneTitleCard({
  pillText,
  title,
  subtitle,
}: {
  pillText: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden px-8 text-center">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-soft" />
      <div className="relative flex items-center gap-2">
        <Balloon className="h-9 w-9" />
        <span className="font-display text-2xl font-extrabold tracking-tight">
          <span className="text-text">Get</span>
          <span className="text-accent">Festa</span>
        </span>
      </div>
      <Pill className="relative bg-accent-soft text-accent-dark">{pillText}</Pill>
      <h3 className="relative font-display text-[26px] font-extrabold leading-[1.15] text-text">{title}</h3>
      <p className="relative max-w-[240px] text-[13.5px] leading-snug text-muted">{subtitle}</p>
    </div>
  );
}

/** Cena de passo numerado (1/2/3) - kicker + título com destaque + mockup
 * livre no `children` (cada persona monta seu próprio mini-mockup). */
export function SceneStep({
  n,
  tone,
  kicker,
  title,
  highlight,
  subtitle,
  children,
}: {
  n: 1 | 2 | 3;
  tone: StepTone;
  kicker: string;
  title: string;
  highlight: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const a = STEP_ACCENT[tone];
  return (
    <div className="flex h-full flex-col justify-center gap-5 px-7">
      <div className="flex items-center gap-2.5">
        <StepBadge n={n} tone={tone} />
        <Pill style={{ backgroundColor: a.soft, color: a.color }}>{kicker}</Pill>
      </div>
      <h3 className="font-display text-[24px] font-extrabold leading-[1.15] text-text">
        {title} <span style={{ color: a.color }}>{highlight}</span>
      </h3>
      <p className="-mt-2 max-w-[260px] text-[13.5px] leading-snug text-muted">{subtitle}</p>
      {children}
    </div>
  );
}

/** Cena final (fundo gradiente) - fechamento + CTA, mesma estrutura da
 * intro só que com nota de rodapé no lugar do selo. */
export function SceneOutro({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
  footerNote,
}: {
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
  footerNote: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
      <Balloon className="h-12 w-12" style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))" } as React.CSSProperties} />
      <h3 className="font-display text-[30px] font-extrabold leading-[1.1] text-white">{title}</h3>
      <p className="max-w-[230px] text-[14px] leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
        {subtitle}
      </p>
      <Link
        href={ctaHref}
        style={{ color: "var(--color-text)" }}
        className="rounded-xl bg-white px-5 py-3 text-[13.5px] font-extrabold shadow-lg transition-transform hover:scale-[1.03]"
      >
        {ctaLabel}
      </Link>
      <p className="text-[11.5px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
        {footerNote}
      </p>
    </div>
  );
}

export type ReelScene = { tone: Tone; render: () => React.ReactNode };

/** Motor genérico do mockup estilo Reels/Stories (moldura de celular, barra
 * de progresso, autoplay, navegação por toque/bolinhas) - o conteúdo de
 * cada cena vem de fora via `scenes`, pra poder montar uma versão por
 * público (cliente, empresa, profissional) sem duplicar essa lógica. */
export default function ComoFuncionaReels({ scenes }: { scenes: ReelScene[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = scenes.length;
  const startRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    startRef.current = Date.now();
    // reseta a barra pra 0 assim que a cena troca (mesmo pausado) - adiado
    // pra fora do corpo síncrono do efeito, só pra respeitar a regra de não
    // chamar setState direto ali.
    const reset = window.setTimeout(() => setProgress(0), 0);
    if (paused) return () => window.clearTimeout(reset);
    const tick = window.setInterval(() => {
      setProgress(Math.min(1, (Date.now() - startRef.current) / SCENE_MS));
    }, 60);
    const advance = window.setTimeout(() => {
      setActive((v) => (v + 1) % total);
    }, SCENE_MS);
    return () => {
      window.clearTimeout(reset);
      window.clearInterval(tick);
      window.clearTimeout(advance);
    };
  }, [active, paused, total]);

  function goTo(i: number) {
    setActive(((i % total) + total) % total);
  }

  return (
    <div className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-4">
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "9 / 16",
          borderRadius: "2.25rem",
          border: "6px solid var(--color-text)",
          backgroundColor: "#000",
          boxShadow: "0 20px 45px -14px rgba(31,41,51,0.35)",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* barra de progresso, estilo Stories */}
        <div className="absolute inset-x-2.5 top-2.5 z-20 flex gap-1">
          {scenes.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: i < active ? "100%" : i === active ? `${progress * 100}%` : "0%",
                  transition: i === active ? "none" : "width 150ms linear",
                }}
              />
            </div>
          ))}
        </div>

        {/* zonas de toque esquerda/direita, tipo stories */}
        <button aria-label="Cena anterior" className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={() => goTo(active - 1)} />
        <button aria-label="Próxima cena" className="absolute inset-y-0 right-0 z-10 w-1/3" onClick={() => goTo(active + 1)} />

        {scenes.map((s, i) => (
          <div
            key={i}
            style={{
              ...TONE_STYLE[s.tone],
              pointerEvents: i === active ? "auto" : "none",
            }}
            className={`absolute inset-0 transition-all duration-500 ease-out ${
              i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-3 opacity-0" : "translate-y-3 opacity-0"
            }`}
          >
            {s.render()}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {scenes.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para cena ${i + 1}`}
            onClick={() => goTo(i)}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === active ? "1.25rem" : "0.375rem", backgroundColor: i === active ? "var(--color-accent)" : "var(--color-border-strong)" }}
          />
        ))}
      </div>
    </div>
  );
}
