/**
 * Validação de CNPJ em duas camadas:
 *   1. cnpjValido()      -> dígitos verificadores (offline, instantâneo)
 *   2. consultarCnpj()   -> situação cadastral na Receita via BrasilAPI, com
 *                           publica.cnpj.ws de reserva (gratuitas, sem chave).
 *                           Só "ATIVA" conta como validado.
 * Quando as duas estão fora do ar o resultado é "indisponivel" - quem chama
 * decide o que fazer (no cadastro a conta é criada mesmo assim e a empresa
 * valida depois pelo painel; o admin também pode marcar manualmente).
 */

export function limparCnpj(cnpj: string) {
  return cnpj.replace(/\D/g, "");
}

export function cnpjValido(cnpj: string): boolean {
  const d = limparCnpj(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (base: string, pesos: number[]) => {
    const soma = pesos.reduce((s, p, i) => s + Number(base[i]) * p, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, ...p1];
  return calc(d, p1) === Number(d[12]) && calc(d, p2) === Number(d[13]);
}

export type ConsultaCnpj =
  | { status: "ativa"; razaoSocial: string }
  | { status: "inativa"; situacao: string; razaoSocial: string }
  | { status: "nao_encontrado" }
  | { status: "indisponivel" };

const HEADERS = {
  Accept: "application/json",
  // sem User-Agent a BrasilAPI responde 403
  "User-Agent": "GetFesta/1.0 (+https://getfesta-mvp.vercel.app)",
};

type Fonte = (cnpj: string, timeoutMs: number) => Promise<ConsultaCnpj>;

const brasilApi: Fonte = async (d, timeoutMs) => {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`, {
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
    headers: HEADERS,
  });
  if (res.status === 404) return { status: "nao_encontrado" };
  if (!res.ok) return { status: "indisponivel" };
  const data = (await res.json()) as { razao_social?: string; descricao_situacao_cadastral?: string };
  return resultado(data.descricao_situacao_cadastral, data.razao_social);
};

// reserva: publica.cnpj.ws (gratuita, limite de 3 consultas/min)
const cnpjWs: Fonte = async (d, timeoutMs) => {
  const res = await fetch(`https://publica.cnpj.ws/cnpj/${d}`, {
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
    headers: HEADERS,
  });
  if (res.status === 404) return { status: "nao_encontrado" };
  if (!res.ok) return { status: "indisponivel" };
  const data = (await res.json()) as { razao_social?: string; estabelecimento?: { situacao_cadastral?: string } };
  return resultado(data.estabelecimento?.situacao_cadastral, data.razao_social);
};

function resultado(situacaoRaw: string | undefined, razaoSocial: string | undefined): ConsultaCnpj {
  const situacao = (situacaoRaw ?? "").toUpperCase();
  if (situacao === "ATIVA") return { status: "ativa", razaoSocial: razaoSocial ?? "" };
  return { status: "inativa", situacao: situacao || "DESCONHECIDA", razaoSocial: razaoSocial ?? "" };
}

export async function consultarCnpj(cnpj: string, timeoutMs = 8000): Promise<ConsultaCnpj> {
  const d = limparCnpj(cnpj);
  if (!cnpjValido(d)) return { status: "nao_encontrado" };
  for (const fonte of [brasilApi, cnpjWs]) {
    try {
      const r = await fonte(d, timeoutMs);
      if (r.status !== "indisponivel") return r;
    } catch {
      // fonte fora do ar ou lenta - tenta a próxima
    }
  }
  return { status: "indisponivel" };
}
