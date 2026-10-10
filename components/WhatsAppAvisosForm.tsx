"use client";

import { useActionState } from "react";
import { salvarAvisosWhatsApp, type WhatsAppActionState } from "@/lib/actions/whatsapp";
import { buttonClass } from "@/components/ui";

export default function WhatsAppAvisosForm({ ativo, numero, eventos }: { ativo: boolean; numero: string; eventos: string[] }) {
  const [state, action, pending] = useActionState<WhatsAppActionState, FormData>(salvarAvisosWhatsApp, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ativo ? "bg-ok-soft text-ok" : "bg-surface-alt text-muted"}`}
        >
          {ativo ? `Ativo · ${numero}` : "Desativado"}
        </span>
      </div>
      <div className="text-[13px] leading-relaxed text-muted">
        Receba no WhatsApp:
        <ul className="mt-1 list-disc pl-5">
          {eventos.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <p className="mt-1">Mensagens só entre 8h e 21h. Para parar, responda <b>SAIR</b> ou desative aqui.</p>
      </div>

      <label className="text-[11px] font-bold uppercase text-muted">
        Celular com WhatsApp
        <input
          name="numero"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={numero}
          placeholder="(11) 98765-4321"
          className="mt-1 w-full max-w-[260px] rounded-md border border-border px-2.5 py-2 text-sm font-normal normal-case"
        />
      </label>

      {ativo ? (
        <input type="hidden" name="consentimento" value="on" />
      ) : (
        <label className="flex items-start gap-2 text-[12.5px] leading-snug">
          <input type="checkbox" name="consentimento" className="mt-0.5" />
          <span>Autorizo a GetFesta a me enviar avisos sobre minha conta por WhatsApp neste número.</span>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button name="ativar" value="1" disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Salvando..." : ativo ? "Salvar número" : "Ativar avisos"}
        </button>
        {ativo && (
          <button name="ativar" value="0" disabled={pending} className={buttonClass("ghost", "sm")}>
            Desativar
          </button>
        )}
      </div>
      {state?.mensagem && <p className="text-[12.5px] font-semibold text-ok">{state.mensagem}</p>}
      {state?.error && <p className="text-[12.5px] font-semibold text-danger-dark">{state.error}</p>}
    </form>
  );
}
