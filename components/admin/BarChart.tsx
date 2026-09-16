/** Gráfico de barras simples em SVG puro (sem lib nova) - normaliza pela
 * maior barra do conjunto. Pensado pra séries curtas (dias/meses), não pra
 * substituir uma lib de gráfico de verdade se o admin crescer muito mais. */
export default function BarChart({ pontos, formatValue }: { pontos: { label: string; value: number }[]; formatValue?: (v: number) => string }) {
  const max = Math.max(1, ...pontos.map((p) => p.value));
  const largura = 100 / pontos.length;

  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-28 w-full overflow-visible">
        {pontos.map((p, i) => {
          const altura = (p.value / max) * 34;
          return (
            <rect
              key={p.label + i}
              x={i * largura + largura * 0.2}
              y={40 - altura}
              width={largura * 0.6}
              height={altura}
              rx={0.6}
              className="fill-accent"
            />
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[9.5px] font-semibold text-muted-2">
        {pontos.map((p, i) => (
          <span key={p.label + i} className={pontos.length > 10 && i % 2 !== 0 ? "invisible" : ""}>
            {p.label}
          </span>
        ))}
      </div>
      {formatValue && (
        <p className="mt-1 text-[11px] text-muted">
          Total no período: <span className="font-bold text-text">{formatValue(pontos.reduce((s, p) => s + p.value, 0))}</span>
        </p>
      )}
    </div>
  );
}
