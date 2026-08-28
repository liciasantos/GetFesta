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

export type HeroBannerAdmin = {
  id: string;
  titulo: string;
  texto: string | null;
  botao_label: string | null;
  botao_url: string | null;
  imagem_fundo: string;
  ativo: boolean;
  ordem: number;
};

export async function listHeroBannersAdmin(): Promise<HeroBannerAdmin[]> {
  return query<HeroBannerAdmin>(
    `SELECT id, titulo, texto, botao_label, botao_url, imagem_fundo, ativo, ordem
     FROM banners_hero ORDER BY ordem ASC, id ASC`
  );
}

export type EmpresaAdmin = {
  usuario_id: string;
  nome_fantasia: string;
  email: string | null;
  cidades: string[];
  selo_verificado: boolean;
  aprovada_para_destaque: boolean;
  perfil_reivindicado: boolean;
  ativo: boolean;
  criado_em: string;
};

export async function listEmpresasAdmin(): Promise<EmpresaAdmin[]> {
  return query<EmpresaAdmin>(
    `SELECT
       e.usuario_id, e.nome_fantasia, u.email, u.ativo, u.criado_em,
       e.selo_verificado, e.aprovada_para_destaque, e.perfil_reivindicado,
       COALESCE(
         (SELECT array_agg(DISTINCT ci.nome) FROM empresa_areas_atuacao ea JOIN cidades ci ON ci.id = ea.cidade_id WHERE ea.empresa_id = e.usuario_id),
         ARRAY[]::text[]
       ) AS cidades
     FROM empresas e
     JOIN usuarios u ON u.id = e.usuario_id
     ORDER BY u.criado_em DESC`
  );
}
