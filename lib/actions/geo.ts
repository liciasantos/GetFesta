"use server";

import { queryOne } from "@/lib/db";
import { listBairros, type Bairro } from "@/lib/data/geo";
import { criarBairroCustomSchema } from "@/lib/validators";

export async function getBairrosAction(cidadeId: number): Promise<Bairro[]> {
  if (!cidadeId) return [];
  return listBairros(cidadeId);
}

/** Cria (ou reaproveita, se já existir com o mesmo nome) um bairro digitado
 * livremente pelo usuário via a opção "Outro" nos formulários com bairro. */
export async function criarBairroCustomAction(cidadeId: number, nome: string): Promise<Bairro | null> {
  const parsed = criarBairroCustomSchema.safeParse({ cidadeId, nome });
  if (!parsed.success) return null;

  const existente = await queryOne<Bairro>(`SELECT id, cidade_id, nome FROM bairros WHERE cidade_id = $1 AND nome = $2`, [
    parsed.data.cidadeId,
    parsed.data.nome,
  ]);
  if (existente) return existente;

  return queryOne<Bairro>(`INSERT INTO bairros (cidade_id, nome) VALUES ($1, $2) RETURNING id, cidade_id, nome`, [
    parsed.data.cidadeId,
    parsed.data.nome,
  ]);
}
