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

// Segmentos de rota fixos sob /produtos ("categoria"/"tema"/"favoritos") mais
// "novo" (usado nos formularios de criacao no admin) - um produto nunca pode
// receber um desses como slug, senao colide com /produtos/[slug].
const SLUGS_RESERVADOS = new Set(["categoria", "tema", "favoritos", "novo"]);

/** Gera um slug unico pra URL bonita (/empresa/nome-da-empresa em vez de
 * /empresa/uuid) - tenta o slug base e vai incrementando sufixo -2, -3... ate
 * achar um livre na tabela informada (e que nao seja uma palavra reservada). */
async function gerarSlugUnico(
  tabela: "empresas" | "profissionais" | "produtos_afiliados",
  base: string
): Promise<string> {
  const raizDefault = tabela === "empresas" ? "empresa" : tabela === "profissionais" ? "profissional" : "produto";
  const raiz = slugify(base) || raizDefault;
  let candidato = SLUGS_RESERVADOS.has(raiz) ? `${raiz}-2` : raiz;
  let sufixo = 2;
  while (await queryOne(`SELECT 1 FROM ${tabela} WHERE slug = $1`, [candidato])) {
    sufixo++;
    candidato = `${raiz}-${sufixo}`;
  }
  return candidato;
}

export function gerarSlugUnicoEmpresa(nomeFantasia: string): Promise<string> {
  return gerarSlugUnico("empresas", nomeFantasia);
}

export function gerarSlugUnicoProfissional(nome: string): Promise<string> {
  return gerarSlugUnico("profissionais", nome);
}

export function gerarSlugUnicoProdutoAfiliado(nome: string): Promise<string> {
  return gerarSlugUnico("produtos_afiliados", nome);
}

/** eventos_rsvp guarda o slug na coluna slug_publico (nao "slug" como as
 * demais tabelas) - pensada pra uma futura pagina publica de confirmacao de
 * presenca (/rsvp/[slug]), que ainda nao existe: por enquanto a lista de
 * convidados só é gerenciada dentro da área logada do cliente, mas gerar o
 * slug já agora evita ter que popular esse NOT NULL depois. */
export async function gerarSlugUnicoEventoRsvp(titulo: string): Promise<string> {
  const raiz = slugify(titulo) || "evento";
  let candidato = raiz;
  let sufixo = 2;
  while (await queryOne(`SELECT 1 FROM eventos_rsvp WHERE slug_publico = $1`, [candidato])) {
    candidato = `${raiz}-${sufixo}`;
    sufixo++;
  }
  return candidato;
}
