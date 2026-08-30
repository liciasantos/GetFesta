/** Renderiza o texto de Política de Privacidade/Termos de Uso guardado no
 * banco (editável em /admin/legal). Marcação bem simples de propósito - o
 * admin escreve num textarea, sem precisar aprender markdown de verdade:
 * "## " = título de seção, "- " = item de lista, linha em branco = novo
 * parágrafo, "**texto**" = negrito. */
function renderNegrito(texto: string, keyPrefix: string) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{parte.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{parte}</span>
    )
  );
}

export default function ConteudoLegal({ texto }: { texto: string }) {
  const blocos = texto.trim().split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-4 text-[14px] leading-relaxed text-text">
      {blocos.map((bloco, i) => {
        if (bloco.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-2 text-base font-bold">
              {bloco.slice(3)}
            </h2>
          );
        }
        if (bloco.startsWith("- ")) {
          const itens = bloco.split("\n").filter((l) => l.startsWith("- "));
          return (
            <ul key={i} className="list-disc pl-5">
              {itens.map((item, j) => (
                <li key={j}>{renderNegrito(item.slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderNegrito(bloco, `${i}`)}</p>;
      })}
    </div>
  );
}
