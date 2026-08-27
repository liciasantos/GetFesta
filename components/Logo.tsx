import Link from "next/link";

/**
 * Usa o ícone SVG oficial (balão) + wordmark em texto nas cores da marca.
 * O wordmark é texto (não o SVG completo) para ficar nítido em qualquer
 * tamanho de tela sem depender de recorte manual do lockup com o slogan.
 */
export default function Logo({
  className = "",
  iconSize = 34,
  wordmarkClassName = "text-xl",
}: {
  className?: string;
  iconSize?: number;
  wordmarkClassName?: string;
}) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icone-getfesta.svg" alt="GetFesta" width={iconSize} height={iconSize} className="shrink-0" />
      <span className={`font-display font-extrabold tracking-tight ${wordmarkClassName}`}>
        <span className="text-text">Get</span>
        <span className="text-accent">Festa</span>
      </span>
    </Link>
  );
}
