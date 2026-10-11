"use client";

import { useRef, useState, useTransition } from "react";
import { adicionarConvidado } from "@/lib/actions/rsvp";
import { buttonClass } from "@/components/ui";
import { Icon } from "@/components/Icon";

const campo = "rounded-lg border border-border bg-surface px-3 py-2.5 text-base sm:text-sm";

/** Adição rápida: depois de salvar limpa os campos e volta o foco pro nome,
 * pra cadastrar vários convidados em sequência. */
export default function AdicionarConvidadoForm({ eventoRsvpId }: { eventoRsvpId: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"adulto" | "crianca">("adulto");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    formData.set("tipoConvidado", tipo);
    startTransition(async () => {
      const res = await adicionarConvidado(undefined, formData);
      if (res?.error) {
        setErro(res.error);
      } else {
        formRef.current?.reset();
        setTipo("adulto");
        nomeRef.current?.focus();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="eventoRsvpId" value={eventoRsvpId} />
      <p className="mb-2.5 text-[14px] font-bold">Adicionar convidado</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_1fr_auto_auto]">
        <input ref={nomeRef} name="nome" required minLength={2} placeholder="Nome" aria-label="Nome do convidado" className={campo} />
        <input name="telefone" inputMode="tel" placeholder="WhatsApp (opcional)" aria-label="Telefone" className={campo} />
        <div className="flex gap-2">
          <div className="flex flex-1 rounded-lg border border-border bg-surface-alt/50 p-0.5" role="group" aria-label="Tipo de convidado">
            {(["adulto", "crianca"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                aria-pressed={tipo === t}
                className={`flex-1 rounded-md px-3 py-2 text-[12.5px] font-bold ${tipo === t ? "bg-surface text-text shadow-sm" : "text-muted"}`}
              >
                {t === "adulto" ? "Adulto" : "Criança"}
              </button>
            ))}
          </div>
          {tipo === "crianca" && (
            <input name="idadeAnos" type="number" min={0} max={17} placeholder="Idade" aria-label="Idade" className={`${campo} w-20`} />
          )}
        </div>
        <button type="submit" disabled={isPending} className={buttonClass("primary", "md")}>
          <Icon name="plus" className="h-4 w-4" />
          {isPending ? "Salvando..." : "Adicionar"}
        </button>
      </div>
      {erro && <p className="mt-2 text-[12px] font-semibold text-accent-dark">{erro}</p>}
    </form>
  );
}
