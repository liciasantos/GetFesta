/** Selo numérico ao lado de um item de menu (ex.: "Vagas" 1). Server/client
 * safe, sem estado. `rotulo` ([singular, plural]) entra só pra leitor de tela
 * ("1 vaga selecionada"); o visual mostra o número (9+ a partir de 10). Não
 * renderiza nada com 0. */
export default function NavBadge({
  count,
  rotulo,
  variant = "inline",
}: {
  count: number;
  rotulo: [string, string];
  /** "inline": pílula no fim da linha do menu (desktop); "corner": bolinha no canto do ícone (barra do celular) */
  variant?: "inline" | "corner";
}) {
  if (count <= 0) return null;
  const texto = count > 9 ? "9+" : String(count);
  const posicao =
    variant === "corner"
      ? "absolute -right-1.5 -top-1 h-[18px] min-w-[18px] border-2 border-surface text-[10px]"
      : "ml-auto h-5 min-w-5 text-[11px]";
  return (
    <>
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full bg-accent-strong px-1.5 font-extrabold leading-none text-white ${posicao}`}
      >
        {texto}
      </span>
      <span className="sr-only">
        {count} {count === 1 ? rotulo[0] : rotulo[1]}
      </span>
    </>
  );
}
