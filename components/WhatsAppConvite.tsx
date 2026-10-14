import { cookies } from "next/headers";
import { queryOne } from "@/lib/db";
import { getWhatsAppConfig } from "@/lib/whatsapp/fila";
import { COOKIE_CONVITE_WHATSAPP, formatarNumero, normalizarNumero } from "@/lib/whatsapp/regras";
import WhatsAppConviteJanela from "./WhatsAppConviteJanela";

/** Janela única "Quer receber avisos no WhatsApp?" para empresa (painel) e
 * profissional (catálogo). Só aparece com os avisos ligados no admin, pra
 * quem ainda não ativou, tem celular válido no cadastro e não tocou em
 * "Agora não" nos últimos 30 dias (cookie). */
export default async function WhatsAppConvite({ usuarioId, tipo, perfilHref }: { usuarioId: string; tipo: "empresa" | "profissional"; perfilHref: string }) {
  const store = await cookies();
  if (store.get(COOKIE_CONVITE_WHATSAPP)) return null;
  const cfg = await getWhatsAppConfig();
  if (!cfg.ativo) return null;
  const u = await queryOne<{ whatsapp_avisos: boolean; telefone: string | null }>(
    `SELECT whatsapp_avisos, telefone FROM usuarios WHERE id = $1`,
    [usuarioId]
  );
  if (!u || u.whatsapp_avisos) return null;
  const numero = normalizarNumero(u.telefone);
  if (!numero) return null;

  const beneficios =
    tipo === "empresa"
      ? [cfg.pedidos && "Pedidos de orçamento novos da sua região", cfg.vagas && "Candidatos nas suas vagas", cfg.lembretes && "Lembrete na véspera dos eventos"]
      : [cfg.vagas && "Vagas novas que combinam com você", cfg.vagas && "Quando uma empresa escolher você", cfg.lembretes && "Lembrete na véspera dos eventos"];

  return (
    <WhatsAppConviteJanela
      numero={formatarNumero(numero)}
      beneficios={beneficios.filter((b): b is string => !!b)}
      perfilHref={perfilHref}
    />
  );
}
