import { queryOne } from "@/lib/db";

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Gera um slug unico pra URL bonita (/empresa/nome-da-empresa em vez de
 * /empresa/uuid) - tenta o slug base e vai incrementando sufixo -2, -3... ate
 * achar um livre na tabela informada. */
async function gerarSlugUnico(tabela: "empresas" | "profissionais", base: string): Promise<string> {
  const raiz = slugify(base) || (tabela === "empresas" ? "empresa" : "profissional");
  let candidato = raiz;
  let sufixo = 2;
  while (await queryOne(`SELECT 1 FROM ${tabela} WHERE slug = $1`, [candidato])) {
    candidato = `${raiz}-${sufixo}`;
    sufixo++;
  }
  return candidato;
}

export function gerarSlugUnicoEmpresa(nomeFantasia: string): Promise<string> {
  return gerarSlugUnico("empresas", nomeFantasia);
}

export function gerarSlugUnicoProfissional(nome: string): Promise<string> {
  return gerarSlugUnico("profissionais", nome);
}
