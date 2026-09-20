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
       (SELECT CASE WHEN url LIKE 'data:%' THEN '/api/empresa/' || e.usuario_id || '/foto-capa' ELSE url END
          FROM empresa_galeria WHERE empresa_id = e.usuario_id ORDER BY ordem ASC LIMIT 1) AS foto_capa
     FROM banners_categoria b
     JOIN categorias c ON c.id = b.categoria_id
     JOIN empresas e ON e.usuario_id = b.empresa_id
     WHERE b.ativo = true AND now() BETWEEN b.inicio_em AND b.fim_em
     ORDER BY b.ordem ASC, b.id ASC`
  );
}

export type HeroBanner = {
  id: string;
  empresa_id: string | null;
  titulo: string;
  texto: string | null;
  botao_label: string | null;
  botao_url: string | null;
  botao2_label: string | null;
  botao2_url: string | null;
  imagem_fundo: string;
  imagem_fundo_mobile: string | null;
};

/** Troca o data URI guardado no banco (upload do admin) pelo link do endpoint
 * que serve a imagem de verdade (ver app/api/hero-banner/[id]/imagem/[variant]/route.ts)
 * - assim o navegador baixa como arquivo separado e cacheavel, e o next/image
 * consegue otimizar, em vez de vir tudo embutido no HTML da home. Banners
 * mais antigos usam um caminho estatico direto (ex.: /banner_x.webp) - esses
 * ja sao um arquivo de verdade e ficam como estao. Feito aqui no próprio SQL
 * (em vez de checar `.startsWith("data:")` em JS) pra nunca trazer o base64
 * inteiro pra fora do Postgres só pra descartar em seguida - isso sozinho
 * dobrava a transferência de rede da home (banner buscado 2x: uma vez aqui,
 * outra na rota /api/hero-banner que realmente serve os bytes). */
const HERO_BANNER_CAMPOS = `
  id, empresa_id, titulo, texto, botao_label, botao_url, botao2_label, botao2_url,
  CASE WHEN imagem_fundo LIKE 'data:%' THEN '/api/hero-banner/' || id || '/imagem/desktop' ELSE imagem_fundo END AS imagem_fundo,
  CASE WHEN imagem_fundo_mobile LIKE 'data:%' THEN '/api/hero-banner/' || id || '/imagem/mobile' ELSE imagem_fundo_mobile END AS imagem_fundo_mobile
`;

/** Banner principal (topo da home) - conteudo 100% administrado (titulo/
 * texto/botao/imagem livres), mas pode opcionalmente ser atribuido a uma
 * empresa que comprou o espaco (empresa_id) pra habilitar as metricas dela
 * (ver registrarVisualizacoesBannerHero/registrarCliqueBannerHero abaixo).
 * `regiaoVisitante` vem da geolocalizacao por IP (header
 * x-vercel-ip-country-region, so existe em producao na Vercel - ver
 * app/page.tsx): se detectou SP ou MG e existe banner ativo pra essa regiao,
 * mostra só esses; senão cai pros de RJ ou sem regiao definida (fallback
 * padrão, cobre local/outros estados/sem match). */
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

/** Registra 1 visualização por empresa que tem um banner_categoria (Destaques
 * da semana) presente nessa leva de banners exibidos - chamado logo depois de
 * listBannersAtivos() nas páginas que renderizam DestaquesGrid (home e
 * /meus-pedidos). Conta "apareceu numa carga de página", mesmo padrão já
 * usado em registrarVisualizacaoPerfil (não é impressão real por scroll). */
export async function registrarVisualizacoesBannerCategoria(banners: BannerCategoria[]): Promise<void> {
  if (banners.length === 0) return;
  await query(
    `INSERT INTO empresa_eventos (empresa_id, tipo) SELECT unnest($1::uuid[]), 'visualizacao_banner_categoria'`,
    [banners.map((b) => b.empresa_id)]
  );
}

/** Mesma ideia, pro banner_hero - só conta pra quem tem empresa_id atribuído
 * (banners institucionais sem empresa não têm quem acompanhar a métrica). */
export async function registrarVisualizacoesBannerHero(banners: HeroBanner[]): Promise<void> {
  const empresaIds = banners.map((b) => b.empresa_id).filter((id): id is string => !!id);
  if (empresaIds.length === 0) return;
  await query(`INSERT INTO empresa_eventos (empresa_id, tipo) SELECT unnest($1::uuid[]), 'visualizacao_banner_hero'`, [
    empresaIds,
  ]);
}

export type MeuBannerCategoria = {
  id: string;
  categoria_nome: string;
  inicio_em: string;
  fim_em: string;
  ativo: boolean;
};

/** "Meus anúncios" (painel da empresa) - histórico completo de Destaques da
 * semana contratados por essa empresa, ativos e passados (não só os
 * ativos agora, como listBannersAtivos faz pra home). */
export async function listMeusBannersCategoria(empresaId: string): Promise<MeuBannerCategoria[]> {
  return query<MeuBannerCategoria>(
    `SELECT b.id, c.nome AS categoria_nome, b.inicio_em, b.fim_em, (b.ativo AND now() BETWEEN b.inicio_em AND b.fim_em) AS ativo
     FROM banners_categoria b
     JOIN categorias c ON c.id = b.categoria_id
     WHERE b.empresa_id = $1
     ORDER BY b.inicio_em DESC`,
    [empresaId]
  );
}

export type MeuBannerHero = {
  id: string;
  titulo: string;
  ativo: boolean;
  criado_em: string;
};

/** Banners principais (hero) atribuídos a essa empresa pelo admin - ver
 * "Empresa anunciante" em components/admin/HeroBannerForm.tsx. */
export async function listMeusBannersHero(empresaId: string): Promise<MeuBannerHero[]> {
  return query<MeuBannerHero>(
    `SELECT id, titulo, ativo, criado_em FROM banners_hero WHERE empresa_id = $1 ORDER BY criado_em DESC`,
    [empresaId]
  );
}
