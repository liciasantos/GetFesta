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
