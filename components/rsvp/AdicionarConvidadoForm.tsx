"use client";

import { useRef, useState, useTransition } from "react";
import { adicionarConvidado } from "@/lib/actions/rsvp";
import { buttonClass } from "@/components/ui";

export default function AdicionarConvidadoForm({ eventoRsvpId }: { eventoRsvpId: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"adulto" | "crianca">("adulto");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // limpa os campos depois de um envio sem erro, pra facilitar cadastrar
  // vários convidados em sequência sem precisar apagar nome/telefone na mão.
  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const res = await adicionarConvidado(undefined, formData);
      if (res?.error) {
        setErro(res.error);
      } else {
        formRef.current?.reset();
        setTipo("adulto");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4">
      <input type="hidden" name="eventoRsvpId" value={eventoRsvpId} />
      <p className="text-[12.5px] font-bold">Adicionar convidado</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.4fr_1fr_auto_auto_auto]">
        <input
          name="nome"
          required
          minLength={2}
          placeholder="Nome do convidado"
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
        <input
          name="telefone"
          placeholder="Telefone (opcional)"
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
        <select
          name="tipoConvidado"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "adulto" | "crianca")}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        >
          <option value="adulto">Adulto</option>
          <option value="crianca">Criança</option>
        </select>
        {tipo === "crianca" && (
          <input
            name="idadeAnos"
            type="number"
            min={0}
            max={17}
            placeholder="Idade"
            className="w-20 rounded-md border border-border px-3 py-2.5 text-sm"
          />
        )}
        <button type="submit" disabled={isPending} className={buttonClass("primary", "md")}>
          {isPending ? "Salvando..." : "Adicionar"}
        </button>
      </div>
      {erro && <p className="text-[11.5px] font-semibold text-accent-dark">{erro}</p>}
    </form>
  );
}
