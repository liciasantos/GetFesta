export type TipoCardapio = "infantil" | "coquetel" | "churrasco" | "buffet";
export type Duracao = "curta" | "media" | "longa";

export interface CalculadoraInput {
  adultos: number;
  criancas: number;
  tipoCardapio: TipoCardapio;
  duracao: Duracao;
  ambienteQuente: boolean;
  servirAlcool: boolean;
  percentualBebeAlcool: number;
}

export interface ItemResultado {
  chave: string;
  icone: string;
  label: string;
  quantidade: number;
  unidade: string;
  detalhe?: string;
  nota?: string;
}

export interface ResultadoCalculadora {
  itens: ItemResultado[];
  avisos: string[];
}

export const TIPOS_CARDAPIO: Array<{ value: TipoCardapio; label: string; desc: string }> = [
  { value: "infantil", label: "Aniversário infantil", desc: "Bolo, docinhos e refrigerante" },
  { value: "coquetel", label: "Coquetel", desc: "Salgados e docinhos, sem refeição" },
  { value: "churrasco", label: "Churrasco", desc: "Carne na brasa como prato principal" },
  { value: "buffet", label: "Buffet completo", desc: "Refeição servida (almoço/jantar)" },
];

export const DURACOES: Array<{ value: Duracao; label: string }> = [
  { value: "curta", label: "Até 2h" },
  { value: "media", label: "3 a 4h" },
  { value: "longa", label: "Mais de 4h" },
];

const MARGEM_SEGURANCA = 0.1;

const DURACAO_MULT: Record<Duracao, number> = { curta: 0.75, media: 1, longa: 1.3 };

const CARDAPIO_CONFIG: Record<TipoCardapio, { docinhoAdulto: number; docinhoCrianca: number; salgadoAdulto: number; salgadoCrianca: number }> = {
  // aniversário infantil e coquetel são refeições "de mesa de doces" - sem prato
  // principal, por isso comem mais salgado/docinho do que num churrasco/buffet
  // onde a carne ou o prato principal já resolve a fome.
  infantil: { docinhoAdulto: 8, docinhoCrianca: 6, salgadoAdulto: 4, salgadoCrianca: 3 },
  coquetel: { docinhoAdulto: 6, docinhoCrianca: 4, salgadoAdulto: 10, salgadoCrianca: 6 },
  churrasco: { docinhoAdulto: 3, docinhoCrianca: 2, salgadoAdulto: 4, salgadoCrianca: 2 },
  buffet: { docinhoAdulto: 3, docinhoCrianca: 2, salgadoAdulto: 4, salgadoCrianca: 2 },
};

function arredondarPara(valor: number, multiplo: number): number {
  return Math.ceil(valor / multiplo) * multiplo;
}

export function calcularEvento(input: CalculadoraInput): ResultadoCalculadora {
  const { adultos, criancas, tipoCardapio, duracao, ambienteQuente, servirAlcool, percentualBebeAlcool } = input;
  const totalConvidados = adultos + criancas;
  const itens: ItemResultado[] = [];
  const avisos: string[] = [
    "Todos os valores já incluem uma margem de segurança de 10% para evitar que falte algo — é normal sobrar um pouco.",
  ];

  if (totalConvidados <= 0) {
    return { itens: [], avisos: [] };
  }

  // --- bebida não alcoólica -------------------------------------------------
  const adultosQueBebemAlcool = servirAlcool ? adultos * (percentualBebeAlcool / 100) : 0;
  const adultosSoRefrigerante = adultos - adultosQueBebemAlcool;
  let baseAdultoL = 1.0;
  let baseCriancaL = 0.6;
  if (ambienteQuente) {
    baseAdultoL *= 1.2;
    baseCriancaL *= 1.15;
  }
  const litrosRefrigerante =
    (adultosSoRefrigerante * baseAdultoL + adultosQueBebemAlcool * baseAdultoL * 0.5 + criancas * baseCriancaL) *
    DURACAO_MULT[duracao] *
    (1 + MARGEM_SEGURANCA);
  const garrafas2L = Math.max(1, Math.ceil(litrosRefrigerante / 2));
  itens.push({
    chave: "refrigerante",
    icone: "🥤",
    label: "Refrigerante e suco",
    quantidade: garrafas2L,
    unidade: garrafas2L === 1 ? "garrafa de 2L" : "garrafas de 2L",
    detalhe: `≈ ${litrosRefrigerante.toFixed(1)} litros no total`,
    nota:
      servirAlcool && percentualBebeAlcool > 0
        ? "Reduzimos um pouco a conta pra quem vai beber álcool, mas todo mundo bebe refrigerante em algum momento."
        : ambienteQuente
          ? "Aumentamos a quantidade porque calor puxa muito mais bebida."
          : "Arredondado pra cima porque refrigerante costuma vir em garrafas fechadas de 2L.",
  });

  // --- bebida alcoólica ------------------------------------------------------
  if (servirAlcool && adultosQueBebemAlcool > 0) {
    const litrosPorAdultoBebendo = 1.5 * DURACAO_MULT[duracao] * (ambienteQuente ? 1.15 : 1);
    const litrosCerveja = adultosQueBebemAlcool * litrosPorAdultoBebendo * (1 + MARGEM_SEGURANCA);
    const latas350 = Math.max(1, arredondarPara(Math.ceil((litrosCerveja * 1000) / 350), 6));
    itens.push({
      chave: "cerveja",
      icone: "🍺",
      label: "Cerveja (ou outra bebida alcoólica)",
      quantidade: latas350,
      unidade: "latas de 350ml",
      detalhe: `considerando ${Math.round(percentualBebeAlcool)}% dos adultos bebendo`,
      nota: "Arredondado pra fechar em múltiplos de 6 (fardo/pack). Ajuste pra cima se o pessoal for de beber mais.",
    });
    avisos.push("Se for servir bebida alcoólica, vale ter opção sem álcool à vontade e pensar em transporte pra quem for dirigir.");
  }

  // --- docinhos e salgados -----------------------------------------------
  const cfg = CARDAPIO_CONFIG[tipoCardapio];
  const multDuracaoComida = duracao === "longa" ? 1.15 : duracao === "curta" ? 0.9 : 1;

  const docinhos = arredondarPara(
    Math.ceil((adultos * cfg.docinhoAdulto + criancas * cfg.docinhoCrianca) * multDuracaoComida * (1 + MARGEM_SEGURANCA)),
    5
  );
  itens.push({
    chave: "docinhos",
    icone: "🍬",
    label: "Docinhos",
    quantidade: docinhos,
    unidade: "unidades",
    nota: "Arredondado pra cima em múltiplos de 5 — a maioria dos confeiteiros fecha o pedido assim.",
  });

  const salgados = arredondarPara(
    Math.ceil((adultos * cfg.salgadoAdulto + criancas * cfg.salgadoCrianca) * multDuracaoComida * (1 + MARGEM_SEGURANCA)),
    5
  );
  itens.push({
    chave: "salgados",
    icone: "🥟",
    label: tipoCardapio === "coquetel" ? "Salgadinhos (prato principal)" : "Salgadinhos",
    quantidade: salgados,
    unidade: "unidades",
    nota:
      tipoCardapio === "coquetel"
        ? "Como não tem refeição, a conta de salgado é bem mais generosa aqui."
        : "Pensado como entrada leve — o prato principal já resolve a fome.",
  });

  // --- bolo ------------------------------------------------------------------
  const fatias = Math.ceil((adultos * 1 + criancas * 0.5) * (1 + MARGEM_SEGURANCA));
  const pesoBoloKg = arredondarPara(fatias / 12, 0.5);
  itens.push({
    chave: "bolo",
    icone: "🎂",
    label: "Bolo",
    quantidade: fatias,
    unidade: "fatias",
    detalhe: `≈ ${pesoBoloKg.toFixed(1)}kg (considerando 12 fatias por kg)`,
    nota: "Crianças comem em média metade de uma fatia de adulto — já entra na conta.",
  });

  // --- churrasco ---------------------------------------------------------
  if (tipoCardapio === "churrasco") {
    const multChurrasco = duracao === "longa" ? 1.2 : duracao === "curta" ? 0.85 : 1;
    const carneKg = arredondarPara((adultos * 0.45 + criancas * 0.15) * multChurrasco * (1 + MARGEM_SEGURANCA), 0.5);
    itens.push({
      chave: "carne",
      icone: "🥩",
      label: "Carne",
      quantidade: carneKg,
      unidade: "kg",
      detalhe: "considere misturar 2 a 3 cortes diferentes",
      nota: "Conta pensada pro churrasco ser o prato principal — se tiver bastante entrada/salada antes, dá pra reduzir uns 15%.",
    });

    const carvaoKg = arredondarPara(carneKg / 2.5, 1);
    itens.push({
      chave: "carvao",
      icone: "🔥",
      label: "Carvão",
      quantidade: carvaoKg,
      unidade: "kg",
      nota: "Regra prática: 1kg de carvão pra cada 2,5kg de carne.",
    });

    const paoDeAlho = arredondarPara(Math.ceil(adultos / 2 + criancas / 4), 5);
    itens.push({
      chave: "pao_de_alho",
      icone: "🥖",
      label: "Pão de alho",
      quantidade: paoDeAlho,
      unidade: "unidades",
    });
  }

  // --- gelo, copos e guardanapos ------------------------------------------
  const geloKg = Math.max(1, arredondarPara(adultos * 0.5 + criancas * 0.25, 1));
  itens.push({
    chave: "gelo",
    icone: "🧊",
    label: "Gelo",
    quantidade: geloKg,
    unidade: "kg",
    nota: "1kg de gelo mantém a bebida gelada pra cerca de 2 pessoas durante a festa.",
  });

  const copos = arredondarPara(totalConvidados * 2, 10);
  itens.push({
    chave: "copos",
    icone: "🥃",
    label: "Copos descartáveis",
    quantidade: copos,
    unidade: "unidades",
    nota: "Conta de 2 copos por convidado — as pessoas trocam de copo ao longo da festa.",
  });

  const guardanapos = arredondarPara(totalConvidados * 3, 10);
  itens.push({
    chave: "guardanapos",
    icone: "🧻",
    label: "Guardanapos",
    quantidade: guardanapos,
    unidade: "unidades",
  });

  if (totalConvidados > 60) {
    avisos.push("Pra festas grandes assim, vale pedir um orçamento de um buffet ou fornecedor profissional além de calcular por conta própria.");
  }

  return { itens, avisos };
}
