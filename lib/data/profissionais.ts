import { query, queryOne } from "@/lib/db";

export type CategoriaProfissional = { id: number; slug: string; nome: string };

export async function listCategoriasProfissionais(): Promise<CategoriaProfissional[]> {
  return query<CategoriaProfissional>(`SELECT id, slug, nome FROM categorias_profissionais ORDER BY nome`);
}

export type PerfilProfissional = {
  usuario_id: string;
  nome: string;
  foto_perfil_url: string | null;
  bairro_id: number | null;
  bairro_nome: string | null;
  cidade_id: number | null;
  cidade_nome: string | null;
  disponibilidade_status: "disponivel" | "indisponivel" | "nao_informado";
  sexo: string | null;
  medidas_habilitadas: boolean;
  altura_cm: number | null;
  peso_kg: number | null;
  cintura_cm: number | null;
  manequim: string | null;
  calcado: string | null;
  categorias: { id: number; nome: string }[];
  galeria: { id: string; url: string }[];
};

export async function getMeuPerfilProfissional(usuarioId: string): Promise<PerfilProfissional | null> {
  const base = await queryOne<{
    usuario_id: string;
    nome: string;
    foto_perfil_url: string | null;
    bairro_id: number | null;
    bairro_nome: string | null;
    cidade_id: number | null;
    cidade_nome: string | null;
    disponibilidade_status: "disponivel" | "indisponivel" | "nao_informado";
    sexo: string | null;
    medidas_habilitadas: boolean;
    altura_cm: number | null;
    peso_kg: number | null;
    cintura_cm: number | null;
    manequim: string | null;
    calcado: string | null;
  }>(
    `SELECT p.usuario_id, p.nome, p.foto_perfil_url, p.bairro_id, b.nome AS bairro_nome,
            ci.id AS cidade_id, ci.nome AS cidade_nome, p.disponibilidade_status,
            p.sexo, p.medidas_habilitadas, p.altura_cm, p.peso_kg, p.cintura_cm, p.manequim, p.calcado
     FROM profissionais p
     LEFT JOIN bairros b ON b.id = p.bairro_id
     LEFT JOIN cidades ci ON ci.id = b.cidade_id
     WHERE p.usuario_id = $1`,
    [usuarioId]
  );
  if (!base) return null;

  const [categorias, galeria] = await Promise.all([
    query<{ id: number; nome: string }>(
      `SELECT cp.id, cp.nome
       FROM profissional_categorias pc
       JOIN categorias_profissionais cp ON cp.id = pc.categoria_id
       WHERE pc.profissional_id = $1
       ORDER BY cp.nome`,
      [usuarioId]
    ),
    query<{ id: string; url: string }>(
      `SELECT id, url FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'foto' ORDER BY ordem ASC`,
      [usuarioId]
    ),
  ]);

  return { ...base, categorias, galeria };
}

/** Telefone fica em usuarios, não em profissionais - só usado quando uma
 * empresa autenticada precisa contatar o profissional (ex.: candidatura a
 * uma vaga ou visita ao perfil dele). */
export async function getTelefoneProfissional(usuarioId: string): Promise<string | null> {
  const row = await queryOne<{ telefone: string | null }>(`SELECT telefone FROM usuarios WHERE id = $1`, [usuarioId]);
  return row?.telefone ?? null;
}

