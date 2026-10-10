import { pool, query, queryOne } from "@/lib/db";
import { CONFIG_WHATSAPP, eventoDoTipo, normalizarNumero, parseWhatsAppConfig, type TipoAviso, type WhatsAppConfig } from "./regras";
import { enviarTexto, resolverChatId, statusSessao, wahaConfigurado } from "./waha";

/** Fila de avisos por WhatsApp. As ações do site só ENFILEIRAM (rápido,
 * nunca trava a ação); quem envia é processarFila, chamado a cada minuto
 * pelo cron do próprio servidor do WAHA (curl em /api/whatsapp/processar).
 * Um envio por vez, com pausa aleatória, dentro do horário e do limite
 * diário da config - o jeito de reduzir o risco de bloqueio do número. */

export const RODAPE = "\n\n_Responda SAIR para não receber mais avisos por aqui._";

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const row = await queryOne<{ valor: string }>(`SELECT valor FROM configuracoes_site WHERE chave = $1`, [CONFIG_WHATSAPP]);
  return parseWhatsAppConfig(row?.valor);
}

/** URL pública do site pros links das mensagens. */
export function urlSite(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export type ItemFila = { usuarioId: string; chave: string; texto: string };

/** Enfileira um aviso para cada usuário que ativou o WhatsApp (os demais são
 * ignorados em silêncio). `chave` repetida não gera aviso duplicado. Nunca
 * lança erro. */
export async function enfileirar(tipo: TipoAviso, itens: ItemFila[]): Promise<number> {
  try {
    if (itens.length === 0) return 0;
    const cfg = await getWhatsAppConfig();
    if (!cfg.ativo) return 0;
    const evento = eventoDoTipo(tipo);
    if (evento && !cfg[evento]) return 0;
    let n = 0;
    for (const it of itens) {
      const r = await query(
        `INSERT INTO whatsapp_fila (usuario_id, tipo, chave, texto)
         SELECT u.id, $2, $3, $4 FROM usuarios u
          WHERE u.id = $1 AND u.whatsapp_avisos AND u.ativo AND NOT u.banido
         ON CONFLICT (chave) DO NOTHING RETURNING id`,
        [it.usuarioId, tipo, it.chave, it.texto + RODAPE]
      );
      n += r.length;
    }
    return n;
  } catch (err) {
    console.error("Falha ao enfileirar aviso de WhatsApp:", err);
    return 0;
  }
}

function horaBrasilia(): number {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ResultadoProcessamento = { enviados: number; erros: number; motivo?: string };

/** Envia o que estiver na fila até `tempoMaxMs`. Só um processamento roda
 * por vez (advisory lock), então chamadas simultâneas não furam o intervalo. */
export async function processarFila(tempoMaxMs = 50_000): Promise<ResultadoProcessamento> {
  const inicio = Date.now();
  const cfg = await getWhatsAppConfig();
  if (!cfg.ativo) return { enviados: 0, erros: 0, motivo: "desativado" };
  if (!wahaConfigurado()) return { enviados: 0, erros: 0, motivo: "waha_nao_configurado" };
  const hora = horaBrasilia();
  if (hora < cfg.horaInicio || hora >= cfg.horaFim) return { enviados: 0, erros: 0, motivo: "fora_do_horario" };

  const cliente = await pool.connect();
  let enviados = 0;
  let erros = 0;
  try {
    const lock = await cliente.query<{ ok: boolean }>(`SELECT pg_try_advisory_lock(764201) AS ok`);
    if (!lock.rows[0]?.ok) return { enviados: 0, erros: 0, motivo: "ja_processando" };
    try {
      const sessao = await statusSessao();
      if (!sessao.ok) return { enviados: 0, erros: 0, motivo: `sessao_${sessao.status}` };

      // destrava itens que ficaram presos em "enviando" (função interrompida)
      await query(`UPDATE whatsapp_fila SET status = 'pendente' WHERE status = 'enviando' AND travado_em < now() - interval '10 minutes'`);

      while (Date.now() - inicio < tempoMaxMs) {
        const hoje = await queryOne<{ n: number }>(
          `SELECT count(*)::int AS n FROM whatsapp_fila
            WHERE status = 'enviado' AND enviado_em >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'`
        );
        if ((hoje?.n ?? 0) >= cfg.limiteDiario) return { enviados, erros, motivo: "limite_diario" };

        const item = await queryOne<{ id: string; usuario_id: string; texto: string; tentativas: number }>(
          `UPDATE whatsapp_fila SET status = 'enviando', travado_em = now(), tentativas = tentativas + 1
            WHERE id = (SELECT id FROM whatsapp_fila WHERE status = 'pendente' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
           RETURNING id, usuario_id, texto, tentativas`
        );
        if (!item) break;

        const dest = await queryOne<{ whatsapp_avisos: boolean; numero: string | null; chat_id: string | null }>(
          `SELECT whatsapp_avisos, COALESCE(NULLIF(whatsapp_numero, ''), telefone) AS numero, whatsapp_chat_id AS chat_id
             FROM usuarios WHERE id = $1`,
          [item.usuario_id]
        );
        if (!dest?.whatsapp_avisos) {
          await query(`UPDATE whatsapp_fila SET status = 'cancelado', erro = 'avisos desativados' WHERE id = $1`, [item.id]);
          continue;
        }

        let chatId = dest.chat_id;
        if (!chatId) {
          const numero = normalizarNumero(dest.numero);
          const r = numero ? await resolverChatId(numero) : { chatId: null, erro: "número inválido" };
          if (!r.chatId) {
            const semWhats = !r.erro;
            await query(`UPDATE whatsapp_fila SET status = $2, erro = $3 WHERE id = $1`, [
              item.id,
              semWhats || item.tentativas >= 3 ? "erro" : "pendente",
              semWhats ? "número sem WhatsApp" : r.erro,
            ]);
            erros++;
            continue;
          }
          chatId = r.chatId;
          await query(`UPDATE usuarios SET whatsapp_chat_id = $2 WHERE id = $1`, [item.usuario_id, chatId]);
        }

        const env = await enviarTexto(chatId, item.texto);
        if (env.ok) {
          await query(`UPDATE whatsapp_fila SET status = 'enviado', enviado_em = now(), erro = NULL WHERE id = $1`, [item.id]);
          enviados++;
        } else {
          await query(`UPDATE whatsapp_fila SET status = $2, erro = $3 WHERE id = $1`, [
            item.id,
            item.tentativas >= 3 ? "erro" : "pendente",
            env.erro ?? "falha no envio",
          ]);
          erros++;
        }

        const pausa = (cfg.intervaloMin + Math.random() * Math.max(0, cfg.intervaloMax - cfg.intervaloMin)) * 1000;
        if (Date.now() - inicio + pausa >= tempoMaxMs) break;
        await dormir(pausa);
      }
    } finally {
      await cliente.query(`SELECT pg_advisory_unlock(764201)`);
    }
  } finally {
    cliente.release();
  }
  return { enviados, erros };
}
