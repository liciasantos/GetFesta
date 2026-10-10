"use client";

import { useActionState } from "react";
import {
  enviarTesteWhatsApp,
  processarFilaAgora,
  reenviarErrosWhatsApp,
  salvarConfigWhatsApp,
  type WhatsAppActionState,
} from "@/lib/actions/whatsapp";
import { buttonClass } from "@/components/ui";
import type { WhatsAppConfig } from "@/lib/whatsapp/regras";

const inputCls = "mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm font-normal normal-case";
const labelCls = "text-[11px] font-bold uppercase text-muted";

function Resultado({ state }: { state: WhatsAppActionState }) {
  if (state?.error) return <span className="text-[12px] font-semibold text-danger-dark">{state.error}</span>;
  if (state?.ok) return <span className="text-[12px] font-semibold text-ok">{state.mensagem ?? "Salvo!"}</span>;
  return null;
}

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start gap-2 text-[13px]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5" />
      <span>
        <b>{label}</b>
        {hint && <span className="block text-[12px] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function Num({ name, label, value }: { name: keyof WhatsAppConfig; label: string; value: number }) {
  return (
    <label className={labelCls}>
      {label}
      <input type="number" name={name} defaultValue={value} min={0} className={inputCls} />
    </label>
  );
}

export function WhatsAppConfigForm({ cfg }: { cfg: WhatsAppConfig }) {
  const [state, action, pending] = useActionState<WhatsAppActionState, FormData>(salvarConfigWhatsApp, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Check
        name="ativo"
        label="Avisos por WhatsApp ligados"
        hint="Desligado: o card some dos perfis e nada é enviado (a fila fica parada)."
        defaultChecked={cfg.ativo}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <Check name="pedidos" label="Pedidos" hint="Novo pedido → empresas compatíveis" defaultChecked={cfg.pedidos} />
        <Check name="vagas" label="Vagas" hint="Vaga nova, candidatura, escolha, desistência" defaultChecked={cfg.vagas} />
        <Check name="lembretes" label="Lembretes" hint="Véspera do evento (a partir das 9h)" defaultChecked={cfg.lembretes} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Num name="intervaloMin" label="Pausa mín. (s)" value={cfg.intervaloMin} />
        <Num name="intervaloMax" label="Pausa máx. (s)" value={cfg.intervaloMax} />
        <Num name="limiteDiario" label="Limite por dia" value={cfg.limiteDiario} />
        <Num name="horaInicio" label="Envia a partir de (h)" value={cfg.horaInicio} />
        <Num name="horaFim" label="Envia até (h)" value={cfg.horaFim} />
      </div>
      <div className="flex items-center gap-2">
        <button disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Salvando..." : "Salvar"}
        </button>
        <Resultado state={state} />
      </div>
    </form>
  );
}

export function WhatsAppTesteForm() {
  const [state, action, pending] = useActionState<WhatsAppActionState, FormData>(enviarTesteWhatsApp, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <label className={labelCls}>
          Número
          <input name="numero" inputMode="tel" placeholder="(11) 98765-4321" className={inputCls} />
        </label>
        <label className={labelCls}>
          Mensagem
          <input name="texto" placeholder="Teste de envio da GetFesta ✅" className={inputCls} />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button disabled={pending} className={buttonClass("secondary", "sm")}>
          {pending ? "Enviando..." : "Enviar teste"}
        </button>
        <Resultado state={state} />
      </div>
    </form>
  );
}

export function WhatsAppFilaAcoes() {
  const [s1, processar, p1] = useActionState<WhatsAppActionState, FormData>(() => processarFilaAgora(), undefined);
  const [s2, reenviar, p2] = useActionState<WhatsAppActionState, FormData>(() => reenviarErrosWhatsApp(), undefined);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={processar}>
        <button disabled={p1} className={buttonClass("secondary", "sm")}>
          {p1 ? "Enviando (até 25s)..." : "Enviar fila agora"}
        </button>
      </form>
      <form action={reenviar}>
        <button disabled={p2} className={buttonClass("ghost", "sm")}>
          {p2 ? "..." : "Tentar de novo os com erro"}
        </button>
      </form>
      <Resultado state={s1 ?? s2} />
    </div>
  );
}
