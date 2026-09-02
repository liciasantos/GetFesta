import { query, queryOne } from "@/lib/db";

export type CategoriaProfissional = { id: number; slug: string; nome: string };

export async function listCategoriasProfissionais(): Promise<CategoriaProfissional[]> {
  return query<CategoriaProfissional>(`SELECT id, slug, nome FROM categorias_profissionais ORDER BY nome`);
}

export type PerfilProfissional = {
  usuario_id: string;
  slug: string;
  nome: string;
  foto_perfil_url: string | null;
  bairro_id: number | null;
  bairro_nome: string | null;
  cidade_id: number | null;
  cidade_nome: string | null;
  disponibilidade_status: "disponivel" | "indisponivel" | "nao_informado";
  sexo: string | null;
  medidas_habilitadas: boolean;
  altura_cm: number | null;
  peso_kg: number | null;
  cintura_cm: number | null;
  manequim: string | null;
  calcado: string | null;
  tem_tatuagem: string | null;
  nota_media: number | null;
  total_avaliacoes: number;
  portfolio_pdf_url: string | null;
  portfolio_pdf_nome: string | null;
  portfolio_liberado_gratis: boolean;
  categorias: { id: number; nome: string }[];
  galeria: { id: string; url: string }[];
  videoLinks: { id: string; url: string }[];
};

/** Aceita tanto o slug (URL bonita, /profissional/nome-sobrenome) quanto o
 * uuid antigo - links já existentes continuam funcionando. */
export async function getMeuPerfilProfissional(idOuSlug: string): Promise<PerfilProfissional | null> {
  const base = await queryOne<{
    usuario_id: string;
    slug: string;
    nome: string;
    foto_perfil_url: string | null;
    bairro_id: number | null;
    bairro_nome: string | null;
    cidade_id: number | null;
    cidade_nome: string | null;
    disponibilidade_status: "disponivel" | "indisponivel" | "nao_informado";
    sexo: string | null;
    medidas_habilitadas: boolean;
    altura_cm: number | null;
    peso_kg: number | null;
    cintura_cm: number | null;
    manequim: string | null;
    calcado: string | null;
    tem_tatuagem: string | null;
    nota_media: number | null;
    total_avaliacoes: number;
    portfolio_pdf_url: string | null;
    portfolio_pdf_nome: string | null;
    portfolio_liberado_gratis: boolean;
  }>(
    `SELECT p.usuario_id, p.slug, p.nome, p.foto_perfil_url, p.bairro_id, b.nome AS bairro_nome,
            ci.id AS cidade_id, ci.nome AS cidade_nome, p.disponibilidade_status,
            p.sexo, p.medidas_habilitadas, p.altura_cm, p.peso_kg, p.cintura_cm, p.manequim, p.calcado, p.tem_tatuagem,
            (SELECT ROUND(AVG(ap.nota)::numeric, 1) FROM avaliacoes_profissional ap WHERE ap.profissional_id = p.usuario_id) AS nota_media,
            (SELECT COUNT(*)::int FROM avaliacoes_profissional ap WHERE ap.profissional_id = p.usuario_id) AS total_avaliacoes,
            p.portfolio_pdf_url, p.portfolio_pdf_nome, p.portfolio_liberado_gratis
     FROM profissionais p
     LEFT JOIN bairros b ON b.id = p.bairro_id
     LEFT JOIN cidades ci ON ci.id = b.cidade_id
     WHERE p.usuario_id::text = $1 OR p.slug = $1`,
    [idOuSlug]
  );
  if (!base) return null;
  const usuarioId = base.usuario_id;

  const [categorias, galeria, videoLinks] = await Promise.all([
    query<{ id: number; nome: string }>(
      `SELECT cp.id, cp.nome
       FROM profissional_categorias pc
       JOIN categorias_profissionais cp ON cp.id = pc.categoria_id
       WHERE pc.profissional_id = $1
       ORDER BY cp.nome`,
      [usuarioId]
    ),
    query<{ id: string; url: string }>(
      `SELECT id, url FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'foto' ORDER BY ordem ASC`,
      [usuarioId]
    ),
    query<{ id: string; url: string }>(
      `SELECT id, url FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'video_link' ORDER BY ordem ASC`,
      [usuarioId]
    ),
  ]);

  return { ...base, categorias, galeria, videoLinks };
}

/** Telefone fica em usuarios, não em profissionais - só usado quando uma
 * empresa autenticada precisa contatar o profissional (ex.: candidatura a
 * uma vaga ou visita ao perfil dele). */
export async function getTelefoneProfissional(usuarioId: string): Promise<string | null> {
  const row = await queryOne<{ telefone: string | null }>(`SELECT telefone FROM usuarios WHERE id = $1`, [usuarioId]);
  return row?.telefone ?? null;
}

export type ProfissionalBusca = {
  usuario_id: string;
  slug: string;
  nome: string;
  foto: string | null;
  bairro_nome: string | null;
  cidade_nome: string | null;
  categoria_principal: string | null;
  nota_media: number | null;
  total_avaliacoes: number;
  aprovada_para_destaque: boolean;
};

/** Profissionais visíveis pra essa empresa - regra de negócio: um profissional
 * só aparece se pelo menos uma das funções dele (ex.: Cozinheiro) for
 * compatível com pelo menos uma das categorias de serviço da empresa (ex.:
 * Buffet), via categoria_profissional_compatibilidade (ver /admin, mapa
 * seedado em db/backfill... n/a, seed direto na migração). Ordenado por nota
 * média (feedback das empresas) - quem nunca foi avaliado vai por último.
 * apenasDestaque=true filtra só quem pagou pra aparecer em destaque. */
export async function listProfissionaisCompativeis(empresaId: string, apenasDestaque = false): Promise<ProfissionalBusca[]> {
  return query<ProfissionalBusca>(
    `SELECT DISTINCT
        p.usuario_id, p.slug, p.nome,
        COALESCE(
          p.foto_perfil_url,
          (SELECT url FROM profissional_galeria g WHERE g.profissional_id = p.usuario_id AND g.tipo = 'foto' ORDER BY g.ordem ASC LIMIT 1)
        ) AS foto,
        b.nome AS bairro_nome, ci.nome AS cidade_nome,
        (
          SELECT cp2.nome FROM profissional_categorias pc2
          JOIN categorias_profissionais cp2 ON cp2.id = pc2.categoria_id
          WHERE pc2.profissional_id = p.usuario_id ORDER BY cp2.nome LIMIT 1
        ) AS categoria_principal,
        (SELECT ROUND(AVG(ap.nota)::numeric, 1) FROM avaliacoes_profissional ap WHERE ap.profissional_id = p.usuario_id) AS nota_media,
        (SELECT COUNT(*)::int FROM avaliacoes_profissional ap WHERE ap.profissional_id = p.usuario_id) AS total_avaliacoes,
        p.aprovada_para_destaque
     FROM profissionais p
     JOIN profissional_categorias pc ON pc.profissional_id = p.usuario_id
     JOIN categoria_profissional_compatibilidade comp ON comp.categoria_profissional_id = pc.categoria_id
     JOIN empresa_categorias ec ON ec.categoria_id = comp.categoria_id AND ec.empresa_id = $1
     LEFT JOIN bairros b ON b.id = p.bairro_id
     LEFT JOIN cidades ci ON ci.id = b.cidade_id
     WHERE ($2::boolean = false OR p.aprovada_para_destaque = true)
     ORDER BY nota_media DESC NULLS LAST, nome ASC
     LIMIT 30`,
    [empresaId, apenasDestaque]
  );
}

