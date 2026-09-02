import { queryOne } from "@/lib/db";

const BONUS_LANCAMENTO_MESES = 12;

export type LimitesProfissional = {
  planoTipo: "gratis" | "light" | "premium";
  planoNome: string;
  maxFotos: number;
  podePdf: boolean;
  maxVideos: number;
  podeContatarEmpresa: boolean;
  viaBonusLancamento: boolean;
  bonusExpiraEm: string | null;
};

const GRATIS: Omit<LimitesProfissional, "viaBonusLancamento" | "bonusExpiraEm"> = {
  planoTipo: "gratis",
  planoNome: "Grátis",
  maxFotos: 4,
  podePdf: false,
  maxVideos: 0,
  podeContatarEmpresa: false,
};
const LIGHT: Omit<LimitesProfissional, "viaBonusLancamento" | "bonusExpiraEm"> = {
  planoTipo: "light",
  planoNome: "Light",
  maxFotos: 6,
  podePdf: true,
  maxVideos: 0,
  podeContatarEmpresa: false,
};
const PREMIUM: Omit<LimitesProfissional, "viaBonusLancamento" | "bonusExpiraEm"> = {
  planoTipo: "premium",
  planoNome: "Premium",
  maxFotos: 10,
  podePdf: true,
  maxVideos: 3,
  podeContatarEmpresa: true,
};

/** Calcula os limites atuais do profissional (fotos, PDF, videos, contato
 * com empresa) numa unica funcao, usada em toda a gente que precisa checar
 * "o que esse profissional pode fazer agora":
 *  1. assinatura ativa (gratis/light/premium) definida manualmente pelo
 *     admin em /admin/profissionais tem prioridade - inclusive pra rebaixar
 *     alguem pra gratis de proposito, sem cair no bonus de lancamento;
 *  2. sem assinatura explicita, mas com o bonus de lancamento (30 primeiros
 *     cadastrados) ainda dentro de 1 ano do cadastro -> limites do Light;
 *  3. senao, gratis. */
export async function getLimitesProfissional(profissionalId: string): Promise<LimitesProfissional> {
  const assinatura = await queryOne<{ tipo: string }>(
    `SELECT p.tipo FROM assinaturas a JOIN planos p ON p.id = a.plano_id
     WHERE a.usuario_id = $1 AND p.tipo IN ('profissional_gratis','profissional_light','profissional_premium')
       AND a.status = 'ativa' AND (a.fim_em IS NULL OR a.fim_em > now())
     ORDER BY a.criado_em DESC LIMIT 1`,
    [profissionalId]
  );

  if (assinatura?.tipo === "profissional_premium") return { ...PREMIUM, viaBonusLancamento: false, bonusExpiraEm: null };
  if (assinatura?.tipo === "profissional_light") return { ...LIGHT, viaBonusLancamento: false, bonusExpiraEm: null };
  if (assinatura?.tipo === "profissional_gratis") return { ...GRATIS, viaBonusLancamento: false, bonusExpiraEm: null };

  const bonus = await queryOne<{ portfolio_liberado_gratis: boolean; criado_em: string }>(
    `SELECT pr.portfolio_liberado_gratis, u.criado_em
     FROM profissionais pr JOIN usuarios u ON u.id = pr.usuario_id
     WHERE pr.usuario_id = $1`,
    [profissionalId]
  );
  if (bonus?.portfolio_liberado_gratis) {
    const expira = new Date(bonus.criado_em);
    expira.setMonth(expira.getMonth() + BONUS_LANCAMENTO_MESES);
    if (expira.getTime() > Date.now()) {
      return { ...LIGHT, viaBonusLancamento: true, bonusExpiraEm: expira.toISOString() };
    }
  }

  return { ...GRATIS, viaBonusLancamento: false, bonusExpiraEm: null };
}
