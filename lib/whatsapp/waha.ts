/** Cliente HTTP do WAHA (servidor próprio de WhatsApp, ver memória/README).
 * Variáveis: WAHA_URL (ex.: https://...sslip.io), WAHA_API_KEY, WAHA_SESSION
 * (padrão "default"). Nada aqui lança erro pra quem chama - devolve
 * { ok:false, erro } e quem chama decide. */

export function wahaConfigurado(): boolean {
  return !!process.env.WAHA_URL && !!process.env.WAHA_API_KEY;
}

function sessao() {
  return process.env.WAHA_SESSION || "default";
}

async function chamar(caminho: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json: unknown; erro?: string }> {
  if (!wahaConfigurado()) return { ok: false, status: 0, json: null, erro: "WAHA não configurado (WAHA_URL / WAHA_API_KEY)." };
  try {
    const res = await fetch(`${process.env.WAHA_URL!.replace(/\/$/, "")}${caminho}`, {
      ...init,
      headers: { "Content-Type": "application/json", "X-Api-Key": process.env.WAHA_API_KEY!, ...(init?.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const texto = await res.text();
    let json: unknown = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      json = texto;
    }
    return res.ok
      ? { ok: true, status: res.status, json }
      : { ok: false, status: res.status, json, erro: `WAHA ${res.status}: ${texto.slice(0, 200)}` };
  } catch (err) {
    return { ok: false, status: 0, json: null, erro: `Falha ao chamar o WAHA: ${(err as Error).message}` };
  }
}

export type StatusSessao = { ok: boolean; status: string; numero: string | null; nome: string | null; erro?: string };

export async function statusSessao(): Promise<StatusSessao> {
  const r = await chamar(`/api/sessions/${encodeURIComponent(sessao())}`);
  if (!r.ok) return { ok: false, status: r.status === 404 ? "NÃO CRIADA" : "SEM CONEXÃO", numero: null, nome: null, erro: r.erro };
  const j = r.json as { status?: string; me?: { id?: string; pushName?: string } | null };
  return {
    ok: j.status === "WORKING",
    status: j.status ?? "?",
    numero: j.me?.id ? j.me.id.split("@")[0] : null,
    nome: j.me?.pushName ?? null,
  };
}

/** Descobre o chatId real do número no WhatsApp (no Brasil, contas antigas
 * podem estar registradas sem o 9 extra - por isso não dá pra montar o id
 * na mão). null = número sem WhatsApp. */
export async function resolverChatId(numero: string): Promise<{ chatId: string | null; erro?: string }> {
  const r = await chamar(`/api/contacts/check-exists?phone=${numero}&session=${encodeURIComponent(sessao())}`);
  if (!r.ok) return { chatId: null, erro: r.erro };
  const j = r.json as { numberExists?: boolean; chatId?: string };
  return { chatId: j.numberExists && j.chatId ? j.chatId : null };
}

export async function enviarTexto(chatId: string, texto: string): Promise<{ ok: boolean; erro?: string }> {
  const r = await chamar(`/api/sendText`, {
    method: "POST",
    body: JSON.stringify({ session: sessao(), chatId, text: texto, linkPreview: false }),
  });
  return r.ok ? { ok: true } : { ok: false, erro: r.erro };
}
