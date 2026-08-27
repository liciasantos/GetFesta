const ICONS: Record<string, string> = {
  instagram: `<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>`,
  tiktok: `<path d="M14 3v10.8a3.2 3.2 0 1 1-2.4-3.1"/><path d="M14 3c.4 2.4 2.1 4 4.6 4.2"/>`,
  youtube: `<rect x="2.5" y="6" width="19" height="12" rx="3.5"/><path d="M10.3 9.6v4.8L14.8 12Z" fill="currentColor" stroke="none"/>`,
};

/** Ícones sociais no rodapé - hrefs são placeholders ("#") até a GetFesta ter
 * perfis reais; troque pelos links definitivos quando existirem. */
export default function SocialIcons({ className = "" }: { className?: string }) {
  const links: Array<{ label: string; href: string; icon: keyof typeof ICONS }> = [
    { label: "Instagram", href: "#", icon: "instagram" },
    { label: "TikTok", href: "#", icon: "tiktok" },
    { label: "YouTube", href: "#", icon: "youtube" },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {links.map((l) => (
        <a
          key={l.icon}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong text-muted hover:border-accent-soft-2 hover:bg-accent-soft hover:text-accent-dark"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
            dangerouslySetInnerHTML={{ __html: ICONS[l.icon] }}
          />
        </a>
      ))}
    </div>
  );
}
