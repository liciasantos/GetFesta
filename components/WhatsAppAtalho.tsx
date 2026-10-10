import { queryOne } from "@/lib/db";
import { getWhatsAppConfig } from "@/lib/whatsapp/fila";
import { formatarNumero, normalizarNumero } from "@/lib/whatsapp/regras";
import { buttonClass } from "@/components/ui";

/** Atalho no painel inicial (empresa e profissional) para o card de avisos
 * por WhatsApp do perfil: convida a ativar quando está desligado e mostra o
 * número quando já está ativo. Some enquanto o admin não ligar os avisos.
 * `href` é <a> comum (não Link) pra o perfil profissional abrir já na aba
 * certa, que é lida dos searchParams na carga da página. */
export default async function WhatsAppAtalho({
  usuarioId,
  href,
  convite,
}: {
  usuarioId: string;
  href: string;
  convite: string;
}) {
  const cfg = await getWhatsAppConfig();
  if (!cfg.ativo) return null;
  const u = await queryOne<{ whatsapp_avisos: boolean; whatsapp_numero: string | null }>(
    `SELECT whatsapp_avisos, whatsapp_numero FROM usuarios WHERE id = $1`,
    [usuarioId]
  );
  if (!u) return null;

  if (u.whatsapp_avisos) {
    const numero = normalizarNumero(u.whatsapp_numero);
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Avisos por WhatsApp</p>
          <p className="mt-1 text-[12.5px]">
            <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">Ativo</span>
            {numero && <span className="ml-1.5 text-muted">{formatarNumero(numero)}</span>}
          </p>
        </div>
        <a href={href} className="shrink-0 text-[12.5px] font-bold text-accent-dark hover:underline">
          Gerenciar
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ok/40 bg-ok-soft p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-ok">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
          <path d="M9 10c0 3 2 5 5 5" />
        </svg>
        Receba avisos no WhatsApp
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-text">{convite}</p>
      <a href={href} className={`${buttonClass("whatsapp", "sm")} mt-3 w-full`}>
        Ativar avisos
      </a>
    </div>
  );
}
