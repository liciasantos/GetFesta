import { query, queryOne } from "@/lib/db";
import {
  CONFIG_PERMUTA,
  calcularNivel,
  limiteDoNivel,
  parsePermutaConfig,
  type ControleAdmin,
  type EstatisticaPermuta,
  planoPermutaDoTipo,
  type NivelPermuta,
  type PermutaConfig,
  type PlanoPermuta,
} from "@/lib/permuta/regras";

// ---------------------------------------------------------------------
// CONFIG + SINCRONIZACAO
// ---------------------------------------------------------------------

export async function getPermutaConfig(): Promise<PermutaConfig> {
  const row = await queryOne<{ valor: string }>(`SELECT valor FROM configuracoes_site WHERE chave = $1`, [
    CONFIG_PERMUTA,
  ]);
  return parsePermutaConfig(row?.valor);
}

/** Roda a cada carregamento das páginas de permuta (barato - só UPDATEs com
 * filtro indexado): entregas cujo beneficiário não respondeu dentro do prazo
 * contam como realizadas, e acordos com as duas entregas realizadas viram
 * concluídos. Sem cron: o estado fica certo na primeira vez que alguém olha. */
export async function sincronizarPermutas(cfg: PermutaConfig) {
  await query(
    `UPDATE permuta_entregas e
        SET status = 'confirmada', confirmada_em = now(), confirmacao_automatica = TRUE
       FROM permuta_acordos a
      WHERE a.id = e.acordo_id
        AND a.status = 'em_execucao'
        AND e.status = 'agendada'
        AND (e.data_evento::timestamp + interval '1 day' + make_interval(hours => $1::int)) < now()`,
    [cfg.horasConfirmacaoAutomatica]
  );
  await query(
    `UPDATE permuta_acordos a SET status = 'concluido', atualizado_em = now()
      WHERE a.status = 'em_execucao'
        AND NOT EXISTS (SELECT 1 FROM permuta_entregas e WHERE e.acordo_id = a.id AND e.status <> 'confirmada')`
  );
}

// ---------------------------------------------------------------------
// PERFIL DE PERMUTA (nivel, limite, elegibilidade)
// ---------------------------------------------------------------------

export type PerfilPermuta = {
  empresaId: string;
  stats: EstatisticaPermuta;
  nivel: NivelPermuta;
  limite: number | null;
  fotos: number;
  ofertas: number;
  cnpjValidado: boolean;
  controle: ControleAdmin & { observacao: string | null };
  /** o que falta pra poder participar - vazio = elegível */
  pendencias: string[];
  suspensa: boolean;
  /** empresa optou por participar da rede (e não pausou) */
  participa: boolean;
  /** já aderiu alguma vez (pausada ou ativa) */
  aderiu: boolean;
  podeAbrirNova: boolean;
};

type PerfilRow = {
  id: string;
  concluidas: number;
  nota: number | null;
  total_avaliacoes: number;
  furos: number;
  cancelamentos: number;
  ativos: number;
  fotos: number;
  ofertas: number;
  cnpj_validado: boolean;
  nivel_manual: NivelPermuta | null;
  suspensa_ate: string | null;
  banida: boolean | null;
  observacao: string | null;
  participa: boolean | null;
};

export async function getPerfisPermuta(ids: string[], cfg: PermutaConfig): Promise<Map<string, PerfilPermuta>> {
  const out = new Map<string, PerfilPermuta>();
  if (ids.length === 0) return out;
  const rows = await query<PerfilRow>(
    `SELECT e.usuario_id AS id,
       (SELECT count(*) FROM permuta_acordos a WHERE a.status = 'concluido' AND e.usuario_id IN (a.proponente_id, a.destinatario_id))::int AS concluidas,
       (SELECT avg(v.nota)::float FROM permuta_avaliacoes v WHERE v.avaliado_id = e.usuario_id) AS nota,
       (SELECT count(*) FROM permuta_avaliacoes v WHERE v.avaliado_id = e.usuario_id)::int AS total_avaliacoes,
       (SELECT count(*) FROM permuta_entregas x WHERE x.prestador_id = e.usuario_id AND x.status = 'nao_realizada'
          AND x.data_evento > now() - interval '12 months')::int AS furos,
       (SELECT count(*) FROM permuta_acordos a WHERE a.encerrado_por = e.usuario_id AND a.cancelado_fora_janela
          AND a.atualizado_em > now() - make_interval(days => $2::int))::int AS cancelamentos,
       (SELECT count(*) FROM permuta_acordos a WHERE a.status IN ('proposta', 'em_execucao', 'em_disputa')
          AND e.usuario_id IN (a.proponente_id, a.destinatario_id))::int AS ativos,
       (SELECT count(*) FROM empresa_galeria g WHERE g.empresa_id = e.usuario_id)::int AS fotos,
       (SELECT count(*) FROM permuta_ofertas o WHERE o.empresa_id = e.usuario_id AND o.ativa)::int AS ofertas,
       e.cnpj_validado, c.nivel_manual, c.suspensa_ate, c.banida, c.observacao, pp.ativa AS participa
     FROM empresas e
     LEFT JOIN permuta_empresa_admin c ON c.empresa_id = e.usuario_id
     LEFT JOIN permuta_participantes pp ON pp.empresa_id = e.usuario_id
     WHERE e.usuario_id = ANY($1::uuid[])`,
    [ids, cfg.diasPenalidadeCancelamento]
  );
  for (const r of rows) {
    const stats: EstatisticaPermuta = {
      concluidas: r.concluidas,
      nota: r.nota,
      totalAvaliacoes: r.total_avaliacoes,
      furos12m: r.furos,
      cancelamentosPenalizados: r.cancelamentos,
      ativos: r.ativos,
    };
    const controle = {
      nivel_manual: r.nivel_manual,
      suspensa_ate: r.suspensa_ate,
      banida: !!r.banida,
      observacao: r.observacao,
    };
    const nivel = calcularNivel(stats, cfg, controle);
    const limite = limiteDoNivel(nivel, cfg);
    const suspensa = !!r.suspensa_ate && new Date(r.suspensa_ate) > new Date();
    const pendencias: string[] = [];
    if (!cfg.ativa) pendencias.push("A rede de permutas está temporariamente desativada.");
    if (controle.banida) pendencias.push("Sua empresa foi removida da rede de permutas.");
    if (suspensa) pendencias.push(`Participação suspensa até ${new Date(r.suspensa_ate!).toLocaleDateString("pt-BR")}.`);
    if (cfg.exigirCnpjValidado && !r.cnpj_validado) pendencias.push("CNPJ ainda não validado.");
    if (r.fotos < cfg.minFotosPortfolio)
      pendencias.push(`Portfólio com pelo menos ${cfg.minFotosPortfolio} fotos (você tem ${r.fotos}).`);
    out.set(r.id, {
      empresaId: r.id,
      stats,
      nivel,
      limite,
      fotos: r.fotos,
      ofertas: r.ofertas,
      cnpjValidado: r.cnpj_validado,
      controle,
      pendencias,
      suspensa,
      participa: r.participa === true,
      aderiu: r.participa !== null,
      podeAbrirNova: r.participa === true && pendencias.length === 0 && (limite === null || r.ativos < limite),
    });
  }
  return out;
}

export async function getPerfilPermuta(id: string, cfg: PermutaConfig): Promise<PerfilPermuta | null> {
  return (await getPerfisPermuta([id], cfg)).get(id) ?? null;
}

// ---------------------------------------------------------------------
// LIMITE DO PLANO (com quantas empresas diferentes pode trocar)
// ---------------------------------------------------------------------

export type UsoPlanoPermuta = {
  plano: PlanoPermuta;
  planoNome: string;
  limite: number | null; // null = sem limite
  parceiros: string[]; // empresas que já contam no período
  usados: number;
  restantes: number | null;
  /** pode fechar com essa empresa? (repetir um parceiro do período não gasta vaga) */
  podeTrocarCom: (parceiroId: string) => boolean;
};

/** Plano atual = assinatura mais recente (mesma regra do limite de orçamentos
 * em lib/actions/pedidos.ts); sem assinatura = Grátis. Contam as empresas
 * de acordos que a empresa propôs ou assinou - uma proposta recebida e ainda
 * não assinada não gasta vaga de quem recebeu. Recusados/cancelados não contam. */
export async function getUsoPlanoPermuta(
  empresaId: string,
  cfg: PermutaConfig,
  excluirAcordoId?: string
): Promise<UsoPlanoPermuta> {
  const assinatura = await queryOne<{ tipo: string; nome: string }>(
    `SELECT pl.tipo::text AS tipo, pl.nome FROM assinaturas a JOIN planos pl ON pl.id = a.plano_id
      WHERE a.usuario_id = $1 ORDER BY a.criado_em DESC LIMIT 1`,
    [empresaId]
  );
  const plano = planoPermutaDoTipo(assinatura?.tipo);
  const limiteCfg = cfg.limitesPlano[plano];
  const limite = limiteCfg > 0 ? limiteCfg : null;

  const filtroPeriodo =
    cfg.periodoLimitePlano === "mes"
      ? `AND date_trunc('month', a.criado_em AT TIME ZONE 'America/Sao_Paulo') = date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')`
      : cfg.periodoLimitePlano === "simultaneo"
        ? `AND a.status IN ('proposta', 'em_execucao', 'em_disputa')`
        : "";
  const rows = await query<{ parceiro: string }>(
    `SELECT DISTINCT CASE WHEN a.proponente_id = $1 THEN a.destinatario_id ELSE a.proponente_id END AS parceiro
       FROM permuta_acordos a
      WHERE $1 IN (a.proponente_id, a.destinatario_id)
        AND a.status NOT IN ('recusado', 'cancelado')
        AND (a.proponente_id = $1 OR a.assinado_destinatario_em IS NOT NULL)
        AND ($2::uuid IS NULL OR a.id <> $2::uuid)
        ${filtroPeriodo}`,
    [empresaId, excluirAcordoId ?? null]
  );
  const parceiros = rows.map((r) => r.parceiro);
  const usados = parceiros.length;
  return {
    plano,
    planoNome: assinatura?.nome ?? "Grátis",
    limite,
    parceiros,
    usados,
    restantes: limite === null ? null : Math.max(0, limite - usados),
    podeTrocarCom: (parceiroId) => limite === null || parceiros.includes(parceiroId) || usados < limite,
  };
}

export async function getPlanosEmpresaPorTipo() {
  const rows = await query<{ id: number; tipo: string; nome: string; valor_mensal: string }>(
    `SELECT id, tipo::text AS tipo, nome, valor_mensal FROM planos WHERE tipo::text LIKE 'empresa_%' AND ativo ORDER BY valor_mensal`
  );
  return rows.map((r) => ({ ...r, chave: planoPermutaDoTipo(r.tipo), valor: Number(r.valor_mensal) }));
}

// ---------------------------------------------------------------------
// OFERTAS / BUSCAS
// ---------------------------------------------------------------------

export type OfertaPermuta = {
  id: string;
  empresa_id: string;
  categoria_id: number | null;
  categoria_nome: string | null;
  titulo: string;
  descricao: string | null;
  valor_referencia: number;
  ativa: boolean;
};

export async function listOfertas(empresaId: string, somenteAtivas = true): Promise<OfertaPermuta[]> {
  const rows = await query<OfertaPermuta & { valor_referencia: string }>(
    `SELECT o.id, o.empresa_id, o.categoria_id, c.nome AS categoria_nome, o.titulo, o.descricao, o.valor_referencia, o.ativa
       FROM permuta_ofertas o LEFT JOIN categorias c ON c.id = o.categoria_id
      WHERE o.empresa_id = $1 AND ($2::boolean = FALSE OR o.ativa)
      ORDER BY o.ativa DESC, o.criado_em`,
    [empresaId, somenteAtivas]
  );
  return rows.map((r) => ({ ...r, valor_referencia: Number(r.valor_referencia) }));
}

export async function listBuscas(empresaId: string): Promise<{ categoria_id: number; nome: string }[]> {
  return query(
    `SELECT b.categoria_id, c.nome FROM permuta_buscas b JOIN categorias c ON c.id = b.categoria_id
      WHERE b.empresa_id = $1 ORDER BY c.nome`,
    [empresaId]
  );
}

// ---------------------------------------------------------------------
// VITRINE
// ---------------------------------------------------------------------

export type EmpresaVitrine = {
  id: string;
  nome_fantasia: string;
  slug: string;
  tem_logo: boolean;
  cidade: string | null;
  categorias: string[];
  ofertas: { id: string; titulo: string; valor_referencia: number; categoria_id: number | null }[];
  buscas: string[];
  oferece_o_que_busco: boolean;
  busca_o_que_ofereco: boolean;
  trocas_comigo: number;
  perfil: PerfilPermuta;
};

export async function listVitrine(
  empresaId: string,
  cfg: PermutaConfig,
  filtros: { categoriaId?: number; estado?: string; soCombina?: boolean }
): Promise<EmpresaVitrine[]> {
  const rows = await query<Omit<EmpresaVitrine, "perfil">>(
    `WITH minhas_buscas AS (SELECT categoria_id FROM permuta_buscas WHERE empresa_id = $1),
          minhas_cats AS (SELECT categoria_id FROM permuta_ofertas WHERE empresa_id = $1 AND ativa AND categoria_id IS NOT NULL)
     SELECT e.usuario_id AS id, e.nome_fantasia, e.slug, (e.logo_url IS NOT NULL) AS tem_logo,
       (SELECT ci.nome || ' — ' || ci.estado FROM empresa_areas_atuacao ar JOIN cidades ci ON ci.id = ar.cidade_id
         WHERE ar.empresa_id = e.usuario_id ORDER BY ci.nome LIMIT 1) AS cidade,
       COALESCE((SELECT array_agg(c.nome ORDER BY c.nome) FROM empresa_categorias ec JOIN categorias c ON c.id = ec.categoria_id
         WHERE ec.empresa_id = e.usuario_id), '{}') AS categorias,
       (SELECT json_agg(json_build_object('id', o.id, 'titulo', o.titulo, 'valor_referencia', o.valor_referencia, 'categoria_id', o.categoria_id) ORDER BY o.criado_em)
          FROM permuta_ofertas o WHERE o.empresa_id = e.usuario_id AND o.ativa) AS ofertas,
       COALESCE((SELECT array_agg(c.nome ORDER BY c.nome) FROM permuta_buscas b JOIN categorias c ON c.id = b.categoria_id
         WHERE b.empresa_id = e.usuario_id), '{}') AS buscas,
       EXISTS (SELECT 1 FROM permuta_ofertas o WHERE o.empresa_id = e.usuario_id AND o.ativa
               AND o.categoria_id IN (SELECT categoria_id FROM minhas_buscas)) AS oferece_o_que_busco,
       EXISTS (SELECT 1 FROM permuta_buscas b WHERE b.empresa_id = e.usuario_id
               AND b.categoria_id IN (SELECT categoria_id FROM minhas_cats)) AS busca_o_que_ofereco,
       (SELECT count(*) FROM permuta_acordos a WHERE a.status IN ('concluido', 'em_execucao')
          AND ((a.proponente_id = $1 AND a.destinatario_id = e.usuario_id) OR (a.destinatario_id = $1 AND a.proponente_id = e.usuario_id)))::int AS trocas_comigo
     FROM empresas e
     WHERE e.usuario_id <> $1
       AND EXISTS (SELECT 1 FROM permuta_ofertas o WHERE o.empresa_id = e.usuario_id AND o.ativa
                   AND ($2::int IS NULL OR o.categoria_id = $2))
       AND ($3::text IS NULL OR EXISTS (SELECT 1 FROM empresa_areas_atuacao ar JOIN cidades ci ON ci.id = ar.cidade_id
                                         WHERE ar.empresa_id = e.usuario_id AND ci.estado = $3))`,
    [empresaId, filtros.categoriaId ?? null, filtros.estado ?? null]
  );
  const perfis = await getPerfisPermuta(
    rows.map((r) => r.id),
    cfg
  );
  return rows
    .map((r) => ({
      ...r,
      ofertas: (r.ofertas ?? []).map((o) => ({ ...o, valor_referencia: Number(o.valor_referencia) })),
      perfil: perfis.get(r.id)!,
    }))
    .filter((r) => r.perfil && r.perfil.participa && r.perfil.pendencias.length === 0)
    .filter((r) => !filtros.soCombina || r.oferece_o_que_busco || r.busca_o_que_ofereco)
    .sort((a, b) => score(b) - score(a));
}

function score(e: Omit<EmpresaVitrine, "perfil"> & { perfil: PerfilPermuta }) {
  const nivel = { novo: 0, c: 1, b: 2, a: 3 }[e.perfil.nivel];
  return (e.oferece_o_que_busco ? 10 : 0) + (e.busca_o_que_ofereco ? 10 : 0) + nivel;
}

// ---------------------------------------------------------------------
// ACORDOS
// ---------------------------------------------------------------------

export type EntregaPermuta = {
  id: string;
  ordem: number;
  prestador_id: string;
  beneficiario_id: string;
  titulo: string;
  escopo: string | null;
  valor_referencia: number;
  data_evento: string; // YYYY-MM-DD
  local_evento: string | null;
  status: string;
  confirmada_em: string | null;
  confirmacao_automatica: boolean;
  avaliacao: { nota: number; pontual: boolean; comentario: string | null } | null;
};

export type AcordoPermuta = {
  id: string;
  status: string;
  versao: number;
  proponente_id: string;
  destinatario_id: string;
  proponente_nome: string;
  proponente_slug: string;
  proponente_tem_logo: boolean;
  destinatario_nome: string;
  destinatario_slug: string;
  destinatario_tem_logo: boolean;
  assinado_proponente_em: string | null;
  assinado_destinatario_em: string | null;
  ultima_edicao_por: string | null;
  compensacao: string | null;
  motivo_encerramento: string | null;
  encerrado_por: string | null;
  cancelado_fora_janela: boolean;
  disputa_aberta_por: string | null;
  disputa_motivo: string | null;
  disputa_resolucao: string | null;
  criado_em: string;
  atualizado_em: string;
  entregas: EntregaPermuta[];
};

const ACORDO_SELECT = `
  SELECT a.id, a.status, a.versao, a.proponente_id, a.destinatario_id,
    p.nome_fantasia AS proponente_nome, p.slug AS proponente_slug, (p.logo_url IS NOT NULL) AS proponente_tem_logo,
    d.nome_fantasia AS destinatario_nome, d.slug AS destinatario_slug, (d.logo_url IS NOT NULL) AS destinatario_tem_logo,
    a.assinado_proponente_em, a.assinado_destinatario_em, a.ultima_edicao_por, a.compensacao,
    a.motivo_encerramento, a.encerrado_por, a.cancelado_fora_janela,
    a.disputa_aberta_por, a.disputa_motivo, a.disputa_resolucao, a.criado_em, a.atualizado_em,
    COALESCE((SELECT json_agg(json_build_object(
        'id', x.id, 'ordem', x.ordem, 'prestador_id', x.prestador_id, 'beneficiario_id', x.beneficiario_id,
        'titulo', x.titulo, 'escopo', x.escopo, 'valor_referencia', x.valor_referencia,
        'data_evento', to_char(x.data_evento, 'YYYY-MM-DD'), 'local_evento', x.local_evento,
        'status', x.status, 'confirmada_em', x.confirmada_em, 'confirmacao_automatica', x.confirmacao_automatica,
        'avaliacao', (SELECT json_build_object('nota', v.nota, 'pontual', v.pontual, 'comentario', v.comentario)
                        FROM permuta_avaliacoes v WHERE v.entrega_id = x.id LIMIT 1)
      ) ORDER BY x.ordem) FROM permuta_entregas x WHERE x.acordo_id = a.id), '[]') AS entregas
  FROM permuta_acordos a
  JOIN empresas p ON p.usuario_id = a.proponente_id
  JOIN empresas d ON d.usuario_id = a.destinatario_id`;

function normalizarAcordo(a: AcordoPermuta): AcordoPermuta {
  return { ...a, entregas: a.entregas.map((e) => ({ ...e, valor_referencia: Number(e.valor_referencia) })) };
}

/** empresaId = null → todos (uso do admin) */
export async function listAcordos(empresaId: string | null, status?: string): Promise<AcordoPermuta[]> {
  const rows = await query<AcordoPermuta>(
    `${ACORDO_SELECT}
     WHERE ($1::uuid IS NULL OR $1::uuid IN (a.proponente_id, a.destinatario_id))
       AND ($2::text IS NULL OR a.status::text = $2)
     ORDER BY a.atualizado_em DESC`,
    [empresaId, status ?? null]
  );
  return rows.map(normalizarAcordo);
}

export async function getAcordo(id: string): Promise<AcordoPermuta | null> {
  const row = await queryOne<AcordoPermuta>(`${ACORDO_SELECT} WHERE a.id = $1`, [id]);
  return row ? normalizarAcordo(row) : null;
}

export type MensagemPermuta = {
  id: string;
  remetente_id: string | null;
  remetente_nome: string | null;
  conteudo: string;
  enviado_em: string;
};

export async function listMensagensAcordo(acordoId: string): Promise<MensagemPermuta[]> {
  return query<MensagemPermuta>(
    `SELECT m.id, m.remetente_id, e.nome_fantasia AS remetente_nome, m.conteudo, m.enviado_em
       FROM permuta_mensagens m LEFT JOIN empresas e ON e.usuario_id = m.remetente_id
      WHERE m.acordo_id = $1 ORDER BY m.enviado_em`,
    [acordoId]
  );
}

export type ContatoEmpresa = { telefone_contato: string | null; instagram: string | null; email: string | null };

export async function getContatoEmpresa(empresaId: string): Promise<ContatoEmpresa | null> {
  return queryOne<ContatoEmpresa>(
    `SELECT e.telefone_contato, e.instagram, u.email FROM empresas e JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.usuario_id = $1`,
    [empresaId]
  );
}

// ---------------------------------------------------------------------
// VISAO DO PONTO DE VISTA DE UMA EMPRESA
// ---------------------------------------------------------------------

export type AcordoVisao = AcordoPermuta & {
  parceiroId: string;
  parceiroNome: string;
  parceiroSlug: string;
  parceiroTemLogo: boolean;
  souProponente: boolean;
  minhaAssinatura: string | null;
  assinaturaParceiro: string | null;
  minhaEntrega: EntregaPermuta | undefined; // eu presto
  entregaParceiro: EntregaPermuta | undefined; // eu recebo
};

export function visaoDoAcordo(a: AcordoPermuta, empresaId: string): AcordoVisao {
  const souProponente = a.proponente_id === empresaId;
  return {
    ...a,
    souProponente,
    parceiroId: souProponente ? a.destinatario_id : a.proponente_id,
    parceiroNome: souProponente ? a.destinatario_nome : a.proponente_nome,
    parceiroSlug: souProponente ? a.destinatario_slug : a.proponente_slug,
    parceiroTemLogo: souProponente ? a.destinatario_tem_logo : a.proponente_tem_logo,
    minhaAssinatura: souProponente ? a.assinado_proponente_em : a.assinado_destinatario_em,
    assinaturaParceiro: souProponente ? a.assinado_destinatario_em : a.assinado_proponente_em,
    minhaEntrega: a.entregas.find((e) => e.prestador_id === empresaId),
    entregaParceiro: a.entregas.find((e) => e.beneficiario_id === empresaId),
  };
}

/** "Hoje" no fuso de Brasília (YYYY-MM-DD) - com toISOString() o dia virava
 * às 21h, e o check-in abria/fechava um dia antes. */
export function hojeISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export type AcaoPendente = {
  tipo: "assinar" | "confirmar" | "avaliar" | "disputa";
  acordoId: string;
  titulo: string;
  descricao: string;
  cta: string;
};

export function acoesPendentes(acordos: AcordoVisao[]): AcaoPendente[] {
  const hoje = hojeISO();
  const out: AcaoPendente[] = [];
  for (const a of acordos) {
    if (a.status === "proposta" && !a.minhaAssinatura) {
      out.push({
        tipo: "assinar",
        acordoId: a.id,
        titulo: a.versao > 1 ? `${a.parceiroNome} alterou os termos da proposta` : `${a.parceiroNome} enviou uma proposta`,
        descricao: `Versão ${a.versao} · revise e assine para liberar os contatos`,
        cta: "Ver proposta",
      });
    }
    const receb = a.entregaParceiro;
    if (a.status === "em_execucao" && receb?.status === "agendada" && receb.data_evento <= hoje) {
      out.push({
        tipo: "confirmar",
        acordoId: a.id,
        titulo: `Confirme a entrega de ${a.parceiroNome}`,
        descricao: `${receb.titulo} · evento de ${formatDataCurta(receb.data_evento)}`,
        cta: "Confirmar",
      });
    }
    if (receb?.status === "confirmada" && !receb.avaliacao) {
      out.push({
        tipo: "avaliar",
        acordoId: a.id,
        titulo: `Avalie ${a.parceiroNome}`,
        descricao: `${receb.titulo} · ${formatDataCurta(receb.data_evento)}`,
        cta: "Avaliar",
      });
    }
    if (a.status === "em_disputa") {
      out.push({
        tipo: "disputa",
        acordoId: a.id,
        titulo: `Acordo com ${a.parceiroNome} em análise`,
        descricao: "A equipe GetFesta está analisando a disputa",
        cta: "Ver acordo",
      });
    }
  }
  return out;
}

export function saldo(acordos: AcordoVisao[]) {
  let devo = 0;
  let devem = 0;
  for (const a of acordos) {
    if (a.status !== "em_execucao" && a.status !== "em_disputa") continue;
    if (a.minhaEntrega?.status === "agendada") devo++;
    if (a.entregaParceiro?.status === "agendada") devem++;
  }
  return { devo, devem };
}

export function formatDataCurta(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function diasAte(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const [hy, hm, hd] = hojeISO().split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(hy, hm - 1, hd)) / 86400000);
}

// ---------------------------------------------------------------------
// REDE DE PARCEIROS
// ---------------------------------------------------------------------

export type Parceiro = {
  id: string;
  nome: string;
  slug: string;
  temLogo: boolean;
  permutasConcluidas: number;
  acordosAtivos: number;
  fezParaEle: number;
  eleFezParaMim: number;
  devo: number;
  meDeve: number;
  ultima: string | null;
  notaDada: number | null;
  notaRecebida: number | null;
  historico: { acordoId: string; data: string; direcao: "eu" | "ele"; titulo: string; status: string; nota: number | null }[];
};

export function montarParceiros(acordos: AcordoVisao[]): Parceiro[] {
  const mapa = new Map<string, Parceiro & { _dadas: number[]; _recebidas: number[] }>();
  for (const a of acordos) {
    if (a.status === "recusado") continue;
    let p = mapa.get(a.parceiroId);
    if (!p) {
      p = {
        id: a.parceiroId,
        nome: a.parceiroNome,
        slug: a.parceiroSlug,
        temLogo: a.parceiroTemLogo,
        permutasConcluidas: 0,
        acordosAtivos: 0,
        fezParaEle: 0,
        eleFezParaMim: 0,
        devo: 0,
        meDeve: 0,
        ultima: null,
        notaDada: null,
        notaRecebida: null,
        historico: [],
        _dadas: [],
        _recebidas: [],
      };
      mapa.set(a.parceiroId, p);
    }
    if (a.status === "concluido") p.permutasConcluidas++;
    if (["proposta", "em_execucao", "em_disputa"].includes(a.status)) p.acordosAtivos++;
    const execucao = a.status === "em_execucao" || a.status === "em_disputa";
    for (const e of a.entregas) {
      const eu = e.prestador_id !== a.parceiroId;
      if (e.status === "confirmada") {
        if (eu) p.fezParaEle++;
        else p.eleFezParaMim++;
        if (!p.ultima || e.data_evento > p.ultima) p.ultima = e.data_evento;
      }
      if (execucao && e.status === "agendada") {
        if (eu) p.devo++;
        else p.meDeve++;
      }
      if (e.avaliacao) (eu ? p._recebidas : p._dadas).push(e.avaliacao.nota);
      if (a.status !== "cancelado" || e.status === "confirmada") {
        p.historico.push({
          acordoId: a.id,
          data: e.data_evento,
          direcao: eu ? "eu" : "ele",
          titulo: e.titulo,
          status: a.status === "proposta" ? "proposta" : e.status,
          nota: e.avaliacao?.nota ?? null,
        });
      }
    }
  }
  const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  return [...mapa.values()]
    .map(({ _dadas, _recebidas, ...p }) => ({
      ...p,
      notaDada: media(_dadas),
      notaRecebida: media(_recebidas),
      historico: p.historico.sort((x, y) => y.data.localeCompare(x.data)),
    }))
    .sort((x, y) => (y.ultima ?? "").localeCompare(x.ultima ?? "") || y.acordosAtivos - x.acordosAtivos);
}

// ---------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------

export type EmpresaPermutaAdmin = {
  id: string;
  nome_fantasia: string;
  slug: string;
  email: string | null;
  perfil: PerfilPermuta;
};

export async function listEmpresasPermutaAdmin(cfg: PermutaConfig): Promise<EmpresaPermutaAdmin[]> {
  const rows = await query<{ id: string; nome_fantasia: string; slug: string; email: string | null }>(
    `SELECT e.usuario_id AS id, e.nome_fantasia, e.slug, u.email
       FROM empresas e JOIN usuarios u ON u.id = e.usuario_id
      ORDER BY e.nome_fantasia`
  );
  const perfis = await getPerfisPermuta(
    rows.map((r) => r.id),
    cfg
  );
  return rows.map((r) => ({ ...r, perfil: perfis.get(r.id)! }));
}

export async function getResumoPermutaAdmin() {
  return queryOne<{
    participantes: number;
    empresas_com_oferta: number;
    total_empresas: number;
    propostas: number;
    em_execucao: number;
    concluidos: number;
    disputas: number;
    cancelados: number;
    recusados: number;
    furos: number;
    entregas_confirmadas: number;
  }>(
    `SELECT
       (SELECT count(DISTINCT o.empresa_id) FROM permuta_ofertas o JOIN permuta_participantes pp ON pp.empresa_id = o.empresa_id AND pp.ativa WHERE o.ativa)::int AS empresas_com_oferta,
       (SELECT count(*) FROM permuta_participantes WHERE ativa)::int AS participantes,
       (SELECT count(*) FROM empresas)::int AS total_empresas,
       (SELECT count(*) FROM permuta_acordos WHERE status = 'proposta')::int AS propostas,
       (SELECT count(*) FROM permuta_acordos WHERE status = 'em_execucao')::int AS em_execucao,
       (SELECT count(*) FROM permuta_acordos WHERE status = 'concluido')::int AS concluidos,
       (SELECT count(*) FROM permuta_acordos WHERE status = 'em_disputa')::int AS disputas,
       (SELECT count(*) FROM permuta_acordos WHERE status = 'cancelado')::int AS cancelados,
       (SELECT count(*) FROM permuta_acordos WHERE status = 'recusado')::int AS recusados,
       (SELECT count(*) FROM permuta_entregas WHERE status = 'nao_realizada')::int AS furos,
       (SELECT count(*) FROM permuta_entregas WHERE status = 'confirmada')::int AS entregas_confirmadas`
  );
}

/** Selo público (perfil /empresa/[slug]): só aparece com ao menos 1 permuta concluída. */
export async function getSeloPermutaPublico(empresaId: string) {
  try {
    return await seloPermutaPublico(empresaId);
  } catch (e) {
    // 42P01 = tabela não existe: banco ainda sem a migração da permuta
    // (npm run permuta:setup) - o perfil público segue funcionando sem o selo.
    if ((e as { code?: string }).code === "42P01") return null;
    throw e;
  }
}

async function seloPermutaPublico(empresaId: string) {
  const cfg = await getPermutaConfig();
  if (!cfg.ativa || !cfg.exibirSeloPerfilPublico) return null;
  const perfil = await getPerfilPermuta(empresaId, cfg);
  if (!perfil || perfil.controle.banida || perfil.stats.concluidas === 0) return null;
  const parceiros = await queryOne<{ total: number }>(
    `SELECT count(DISTINCT CASE WHEN proponente_id = $1 THEN destinatario_id ELSE proponente_id END)::int AS total
       FROM permuta_acordos WHERE status = 'concluido' AND $1 IN (proponente_id, destinatario_id)`,
    [empresaId]
  );
  return { nivel: perfil.nivel, concluidas: perfil.stats.concluidas, parceiros: parceiros?.total ?? 0 };
}

// ---------------------------------------------------------------------
// FOTOS DA ENTREGA (portfolio)
// ---------------------------------------------------------------------

export const MAX_FOTOS_POR_ENTREGA = 6;

export type FotoEntrega = {
  id: string;
  entrega_id: string;
  url: string;
  autorizada_portfolio: boolean;
  galeria_foto_id: string | null;
};

export async function listFotosAcordo(acordoId: string): Promise<FotoEntrega[]> {
  try {
    return await query<FotoEntrega>(
      `SELECT f.id, f.entrega_id, f.url, f.autorizada_portfolio, f.galeria_foto_id
         FROM permuta_entrega_fotos f JOIN permuta_entregas e ON e.id = f.entrega_id
        WHERE e.acordo_id = $1 ORDER BY f.criado_em`,
      [acordoId]
    );
  } catch (e) {
    // banco ainda sem a migração 2026-09-29 - a página do acordo segue sem fotos
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}

export async function contarFotosGaleria(empresaId: string): Promise<number> {
  const r = await queryOne<{ total: number }>(`SELECT count(*)::int AS total FROM empresa_galeria WHERE empresa_id = $1`, [empresaId]);
  return r?.total ?? 0;
}
