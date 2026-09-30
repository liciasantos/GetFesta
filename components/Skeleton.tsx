/** Blocos de "esqueleto" das telas de carregamento (arquivos loading.tsx em app/).
 * Pulsa só pra quem não pediu movimento reduzido no sistema. */
export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-lg bg-surface-alt motion-safe:animate-pulse ${className}`} />;
}

/** Envoltório com o aviso pra leitores de tela - o esqueleto em si é decorativo. */
export function CarregandoPagina({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">Carregando…</span>
      {children}
    </div>
  );
}
