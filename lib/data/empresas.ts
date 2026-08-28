import { query, queryOne } from "@/lib/db";

/**
 * Fragmento SQL da "nota exibida" (secao 14 do schema / cold start via Google):
 * usa a nota nativa quando ja existem avaliacoes suficientes (>=5); caso
 * contrario, cai para a nota importada do Google (se houver e estiver ativa);
 * se nao houver nenhuma das duas, fica null (perfil "novo na GetFesta").
 */
const NOTA_EXIBIDA_SQL = `
  CASE
    WHEN e.total_avaliacoes >= 5 THEN e.nota_media
    WHEN g.ativo IS TRUE THEN g.nota_media_google
    ELSE NULL
  END
`;
const NOTA_FONTE_SQL = `
  CASE
    WHEN e.total_avaliacoes >= 5 THEN 'nativa'
    WHEN g.ativo IS TRUE THEN 'google'
    ELSE 'nenhuma'
  END
`;

export type EmpresaCard = {
  usuario_id: string;
  nome_fantasia: string;
  logo_url: string | null;
  preco_a_partir_de: string | null;
  capacidade_convidados: number | null;
  selo_verificado: boolean;
  aprovada_para_destaque: boolean;
  tempo_resposta_medio_minutos: number | null;
  foto_capa: string | null;
  categorias: string[];
  cidades: string[];
  nota_exibida: string | null;
  nota_fonte: "nativa" | "google" | "nenhuma";
  total_avaliacoes_exibido: number;
  url_perfil_google: string | null;
  perfil_reivindicado: boolean;
};

const EMPRESA_CARD_SELECT = `
  SELECT
    e.usuario_id,
    e.nome_fantasia,
    e.logo_url,
    e.razao_social,
    e.descricao,
    e.instagram,
    e.telefone_contato,
    e.preco_a_partir_de,
    e.capacidade_convidados,
    e.selo_verificado,
    e.aprovada_para_destaque,
    e.tempo_resposta_medio_minutos,
    e.perfil_reivindicado,
    (SELECT url FROM empresa_galeria WHERE empresa_id = e.usuario_id ORDER BY ordem ASC LIMIT 1) AS foto_capa,
    COALESCE(
      (SELECT array_agg(c.nome ORDER BY c.nome) FROM empresa_categorias ec JOIN categorias c ON c.id = ec.categoria_id WHERE ec.empresa_id = e.usuario_id),
      ARRAY[]::text[]
    ) AS categorias,
    COALESCE(
      (SELECT array_agg(DISTINCT ci.nome) FROM empresa_areas_atuacao ea JOIN cidades ci ON ci.id = ea.cidade_id WHERE ea.empresa_id = e.usuario_id),
      ARRAY[]::text[]
    ) AS cidades,
    ${NOTA_EXIBIDA_SQL} AS nota_exibida,
    ${NOTA_FONTE_SQL} AS nota_fonte,
    CASE WHEN e.total_avaliacoes >= 5 THEN e.total_avaliacoes ELSE COALESCE(g.total_avaliacoes_google, 0) END AS total_avaliacoes_exibido,
    g.url_perfil_google
  FROM empresas e
  LEFT JOIN empresa_avaliacoes_google g ON g.empresa_id = e.usuario_id
`;

export async function getEmpresasDestaque(limit = 4): Promise<EmpresaCard[]> {
  return query<EmpresaCard>(
    `${EMPRESA_CARD_SELECT}
     WHERE (e.aprovada_para_destaque = true OR e.elegivel_destaque = true)
     ORDER BY random()
     LIMIT $1`,
    [limit]
  );
}

export type BuscaFiltros = {
  categoriaSlug?: string;
  cidadeId?: number;
  faixa?: "ate_700" | "700_3000" | "3000_8000" | "acima_8000";
};

export async function searchEmpresas(filtros: BuscaFiltros): Promise<EmpresaCard[]> {
  const conditions: string[] = ["1 = 1"];
  const params: unknown[] = [];

  if (filtros.categoriaSlug) {
    params.push(filtros.categoriaSlug);
    conditions.push(
      `EXISTS (SELECT 1 FROM empresa_categorias ec JOIN categorias c ON c.id = ec.categoria_id WHERE ec.empresa_id = e.usuario_id AND c.slug = $${params.length})`
    );
  }
  if (filtros.cidadeId) {
    params.push(filtros.cidadeId);
    conditions.push(
      `EXISTS (SELECT 1 FROM empresa_areas_atuacao ea WHERE ea.empresa_id = e.usuario_id AND ea.cidade_id = $${params.length})`
    );
  }
  if (filtros.faixa === "ate_700") {
    conditions.push(`(e.preco_a_partir_de IS NULL OR e.preco_a_partir_de <= 700)`);
  } else if (filtros.faixa === "700_3000") {
    conditions.push(`(e.preco_a_partir_de IS NULL OR e.preco_a_partir_de BETWEEN 700 AND 3000)`);
  } else if (filtros.faixa === "3000_8000") {
    conditions.push(`(e.preco_a_partir_de IS NULL OR e.preco_a_partir_de BETWEEN 3000 AND 8000)`);
  } else if (filtros.faixa === "acima_8000") {
    conditions.push(`(e.preco_a_partir_de IS NULL OR e.preco_a_partir_de >= 8000)`);
  }

  const sql = `${EMPRESA_CARD_SELECT}
    WHERE ${conditions.join(" AND ")}
    ORDER BY e.perfil_reivindicado DESC, e.aprovada_para_destaque DESC, nota_exibida DESC NULLS LAST, e.nome_fantasia ASC`;
  return query<EmpresaCard>(sql, params);
}

export type EmpresaPerfil = EmpresaCard & {
  razao_social: string;
  descricao: string | null;
  instagram: string | null;
  telefone_contato: string | null;
  estrutura: string[];
  galeria: { id: string; url: string; ordem: number }[];
  pacotes: { id: string; nome: string; descricao: string | null; preco: string | null }[];
  avaliacoes: { nota: number; comentario: string | null; criado_em: string }[];
};

export async function getEmpresaById(id: string): Promise<EmpresaPerfil | null> {
  const base = await queryOne<
    EmpresaCard & { razao_social: string; descricao: string | null; instagram: string | null; telefone_contato: string | null }
  >(
    `${EMPRESA_CARD_SELECT}
     WHERE e.usuario_id = $1`,
    [id]
  );
  if (!base) return null;

  const [estruturaRows, galeria, pacotes, avaliacoes] = await Promise.all([
    query<{ item: string }>(`SELECT item FROM empresa_estrutura WHERE empresa_id = $1`, [id]),
    query<{ id: string; url: string; ordem: number }>(
      `SELECT id, url, ordem FROM empresa_galeria WHERE empresa_id = $1 ORDER BY ordem ASC`,
      [id]
    ),
    query<{ id: string; nome: string; descricao: string | null; preco: string | null }>(
      `SELECT id, nome, descricao, preco FROM empresa_pacotes WHERE empresa_id = $1 ORDER BY preco ASC NULLS LAST`,
      [id]
    ),
    query<{ nota: number; comentario: string | null; criado_em: string }>(
      `SELECT nota, comentario, criado_em FROM avaliacoes WHERE empresa_id = $1 ORDER BY criado_em DESC LIMIT 10`,
      [id]
    ),
  ]);

  return {
    ...base,
    estrutura: estruturaRows.map((r) => r.item),
    galeria,
    pacotes,
    avaliacoes,
  };
}

/** Instagram/telefone só ficam visíveis se o cliente logado tiver ao menos um
 * pedido em que essa empresa manifestou interesse (contato liberado). */
export async function contatoLiberadoParaCliente(empresaId: string, clienteUsuarioId: string): Promise<boolean> {
  const row = await queryOne<{ liberado: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pedido_interesses pi
       JOIN pedidos p ON p.id = pi.pedido_id
       WHERE pi.empresa_id = $1 AND p.cliente_id = $2 AND pi.status = 'contato_liberado'
     ) AS liberado`,
    [empresaId, clienteUsuarioId]
  );
  return row?.liberado ?? false;
}

export type AvaliacaoGoogle = {
  googlePlaceId: string | null;
  notaMediaGoogle: string;
  totalAvaliacoesGoogle: number;
  urlPerfilGoogle: string;
  ativo: boolean;
};

/** Dado bruto da avaliacao do Google importada pela propria empresa, pra pre-preencher o formulario de edicao. */
export async function getAvaliacaoGoogle(empresaId: string): Promise<AvaliacaoGoogle | null> {
  const row = await queryOne<{
    google_place_id: string | null;
    nota_media_google: string;
    total_avaliacoes_google: number;
    url_perfil_google: string;
    ativo: boolean;
  }>(
    `SELECT google_place_id, nota_media_google, total_avaliacoes_google, url_perfil_google, ativo
     FROM empresa_avaliacoes_google WHERE empresa_id = $1`,
    [empresaId]
  );
  if (!row) return null;
  return {
    googlePlaceId: row.google_place_id,
    notaMediaGoogle: row.nota_media_google,
    totalAvaliacoesGoogle: row.total_avaliacoes_google,
    urlPerfilGoogle: row.url_perfil_google,
    ativo: row.ativo,
  };
}

export async function getNomeFantasia(empresaId: string): Promise<string | null> {
  const row = await queryOne<{ nome_fantasia: string }>(`SELECT nome_fantasia FROM empresas WHERE usuario_id = $1`, [
    empresaId,
  ]);
  return row?.nome_fantasia ?? null;
}

export async function registrarVisualizacaoPerfil(empresaId: string) {
  await query(`INSERT INTO empresa_eventos (empresa_id, tipo) VALUES ($1, 'visualizacao_perfil')`, [empresaId]);
}

export type PlataformaStats = {
  totalEmpresas: number;
  totalCidades: number;
  tempoRespostaMedioMinutos: number | null;
};

/** Números de prova social exibidos na home (secao 8 do plano). Sem dado
 * suficiente ainda, a home mostra uma faixa de lancamento em vez de zeros. */
export async function getEstatisticasPlataforma(): Promise<PlataformaStats> {
  const row = await queryOne<{ total_empresas: string; total_cidades: string; tempo_resposta_medio: string | null }>(`
    SELECT
      (SELECT COUNT(*) FROM empresas) AS total_empresas,
      (SELECT COUNT(DISTINCT cidade_id) FROM empresa_areas_atuacao) AS total_cidades,
      (SELECT AVG(tempo_resposta_medio_minutos) FROM empresas WHERE tempo_resposta_medio_minutos > 0) AS tempo_resposta_medio
  `);
  return {
    totalEmpresas: Number(row?.total_empresas ?? 0),
    totalCidades: Number(row?.total_cidades ?? 0),
    tempoRespostaMedioMinutos: row?.tempo_resposta_medio ? Math.round(Number(row.tempo_resposta_medio)) : null,
  };
}
