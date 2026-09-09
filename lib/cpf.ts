export function normalizeCPF(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function formatCPF(raw: string): string {
  const digits = normalizeCPF(raw);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/** Valida os dígitos verificadores de verdade (não só o formato/tamanho) -
 * diferente do CNPJ no resto do código, que só confere 14 dígitos. Isso
 * importa aqui porque CPF é justamente o campo usado pra coibir cadastro
 * falso/duplicado, então vale a pena validar de verdade. */
export function isValidCPF(raw: string): boolean {
  const cpf = normalizeCPF(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigito = (base: string) => {
    let total = 0;
    let fator = base.length + 1;
    for (const digito of base) {
      total += Number(digito) * fator--;
    }
    const resto = (total * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcDigito(cpf.slice(0, 9));
  const digito2 = calcDigito(cpf.slice(0, 9) + digito1);

  return cpf === cpf.slice(0, 9) + String(digito1) + String(digito2);
}
