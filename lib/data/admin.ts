import { query } from "@/lib/db";

export type BannerAdmin = {
  id: string;
  categoria_id: number;
  categoria_nome: string;
  empresa_id: string;
  nome_fantasia: string;
  inicio_em: string;
  fim_em: string;
  valor_pago: string;
  ativo: boolean;
  ordem: number;
};

/** Todos os banners (ativos ou não, vencidos ou não) - visão completa pro
 * admin gerenciar, ao contrário de listBannersAtivos() que só traz o que
 * está no ar agora pro carrossel público. */
export async function listBannersAdmin(): Promise<BannerAdmin[]> {
  return query<BannerAdmin>(
    `SELECT b.id, b.categoria_id, c.nome AS categoria_nome, b.empresa_id, e.nome_fantasia,
            b.inicio_em, b.fim_em, b.valor_pago, b.ativo, b.ordem
     FROM banners_categoria b
     JOIN categorias c ON c.id = b.categoria_id
     JOIN empresas e ON e.usuario_id = b.empresa_id
     ORDER BY b.ordem ASC, b.id ASC`
  );
}

export type EmpresaOption = { usuario_id: string; nome_fantasia: string };

export async function listEmpresasParaSelect(): Promise<EmpresaOption[]> {
  return query<EmpresaOption>(`SELECT usuario_id, nome_fantasia FROM empresas ORDER BY nome_fantasia ASC`);
}
