import { query } from "@/lib/db";

export type BannerCategoria = {
  id: string;
  categoria_nome: string;
  empresa_id: string;
  nome_fantasia: string;
  telefone_contato: string | null;
  foto_capa: string | null;
};

/** Banners premium ativos (secao 2/4 do plano) - pulam o funil de interesse,
 * vao direto pro WhatsApp da empresa. Ordem controlada pelo admin (ver
 * /admin/banners e banners_categoria.ordem), nao mais aleatoria. */
export async function listBannersAtivos(): Promise<BannerCategoria[]> {
  return query<BannerCategoria>(
    `SELECT b.id, c.nome AS categoria_nome, e.usuario_id AS empresa_id, e.nome_fantasia, e.telefone_contato,
       (SELECT url FROM empresa_galeria WHERE empresa_id = e.usuario_id ORDER BY ordem ASC LIMIT 1) AS foto_capa
     FROM banners_categoria b
     JOIN categorias c ON c.id = b.categoria_id
     JOIN empresas e ON e.usuario_id = b.empresa_id
     WHERE b.ativo = true AND now() BETWEEN b.inicio_em AND b.fim_em
     ORDER BY b.ordem ASC, b.id ASC`
  );
}
