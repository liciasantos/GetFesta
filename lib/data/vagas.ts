import { query, queryOne } from "@/lib/db";

export type VagaFeedItem = {
  id: string;
  categoria_nome: string;
  cidade_nome: string;
  bairro_nome: string | null;
  data_evento: string;
  hora_inicio: string;
  duracao_horas: string;
  valor: string | null;
  descricao: string;
  criado_em: string;
  empresa_nome_fantasia: string;
  sexo_desejado: string;
  /** status da vaga em si (aberta/preenchida/cancelada) - junto com
   * candidatura_status, decide o que mostrar pro profissional (ver
   * app/perfil-profissional/page.tsx). */
  status: string;
  /** status da candidatura desse profissional especifico nessa vaga
   * ('candidatado'/'selecionado'/'recusado') - null quando ele nunca se
   * candidatou. */
  candidatura_status: string | null;
  /** quantas pessoas a empresa precisa pra essa vaga, e quantas já foram
   * selecionadas - dá pro profissional uma ideia da concorrência (ex.: "vaga
   * pra 3 pessoas, 1 já selecionada"). */
  vagas_desejadas: number;
  vagas_selecionadas: number;
};

/** Vagas que o profissional pode ver: as em aberto que combinam com suas
 * funções e estado (mesmo padrão de "lead compatível" já usado pra pedidos
 * no painel da empresa, lib/data/pedidos.ts:listPedidosCompativeis, só que
 * na direção inversa) MAIS qualquer vaga que ele já se candidatou antes,
 * mesmo que ela tenha sido preenchida/cancelada depois - assim ele continua
 * vendo o resultado da candidatura (selecionado ou nao) em vez da vaga
 * simplesmente sumir da lista. Compara por estado (nao cidade) pra nao
 * esconder vagas de cidades vizinhas na mesma regiao metropolitana (ex.:
 * profissional de Nilopolis ve vaga na capital do RJ). sexo_desejado=
 * 'indiferente' aparece pra todo mundo; senão, só combina se bater com o
 * sexo do profissional (quem é nao_binario/prefiro_nao_informar ou nao
 * informou so ve vagas indiferentes). */
export async function listVagasCompativeis(profissionalId: string): Promise<(VagaFeedItem & { ja_candidatado: boolean })[]> {
  return query<VagaFeedItem & { ja_candidatado: boolean }>(
    `SELECT
       v.id, cp.nome AS categoria_nome, ci.nome AS cidade_nome, b.nome AS bairro_nome,
       v.data_evento, v.hora_inicio, v.duracao_horas, v.valor, v.descricao, v.criado_em, v.sexo_desejado,
       v.status, v.vagas_desejadas,
       (SELECT count(*)::int FROM vaga_candidaturas vc2 WHERE vc2.vaga_id = v.id AND vc2.status = 'selecionado') AS vagas_selecionadas,
       e.nome_fantasia AS empresa_nome_fantasia,
       vc.status AS candidatura_status,
       (vc.id IS NOT NULL) AS ja_candidatado
     FROM vagas_profissionais v
     JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
     JOIN cidades ci ON ci.id = v.cidade_id
     LEFT JOIN bairros b ON b.id = v.bairro_id
     JOIN empresas e ON e.usuario_id = v.empresa_id
     JOIN profissionais p ON p.usuario_id = $1
     LEFT JOIN bairros pb ON pb.id = p.bairro_id
     LEFT JOIN cidades pci ON pci.id = pb.cidade_id
     LEFT JOIN vaga_candidaturas vc ON vc.vaga_id = v.id AND vc.profissional_id = $1
     WHERE (
       (v.status = 'aberta'
        AND pci.estado = ci.estado
        AND (v.sexo_desejado = 'indiferente' OR v.sexo_desejado = p.sexo)
        AND EXISTS (
          SELECT 1 FROM profissional_categorias pc WHERE pc.profissional_id = $1 AND pc.categoria_id = v.categoria_profissional_id
        ))
       OR vc.id IS NOT NULL
     )
     ORDER BY v.criado_em DESC`,
    [profissionalId]
  );
}

export type MinhaVaga = {
  id: string;
  categoria_nome: string;
  cidade_nome: string;
  bairro_nome: string | null;
  data_evento: string;
  hora_inicio: string;
  duracao_horas: string;
  valor: string | null;
  descricao: string;
  criado_em: string;
  status: string;
  sexo_desejado: string;
  vagas_desejadas: number;
  total_candidatos: number;
  total_selecionados: number;
  realizada: boolean;
};

const MINHA_VAGA_SELECT = `
  SELECT
    v.id, cp.nome AS categoria_nome, ci.nome AS cidade_nome, b.nome AS bairro_nome,
    v.data_evento, v.hora_inicio, v.duracao_horas, v.valor, v.descricao, v.criado_em, v.status, v.sexo_desejado,
    v.vagas_desejadas,
    (v.data_evento < CURRENT_DATE) AS realizada,
    (SELECT count(*)::int FROM vaga_candidaturas vc WHERE vc.vaga_id = v.id) AS total_candidatos,
    (SELECT count(*)::int FROM vaga_candidaturas vc WHERE vc.vaga_id = v.id AND vc.status = 'selecionado') AS total_selecionados
  FROM vagas_profissionais v
  JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
  JOIN cidades ci ON ci.id = v.cidade_id
  LEFT JOIN bairros b ON b.id = v.bairro_id
`;

export async function listMinhasVagas(empresaId: string): Promise<MinhaVaga[]> {
  return query<MinhaVaga>(`${MINHA_VAGA_SELECT} WHERE v.empresa_id = $1 ORDER BY v.criado_em DESC`, [empresaId]);
}

export async function getVagaDaEmpresa(vagaId: string, empresaId: string): Promise<MinhaVaga | null> {
  return queryOne<MinhaVaga>(`${MINHA_VAGA_SELECT} WHERE v.id = $1 AND v.empresa_id = $2`, [vagaId, empresaId]);
}

export type CandidatoVaga = {
  profissional_id: string;
  profissional_slug: string;
  nome: string;
  foto_perfil_url: string | null;
  telefone: string | null;
  candidatado_em: string;
  /** 'candidatado' | 'selecionado' | 'recusado' */
  status: string;
};

/** Contato do profissional só é retornado pra empresa dona da vaga (join com
 * vagas_profissionais.empresa_id = $2) - segue a mesma regra do resto do
 * schema: profissional é visível pra empresa autenticada, nunca pra terceiros. */
export async function listCandidatosDaVaga(vagaId: string, empresaId: string): Promise<CandidatoVaga[]> {
  return query<CandidatoVaga>(
    `SELECT p.usuario_id AS profissional_id, p.slug AS profissional_slug, p.nome, p.foto_perfil_url, u.telefone,
            vc.criado_em AS candidatado_em, vc.status
     FROM vaga_candidaturas vc
     JOIN vagas_profissionais v ON v.id = vc.vaga_id AND v.empresa_id = $2
     JOIN profissionais p ON p.usuario_id = vc.profissional_id
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE vc.vaga_id = $1
     ORDER BY vc.criado_em ASC`,
    [vagaId, empresaId]
  );
}

export type AvaliacaoVaga = { nota: number; comentario: string | null };

export async function getAvaliacaoDaVaga(vagaId: string, empresaId: string, profissionalId: string): Promise<AvaliacaoVaga | null> {
  return queryOne<AvaliacaoVaga>(
    `SELECT nota, comentario FROM avaliacoes_profissional WHERE vaga_id = $1 AND empresa_id = $2 AND profissional_id = $3`,
    [vagaId, empresaId, profissionalId]
  );
}

export type VagaConcluidaEmpresa = {
  id: string;
  categoria_nome: string;
  data_evento: string;
  valor: string | null;
  profissional_selecionado_nome: string | null;
  profissional_selecionado_slug: string | null;
};

// uma linha por contratação (não por vaga) - uma vaga com vagas_desejadas=3
// aparece 3 vezes aqui, uma pra cada profissional selecionado.
const VAGA_CONCLUIDA_EMPRESA_SELECT = `
  SELECT v.id, cp.nome AS categoria_nome, v.data_evento, v.valor,
         sel.nome AS profissional_selecionado_nome, sel.slug AS profissional_selecionado_slug
  FROM vaga_candidaturas vc
  JOIN vagas_profissionais v ON v.id = vc.vaga_id
  JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
  JOIN profissionais sel ON sel.usuario_id = vc.profissional_id
  WHERE v.empresa_id = $1 AND v.status = 'preenchida' AND vc.status = 'selecionado'
`;

/** Histórico de vagas concluídas da empresa - usado tanto no card resumido
 * (5 mais recentes) quanto na página de histórico completo (paginada). */
export async function listVagasConcluidasEmpresa(
  empresaId: string,
  { limit, offset = 0 }: { limit: number; offset?: number }
): Promise<VagaConcluidaEmpresa[]> {
  return query<VagaConcluidaEmpresa>(
    `${VAGA_CONCLUIDA_EMPRESA_SELECT} ORDER BY v.data_evento DESC LIMIT $2 OFFSET $3`,
    [empresaId, limit, offset]
  );
}

export async function countVagasConcluidasEmpresa(empresaId: string): Promise<number> {
  const row = await queryOne<{ total: string }>(
    `SELECT COUNT(*) AS total
     FROM vaga_candidaturas vc
     JOIN vagas_profissionais v ON v.id = vc.vaga_id
     WHERE v.empresa_id = $1 AND v.status = 'preenchida' AND vc.status = 'selecionado'`,
    [empresaId]
  );
  return Number(row?.total ?? 0);
}

export type VagaConcluidaProfissional = {
  id: string;
  categoria_nome: string;
  data_evento: string;
  valor: string | null;
  empresa_nome_fantasia: string;
  empresa_slug: string;
};

const VAGA_CONCLUIDA_PROFISSIONAL_SELECT = `
  SELECT v.id, cp.nome AS categoria_nome, v.data_evento, v.valor,
         e.nome_fantasia AS empresa_nome_fantasia, e.slug AS empresa_slug
  FROM vaga_candidaturas vc
  JOIN vagas_profissionais v ON v.id = vc.vaga_id
  JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
  JOIN empresas e ON e.usuario_id = v.empresa_id
  WHERE vc.profissional_id = $1 AND v.status = 'preenchida' AND vc.status = 'selecionado'
`;

/** Histórico de vagas concluídas do profissional - mesmo padrão do lado da
 * empresa (card resumido + página de histórico paginada). */
export async function listVagasConcluidasProfissional(
  profissionalId: string,
  { limit, offset = 0 }: { limit: number; offset?: number }
): Promise<VagaConcluidaProfissional[]> {
  return query<VagaConcluidaProfissional>(
    `${VAGA_CONCLUIDA_PROFISSIONAL_SELECT} ORDER BY v.data_evento DESC LIMIT $2 OFFSET $3`,
    [profissionalId, limit, offset]
  );
}

export async function countVagasConcluidasProfissional(profissionalId: string): Promise<number> {
  const row = await queryOne<{ total: string }>(
    `SELECT COUNT(*) AS total
     FROM vaga_candidaturas vc
     JOIN vagas_profissionais v ON v.id = vc.vaga_id
     WHERE vc.profissional_id = $1 AND v.status = 'preenchida' AND vc.status = 'selecionado'`,
    [profissionalId]
  );
  return Number(row?.total ?? 0);
}
