const ICONS: Record<string, { dark: string; accent: string }> = {
  // lupa - representa buscar/encontrar fornecedores
  cliente: {
    dark: `<circle cx="10.3" cy="10.3" r="6.3"/>`,
    accent: `<path d="M15.1 15.1 20.5 20.5"/>`,
  },
  // fachada de loja - representa a empresa/fornecedor
  empresa: {
    dark: `<path d="M4.5 10.3V19h15v-8.7"/><path d="M9.5 19v-5.5h5V19"/>`,
    accent: `<path d="M3 10.3 12 4l9 6.3"/>`,
  },
  // medalha/estrela - representa destaque do talento individual
  profissional: {
    dark: `<circle cx="12" cy="12" r="8.3"/>`,
    accent: `<path d="M12 7.8 13.2 10.5 16.1 10.8 13.9 12.7 14.6 15.5 12 13.9 9.4 15.5 10.1 12.7 7.9 10.8 10.8 10.5Z"/>`,
  },
};

/** Ícones de duas cores (contorno escuro + um traço de destaque na cor de
 * marca) usados na seção "Precisa de ajuda?" da home - estilo outline puro,
 * sem preenchimento nem selo/círculo de fundo. */
export default function HelpIcon({ slug, className = "" }: { slug: keyof typeof ICONS; className?: string }) {
  const def = ICONS[slug];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <g stroke="var(--color-text)" dangerouslySetInnerHTML={{ __html: def.dark }} />
      <g stroke="var(--color-accent)" dangerouslySetInnerHTML={{ __html: def.accent }} />
    </svg>
  );
}
