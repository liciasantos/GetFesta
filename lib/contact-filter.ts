/**
 * Filtro anti-vazamento de contato (secao 10 do plano de produto).
 *
 * Como o pedido e publicado sem login, a descricao (e depois as mensagens
 * internas) sao o ponto mais vulneravel para alguem tentar furar o funil de
 * contato controlado escrevendo o telefone/e-mail disfarcado. Este modulo
 * implementa uma versao inicial das 4 camadas descritas no plano:
 *
 *   1. Normalizacao   -> tolerante a espacamento artificial, "arroba"/"ponto"
 *                        e numero por extenso (zero a nove / meia).
 *   2. Deteccao       -> regex de telefone (8+ digitos, mesmo espacados) e de
 *                        e-mail disfarcado.
 *   3. Bloqueio       -> detectContactLeak() usado no submit (API de pedidos
 *                        e de mensagens) para rejeitar o envio.
 *   4. Mascaramento   -> maskContactLeak() usado na exibicao publica, como
 *                        camada redundante para qualquer disfarce que passe
 *                        despercebido pela deteccao no envio.
 *
 * Isto e uma heuristica inicial - super facil de gerar falso positivo/negativo
 * em casos de borda. Antes de ir pra producao vale calibrar com uma amostra
 * real de pedidos (o proprio plano pede cuidado pra nao travar em numeros
 * legitimos curtos: idade, preco, capacidade de convidados).
 */

const DIGIT_WORD =
  "(?:\\d|zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|meia|sete|oito|nove)";

// 8+ "digitos" (numericos ou por extenso) em sequencia, tolerando espaco/traco/ponto
// artificial entre eles - captura tanto "21999887766" quanto "2 1 9 9 9 8 8 7 7 6 6"
// e "dois um nove nove nove oito oito sete sete meia meia".
function phoneRegex(): RegExp {
  return new RegExp(`(?:${DIGIT_WORD}[\\s\\-.]*){8,}`, "gi");
}

// e-mail disfarcado: aceita "@"/"arroba" e "."/"ponto" com espacos ao redor.
function emailRegex(): RegExp {
  return /[a-z0-9._%+-]+\s*(?:@|\(?\s*arroba\s*\)?)\s*[a-z0-9-]+\s*(?:\.|\(?\s*ponto\s*\)?)\s*(?:com(?:\.br)?|net|org|br|io)\b/gi;
}

export type ContactLeakResult = {
  blocked: boolean;
  motivos: string[];
};

/** Layer 2+3: usado no momento do envio (pedido, mensagem, perfil). */
export function detectContactLeak(texto: string): ContactLeakResult {
  const motivos: string[] = [];
  if (phoneRegex().test(texto)) motivos.push("possivel_telefone");
  if (emailRegex().test(texto)) motivos.push("possivel_email");
  return { blocked: motivos.length > 0, motivos };
}

/** Layer 4: usado na exibicao publica, como rede de seguranca redundante. */
export function maskContactLeak(texto: string): string {
  return texto.replace(phoneRegex(), "[contato oculto]").replace(emailRegex(), "[contato oculto]");
}
