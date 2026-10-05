/**
 * Aplica TODAS as migrações de db/migrations em ordem de data no banco do
 * DATABASE_URL. Cada arquivo é idempotente (IF NOT EXISTS etc.), então pode
 * rodar quantas vezes quiser - em produção, rode depois de cada publicação
 * que trouxer um arquivo novo em db/migrations.
 *
 *   npm run db:migrate
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pool } from "../lib/db";

async function main() {
  const dir = path.join(__dirname, "migrations");
  for (const arquivo of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await pool.query(readFileSync(path.join(dir, arquivo), "utf8"));
    console.log(`${arquivo} aplicada.`);
  }
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
