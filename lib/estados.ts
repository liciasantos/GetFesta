/** Estados atendidos - lista curta e fixa (nao precisa de tabela propria).
 * Fica num arquivo proprio (sem nenhum import de servidor/banco) porque e
 * usada tanto em componentes de cliente quanto de servidor - se importada de
 * lib/data/geo.ts, arrastaria o driver do Postgres (pg) pro bundle do
 * cliente, ja que aquele arquivo importa "@/lib/db" no topo. */
export const ESTADOS = [
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "MG", nome: "Minas Gerais" },
] as const;

// import type é apagado na compilação - não arrasta o driver do Postgres
// pro bundle do cliente (só o import de valor de lib/data/geo.ts faria isso).
import type { Cidade } from "@/lib/data/geo";

/** Agrupa as cidades de um estado por macrorregiao, na ordem em que cada
 * grupo apareceu (mantém previsível) - usado pra montar um <select> com
 * <optgroup> em vez de uma lista longa e solta (ver NovaVagaForm.tsx,
 * Wizard.tsx etc.). Cidades sem macrorregiao cadastrada caem num grupo
 * "Outras cidades". */
export function agruparCidadesPorMacrorregiao(cidadesDoEstado: Cidade[]): Map<string, Cidade[]> {
  const grupos = new Map<string, Cidade[]>();
  for (const c of cidadesDoEstado) {
    const chave = c.macrorregiao ?? "Outras cidades";
    const grupo = grupos.get(chave) ?? [];
    grupo.push(c);
    grupos.set(chave, grupo);
  }
  return grupos;
}
