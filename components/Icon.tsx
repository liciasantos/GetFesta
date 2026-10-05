/** Conjunto único de ícones de traço do site (mesmo estilo das barras laterais
 * do painel e do admin). Substitui os emojis que eram usados como ícone - emoji
 * muda de desenho em cada celular/sistema e destoa do resto da interface.
 * Funciona em server e client components (sem estado). */

const PATHS = {
  chat: `<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>`,
  megaphone: `<path d="M3 10v4a1 1 0 0 0 1 1h2l8 4V5L6 9H4a1 1 0 0 0-1 1Z"/><path d="M17 9a3.5 3.5 0 0 1 0 6"/>`,
  eye: `<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>`,
  clipboard: `<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6"/>`,
  userPlus: `<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5 1.6 0 3 .5 4.1 1.4M18 14v6M15 17h6"/>`,
  pencil: `<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  alert: `<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17h.01"/>`,
  sparkles: `<path d="M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9L12 3Z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/>`,
  party: `<path d="M4 20l5-14 9 9-14 5Z"/><path d="M14 3.5v2M20.5 10h-2M17.5 6.5 16 8"/>`,
  star: `<path d="M12 3.5 14.5 9l6 .7-4.4 4 1.2 5.8L12 16.6l-5.3 2.9 1.2-5.8-4.4-4 6-.7Z"/>`,
  pin: `<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>`,
  lock: `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  tag: `<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8.5" r="1.5"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  instagram: `<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>`,
  file: `<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>`,
  printer: `<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>`,
  lightbulb: `<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>`,
  balloon: `<path d="M12 3c3.3 0 6 2.8 6 6.3 0 3.8-2.7 7-6 7s-6-3.2-6-7C6 5.8 8.7 3 12 3Z"/><path d="m11 16.3-.8 1.7h3.6l-.8-1.7M12 18c0 1.5-1.5 2-1.5 3"/>`,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "h-4 w-4",
  filled = false,
  label,
}: {
  name: IconName;
  className?: string;
  /** preenchido (ex.: estrela de nota) em vez de só o contorno */
  filled?: boolean;
  /** texto pra leitor de tela quando o ícone carrega significado sozinho */
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}

/** Estrelas da nota (1 a 5), preenchidas em dourado. */
export function Estrelas({ nota, className = "h-3.5 w-3.5" }: { nota: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-gold" role="img" aria-label={`Nota ${nota} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" filled={i < nota} className={`${className} ${i < nota ? "" : "text-border-strong"}`} />
      ))}
    </span>
  );
}
