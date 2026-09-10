import Link from "next/link";
import { buttonClass } from "@/components/ui";

/** Página de "não encontrado" (rotas inexistentes + chamadas de notFound())
 * - balões reaproveitando exatamente o desenho do ícone da marca
 * (public/icone-getfesta.svg), só em cores diferentes, pra manter a
 * identidade visual mesmo numa página de erro. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center sm:py-24">
      <svg viewBox="0 0 600 320" className="w-full max-w-sm" aria-hidden="true">
        <ellipse cx="300" cy="290" rx="150" ry="16" fill="var(--color-border)" opacity="0.5" />

        {/* balão coral, esquerda */}
        <g transform="translate(60,6) rotate(-8 50 90) scale(0.85)">
          <path d="M50,120 C34,142 66,152 50,176" fill="none" stroke="var(--color-border-strong)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M45,106 L55,106 L50,120 Z" fill="var(--color-accent-dark)" />
          <path
            d="M50,4 C76,4 96,26 96,54 C96,80 78,100 58,108 C55,109.5 45,109.5 42,108 C22,100 4,80 4,54 C4,26 24,4 50,4 Z"
            fill="var(--color-accent)"
          />
        </g>

        {/* balão dourado, direita */}
        <g transform="translate(430,26) rotate(10 50 90) scale(0.62)">
          <path d="M50,120 C34,142 66,152 50,176" fill="none" stroke="var(--color-border-strong)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M45,106 L55,106 L50,120 Z" fill="var(--color-gold)" opacity="0.85" />
          <path
            d="M50,4 C76,4 96,26 96,54 C96,80 78,100 58,108 C55,109.5 45,109.5 42,108 C22,100 4,80 4,54 C4,26 24,4 50,4 Z"
            fill="var(--color-gold)"
          />
        </g>

        {/* balão azul, atrás do número, ao centro */}
        <g transform="translate(255,-30) rotate(-4 50 90) scale(0.5)">
          <path d="M50,120 C34,142 66,152 50,176" fill="none" stroke="var(--color-border-strong)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M45,106 L55,106 L50,120 Z" fill="var(--color-info-dark)" />
          <path
            d="M50,4 C76,4 96,26 96,54 C96,80 78,100 58,108 C55,109.5 45,109.5 42,108 C22,100 4,80 4,54 C4,26 24,4 50,4 Z"
            fill="var(--color-info)"
          />
        </g>

        {/* confete */}
        <circle cx="90" cy="150" r="6" fill="var(--color-gold)" />
        <circle cx="520" cy="140" r="5" fill="var(--color-accent)" />
        <rect x="150" y="40" width="9" height="9" rx="2" fill="var(--color-info)" transform="rotate(20 154 44)" />
        <rect x="470" y="200" width="8" height="8" rx="2" fill="var(--color-ok)" transform="rotate(-15 474 204)" />
        <circle cx="200" cy="230" r="4" fill="var(--color-accent-dark)" />

        <text
          x="300"
          y="250"
          textAnchor="middle"
          className="font-display"
          style={{ fontSize: 130, fontWeight: 800, fill: "var(--color-text)" }}
        >
          404
        </text>
      </svg>

      <h1 className="mt-4 text-xl font-extrabold">Essa página não recebeu o convite 🎈</h1>
      <p className="mt-2 text-sm text-muted">
        A página que você procura não existe ou mudou de endereço. Mas a festa continua — bora voltar pro início?
      </p>

      <Link href="/" className={`${buttonClass("primary")} mt-6`}>
        Voltar para o início
      </Link>
    </div>
  );
}
