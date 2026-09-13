import { query, queryOne } from "@/lib/db";

export type PainelKpis = {
  visualizacoes: number;
  visualizacoesVariacaoPct: number | null;
  cliquesWhatsapp: number;
  cliquesWhatsappVariacaoPct: number | null;
  visualizacoesBanner: number;
  visualizacoesBannerVariacaoPct: number | null;
  cliquesBanner: number;
  cliquesBannerVariacaoPct: number | null;
  pedidosRecebidos: number;
  pedidosRecebidosVariacaoPct: number | null;
  taxaRespostaPct: string | null;
  tempoRespostaMedioMinutos: number | null;
};

/** % de variação entre a janela atual (últimos 7 dias) e a anterior (7 dias
 * antes dela) - null quando não dá pra calcular de forma útil (não tinha
 * nenhum evento na janela anterior pra comparar). */
function calcularVariacaoPct(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

type ContagemPorPeriodo = { total: string; atual: string; anterior: string };

const FILTRO_JANELAS = `
  count(*) AS total,
  count(*) FILTER (WHERE criado_em >= now() - interval '7 days') AS atual,
  count(*) FILTER (WHERE criado_em < now() - interval '7 days' AND criado_em >= now() - interval '14 days') AS anterior
`;

export async function getPainelKpis(empresaId: string): Promise<PainelKpis> {
  const [eventosPorTipo, pedidos, empresa] = await Promise.all([
    query<{ tipo: string } & ContagemPorPeriodo>(
      `SELECT tipo::text AS tipo, ${FILTRO_JANELAS} FROM empresa_eventos WHERE empresa_id = $1 GROUP BY tipo`,
      [empresaId]
    ),
    queryOne<ContagemPorPeriodo>(`SELECT ${FILTRO_JANELAS} FROM pedido_interesses WHERE empresa_id = $1`, [empresaId]),
    queryOne<{ taxa_resposta_pct: string | null; tempo_resposta_medio_minutos: number | null }>(
      `SELECT taxa_resposta_pct, tempo_resposta_medio_minutos FROM empresas WHERE usuario_id = $1`,
      [empresaId]
    ),
  ]);

  // soma as linhas (agrupadas por tipo) que pertencem a essa métrica - visão
  // do banner junta hero+categoria num número só, o resto é 1 tipo cada.
  const somar = (tipos: string[]) =>
    eventosPorTipo
      .filter((r) => tipos.includes(r.tipo))
      .reduce(
        (soma, r) => ({
          total: soma.total + Number(r.total),
          atual: soma.atual + Number(r.atual),
          anterior: soma.anterior + Number(r.anterior),
        }),
        { total: 0, atual: 0, anterior: 0 }
      );

  const visualizacoes = somar(["visualizacao_perfil"]);
  const cliques = somar(["clique_whatsapp"]);
  const visualizacoesBanner = somar(["visualizacao_banner_hero", "visualizacao_banner_categoria"]);
  const cliquesBanner = somar(["clique_banner_hero", "clique_banner_categoria"]);
  const pedidosTotal = Number(pedidos?.total ?? 0);
  const pedidosAtual = Number(pedidos?.atual ?? 0);
  const pedidosAnterior = Number(pedidos?.anterior ?? 0);

  return {
    visualizacoes: visualizacoes.total,
    visualizacoesVariacaoPct: calcularVariacaoPct(visualizacoes.atual, visualizacoes.anterior),
    cliquesWhatsapp: cliques.total,
    cliquesWhatsappVariacaoPct: calcularVariacaoPct(cliques.atual, cliques.anterior),
    visualizacoesBanner: visualizacoesBanner.total,
    visualizacoesBannerVariacaoPct: calcularVariacaoPct(visualizacoesBanner.atual, visualizacoesBanner.anterior),
    cliquesBanner: cliquesBanner.total,
    cliquesBannerVariacaoPct: calcularVariacaoPct(cliquesBanner.atual, cliquesBanner.anterior),
    pedidosRecebidos: pedidosTotal,
    pedidosRecebidosVariacaoPct: calcularVariacaoPct(pedidosAtual, pedidosAnterior),
    taxaRespostaPct: empresa?.taxa_resposta_pct ?? null,
    tempoRespostaMedioMinutos: empresa?.tempo_resposta_medio_minutos ?? null,
  };
}

export type AtividadeRecente = {
  tipo:
    | "visualizacao_perfil"
    | "clique_whatsapp"
    | "visualizacao_banner"
    | "clique_banner"
    | "pedido_compativel"
    | "candidatura_vaga";
  criado_em: string;
};

/** Feed cronológico simples misturando os eventos que já rastreamos
 * (empresa_eventos), novos pedidos compatíveis e novas candidaturas nas
 * vagas publicadas por essa empresa - mesmo espírito do "Atividades
 * recentes" do mockup, sem precisar de nenhuma tabela nova. */
export async function getAtividadesRecentes(empresaId: string, limit = 8): Promise<AtividadeRecente[]> {
  return query<AtividadeRecente>(
    `(
       SELECT
         CASE
           WHEN tipo IN ('visualizacao_banner_hero', 'visualizacao_banner_categoria') THEN 'visualizacao_banner'
           WHEN tipo IN ('clique_banner_hero', 'clique_banner_categoria') THEN 'clique_banner'
           ELSE tipo::text
         END AS tipo,
         criado_em
       FROM empresa_eventos WHERE empresa_id = $1
     )
     UNION ALL
     (SELECT 'pedido_compativel' AS tipo, criado_em FROM pedido_interesses WHERE empresa_id = $1)
     UNION ALL
     (SELECT 'candidatura_vaga' AS tipo, vc.criado_em
      FROM vaga_candidaturas vc JOIN vagas_profissionais v ON v.id = vc.vaga_id
      WHERE v.empresa_id = $1)
     ORDER BY criado_em DESC
     LIMIT $2`,
    [empresaId, limit]
  );
}

export type AssinaturaInfo = {
  status: string;
  plano_id: number;
  plano_nome: string;
  fim_em: string | null;
};

export async function getAssinaturaAtiva(usuarioId: string): Promise<AssinaturaInfo | null> {
  return queryOne<AssinaturaInfo>(
    `SELECT a.status, a.plano_id, pl.nome AS plano_nome, a.fim_em
     FROM assinaturas a
     JOIN planos pl ON pl.id = a.plano_id
     WHERE a.usuario_id = $1
     ORDER BY a.criado_em DESC
     LIMIT 1`,
    [usuarioId]
  );
}

export type PlanoEmpresa = { id: number; nome: string; valor_mensal: string; limite_orcamentos_mes: number | null };

export async function listPlanosEmpresa(): Promise<PlanoEmpresa[]> {
  return query<PlanoEmpresa>(
    `SELECT id, nome, valor_mensal, limite_orcamentos_mes FROM planos WHERE tipo::text LIKE 'empresa_%' AND ativo = true ORDER BY valor_mensal ASC`
  );
}

export type PlanoPeriodoEmpresa = { id: number; plano_id: number; meses: number; desconto_pct: string };

/** Periodicidades ativas (1/3/12/24 meses etc.) pra planos pagos de empresa -
 * usado no seletor de plano do painel pra mostrar o desconto por período. */
export async function listPeriodosEmpresa(): Promise<PlanoPeriodoEmpresa[]> {
  return query<PlanoPeriodoEmpresa>(
    `SELECT pp.id, pp.plano_id, pp.meses, pp.desconto_pct
     FROM plano_periodos pp
     JOIN planos p ON p.id = pp.plano_id
     WHERE pp.ativo = true AND p.tipo::text LIKE 'empresa_%'
     ORDER BY pp.meses ASC`
  );
}

export type VinculoProfissional = {
  profissional_id: string;
  nome: string;
  status: string;
};

export async function listVinculos(empresaId: string): Promise<VinculoProfissional[]> {
  return query<VinculoProfissional>(
    `SELECT pr.usuario_id AS profissional_id, pr.nome, v.status
     FROM profissional_empresa_vinculo v
     JOIN profissionais pr ON pr.usuario_id = v.profissional_id
     WHERE v.empresa_id = $1
     ORDER BY v.criado_em DESC`,
    [empresaId]
  );
}
