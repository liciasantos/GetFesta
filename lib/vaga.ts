/** Nome de exibição da vaga: o título que a empresa deu (ex.: "Mascote Bluey
 * — aniversário da Maria") ou, sem título, a função (ex.: "Ator/atriz"). */
export function nomeDaVaga(v: { titulo?: string | null; categoria_nome: string }): string {
  return v.titulo?.trim() || v.categoria_nome;
}
