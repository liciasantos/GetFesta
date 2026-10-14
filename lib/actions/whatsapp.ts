"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enfileirar, getWhatsAppConfig, processarFila } from "@/lib/whatsapp/fila";
import {
  CONFIG_WHATSAPP,
  COOKIE_CONVITE_WHATSAPP,
  WHATSAPP_PADRAO,
  formatarNumero,
  normalizarNumero,
  type WhatsAppConfig,
} from "@/lib/whatsapp/regras";
import { enviarTexto, resolverChatId } from "@/lib/whatsapp/waha";

export type WhatsAppActionState = { ok?: boolean; error?: string; mensagem?: string } | undefined;

function textoBoasVindas(tipo: "empresa" | "profissional") {
  return (
    "👋 Olá! Você ativou os avisos da *GetFesta* por WhatsApp.\n\n" +
    (tipo === "empresa"
      ? "Vamos te avisar por aqui de novos pedidos de orçamento, candidatos nas suas vagas e lembretes de eventos."
      : "Vamos te avisar por aqui de vagas novas para você, quando uma empresa te escolher e lembretes na véspera dos eventos.")
  );
}

function revalidarPerfis() {
  revalidatePath("/painel/perfil");
  revalidatePath("/perfil-profissional");
}

/** Empresa ou profissional liga/desliga os avisos e informa o número. Ao
 * ligar, sai uma mensagem de boas-vindas - serve de teste do número. */
export async function salvarAvisosWhatsApp(_prev: WhatsAppActionState, formData: FormData): Promise<WhatsAppActionState> {
  const session = await getSession();
  if (!session || (session.tipo !== "empresa" && session.tipo !== "profissional")) return { error: "Sessão inválida." };

  const ativar = formData.get("ativar") === "1";
  if (!ativar) {
    await query(`UPDATE usuarios SET whatsapp_avisos = FALSE, atualizado_em = now() WHERE id = $1`, [session.usuarioId]);
    await query(`UPDATE whatsapp_fila SET status = 'cancelado', erro = 'avisos desativados' WHERE status = 'pendente' AND usuario_id = $1`, [
      session.usuarioId,
    ]);
    revalidarPerfis();
    return { ok: true, mensagem: "Avisos por WhatsApp desativados." };
  }

  const cfg = await getWhatsAppConfig();
  if (!cfg.ativo) return { error: "Os avisos por WhatsApp estão temporariamente indisponíveis." };
  if (formData.get("consentimento") !== "on") return { error: "Marque a autorização para receber mensagens." };
  const numero = normalizarNumero(String(formData.get("numero") ?? ""));
  if (!numero) return { error: "Informe um celular válido com DDD, ex.: (11) 98765-4321." };

  const atual = await queryOne<{ whatsapp_numero: string | null }>(`SELECT whatsapp_numero FROM usuarios WHERE id = $1`, [session.usuarioId]);
  const mudouNumero = normalizarNumero(atual?.whatsapp_numero) !== numero;
  await query(
    `UPDATE usuarios SET whatsapp_avisos = TRUE, whatsapp_numero = $2, whatsapp_optin_em = now(), atualizado_em = now()
       ${mudouNumero ? ", whatsapp_chat_id = NULL" : ""}
     WHERE id = $1`,
    [session.usuarioId, numero]
  );
  const texto = textoBoasVindas(session.tipo);
  after(() => enfileirar("boas_vindas", [{ usuarioId: session.usuarioId, chave: `boas_vindas:${session.usuarioId}:${Date.now()}`, texto }]));
  revalidarPerfis();
  return { ok: true, mensagem: `Avisos ativados para ${formatarNumero(numero)}. Você vai receber uma mensagem de boas-vindas em instantes.` };
}

/** "Sim, ativar" da janela de convite (components/WhatsAppConvite): usa o
 * celular do cadastro. O toque no botão, com o texto de autorização na
 * própria janela, é o consentimento registrado em whatsapp_optin_em. */
export async function ativarWhatsAppConvite(): Promise<WhatsAppActionState> {
  const session = await getSession();
  if (!session || (session.tipo !== "empresa" && session.tipo !== "profissional")) return { error: "Sessão inválida." };
  const cfg = await getWhatsAppConfig();
  if (!cfg.ativo) return { error: "Os avisos por WhatsApp estão temporariamente indisponíveis." };
  const u = await queryOne<{ telefone: string | null }>(`SELECT telefone FROM usuarios WHERE id = $1`, [session.usuarioId]);
  const numero = normalizarNumero(u?.telefone);
  if (!numero) return { error: "Não achamos um celular válido no seu cadastro. Ative pelo seu perfil informando o número." };
  await query(
    `UPDATE usuarios SET whatsapp_avisos = TRUE, whatsapp_numero = $2, whatsapp_optin_em = now(), whatsapp_chat_id = NULL, atualizado_em = now()
      WHERE id = $1`,
    [session.usuarioId, numero]
  );
  const { usuarioId, tipo } = session;
  after(() => enfileirar("boas_vindas", [{ usuarioId, chave: `boas_vindas:${usuarioId}:${Date.now()}`, texto: textoBoasVindas(tipo) }]));
  revalidarPerfis();
  revalidatePath("/painel");
  return { ok: true, mensagem: `Pronto! Os avisos vão chegar no ${formatarNumero(numero)}.` };
}

/** "Agora não": esconde a janela de convite por 30 dias neste aparelho. */
export async function dispensarConviteWhatsApp(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_CONVITE_WHATSAPP, "dispensado", { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax", httpOnly: true });
}

// ---------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------

async function requireAdmin() {
  const session = await getSession();
  return session?.tipo === "admin" ? session : null;
}

export async function salvarConfigWhatsApp(_prev: WhatsAppActionState, formData: FormData): Promise<WhatsAppActionState> {
  if (!(await requireAdmin())) return { error: "Sessão inválida." };
  const num = (k: keyof WhatsAppConfig, min: number, max: number) => {
    const n = Number(formData.get(k));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : (WHATSAPP_PADRAO[k] as number);
  };
  const cfg: WhatsAppConfig = {
    ativo: formData.get("ativo") === "on",
    pedidos: formData.get("pedidos") === "on",
    vagas: formData.get("vagas") === "on",
    lembretes: formData.get("lembretes") === "on",
    intervaloMin: num("intervaloMin", 3, 300),
    intervaloMax: num("intervaloMax", 3, 600),
    limiteDiario: num("limiteDiario", 1, 2000),
    horaInicio: num("horaInicio", 0, 23),
    horaFim: num("horaFim", 1, 24),
  };
  if (cfg.intervaloMax < cfg.intervaloMin) cfg.intervaloMax = cfg.intervaloMin;
  if (cfg.horaFim <= cfg.horaInicio) return { error: "O horário final precisa ser depois do inicial." };
  await query(
    `INSERT INTO configuracoes_site (chave, valor, atualizado_em) VALUES ($1, $2, now())
     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = now()`,
    [CONFIG_WHATSAPP, JSON.stringify(cfg)]
  );
  revalidatePath("/admin/whatsapp");
  revalidarPerfis();
  return { ok: true };
}

/** Envio direto (sem fila) pra testar a conexão com o WAHA. */
export async function enviarTesteWhatsApp(_prev: WhatsAppActionState, formData: FormData): Promise<WhatsAppActionState> {
  if (!(await requireAdmin())) return { error: "Sessão inválida." };
  const numero = normalizarNumero(String(formData.get("numero") ?? ""));
  if (!numero) return { error: "Número inválido." };
  const r = await resolverChatId(numero);
  if (r.erro) return { error: r.erro };
  if (!r.chatId) return { error: "Esse número não tem WhatsApp." };
  const env = await enviarTexto(r.chatId, String(formData.get("texto") || "Teste de envio da GetFesta ✅"));
  return env.ok ? { ok: true, mensagem: `Enviado para ${formatarNumero(numero)}.` } : { error: env.erro };
}

export async function processarFilaAgora(): Promise<WhatsAppActionState> {
  if (!(await requireAdmin())) return { error: "Sessão inválida." };
  const r = await processarFila(25_000);
  revalidatePath("/admin/whatsapp");
  const motivo: Record<string, string> = {
    desativado: "os avisos estão desligados",
    waha_nao_configurado: "faltam as variáveis WAHA_URL / WAHA_API_KEY",
    fora_do_horario: "está fora do horário de envio",
    ja_processando: "outro envio já está em andamento",
    limite_diario: "o limite diário foi atingido",
  };
  const extra = r.motivo ? ` (parou porque ${motivo[r.motivo] ?? r.motivo.replace("sessao_", "a sessão do WhatsApp está ")})` : "";
  return { ok: true, mensagem: `${r.enviados} enviada(s), ${r.erros} com erro${extra}.` };
}

export async function reenviarErrosWhatsApp(): Promise<WhatsAppActionState> {
  if (!(await requireAdmin())) return { error: "Sessão inválida." };
  const r = await query(
    `UPDATE whatsapp_fila SET status = 'pendente', tentativas = 0, erro = NULL
      WHERE status = 'erro' AND criado_em > now() - interval '3 days' AND erro <> 'número sem WhatsApp' RETURNING id`
  );
  revalidatePath("/admin/whatsapp");
  return { ok: true, mensagem: `${r.length} aviso(s) voltaram para a fila.` };
}
