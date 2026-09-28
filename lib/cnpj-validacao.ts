import { query, queryOne } from "@/lib/db";
import { consultarCnpj, type ConsultaCnpj } from "@/lib/cnpj";

/** Consulta a situação do CNPJ da empresa e grava o resultado: ATIVA marca
 * cnpj_validado; outra situação desmarca; API fora do ar não mexe em nada. */
export async function validarCnpjDaEmpresa(empresaId: string, timeoutMs?: number): Promise<ConsultaCnpj | null> {
  const empresa = await queryOne<{ cnpj: string }>(`SELECT cnpj FROM empresas WHERE usuario_id = $1`, [empresaId]);
  if (!empresa) return null;
  const r = await consultarCnpj(empresa.cnpj, timeoutMs);
  if (r.status === "ativa") {
    await query(`UPDATE empresas SET cnpj_validado = TRUE, cnpj_validado_em = now() WHERE usuario_id = $1`, [empresaId]);
  } else if (r.status === "inativa" || r.status === "nao_encontrado") {
    await query(`UPDATE empresas SET cnpj_validado = FALSE, cnpj_validado_em = now() WHERE usuario_id = $1`, [empresaId]);
  }
  return r;
}

export function mensagemConsultaCnpj(r: ConsultaCnpj | null): { ok: boolean; texto: string } {
  if (!r) return { ok: false, texto: "Empresa não encontrada." };
  switch (r.status) {
    case "ativa":
      return { ok: true, texto: "CNPJ validado: situação ATIVA na Receita Federal." };
    case "inativa":
      return {
        ok: false,
        texto: `A Receita Federal informa a situação "${r.situacao}" para este CNPJ. Só CNPJs com situação ATIVA são validados.`,
      };
    case "nao_encontrado":
      return { ok: false, texto: "CNPJ não encontrado na Receita Federal. Confira o número cadastrado com a equipe GetFesta." };
    case "indisponivel":
      return { ok: false, texto: "A consulta à Receita está indisponível no momento. Tente de novo em alguns minutos." };
  }
}
