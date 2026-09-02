import { query } from "@/lib/db";

export type BannerCategoria = {
  id: string;
  categoria_nome: string;
  empresa_id: string;
  empresa_slug: string;
  nome_fantasia: string;
  telefone_contato: string | null;
  foto_capa: string | null;
};

/** Banners premium ativos (secao 2/4 do plano) - pulam o funil de interesse,
 * vao direto pro WhatsApp da empresa. Ordem controlada pelo admin (ver
 * /admin/banners e banners_categoria.ordem), nao mais aleatoria. */
export async function listBannersAtivos(): Promise<BannerCategoria[]> {
  return query<BannerCategoria>(
    `SELECT b.id, c.nome AS categoria_nome, e.usuario_id AS empresa_id, e.slug AS empresa_slug, e.nome_fantasia, e.telefone_contato,
       (SELECT url FROM empresa_galeria WHERE empresa_id = e.usuario_id ORDER BY ordem ASC LIMIT 1) AS foto_capa
     FROM banners_categoria b
     JOIN categorias c ON c.id = b.categoria_id
     JOIN empresas e ON e.usuario_id = b.empresa_id
     WHERE b.ativo = true AND now() BETWEEN b.inicio_em AND b.fim_em
     ORDER BY b.ordem ASC, b.id ASC`
  );
}

export type HeroBanner = {
  id: string;
  titulo: string;
  texto: string | null;
  botao_label: string | null;
  botao_url: string | null;
  botao2_label: string | null;
  botao2_url: string | null;
  imagem_fundo: string;
  imagem_fundo_mobile: string | null;
};

const HERO_BANNER_CAMPOS =
  "id, titulo, texto, botao_label, botao_url, botao2_label, botao2_url, imagem_fundo, imagem_fundo_mobile";

/** Banner principal (topo da home) - 100% administrado, independente de
 * empresa (ver /admin/hero e banners_hero). `regiaoVisitante` vem da
 * geolocalizacao por IP (header x-vercel-ip-country-region, so existe em
 * producao na Vercel - ver app/page.tsx): se detectou SP ou MG e existe
 * banner ativo pra essa regiao, mostra só esses; senão cai pros de RJ ou sem
 * regiao definida (fallback padrão, cobre local/outros estados/sem match). */
export async function listHeroBannersAtivos(regiaoVisitante?: string | null): Promise<HeroBanner[]> {
  if (regiaoVisitante === "SP" || regiaoVisitante === "MG") {
    const doEstado = await query<HeroBanner>(
      `SELECT ${HERO_BANNER_CAMPOS} FROM banners_hero WHERE ativo = true AND regiao_alvo = $1 ORDER BY ordem ASC, id ASC`,
      [regiaoVisitante]
    );
    if (doEstado.length > 0) return doEstado;
  }
  return query<HeroBanner>(
    `SELECT ${HERO_BANNER_CAMPOS} FROM banners_hero
     WHERE ativo = true AND (regiao_alvo = 'RJ' OR regiao_alvo IS NULL)
     ORDER BY ordem ASC, id ASC`
  );
}
