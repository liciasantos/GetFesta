import { query, queryOne } from "@/lib/db";

export type PainelKpis = {
  visualizacoes: number;
  cliquesWhatsapp: number;
  pedidosRecebidos: number;
  taxaRespostaPct: string | null;
  tempoRespostaMedioMinutos: number | null;
};

export async function getPainelKpis(empresaId: string): Promise<PainelKpis> {
  const [visualizacoes, cliques, pedidosRecebidos, empresa] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT count(*) FROM empresa_eventos WHERE empresa_id = $1 AND tipo = 'visualizacao_perfil'`,
      [empresaId]
    ),
    queryOne<{ count: string }>(
      `SELECT count(*) FROM empresa_eventos WHERE empresa_id = $1 AND tipo = 'clique_whatsapp'`,
      [empresaId]
    ),
    queryOne<{ count: string }>(`SELECT count(*) FROM pedido_interesses WHERE empresa_id = $1`, [empresaId]),
    queryOne<{ taxa_resposta_pct: string | null; tempo_resposta_medio_minutos: number | null }>(
      `SELECT taxa_resposta_pct, tempo_resposta_medio_minutos FROM empresas WHERE usuario_id = $1`,
      [empresaId]
    ),
  ]);

  return {
    visualizacoes: Number(visualizacoes?.count ?? 0),
    cliquesWhatsapp: Number(cliques?.count ?? 0),
    pedidosRecebidos: Number(pedidosRecebidos?.count ?? 0),
    taxaRespostaPct: empresa?.taxa_resposta_pct ?? null,
    tempoRespostaMedioMinutos: empresa?.tempo_resposta_medio_minutos ?? null,
  };
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
