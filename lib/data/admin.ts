import { query, queryOne } from "@/lib/db";

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

export type EmpresaOption = { usuario_id: string; slug: string; nome_fantasia: string };

export async function listEmpresasParaSelect(): Promise<EmpresaOption[]> {
  return query<EmpresaOption>(`SELECT usuario_id, slug, nome_fantasia FROM empresas ORDER BY nome_fantasia ASC`);
}

export type HeroBannerAdmin = {
  id: string;
  titulo: string;
  texto: string | null;
  botao_label: string | null;
  botao_url: string | null;
  imagem_fundo: string;
  imagem_fundo_mobile: string | null;
  ativo: boolean;
  ordem: number;
};

export async function listHeroBannersAdmin(): Promise<HeroBannerAdmin[]> {
  return query<HeroBannerAdmin>(
    `SELECT id, titulo, texto, botao_label, botao_url, imagem_fundo, imagem_fundo_mobile, ativo, ordem
     FROM banners_hero ORDER BY ordem ASC, id ASC`
  );
}

export async function getHeroBannerAdmin(id: string): Promise<HeroBannerAdmin | null> {
  const rows = await query<HeroBannerAdmin>(
    `SELECT id, titulo, texto, botao_label, botao_url, imagem_fundo, imagem_fundo_mobile, ativo, ordem
     FROM banners_hero WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export type EmpresaAdmin = {
  usuario_id: string;
  slug: string;
  nome_fantasia: string;
  email: string | null;
  cidades: string[];
  selo_verificado: boolean;
  aprovada_para_destaque: boolean;
  perfil_reivindicado: boolean;
  ativo: boolean;
  criado_em: string;
};

export type ProfissionalAdmin = {
  usuario_id: string;
  slug: string;
  nome: string;
  email: string | null;
  categorias: string[];
  aprovada_para_destaque: boolean;
  nota_media: number | null;
  total_avaliacoes: number;
  criado_em: string;
};

export async function listProfissionaisAdmin(): Promise<ProfissionalAdmin[]> {
  return query<ProfissionalAdmin>(
    `SELECT
       p.usuario_id, p.slug, p.nome, u.email, p.aprovada_para_destaque, p.criado_em,
       COALESCE(
         (SELECT array_agg(cp.nome ORDER BY cp.nome) FROM profissional_categorias pc JOIN categorias_profissionais cp ON cp.id = pc.categoria_id WHERE pc.profissional_id = p.usuario_id),
         ARRAY[]::text[]
       ) AS categorias,
       (SELECT ROUND(AVG(ap.nota)::numeric, 1) FROM avaliacoes_profissional ap WHERE ap.profissional_id = p.usuario_id) AS nota_media,
       (SELECT COUNT(*)::int FROM avaliacoes_profissional ap WHERE ap.profissional_id = p.usuario_id) AS total_avaliacoes
     FROM profissionais p
     JOIN usuarios u ON u.id = p.usuario_id
     ORDER BY u.criado_em DESC`
  );
}

export type CompatibilidadeMatriz = {
  categoriasProfissionais: { id: number; nome: string }[];
  categorias: { id: number; nome: string }[];
  pares: string[]; // `${categoria_profissional_id}-${categoria_id}` de cada par ja compativel
};

export async function getCompatibilidadeMatriz(): Promise<CompatibilidadeMatriz> {
  const [categoriasProfissionais, categorias, pares] = await Promise.all([
    query<{ id: number; nome: string }>(`SELECT id, nome FROM categorias_profissionais ORDER BY nome`),
    query<{ id: number; nome: string }>(`SELECT id, nome FROM categorias ORDER BY nome`),
    query<{ categoria_profissional_id: number; categoria_id: number }>(
      `SELECT categoria_profissional_id, categoria_id FROM categoria_profissional_compatibilidade`
    ),
  ]);
  return {
    categoriasProfissionais,
    categorias,
    pares: pares.map((p) => `${p.categoria_profissional_id}-${p.categoria_id}`),
  };
}

export type PlanoPeriodoAdmin = {
  id: number;
  plano_id: number;
  plano_nome: string;
  meses: number;
  desconto_pct: string;
  ativo: boolean;
  valor_mensal: string;
};

export async function listPlanoPeriodosAdmin(): Promise<PlanoPeriodoAdmin[]> {
  return query<PlanoPeriodoAdmin>(
    `SELECT pp.id, pp.plano_id, p.nome AS plano_nome, pp.meses, pp.desconto_pct, pp.ativo, p.valor_mensal
     FROM plano_periodos pp
     JOIN planos p ON p.id = pp.plano_id
     WHERE p.tipo::text LIKE 'empresa_%' AND p.tipo != 'empresa_gratis'
     ORDER BY p.nome ASC, pp.meses ASC`
  );
}

export type PlanoParaSelect = { id: number; nome: string; valor_mensal: string; tipo: string };

export async function listPlanosEmpresaParaSelect(): Promise<PlanoParaSelect[]> {
  return query<PlanoParaSelect>(
    `SELECT id, nome, valor_mensal, tipo FROM planos WHERE tipo::text LIKE 'empresa_%' ORDER BY valor_mensal ASC`
  );
}

export type AssinaturaAdmin = {
  usuario_id: string;
  slug: string;
  nome_fantasia: string;
  email: string | null;
  assinatura_id: string | null;
  plano_id: number | null;
  plano_nome: string | null;
  valor_mensal: string | null;
  status: string | null;
  fim_em: string | null;
  dias_atraso: number | null;
};

/** Assinatura mais recente de cada empresa (uma empresa pode ter varias
 * linhas historicas em assinaturas - uma por troca/renovacao de plano). */
export async function listAssinaturasAdmin(): Promise<AssinaturaAdmin[]> {
  return query<AssinaturaAdmin>(
    `SELECT
       e.usuario_id, e.slug, e.nome_fantasia, u.email,
       a.id AS assinatura_id, a.plano_id, p.nome AS plano_nome, p.valor_mensal, a.status, a.fim_em,
       CASE WHEN a.status = 'atrasada' AND a.fim_em IS NOT NULL
            THEN GREATEST(0, EXTRACT(DAY FROM now() - a.fim_em))::int
            ELSE NULL END AS dias_atraso
     FROM empresas e
     JOIN usuarios u ON u.id = e.usuario_id
     LEFT JOIN LATERAL (
       SELECT * FROM assinaturas WHERE usuario_id = e.usuario_id ORDER BY criado_em DESC LIMIT 1
     ) a ON true
     LEFT JOIN planos p ON p.id = a.plano_id
     ORDER BY (a.status = 'atrasada') DESC, u.criado_em DESC`
  );
}

export type ClienteAdmin = {
  usuario_id: string;
  nome: string;
  email: string | null;
  cidade_nome: string | null;
  ativo: boolean;
  banido: boolean;
  total_pedidos: number;
  criado_em: string;
};

export async function listClientesAdmin(): Promise<ClienteAdmin[]> {
  return query<ClienteAdmin>(
    `SELECT
       c.usuario_id, c.nome, u.email, ci.nome AS cidade_nome, u.ativo, u.banido, u.criado_em,
       (SELECT COUNT(*)::int FROM pedidos pd WHERE pd.cliente_id = c.usuario_id) AS total_pedidos
     FROM clientes c
     JOIN usuarios u ON u.id = c.usuario_id
     LEFT JOIN cidades ci ON ci.id = c.cidade_id
     ORDER BY u.criado_em DESC`
  );
}

export type EstatisticasClientes = {
  totalClientes: number;
  totalPedidos: number;
  pedidosUltimos30Dias: number;
  clientesBanidos: number;
};

export async function getEstatisticasClientes(): Promise<EstatisticasClientes> {
  const row = await queryOne<{
    total_clientes: string;
    total_pedidos: string;
    pedidos_30_dias: string;
    clientes_banidos: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM usuarios WHERE tipo = 'cliente') AS total_clientes,
       (SELECT COUNT(*) FROM pedidos) AS total_pedidos,
       (SELECT COUNT(*) FROM pedidos WHERE criado_em >= now() - interval '30 days') AS pedidos_30_dias,
       (SELECT COUNT(*) FROM usuarios WHERE tipo = 'cliente' AND banido) AS clientes_banidos`
  );
  return {
    totalClientes: Number(row?.total_clientes ?? 0),
    totalPedidos: Number(row?.total_pedidos ?? 0),
    pedidosUltimos30Dias: Number(row?.pedidos_30_dias ?? 0),
    clientesBanidos: Number(row?.clientes_banidos ?? 0),
  };
}

export async function listEmpresasAdmin(): Promise<EmpresaAdmin[]> {
  return query<EmpresaAdmin>(
    `SELECT
       e.usuario_id, e.slug, e.nome_fantasia, u.email, u.ativo, u.criado_em,
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

// ---------------------------------------------------------------------
// DASHBOARD — contagens gerais e fluxo de caixa
// ---------------------------------------------------------------------

export type ContagemPerfis = { clientes: number; empresas: number; profissionais: number };

export async function getContagemPerfis(): Promise<ContagemPerfis> {
  const row = await query<{ tipo: string; total: string }>(
    `SELECT tipo, count(*) AS total FROM usuarios WHERE tipo IN ('cliente','empresa','profissional') GROUP BY tipo`
  );
  const porTipo = Object.fromEntries(row.map((r) => [r.tipo, Number(r.total)]));
  return {
    clientes: porTipo.cliente ?? 0,
    empresas: porTipo.empresa ?? 0,
    profissionais: porTipo.profissional ?? 0,
  };
}

export type FluxoCaixaResumo = { totalMes: number; totalAno: number };

export async function getFluxoCaixaResumo(): Promise<FluxoCaixaResumo> {
  const row = await queryOne<{ total_mes: string | null; total_ano: string | null }>(
    `SELECT
       (SELECT COALESCE(sum(valor), 0) FROM pagamentos WHERE status = 'aprovado' AND date_trunc('month', pago_em) = date_trunc('month', now())) AS total_mes,
       (SELECT COALESCE(sum(valor), 0) FROM pagamentos WHERE status = 'aprovado' AND date_trunc('year', pago_em) = date_trunc('year', now())) AS total_ano`
  );
  return { totalMes: Number(row?.total_mes ?? 0), totalAno: Number(row?.total_ano ?? 0) };
}

export type PagamentoAdmin = {
  id: string;
  empresa_nome: string;
  plano_nome: string;
  valor: string;
  pago_em: string | null;
  criado_em: string;
};

export async function listPagamentosAdmin(limit = 50): Promise<PagamentoAdmin[]> {
  return query<PagamentoAdmin>(
    `SELECT pg.id, e.nome_fantasia AS empresa_nome, p.nome AS plano_nome, pg.valor, pg.pago_em, pg.criado_em
     FROM pagamentos pg
     JOIN assinaturas a ON a.id = pg.assinatura_id
     JOIN empresas e ON e.usuario_id = a.usuario_id
     JOIN planos p ON p.id = a.plano_id
     WHERE pg.status = 'aprovado'
     ORDER BY pg.pago_em DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );
}

// ---------------------------------------------------------------------
// USUARIOS ADMIN — quem tem acesso ao painel administrativo
// ---------------------------------------------------------------------

export type AdminUsuario = { id: string; email: string | null; criado_em: string };

export async function listAdmins(): Promise<AdminUsuario[]> {
  return query<AdminUsuario>(`SELECT id, email, criado_em FROM usuarios WHERE tipo = 'admin' ORDER BY criado_em ASC`);
}

// ---------------------------------------------------------------------
// MODERACAO DE PEDIDOS
// ---------------------------------------------------------------------

export type PedidoAdmin = {
  id: string;
  tipo_evento: string;
  data_evento: string;
  cidade_nome: string;
  status: string;
  oculto_admin: boolean;
  nome_temp: string | null;
  criado_em: string;
};

export async function listPedidosAdmin(limit = 100): Promise<PedidoAdmin[]> {
  return query<PedidoAdmin>(
    `SELECT p.id, p.tipo_evento, p.data_evento, ci.nome AS cidade_nome, p.status, p.oculto_admin, p.nome_temp, p.criado_em
     FROM pedidos p
     JOIN cidades ci ON ci.id = p.cidade_id
     ORDER BY p.criado_em DESC
     LIMIT $1`,
    [limit]
  );
}
