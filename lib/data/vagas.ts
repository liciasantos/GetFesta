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
};

/** Vagas em aberto que combinam com as funções e o estado do profissional -
 * mesmo padrão de "lead compatível" já usado pra pedidos no painel da empresa
 * (lib/data/pedidos.ts:listPedidosCompativeis), só que na direção inversa.
 * Compara por estado (nao cidade) pra nao esconder vagas de cidades vizinhas
 * na mesma regiao metropolitana (ex.: profissional de Nilopolis via vaga na
 * capital do RJ). sexo_desejado='indiferente' aparece pra todo mundo; senão,
 * só combina se bater com o sexo do profissional (quem é
 * nao_binario/prefiro_nao_informar ou nao informou so ve vagas indiferentes). */
export async function listVagasCompativeis(profissionalId: string): Promise<(VagaFeedItem & { ja_candidatado: boolean })[]> {
  return query<VagaFeedItem & { ja_candidatado: boolean }>(
    `SELECT
       v.id, cp.nome AS categoria_nome, ci.nome AS cidade_nome, b.nome AS bairro_nome,
       v.data_evento, v.hora_inicio, v.duracao_horas, v.valor, v.descricao, v.criado_em, v.sexo_desejado,
       e.nome_fantasia AS empresa_nome_fantasia,
       EXISTS (SELECT 1 FROM vaga_candidaturas vc WHERE vc.vaga_id = v.id AND vc.profissional_id = $1) AS ja_candidatado
     FROM vagas_profissionais v
     JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
     JOIN cidades ci ON ci.id = v.cidade_id
     LEFT JOIN bairros b ON b.id = v.bairro_id
     JOIN empresas e ON e.usuario_id = v.empresa_id
     JOIN profissionais p ON p.usuario_id = $1
     LEFT JOIN bairros pb ON pb.id = p.bairro_id
     LEFT JOIN cidades pci ON pci.id = pb.cidade_id
     WHERE v.status = 'aberta'
       AND pci.estado = ci.estado
       AND (v.sexo_desejado = 'indiferente' OR v.sexo_desejado = p.sexo)
       AND EXISTS (
         SELECT 1 FROM profissional_categorias pc WHERE pc.profissional_id = $1 AND pc.categoria_id = v.categoria_profissional_id
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
  total_candidatos: number;
  realizada: boolean;
  profissional_selecionado_id: string | null;
  profissional_selecionado_nome: string | null;
};

const MINHA_VAGA_SELECT = `
  SELECT
    v.id, cp.nome AS categoria_nome, ci.nome AS cidade_nome, b.nome AS bairro_nome,
    v.data_evento, v.hora_inicio, v.duracao_horas, v.valor, v.descricao, v.criado_em, v.status, v.sexo_desejado,
    (v.data_evento < CURRENT_DATE) AS realizada,
    v.profissional_selecionado_id, sel.nome AS profissional_selecionado_nome,
    (SELECT count(*)::int FROM vaga_candidaturas vc WHERE vc.vaga_id = v.id) AS total_candidatos
  FROM vagas_profissionais v
  JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
  JOIN cidades ci ON ci.id = v.cidade_id
  LEFT JOIN bairros b ON b.id = v.bairro_id
  LEFT JOIN profissionais sel ON sel.usuario_id = v.profissional_selecionado_id
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
};

/** Contato do profissional só é retornado pra empresa dona da vaga (join com
 * vagas_profissionais.empresa_id = $2) - segue a mesma regra do resto do
 * schema: profissional é visível pra empresa autenticada, nunca pra terceiros. */
export async function listCandidatosDaVaga(vagaId: string, empresaId: string): Promise<CandidatoVaga[]> {
  return query<CandidatoVaga>(
    `SELECT p.usuario_id AS profissional_id, p.slug AS profissional_slug, p.nome, p.foto_perfil_url, u.telefone, vc.criado_em AS candidatado_em
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

export async function getAvaliacaoDaVaga(vagaId: string, empresaId: string): Promise<AvaliacaoVaga | null> {
  return queryOne<AvaliacaoVaga>(
    `SELECT nota, comentario FROM avaliacoes_profissional WHERE vaga_id = $1 AND empresa_id = $2`,
    [vagaId, empresaId]
  );
}
