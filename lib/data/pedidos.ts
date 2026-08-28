import { query, queryOne } from "@/lib/db";

export type PedidoFeedItem = {
  id: string;
  tipo_evento: string;
  data_evento: string;
  cidade_nome: string;
  bairro_nome: string | null;
  descricao: string;
  orcamento_min: string | null;
  orcamento_max: string | null;
  categorias: string[];
  criado_em: string;
};

const PEDIDO_FEED_SELECT = `
  SELECT
    p.id, p.tipo_evento, p.data_evento, ci.nome AS cidade_nome, b.nome AS bairro_nome,
    p.descricao, p.orcamento_min, p.orcamento_max, p.criado_em,
    COALESCE(
      (SELECT array_agg(c.nome ORDER BY c.nome) FROM pedido_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE pc.pedido_id = p.id),
      ARRAY[]::text[]
    ) AS categorias
  FROM pedidos p
  JOIN cidades ci ON ci.id = p.cidade_id
  LEFT JOIN bairros b ON b.id = p.bairro_id
`;

export type PedidosFeedFiltros = {
  limit?: number;
  categoriaSlug?: string;
  cidadeId?: number;
  dataAPartirDe?: string;
};

export async function listPedidosFeed(filtros: PedidosFeedFiltros = {}): Promise<PedidoFeedItem[]> {
  const conditions: string[] = ["p.status = 'aberto'", "p.oculto_admin = false"];
  const params: unknown[] = [];

  if (filtros.categoriaSlug) {
    params.push(filtros.categoriaSlug);
    conditions.push(
      `EXISTS (SELECT 1 FROM pedido_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE pc.pedido_id = p.id AND c.slug = $${params.length})`
    );
  }
  if (filtros.cidadeId) {
    params.push(filtros.cidadeId);
    conditions.push(`p.cidade_id = $${params.length}`);
  }
  if (filtros.dataAPartirDe) {
    params.push(filtros.dataAPartirDe);
    conditions.push(`p.data_evento >= $${params.length}`);
  }

  params.push(filtros.limit ?? 10);
  return query<PedidoFeedItem>(
    `${PEDIDO_FEED_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY p.criado_em DESC LIMIT $${params.length}`,
    params
  );
}

export async function getPedidoById(id: string): Promise<PedidoFeedItem | null> {
  return queryOne<PedidoFeedItem>(`${PEDIDO_FEED_SELECT} WHERE p.id = $1`, [id]);
}

/** Pedidos em aberto que combinam com as categorias/cidades da empresa - o "lead"
 * que aparece no painel do fornecedor (secao 8 do plano: notificacao de lead compativel). */
export type PedidoLead = PedidoFeedItem & {
  telefone_temp: string;
  nome_temp: string;
  interesse_status: "interesse_manifestado" | "contato_liberado" | "recusado" | null;
};

export async function listPedidosCompativeis(empresaId: string): Promise<PedidoLead[]> {
  return query<PedidoLead>(
    `SELECT
       p.id, p.tipo_evento, p.data_evento, ci.nome AS cidade_nome, b.nome AS bairro_nome,
       p.descricao, p.orcamento_min, p.orcamento_max, p.criado_em, p.nome_temp, p.telefone_temp,
       COALESCE(
         (SELECT array_agg(c.nome ORDER BY c.nome) FROM pedido_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE pc.pedido_id = p.id),
         ARRAY[]::text[]
       ) AS categorias,
       pi.status AS interesse_status
     FROM pedidos p
     JOIN cidades ci ON ci.id = p.cidade_id
     LEFT JOIN bairros b ON b.id = p.bairro_id
     LEFT JOIN pedido_interesses pi ON pi.pedido_id = p.id AND pi.empresa_id = $1
     WHERE p.status = 'aberto'
       AND p.oculto_admin = false
       AND EXISTS (
         SELECT 1 FROM pedido_categorias pc
         JOIN empresa_categorias ec ON ec.categoria_id = pc.categoria_id AND ec.empresa_id = $1
         WHERE pc.pedido_id = p.id
       )
       AND EXISTS (
         SELECT 1 FROM empresa_areas_atuacao ea WHERE ea.empresa_id = $1 AND ea.cidade_id = p.cidade_id
       )
     ORDER BY p.criado_em DESC`,
    [empresaId]
  );
}

export type MeuPedido = PedidoFeedItem & {
  status: string;
  encontrado_pelo_site: boolean | null;
  empresasInteressadas: { empresa_id: string; empresa_slug: string; nome_fantasia: string; telefone_contato: string | null }[];
};

export async function listMeusPedidos(clienteUsuarioId: string): Promise<MeuPedido[]> {
  const pedidos = await query<PedidoFeedItem & { status: string; encontrado_pelo_site: boolean | null }>(
    `SELECT
       p.id, p.tipo_evento, p.data_evento, ci.nome AS cidade_nome, b.nome AS bairro_nome,
       p.descricao, p.orcamento_min, p.orcamento_max, p.criado_em, p.status, p.encontrado_pelo_site,
       COALESCE(
         (SELECT array_agg(c.nome ORDER BY c.nome) FROM pedido_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE pc.pedido_id = p.id),
         ARRAY[]::text[]
       ) AS categorias
     FROM pedidos p
     JOIN cidades ci ON ci.id = p.cidade_id
     LEFT JOIN bairros b ON b.id = p.bairro_id
     WHERE p.cliente_id = $1
     ORDER BY p.criado_em DESC`,
    [clienteUsuarioId]
  );

  const result: MeuPedido[] = [];
  for (const pedido of pedidos) {
    const interessadas = await query<{
      empresa_id: string;
      empresa_slug: string;
      nome_fantasia: string;
      telefone_contato: string | null;
    }>(
      `SELECT e.usuario_id AS empresa_id, e.slug AS empresa_slug, e.nome_fantasia, e.telefone_contato
       FROM pedido_interesses pi
       JOIN empresas e ON e.usuario_id = pi.empresa_id
       WHERE pi.pedido_id = $1 AND pi.status = 'contato_liberado'
       ORDER BY pi.criado_em ASC`,
      [pedido.id]
    );
    result.push({ ...pedido, empresasInteressadas: interessadas });
  }
  return result;
}
