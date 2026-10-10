import { queryOne } from "@/lib/db";
import { getWhatsAppConfig } from "@/lib/whatsapp/fila";
import { formatarNumero, normalizarNumero } from "@/lib/whatsapp/regras";
import WhatsAppAvisosForm from "./WhatsAppAvisosForm";

/** Card "Avisos por WhatsApp" do perfil (empresa e profissional). Some
 * enquanto o admin não ligar os avisos em /admin/whatsapp. */
export default async function WhatsAppAvisos({ usuarioId, tipo }: { usuarioId: string; tipo: "empresa" | "profissional" }) {
  const cfg = await getWhatsAppConfig();
  if (!cfg.ativo) return null;
  const u = await queryOne<{ whatsapp_avisos: boolean; whatsapp_numero: string | null; telefone: string | null }>(
    `SELECT whatsapp_avisos, whatsapp_numero, telefone FROM usuarios WHERE id = $1`,
    [usuarioId]
  );
  if (!u) return null;
  const numero = normalizarNumero(u.whatsapp_numero) ?? normalizarNumero(u.telefone);
  const eventos =
    tipo === "empresa"
      ? [cfg.pedidos && "novos pedidos de orçamento da sua região", cfg.vagas && "candidatos nas suas vagas", cfg.lembretes && "lembrete na véspera dos eventos"]
      : [cfg.vagas && "vagas novas que combinam com você", cfg.vagas && "quando uma empresa escolher você", cfg.lembretes && "lembrete na véspera dos eventos"];

  return (
    <div id="whatsapp" className="mt-5 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Avisos por WhatsApp</h2>
      <WhatsAppAvisosForm
        ativo={u.whatsapp_avisos}
        numero={numero ? formatarNumero(numero) : ""}
        eventos={eventos.filter((e): e is string => !!e)}
      />
    </div>
  );
}
