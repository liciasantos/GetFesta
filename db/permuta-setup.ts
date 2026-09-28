/**
 * Aplica as migrações da Permuta B2B (db/migrations/*permuta*.sql) no banco
 * do DATABASE_URL - são idempotentes, pode rodar quantas vezes quiser.
 *
 *   npm run permuta:setup           -> só cria/atualiza as tabelas
 *   npm run permuta:setup -- --demo -> também cria ofertas e acordos de exemplo
 *                                     entre as empresas do seed (só se ainda
 *                                     não existir nenhum acordo)
 *
 * Login pra ver a demo: casadefestaslua@teste.com / teste123
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pool } from "../lib/db";

async function main() {
  // todas as migrações da permuta, em ordem de data (cada uma é idempotente)
  const dir = path.join(__dirname, "migrations");
  for (const arquivo of readdirSync(dir).filter((f) => f.includes("permuta") && f.endsWith(".sql")).sort()) {
    await pool.query(readFileSync(path.join(dir, arquivo), "utf8"));
    console.log(`Permuta: ${arquivo} aplicada.`);
  }

  if (process.argv.includes("--demo")) await demo();
  await pool.end();
}

async function demo() {
  const { rows: existentes } = await pool.query(`SELECT 1 FROM permuta_acordos LIMIT 1`);
  if (existentes.length) {
    console.log("Permuta: já existem acordos - demo não recriada.");
    return;
  }
  const { rows: empresas } = await pool.query<{ usuario_id: string; email: string }>(
    `SELECT e.usuario_id, u.email FROM empresas e JOIN usuarios u ON u.id = e.usuario_id`
  );
  const id = (email: string) => empresas.find((e) => e.email === email)?.usuario_id;
  const lua = id("casadefestaslua@teste.com");
  const doce = id("doceestacao@teste.com");
  const fantasy = id("fantasykids@teste.com");
  const flor = id("atelieflor@teste.com");
  const sitio = id("sitiorecantoverde@teste.com");
  if (!lua || !doce || !fantasy || !flor || !sitio) {
    console.log("Permuta: empresas do seed não encontradas (rode npm run seed antes) - demo pulada.");
    return;
  }
  const cat = async (slug: string) =>
    (await pool.query<{ id: number }>(`SELECT id FROM categorias WHERE slug = $1`, [slug])).rows[0]?.id ?? null;

  const oferta = async (empresa: string, slug: string, titulo: string, valor: number, descricao: string) =>
    (
      await pool.query<{ id: string }>(
        `INSERT INTO permuta_ofertas (empresa_id, categoria_id, titulo, valor_referencia, descricao) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [empresa, await cat(slug), titulo, valor, descricao]
      )
    ).rows[0].id;

  const oLua = await oferta(lua, "saloes", "Salão para 80 pessoas por 5 h", 3500, "Salão climatizado, mesas, cadeiras e equipe de limpeza.");
  const oLuaDeco = await oferta(lua, "decoracao", "Decoração temática simples", 1200, "Mesa do bolo, painel e 20 centros de mesa.");
  const oDoce = await oferta(doce, "buffet", "Buffet infantil para 60 pessoas", 2400, "4 h de serviço, 2 garçons, salgados, doces e bebidas não alcoólicas.");
  const oFantasy = await oferta(fantasy, "animacao", "3 h de recreação com 2 personagens", 1500, "Até 30 crianças, som portátil incluso.");
  const oFlor = await oferta(flor, "decoracao", "Decoração provençal completa", 2600, "Mesa principal, arco de balões e arranjos.");
  const oSitio = await oferta(sitio, "sitios", "Sítio por 1 dia (até 100 pessoas)", 4000, "Piscina, campo e churrasqueira, das 9h às 19h.");

  for (const e of [lua, doce, fantasy, flor, sitio]) {
    await pool.query(`INSERT INTO permuta_participantes (empresa_id) VALUES ($1) ON CONFLICT DO NOTHING`, [e]);
  }

  const busca = async (empresa: string, slugs: string[]) => {
    for (const s of slugs) {
      const c = await cat(s);
      if (c) await pool.query(`INSERT INTO permuta_buscas VALUES ($1,$2) ON CONFLICT DO NOTHING`, [empresa, c]);
    }
  };
  await busca(lua, ["animacao", "buffet", "sitios", "musica_som"]);
  await busca(doce, ["saloes", "decoracao"]);
  await busca(fantasy, ["saloes", "buffet"]);
  await busca(flor, ["saloes", "fotografia"]);
  await busca(sitio, ["decoracao", "buffet"]);

  const dia = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  type Perna = { prestador: string; beneficiario: string; oferta: string; titulo: string; valor: number; data: number; status: string; nota?: number };
  const acordo = async (
    proponente: string,
    destinatario: string,
    status: string,
    pernas: [Perna, Perna],
    opts: { assinadoDestinatario?: boolean; compensacao?: string; criadoHaDias: number }
  ) => {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO permuta_acordos (proponente_id, destinatario_id, status, compensacao, ultima_edicao_por,
         assinado_proponente_em, assinado_destinatario_em, criado_em, atualizado_em)
       VALUES ($1,$2,$3,$4,$1, now() - make_interval(days => $5::int), CASE WHEN $6::boolean THEN now() - make_interval(days => $5::int - 1) END,
         now() - make_interval(days => $5::int), now()) RETURNING id`,
      [proponente, destinatario, status, opts.compensacao ?? null, opts.criadoHaDias, opts.assinadoDestinatario ?? true]
    );
    const acordoId = rows[0].id;
    for (const [i, p] of pernas.entries()) {
      const { rows: er } = await pool.query<{ id: string }>(
        `INSERT INTO permuta_entregas (acordo_id, ordem, prestador_id, beneficiario_id, oferta_id, titulo, valor_referencia,
           data_evento, local_evento, status, confirmada_em, escopo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Rio de Janeiro — RJ',$9::status_entrega_permuta, CASE WHEN $9::text = 'confirmada' THEN now() END, $10) RETURNING id`,
        [acordoId, i + 1, p.prestador, p.beneficiario, p.oferta, p.titulo, p.valor, dia(p.data), p.status, "Conforme a oferta cadastrada."]
      );
      if (p.nota) {
        await pool.query(
          `INSERT INTO permuta_avaliacoes (entrega_id, avaliador_id, avaliado_id, nota, pontual, comentario) VALUES ($1,$2,$3,$4,TRUE,$5)`,
          [er[0].id, p.beneficiario, p.prestador, p.nota, p.nota >= 5 ? "Impecável, equipe muito organizada." : "Tudo certo, recomendo."]
        );
      }
    }
    await pool.query(`INSERT INTO permuta_mensagens (acordo_id, remetente_id, conteudo, enviado_em) VALUES ($1, NULL, $2, now() - interval '5 days')`, [
      acordoId,
      status === "proposta" ? "Proposta enviada e assinada pelo proponente." : "Acordo assinado pelas duas empresas. Contatos liberados — bom evento!",
    ]);
    return acordoId;
  };

  // 1) concluída: Lua fez a festa da Ateliê Flor, e a Flor decorou o evento da Lua
  await acordo(lua, flor, "concluido", [
    { prestador: flor, beneficiario: lua, oferta: oFlor, titulo: "Decoração provençal completa", valor: 2600, data: -70, status: "confirmada", nota: 5 },
    { prestador: lua, beneficiario: flor, oferta: oLua, titulo: "Salão para 80 pessoas por 5 h", valor: 3500, data: -45, status: "confirmada", nota: 5 },
  ], { criadoHaDias: 90, compensacao: "Flor inclui 20 centros de mesa extras" });

  // 2) em execução: Lua já entregou, Fantasy Kids ainda deve
  const a2 = await acordo(lua, fantasy, "em_execucao", [
    { prestador: lua, beneficiario: fantasy, oferta: oLuaDeco, titulo: "Decoração temática simples", valor: 1200, data: -10, status: "confirmada", nota: 5 },
    { prestador: fantasy, beneficiario: lua, oferta: oFantasy, titulo: "3 h de recreação com 2 personagens", valor: 1500, data: 21, status: "agendada" },
  ], { criadoHaDias: 30 });
  await pool.query(`INSERT INTO permuta_mensagens (acordo_id, remetente_id, conteudo) VALUES ($1,$2,$3)`, [
    a2,
    fantasy,
    "Obrigada pela decoração! Já reservamos os personagens para o seu evento.",
  ]);

  // 3) em execução: o Sítio entregou ontem (Lua precisa confirmar) e a Lua entrega em 7 dias
  await acordo(sitio, lua, "em_execucao", [
    { prestador: sitio, beneficiario: lua, oferta: oSitio, titulo: "Sítio por 1 dia (até 100 pessoas)", valor: 4000, data: -1, status: "agendada" },
    { prestador: lua, beneficiario: sitio, oferta: oLua, titulo: "Salão para 80 pessoas por 5 h", valor: 3500, data: 7, status: "agendada" },
  ], { criadoHaDias: 40, compensacao: "Lua inclui a decoração temática simples" });

  // 4) proposta da Doce Estação aguardando a assinatura da Lua
  await acordo(doce, lua, "proposta", [
    { prestador: doce, beneficiario: lua, oferta: oDoce, titulo: "Buffet infantil para 60 pessoas", valor: 2400, data: 35, status: "agendada" },
    { prestador: lua, beneficiario: doce, oferta: oLuaDeco, titulo: "Decoração temática simples", valor: 1200, data: 50, status: "agendada" },
  ], { criadoHaDias: 2, assinadoDestinatario: false, compensacao: "Lua também cede o salão por 2 h para a montagem" });

  console.log("Permuta: dados de exemplo criados. Entre como casadefestaslua@teste.com / teste123 e abra /painel/permutas");
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
