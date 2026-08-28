/** Nome/destaque/beneficios de cada plano de empresa pra exibicao (home e tela
 * de resumo da contratacao). O preco vem do banco (planos.valor_mensal) - ver
 * lib/data/painel.ts:listPlanosEmpresa - pra nao duplicar o valor em dois
 * lugares e desatualizar quando o preco mudar. */
export const PLANOS_BENEFICIOS = [
  {
    nome: "Grátis",
    destaque: false,
    beneficios: ["Até 6 orçamentos respondidos por mês", "Perfil completo com fotos e descrição", "Sem cartão, sem fidelidade"],
  },
  {
    nome: "Light",
    destaque: false,
    beneficios: ["Até 30 orçamentos respondidos por mês", "Perfil completo com fotos e descrição", "Suporte por WhatsApp"],
  },
  {
    nome: "Completo",
    destaque: true,
    beneficios: [
      "Orçamentos ilimitados por mês",
      "3 meses em Destaques da semana na home",
      "Pra manter o destaque no ciclo seguinte, é só contratar o plano trimestral",
    ],
  },
] as const;

export function formatPrecoPlano(valor: number): string {
  if (valor === 0) return "R$ 0";
  const numero = Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(".", ",");
  return `R$ ${numero}`;
}
