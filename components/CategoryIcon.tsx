const ICONS: Record<string, string> = {
  baloes: `<circle cx="8.5" cy="10.5" r="4.3"/><circle cx="15.7" cy="8.6" r="3.1"/><path d="M8.5 14.8v3.4M15.7 11.7v2.6"/>`,
  personagens_vivos: `<path d="M12 3.3 14.3 9l6.2.5-4.7 4 1.5 6-5.3-3.3-5.3 3.3 1.5-6-4.7-4L11.7 9Z"/>`,
  animacao: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M17.2 6 14.4 8.8M6 18l2.8-2.8M17.2 18 14.4 15.2"/>`,
  decoracao: `<path d="M12 12 4 6.5V4h2.5L12 8M12 12l8-5.5V4h-2.5L12 8"/><circle cx="12" cy="12" r="1.6"/><path d="M12 13.6 9 20M12 13.6l3 6.4"/>`,
  decoracao_pegue_monte: `<path d="M4 9v10h16V9"/><path d="M4 9 12 5l8 4"/><path d="M12 5v14"/>`,
  buffet: `<path d="M4.5 15.5a7.5 6 0 0 1 15 0Z"/><path d="M3 15.5h18M11 6.5V4.8M9.3 5l1.7 1.5L12.7 5"/>`,
  fotografia: `<rect x="3" y="7.5" width="18" height="12.5" rx="2.2"/><path d="M8.5 7.5 10 4.8h4L15.5 7.5"/><circle cx="12" cy="13.7" r="3.4"/>`,
  estacoes: `<path d="M6 20 7.2 11h9.6L18 20Z"/><path d="M8.3 11c0-2.3 1.7-4 3.7-4s3.7 1.7 3.7 4"/><circle cx="12" cy="5.4" r="1.1"/>`,
  brinquedos: `<circle cx="12" cy="12" r="2"/><path d="M12 3 14 10 21 12 14 14 12 21 10 14 3 12 10 10Z"/>`,
  papelaria: `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.6 6.5 12 13l8.4-6.5"/>`,
  brindes: `<path d="M5.5 9.5h13L17 20H7Z"/><path d="M9 9.5c0-3 1.3-5 3-5s3 2 3 5"/><path d="M12 9.5V20"/>`,
  centro_de_mesa: `<path d="M9.5 4h5l-.9 8h-3.2Z"/><path d="M8.3 12h7.4l-1 8H9.3Z"/><circle cx="12" cy="3.1" r="1.1"/>`,
  sitios: `<path d="M12 3 17 11H7Z"/><path d="M9 15h6L14 21h-4Z"/><path d="M12 11v4"/>`,
  saloes: `<path d="M4 20V10L12 4l8 6v10"/><path d="M4 20h16"/><path d="M10 20v-5h4v5"/>`,
};

const FALLBACK = `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M17.2 6 14.4 8.8M6 18l2.8-2.8M17.2 18 14.4 15.2"/>`;

export default function CategoryIcon({ slug, className = "" }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: ICONS[slug] ?? FALLBACK }}
    />
  );
}
