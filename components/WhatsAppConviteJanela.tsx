"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { buttonClass } from "@/components/ui";
import { ativarWhatsAppConvite, dispensarConviteWhatsApp } from "@/lib/actions/whatsapp";
import { toast } from "@/lib/toast";

/** Janela de ativação com um toque (ver WhatsAppConvite.tsx). Entra depois
 * que a página já apareceu; "Agora não", Esc ou clicar fora fecham. */
export default function WhatsAppConviteJanela({ numero, beneficios, perfilHref }: { numero: string; beneficios: string[]; perfilHref: string }) {
  const [aberta, setAberta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const botaoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setAberta(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!aberta) return;
    botaoRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberta]);

  function fechar() {
    setAberta(false);
    dispensarConviteWhatsApp();
  }

  function ativar() {
    setErro(null);
    startTransition(async () => {
      const r = await ativarWhatsAppConvite();
      if (r?.error) setErro(r.error);
      else {
        // a página se atualiza e esta janela some junto - o aviso rápido fica
        toast(`${r?.mensagem ?? "Avisos ativados!"} Vem uma mensagem de boas-vindas.`);
        setAberta(false);
      }
    });
  }

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-text/40 p-3 sm:items-center sm:p-6" onClick={fechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="convite-whatsapp-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-[var(--shadow-card-hover)] motion-safe:animate-[subir_220ms_ease-out] sm:p-6"
      >
        <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ok-soft text-ok">
              <Icon name="chat" className="h-6 w-6" />
            </span>
            <h2 id="convite-whatsapp-titulo" className="mt-3 font-display text-[20px] font-extrabold leading-tight">
              Quer receber avisos no seu WhatsApp?
            </h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-[14px]">
              {beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-surface-alt/70 px-3 py-2.5 text-[13px]">
              No número <b>{numero}</b>{" "}
              <a href={perfilHref} className="font-bold text-accent-dark underline">
                usar outro
              </a>
            </p>
            {erro && <p className="mt-2 text-[13px] font-semibold text-accent-dark">{erro}</p>}
            <div className="mt-4 flex flex-col gap-2">
              <button ref={botaoRef} type="button" disabled={pending} onClick={ativar} className={`${buttonClass("whatsapp", "lg")} w-full`}>
                {pending ? "Ativando..." : "Sim, ativar"}
              </button>
              <button type="button" onClick={fechar} className="py-2 text-[14px] font-bold text-muted hover:text-text">
                Agora não
              </button>
            </div>
            <p className="mt-2 text-center text-[11.5px] leading-snug text-muted-2">
              Ao ativar, você autoriza a GetFesta a enviar avisos da sua conta por WhatsApp, só entre 8h e 21h. Para parar, responda SAIR.
            </p>
        </>
      </div>
    </div>
  );
}
