"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  abrirDisputa,
  assinarAcordo,
  cancelarAcordo,
  confirmarEntrega,
  editarTermos,
  enviarMensagemPermuta,
  recusarProposta,
  type PermutaActionState,
} from "@/lib/actions/permuta";
import { buttonClass } from "@/components/ui";

const inputCls = "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal";

/** Assinar / recusar / retirar proposta. */
export function AssinaturaAcoes({
  acordoId,
  podeAssinar,
  souDestinatario,
}: {
  acordoId: string;
  podeAssinar: boolean;
  souDestinatario: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");

  function run(fn: () => Promise<PermutaActionState>) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (r?.error) setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {podeAssinar && (
          <button disabled={pending} onClick={() => run(() => assinarAcordo(acordoId))} className={buttonClass("primary")}>
            Assinar acordo
          </button>
        )}
        <button disabled={pending} onClick={() => setRecusando((v) => !v)} className={buttonClass("secondary")}>
          {souDestinatario ? "Recusar proposta" : "Retirar proposta"}
        </button>
      </div>
      {recusando && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-bg p-3">
          <label className="text-[12px] font-bold">
            Motivo (opcional, a outra empresa verá)
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls} />
          </label>
          <button
            disabled={pending}
            onClick={() => run(() => recusarProposta(acordoId, motivo))}
            className={`${buttonClass("danger", "sm")} self-start`}
          >
            Confirmar
          </button>
        </div>
      )}
      {error && <p className="text-[12.5px] font-semibold text-danger-dark">{error}</p>}
    </div>
  );
}

export type TermosAtuais = {
  dataMinha: string;
  dataParceiro: string;
  localMinha: string;
  localParceiro: string;
  escopoMinha: string;
  escopoParceiro: string;
  compensacao: string;
};

/** Contraproposta: muda datas/escopo antes das duas assinaturas. */
export function EditarTermosForm({ acordoId, atuais, parceiroNome }: { acordoId: string; atuais: TermosAtuais; parceiroNome: string }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(async (prev, fd) => {
    const r = await editarTermos(prev, fd);
    if (r?.ok) setAberto(false);
    return r;
  }, undefined);
  const [, startTransition] = useTransition();

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className={`${buttonClass("ghost", "sm")} self-start`}>
        Alterar termos (contraproposta)
      </button>
    );
  }
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="flex flex-col gap-3 rounded-xl border border-accent-soft-2 bg-bg p-4"
    >
      <input type="hidden" name="acordoId" value={acordoId} />
      <p className="text-[12.5px] text-muted">
        Ao salvar, você assina a nova versão e {parceiroNome} precisa revisar e assinar de novo.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-[12px] font-bold">
          Data da sua entrega
          <input type="date" name="dataMinha" defaultValue={atuais.dataMinha} required className={inputCls} />
        </label>
        <label className="text-[12px] font-bold">
          Data da entrega de {parceiroNome}
          <input type="date" name="dataParceiro" defaultValue={atuais.dataParceiro} required className={inputCls} />
        </label>
        <label className="text-[12px] font-bold">
          Local da sua entrega
          <input name="localMinha" defaultValue={atuais.localMinha} className={inputCls} />
        </label>
        <label className="text-[12px] font-bold">
          Local da entrega de {parceiroNome}
          <input name="localParceiro" defaultValue={atuais.localParceiro} className={inputCls} />
        </label>
      </div>
      <label className="text-[12px] font-bold">
        Escopo da sua entrega
        <textarea name="escopoMinha" rows={3} defaultValue={atuais.escopoMinha} required className={inputCls} />
      </label>
      <label className="text-[12px] font-bold">
        Escopo da entrega de {parceiroNome}
        <textarea name="escopoParceiro" rows={3} defaultValue={atuais.escopoParceiro} required className={inputCls} />
      </label>
      <label className="text-[12px] font-bold">
        Compensação da diferença
        <input name="compensacao" defaultValue={atuais.compensacao} className={inputCls} />
      </label>
      {state?.error && <p className="text-[12.5px] font-semibold text-danger-dark">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className={buttonClass("primary", "sm")}>
          {pending ? "Salvando..." : "Salvar e assinar nova versão"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className={buttonClass("secondary", "sm")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Check-in + avaliação da entrega que a empresa recebeu. */
export function ConfirmarEntregaForm({ entregaId, jaConfirmada }: { entregaId: string; jaConfirmada: boolean }) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(confirmarEntrega, undefined);
  const [nota, setNota] = useState(5);
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-[#bfe0cb] bg-ok-soft/50 p-3.5">
      <input type="hidden" name="entregaId" value={entregaId} />
      <input type="hidden" name="nota" value={nota} />
      <div className="text-[13px] font-bold">{jaConfirmada ? "Avalie esta entrega" : "O serviço foi realizado? Confirme e avalie"}</div>
      <fieldset>
        <legend className="text-[12px] font-bold">Nota</legend>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              aria-pressed={n <= nota}
              onClick={() => setNota(n)}
              className="flex h-10 w-10 items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill={n <= nota ? "#ffb800" : "none"} stroke={n <= nota ? "#b07d00" : "#98a0ac"} strokeWidth={1.4} strokeLinejoin="round">
                <path d="M12 3.5 14.5 9l6 .7-4.4 4 1.2 5.8L12 16.6l-5.3 2.9 1.2-5.8-4.4-4 6-.7z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-wrap gap-4 text-[13px]">
        <legend className="mb-1 text-[12px] font-bold">Pontualidade</legend>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="pontual" value="sim" defaultChecked /> Chegou no horário
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="pontual" value="nao" /> Atrasou
        </label>
      </fieldset>
      <label className="text-[12px] font-bold">
        Comentário (opcional)
        <textarea name="comentario" rows={2} className={inputCls} />
      </label>
      {state?.error && <p className="text-[12.5px] font-semibold text-danger-dark">{state.error}</p>}
      <button disabled={pending} className={`${buttonClass("primary", "sm")} self-start`}>
        {pending ? "Salvando..." : jaConfirmada ? "Enviar avaliação" : "Confirmar que foi realizada"}
      </button>
    </form>
  );
}

export function DisputaCancelamento({
  acordoId,
  entregaIds,
  podeCancelar,
  textoCancelamento,
}: {
  acordoId: string;
  entregaIds: { id: string; label: string }[];
  podeCancelar: boolean;
  textoCancelamento: string;
}) {
  const [modo, setModo] = useState<"disputa" | "cancelar" | null>(null);
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(abrirDisputa, undefined);
  const [cancelPending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [cancelErro, setCancelErro] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#f1c9ca] bg-[#fdf3f3] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#5c1a1c]">
          <b>Algo deu errado?</b> {textoCancelamento}
        </p>
        <button onClick={() => setModo(modo === "disputa" ? null : "disputa")} className="rounded-lg border border-danger bg-surface px-3 py-2 text-[13px] font-bold text-danger-dark">
          Abrir disputa
        </button>
        {podeCancelar && (
          <button onClick={() => setModo(modo === "cancelar" ? null : "cancelar")} className={buttonClass("secondary", "sm")}>
            Cancelar acordo
          </button>
        )}
      </div>
      {modo === "disputa" && (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="acordoId" value={acordoId} />
          <label className="text-[12px] font-bold">
            Qual entrega?
            <select name="entregaId" className={inputCls}>
              <option value="">O acordo como um todo</option>
              {entregaIds.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] font-bold">
            O que aconteceu?
            <textarea name="motivo" rows={3} required className={inputCls} />
          </label>
          {state?.error && <p className="text-[12.5px] font-semibold text-danger-dark">{state.error}</p>}
          <button disabled={pending} className={`${buttonClass("danger", "sm")} self-start`}>
            Enviar para a equipe GetFesta
          </button>
        </form>
      )}
      {modo === "cancelar" && (
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold">
            Motivo do cancelamento
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls} />
          </label>
          {cancelErro && <p className="text-[12.5px] font-semibold text-danger-dark">{cancelErro}</p>}
          <button
            disabled={cancelPending}
            onClick={() =>
              startTransition(async () => {
                const r = await cancelarAcordo(acordoId, motivo);
                setCancelErro(r?.error ?? null);
              })
            }
            className={`${buttonClass("danger", "sm")} self-start`}
          >
            Confirmar cancelamento
          </button>
        </div>
      )}
    </section>
  );
}

export function MensagemForm({ acordoId, aviso }: { acordoId: string; aviso: string | null }) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(enviarMensagemPermuta, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="acordoId" value={acordoId} />
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Mensagem</span>
          <input name="conteudo" required placeholder="Escreva uma mensagem" className="w-full rounded-md border border-border-strong bg-surface px-3 py-2.5 text-sm" />
        </label>
        <button disabled={pending} className={buttonClass("primary")}>
          Enviar
        </button>
      </div>
      {aviso && <p className="text-[11.5px] text-muted">{aviso}</p>}
      {state?.error && <p className="text-[12px] font-semibold text-danger-dark">{state.error}</p>}
    </form>
  );
}
