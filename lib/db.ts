import { Pool, type QueryResultRow } from "pg";

// Singleton do pool de conexoes - reaproveitado entre hot-reloads do Next.js em dev.
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// Reaproveitado também em produção - sem isso, cada nova instância de função
// serverless na Vercel cria seu próprio pool (até `max` conexões cada), o
// que esgota o limite de conexões do Neon conforme o tráfego cresce (erro
// Postgres 53000 - insufficient_resources). O global sobrevive entre
// invocações num mesmo container "morno" da função.
export const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

global.__pgPool = pool;

/** Helper tipado para SELECT/INSERT...RETURNING */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/** Helper para pegar so a primeira linha (ou null) */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
