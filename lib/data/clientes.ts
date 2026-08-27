import { queryOne } from "@/lib/db";

export type PerfilCliente = {
  usuario_id: string;
  nome: string;
  foto_url: string | null;
  cidade_id: number | null;
  cidade_nome: string | null;
  email: string | null;
};

export async function getMeuPerfilCliente(usuarioId: string): Promise<PerfilCliente | null> {
  return queryOne<PerfilCliente>(
    `SELECT c.usuario_id, c.nome, c.foto_url, c.cidade_id, ci.nome AS cidade_nome, u.email
     FROM clientes c
     JOIN usuarios u ON u.id = c.usuario_id
     LEFT JOIN cidades ci ON ci.id = c.cidade_id
     WHERE c.usuario_id = $1`,
    [usuarioId]
  );
}
