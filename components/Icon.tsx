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
  calendar: `<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>`,
  users: `<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c0-3.1 2.5-5.5 5.5-5.5s5.5 2.4 5.5 5.5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.3 14.2c2.6.3 4.7 2.5 4.7 5.3"/>`,
  check: `<path d="M5 12.5 10 17l9-10"/>`,
  x: `<path d="M6 6l12 12M18 6 6 18"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  search: `<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>`,
  share: `<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>`,
  download: `<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>`,
  arrowRight: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  calculator: `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>`,
  cart: `<path d="M3 4h2l2.2 10.3a1 1 0 0 0 1 .7h8.6a1 1 0 0 0 1-.8L19.5 8H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>`,
  copo: `<path d="M6 4h12l-1.6 15.1a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9L6 4Z"/><path d="M6.5 9h11"/>`,
  cerveja: `<path d="M6 7h9v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2M6 7a2.5 2.5 0 0 1 2.5-3c.8-1 2.7-1 3.5 0A2.5 2.5 0 0 1 15 7"/>`,
  doce: `<circle cx="12" cy="12" r="4.5"/><path d="M7.8 10.3 3.5 8l1 4-1 4 4.3-2.3M16.2 10.3 20.5 8l-1 4 1 4-4.3-2.3"/>`,
  salgado: `<path d="M4 15.5C4 10.8 7.6 7 12 7s8 3.8 8 8.5V16H4v-.5Z"/><path d="M8 10.5l1 2M12 9.5v2.5M16 10.5l-1 2"/>`,
  bolo: `<path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6Z"/><path d="M4 16c1.5 1 2.5 1 4 0s2.5-1 4 0 2.5 1 4 0 2.5-1 4 0M12 12V8M12 5.5v.01"/>`,
  carne: `<path d="M15.5 4.5c3 1.2 4.5 4.6 3.2 7.7-1.6 3.9-6 6.6-10.2 6.6-2.7 0-4.5-1.7-4.5-4 0-3.4 3-4.6 4.6-7.2 1.4-2.3 4-4.2 6.9-3.1Z"/><circle cx="13.5" cy="10" r="2"/>`,
  fogo: `<path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-4.3-3.6-6.6-4.6-10.3-2 1.6-3.2 3.7-3.2 5.9-1-.6-1.6-1.6-1.8-2.8C7.2 9 5.5 11.4 5.5 14.8 5.5 18.4 8.1 21 12 21Z"/>`,
  pao: `<path d="M5 18h14a1 1 0 0 0 1-1v-5c0-3.3-3.6-6-8-6s-8 2.7-8 6v5a1 1 0 0 0 1 1Z"/><path d="M9 9.5l-1 3M13 9l-1 3.5M17 10l-1 2.5"/>`,
  gelo: `<rect x="4" y="9" width="9" height="9" rx="1.5"/><path d="M10 6.5 13.5 3h6.5v6.5L16.5 13"/><path d="M13 9l7-6"/>`,
  taca: `<path d="M7 3h10l-.6 5a4.4 4.4 0 0 1-8.8 0L7 3Z"/><path d="M12 12.5V20M8.5 20.5h7"/>`,
  guardanapo: `<path d="M5 5h14v14H5z"/><path d="M5 5l14 14"/>`,
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
