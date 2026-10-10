import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enviarTexto } from "@/lib/whatsapp/waha";
import { urlSite } from "@/lib/whatsapp/fila";
import { segredoConfere } from "../autorizacao";

export const dynamic = "force-dynamic";

const PALAVRAS_SAIR = ["sair", "parar", "pare", "stop", "cancelar", "descadastrar"];

/**
 * Webhook do WAHA (evento "message"), configurado no servidor com
 * WHATSAPP_HOOK_URL=https://SITE/api/whatsapp/webhook?token=$WHATSAPP_SECRET.
 * Única função: quem responder SAIR deixa de receber avisos (opt-out exigido
 * pela LGPD e pelas regras do WhatsApp). O resto das mensagens é ignorado.
 */
export async function POST(request: NextRequest) {
  if (!segredoConfere(request.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    event?: string;
    payload?: { from?: string; fromMe?: boolean; body?: string };
  } | null;
  const p = body?.payload;
  if (body?.event !== "message" || !p?.from || p.fromMe || !p.body) return NextResponse.json({ ok: true });
  if (p.from.endsWith("@g.us") || p.from === "status@broadcast") return NextResponse.json({ ok: true });

  const palavra = p.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!PALAVRAS_SAIR.includes(palavra)) return NextResponse.json({ ok: true });

  const digitos = p.from.split("@")[0].replace(/\D/g, "");
  const ultimos = digitos.slice(-8); // casa com ou sem o 9 extra
  const afetados = await query<{ id: string }>(
    `UPDATE usuarios SET whatsapp_avisos = FALSE, atualizado_em = now()
      WHERE whatsapp_avisos
        AND (whatsapp_chat_id = $1
             OR (length($2) >= 8 AND right(regexp_replace(COALESCE(NULLIF(whatsapp_numero, ''), telefone), '\D', '', 'g'), 8) = $2))
     RETURNING id`,
    [p.from, ultimos]
  );
  if (afetados.length > 0) {
    await query(`UPDATE whatsapp_fila SET status = 'cancelado', erro = 'opt-out (SAIR)' WHERE status = 'pendente' AND usuario_id = ANY($1::uuid[])`, [
      afetados.map((a) => a.id),
    ]);
  }
  await enviarTexto(
    p.from,
    afetados.length > 0
      ? "Pronto! Você não vai mais receber avisos da GetFesta por aqui. Se mudar de ideia, é só reativar no seu perfil do site."
      : `Não encontramos avisos ativos para este número. Para gerenciar, acesse seu perfil em ${urlSite()}`
  );
  return NextResponse.json({ ok: true, desativados: afetados.length });
}
