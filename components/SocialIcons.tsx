const ICONS: Record<string, string> = {
  instagram: `<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>`,
  tiktok: `<path d="M14 3v10.8a3.2 3.2 0 1 1-2.4-3.1"/><path d="M14 3c.4 2.4 2.1 4 4.6 4.2"/>`,
  youtube: `<rect x="2.5" y="6" width="19" height="12" rx="3.5"/><path d="M10.3 9.6v4.8L14.8 12Z" fill="currentColor" stroke="none"/>`,
};

/** Ícones sociais no rodapé/contato - link vazio (não configurado no
 * /admin/site ainda) fica visualmente desabilitado e sem clique. */
export default function SocialIcons({
  className = "",
  instagram = "",
  tiktok = "",
  youtube = "",
  mobileScale = false,
}: {
  className?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  /** +15% no tamanho só no mobile (usado no rodapé) - o resto dos usos
   * (ex: página de contato) mantém o tamanho padrão em qualquer largura. */
  mobileScale?: boolean;
}) {
  const links: Array<{ label: string; href: string; icon: keyof typeof ICONS }> = [
    { label: "Instagram", href: instagram, icon: "instagram" },
    { label: "TikTok", href: tiktok, icon: "tiktok" },
    { label: "YouTube", href: youtube, icon: "youtube" },
  ];
  const botaoSize = mobileScale ? "h-[41px] w-[41px] sm:h-9 sm:w-9" : "h-9 w-9";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {links.map((l) => {
        const habilitado = !!l.href;
        return habilitado ? (
          <a
            key={l.icon}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            className={`flex items-center justify-center rounded-full border border-border-strong text-muted hover:border-accent-soft-2 hover:bg-accent-soft hover:text-accent-dark ${botaoSize}`}
          >
            <SocialIcon icon={l.icon} mobileScale={mobileScale} />
          </a>
        ) : (
          <span
            key={l.icon}
            aria-hidden="true"
            title={`${l.label} ainda não cadastrado`}
            className={`flex cursor-not-allowed items-center justify-center rounded-full border border-border text-muted-2 opacity-40 ${botaoSize}`}
          >
            <SocialIcon icon={l.icon} mobileScale={mobileScale} />
          </span>
        );
      })}
    </div>
  );
}

function SocialIcon({ icon, mobileScale }: { icon: keyof typeof ICONS; mobileScale: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={mobileScale ? "h-[21px] w-[21px] sm:h-[18px] sm:w-[18px]" : "h-[18px] w-[18px]"}
      dangerouslySetInnerHTML={{ __html: ICONS[icon] }}
    />
  );
}
