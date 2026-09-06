const ICONS: Record<string, string> = {
  calculadora: `<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="7.5" y="5.5" width="9" height="4" rx="0.6"/><path d="M8 13.3h.01M12 13.3h.01M16 13.3h.01M8 16.7h.01M12 16.7h.01M16 16.7h.01"/>`,
  convite: `<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3.5 7 12 13l8.5-6"/>`,
  confirmacao: `<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.6 2.6L16.2 9"/>`,
  presente: `<rect x="3.5" y="9" width="17" height="11" rx="1.3"/><path d="M3.5 9h17M12 9v11"/><path d="M12 9c-1.3-3.2-6-3-6-.3C6 9.6 8 9 12 9Z"/><path d="M12 9c1.3-3.2 6-3 6-.3C18 9.6 16 9 12 9Z"/>`,
};

export default function DicaIcon({ slug, className = "" }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: ICONS[slug] ?? "" }}
    />
  );
}
