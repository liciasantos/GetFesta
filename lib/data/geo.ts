import { query } from "@/lib/db";

export type Cidade = { id: number; estado: string; nome: string };
export type Bairro = { id: number; cidade_id: number; nome: string };

export async function listCidades(): Promise<Cidade[]> {
  return query<Cidade>(`SELECT id, estado, nome FROM cidades ORDER BY nome`);
}

export async function listBairros(cidadeId: number): Promise<Bairro[]> {
  return query<Bairro>(`SELECT id, cidade_id, nome FROM bairros WHERE cidade_id = $1 ORDER BY nome`, [cidadeId]);
}

export type Categoria = { id: number; slug: string; nome: string };

export async function listCategorias(): Promise<Categoria[]> {
  return query<Categoria>(`SELECT id, slug, nome FROM categorias ORDER BY nome`);
}
