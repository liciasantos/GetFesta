/** Regras da Permuta B2B que o admin pode ajustar em /admin/permutas.
 * Ficam num JSON só em configuracoes_site (chave CONFIG_PERMUTA) - qualquer
 * campo ausente cai no padrão daqui, então dá pra adicionar regra nova sem
 * migração. Este arquivo é puro (sem banco) pra ser usado também em client
 * components (ex: prévia de equilíbrio na proposta). */

export const CONFIG_PERMUTA = "permuta_config";

export type NivelPermuta = "novo" | "c" | "b" | "a";

export const NIVEIS: NivelPermuta[] = ["novo", "c", "b", "a"];

export const NIVEL_LABEL: Record<NivelPermuta, string> = {
  novo: "Novo",
  c: "Nível C",
  b: "Nível B",
  a: "Nível A",
};

/** Plano de empresa, pelo planos.tipo (empresa_gratis / empresa_leads / empresa_completo). */
export type PlanoPermuta = "gratis" | "light" | "completo";

export const PLANO_PERMUTA_LABEL: Record<PlanoPermuta, string> = {
  gratis: "Grátis",
  light: "Light",
  completo: "Completo",
};

export function planoPermutaDoTipo(tipo: string | null | undefined): PlanoPermuta {
  if (tipo === "empresa_completo") return "completo";
  if (tipo === "empresa_leads") return "light";
  return "gratis";
}

/** Janela em que as "empresas diferentes" do limite do plano são contadas. */
export type PeriodoLimitePlano = "mes" | "simultaneo" | "total";

export const PERIODO_LIMITE_LABEL: Record<PeriodoLimitePlano, string> = {
  mes: "por mês",
  simultaneo: "ao mesmo tempo",
  total: "no total",
};

export type PermutaConfig = {
  ativa: boolean;
  exigirCnpjValidado: boolean;
  minFotosPortfolio: number;
  /** com quantas empresas diferentes a empresa pode trocar, por plano - 0 = sem limite */
  limitesPlano: Record<PlanoPermuta, number>;
  periodoLimitePlano: PeriodoLimitePlano;
  /** permutas abertas ao mesmo tempo por nível - 0 = sem limite */
  limites: Record<NivelPermuta, number>;
  /** requisitos pra subir de nível (Novo não tem requisito) */
  requisitos: Record<Exclude<NivelPermuta, "novo">, { concluidas: number; nota: number }>;
  janelaCancelamentoDias: number;
  horasConfirmacaoAutomatica: number;
  /** dias que um cancelamento fora da janela derruba um nível */
  diasPenalidadeCancelamento: number;
  /** furos (entrega não realizada) em 12 meses que suspendem a empresa */
  furosParaSuspender: number;
  diasSuspensao: number;
  exibirSeloPerfilPublico: boolean;
  /** e-mails de proposta, assinatura, confirmação e lembretes */
  emailsAtivos: boolean;
  secaoEmpresasVisivel: boolean;
  secaoEmpresasTitulo: string;
  secaoEmpresasTexto: string;
};

export const PERMUTA_CONFIG_PADRAO: PermutaConfig = {
  ativa: true,
  exigirCnpjValidado: true,
  minFotosPortfolio: 3,
  limitesPlano: { gratis: 2, light: 10, completo: 0 },
  periodoLimitePlano: "mes",
  limites: { novo: 0, c: 0, b: 0, a: 0 },
  requisitos: {
    c: { concluidas: 1, nota: 4.0 },
    b: { concluidas: 3, nota: 4.5 },
    a: { concluidas: 8, nota: 4.7 },
  },
  janelaCancelamentoDias: 30,
  horasConfirmacaoAutomatica: 72,
  diasPenalidadeCancelamento: 90,
  furosParaSuspender: 1,
  diasSuspensao: 180,
  exibirSeloPerfilPublico: true,
  emailsAtivos: true,
  secaoEmpresasVisivel: true,
  secaoEmpresasTitulo: "Troque serviços com outras empresas de eventos",
  secaoEmpresasTexto:
    "Vai fazer a festa do seu filho ou a confraternização da equipe? Na rede de permutas da GetFesta você paga com o seu próprio serviço: oferece o que faz de melhor e recebe o que precisa de outros fornecedores verificados — tudo registrado num acordo digital, com check-in e avaliação dos dois lados.",
};

/** Mescla o JSON salvo (que pode estar incompleto ou ser de uma versão
 * antiga) com os padrões, campo a campo. */
export function parsePermutaConfig(raw: string | null | undefined): PermutaConfig {
  const base = PERMUTA_CONFIG_PADRAO;
  if (!raw) return base;
  try {
    const p = JSON.parse(raw) as Partial<PermutaConfig>;
    return {
      ...base,
      ...p,
      limites: { ...base.limites, ...(p.limites ?? {}) },
      limitesPlano: { ...base.limitesPlano, ...(p.limitesPlano ?? {}) },
      periodoLimitePlano: (["mes", "simultaneo", "total"] as const).includes(p.periodoLimitePlano as PeriodoLimitePlano)
        ? (p.periodoLimitePlano as PeriodoLimitePlano)
        : base.periodoLimitePlano,
      requisitos: {
        c: { ...base.requisitos.c, ...(p.requisitos?.c ?? {}) },
        b: { ...base.requisitos.b, ...(p.requisitos?.b ?? {}) },
        a: { ...base.requisitos.a, ...(p.requisitos?.a ?? {}) },
      },
    };
  } catch {
    return base;
  }
}

export type EstatisticaPermuta = {
  concluidas: number;
  nota: number | null;
  totalAvaliacoes: number;
  furos12m: number;
  cancelamentosPenalizados: number;
  ativos: number;
};

export type ControleAdmin = {
  nivel_manual: NivelPermuta | null;
  suspensa_ate: string | null;
  banida: boolean;
};

/** Nível calculado pelos critérios públicos. Furo em 12 meses trava no
 * máximo em C; cancelamento fora da janela recente derruba um nível. Se o
 * admin definiu um nível manual, ele manda. */
export function calcularNivel(
  stats: EstatisticaPermuta,
  cfg: PermutaConfig,
  controle?: ControleAdmin | null
): NivelPermuta {
  if (controle?.nivel_manual) return controle.nivel_manual;
  const nota = stats.nota ?? 0;
  const atinge = (n: Exclude<NivelPermuta, "novo">) =>
    stats.concluidas >= cfg.requisitos[n].concluidas &&
    (cfg.requisitos[n].concluidas === 0 || nota >= cfg.requisitos[n].nota);
  let idx = 0;
  if (atinge("c")) idx = 1;
  if (idx === 1 && stats.furos12m === 0 && atinge("b")) idx = 2;
  if (idx === 2 && atinge("a")) idx = 3;
  if (stats.cancelamentosPenalizados > 0) idx = Math.max(0, idx - 1);
  return NIVEIS[idx];
}

export function limiteDoNivel(nivel: NivelPermuta, cfg: PermutaConfig): number | null {
  const l = cfg.limites[nivel];
  return l > 0 ? l : null;
}

export const STATUS_ACORDO_LABEL: Record<string, string> = {
  proposta: "Aguardando assinatura",
  em_execucao: "Em execução",
  concluido: "Concluída",
  recusado: "Recusada",
  cancelado: "Cancelada",
  em_disputa: "Em disputa",
};

export const STATUS_ENTREGA_LABEL: Record<string, string> = {
  agendada: "Agendada",
  confirmada: "Realizada",
  nao_realizada: "Não realizada",
  em_disputa: "Em disputa",
  cancelada: "Cancelada",
};

/** Linha de benefício da permuta pros cards de planos (home, /empresas,
 * resumo da contratação) - sai da config, então muda junto com o admin. */
export function beneficioPermutaDoPlano(nomePlano: string, cfg: PermutaConfig): string | null {
  if (!cfg.ativa) return null;
  const chave = (Object.keys(PLANO_PERMUTA_LABEL) as PlanoPermuta[]).find((k) => PLANO_PERMUTA_LABEL[k] === nomePlano);
  if (!chave) return null;
  const limite = cfg.limitesPlano[chave];
  if (limite <= 0) return "Permuta de serviços com empresas ilimitadas";
  return `Permuta de serviços com até ${limite} ${limite === 1 ? "empresa" : "empresas"} ${PERIODO_LIMITE_LABEL[cfg.periodoLimitePlano]}`;
}
