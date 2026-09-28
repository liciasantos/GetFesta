"use client";

import { useActionState, useState, useTransition } from "react";
import { criarProposta, type PermutaActionState } from "@/lib/actions/permuta";
import { buttonClass } from "@/components/ui";
import type { OfertaPermuta } from "@/lib/data/permuta";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function Equilibrio({ meu, dele }: { meu: number; dele: number }) {
  const diff = meu - dele;
  const tolerancia = Math.max(100, Math.max(meu, dele) * 0.05);
  const [cls, txt] =
    Math.abs(diff) <= tolerancia
      ? ["bg-ok-soft text-ok", "Equilibrado — os dois lados têm praticamente o mesmo valor de referência."]
      : diff < 0
        ? ["bg-note-bg text-note-text", `${brl(-diff)} a mais do lado do parceiro. Proponha como compensar.`]
        : ["bg-info-soft text-info-dark", `${brl(diff)} a mais do seu lado. Você pode pedir um complemento.`];
  const total = Math.max(1, meu + dele);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <div className="bg-accent-dark" style={{ flexGrow: meu / total }} />
        <div className="bg-info" style={{ flexGrow: dele / total }} />
      </div>
      <div className="flex justify-between text-[12px] text-muted">
        <span>Você entrega {brl(meu)}</span>
        <span>Você recebe {brl(dele)}</span>
      </div>
      <div className={`rounded-lg px-3 py-2 text-[12.5px] font-semibold ${cls}`}>{txt}</div>
    </div>
  );
}

const inputCls = "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal";

export default function PropostaForm({
  destinatarioId,
  parceiroNome,
  minhas,
  deles,
  janelaDias,
  horasConfirmacao,
  limite,
  ativos,
}: {
  destinatarioId: string;
  parceiroNome: string;
  minhas: OfertaPermuta[];
  deles: OfertaPermuta[];
  janelaDias: number;
  horasConfirmacao: number;
  limite: number | null;
  ativos: number;
}) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(criarProposta, undefined);
  const [, startTransition] = useTransition();
  const [minhaId, setMinhaId] = useState(minhas[0]?.id ?? "");
  const [deleId, setDeleId] = useState(deles[0]?.id ?? "");
  const minha = minhas.find((o) => o.id === minhaId);
  const dele = deles.find((o) => o.id === deleId);

  return (
    <form
      onSubmit={(ev) => {
        // onSubmit em vez de action={...}: o React 19 limpa o formulário depois
        // de uma action, e aqui um erro de validação apagaria tudo o que foi digitado
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
      <input type="hidden" name="destinatarioId" value={destinatarioId} />
      <div className="flex flex-col gap-4">
        <Secao n="1" titulo="O que você oferece">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {minhas.map((o) => (
              <OfertaOpcao key={o.id} o={o} name="minhaOfertaId" checked={o.id === minhaId} onPick={setMinhaId} tom="accent" />
            ))}
          </div>
        </Secao>

        <Secao n="2" titulo={`O que você quer de ${parceiroNome}`}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {deles.map((o) => (
              <OfertaOpcao key={o.id} o={o} name="ofertaParceiroId" checked={o.id === deleId} onPick={setDeleId} tom="info" />
            ))}
          </div>
        </Secao>

        <Secao n="3" titulo="Datas e locais">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-[12px] font-bold">
              Sua entrega (evento de {parceiroNome})
              <input type="date" name="dataMinha" required className={inputCls} />
            </label>
            <label className="text-[12px] font-bold">
              Entrega de {parceiroNome} (seu evento)
              <input type="date" name="dataParceiro" required className={inputCls} />
            </label>
            <label className="text-[12px] font-bold">
              Local do evento deles (opcional)
              <input name="localMinha" placeholder="Bairro, cidade" className={inputCls} />
            </label>
            <label className="text-[12px] font-bold">
              Local do seu evento (opcional)
              <input name="localParceiro" placeholder="Bairro, cidade" className={inputCls} />
            </label>
          </div>
          <fieldset className="mt-3">
            <legend className="text-[12px] font-bold">Quem entrega primeiro</legend>
            <div className="mt-1.5 flex flex-wrap gap-4 text-[13px]">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="primeiro" value="data" defaultChecked /> Pela ordem das datas
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="primeiro" value="eu" /> Eu
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="primeiro" value="parceiro" /> {parceiroNome}
              </label>
            </div>
          </fieldset>
        </Secao>

        <Secao n="4" titulo="Escopo e responsabilidades">
          <label className="text-[12px] font-bold">
            O que está incluso na sua entrega
            <textarea
              name="escopoMinha"
              rows={3}
              required
              key={`m-${minhaId}`}
              defaultValue={minha?.descricao ?? ""}
              placeholder="Quantidade de pessoas, duração, equipe, o que não está incluso..."
              className={inputCls}
            />
          </label>
          <label className="mt-3 block text-[12px] font-bold">
            O que você espera receber
            <textarea
              name="escopoParceiro"
              rows={3}
              required
              key={`d-${deleId}`}
              defaultValue={dele?.descricao ?? ""}
              className={inputCls}
            />
          </label>
        </Secao>

        <Secao n="5" titulo="Equilíbrio">
          <Equilibrio meu={minha?.valor_referencia ?? 0} dele={dele?.valor_referencia ?? 0} />
          <label className="mt-3 block text-[12px] font-bold">
            Como a diferença será compensada (opcional)
            <input name="compensacao" placeholder='Ex: "+1 h extra de DJ", "+10 pessoas no buffet"' className={inputCls} />
          </label>
        </Secao>

        <label className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
          <input type="checkbox" name="aceite" className="mt-0.5" />
          Li as regras: cancelar a menos de {janelaDias} dias de uma entrega reduz meu nível, a confirmação e a avaliação
          acontecem depois de cada entrega, e contatos só são liberados depois das duas assinaturas.
        </label>
        {state?.error && <p className="text-[12.5px] font-semibold text-danger-dark">{state.error}</p>}
        <button disabled={pending} className={`${buttonClass("primary", "lg")} self-start`}>
          {pending ? "Enviando..." : "Assinar e enviar proposta"}
        </button>
      </div>

      <aside className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-6">
        <h3 className="text-[15px] font-extrabold">Prévia do acordo</h3>
        <div className="rounded-lg bg-bg p-3">
          <div className="text-[11.5px] font-bold text-accent-dark">Você → {parceiroNome}</div>
          <div className="text-[13px] font-semibold">{minha?.titulo ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-bg p-3">
          <div className="text-[11.5px] font-bold text-info-dark">{parceiroNome} → Você</div>
          <div className="text-[13px] font-semibold">{dele?.titulo ?? "—"}</div>
        </div>
        <ul className="list-disc pl-5 text-[12px] leading-relaxed text-muted">
          <li>Contatos liberados depois das duas assinaturas</li>
          <li>Cancelamento sem penalidade até {janelaDias} dias antes de cada entrega</li>
          <li>Quem recebe confirma e avalia cada entrega; sem resposta em {horasConfirmacao} h, conta como realizada</li>
          <li>{limite === null ? "Sem limite de permutas simultâneas no seu nível" : `Esta troca usa 1 das suas ${limite} vagas (${ativos} em uso)`}</li>
        </ul>
        <p className="rounded-lg border border-note-border bg-note-bg px-3 py-2 text-[12px] text-note-text">
          {parceiroNome} pode assinar, recusar ou alterar os termos (contraproposta).
        </p>
      </aside>
    </form>
  );
}

function Secao({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-3 text-[14.5px] font-extrabold">
        {n} · {titulo}
      </h3>
      {children}
    </section>
  );
}

function OfertaOpcao({
  o,
  name,
  checked,
  onPick,
  tom,
}: {
  o: OfertaPermuta;
  name: string;
  checked: boolean;
  onPick: (id: string) => void;
  tom: "accent" | "info";
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 ${
        checked ? (tom === "accent" ? "border-2 border-accent-dark bg-accent-soft/40" : "border-2 border-info bg-info-soft/40") : "border-border"
      }`}
    >
      <input type="radio" name={name} value={o.id} checked={checked} onChange={() => onPick(o.id)} className="sr-only" />
      <span className="text-[13.5px] font-bold">{o.titulo}</span>
      {o.categoria_nome && <span className="text-[12px] text-muted">{o.categoria_nome}</span>}
      <span className={`text-[13px] font-bold ${tom === "accent" ? "text-accent-dark" : "text-info-dark"}`}>{brl(o.valor_referencia)}</span>
    </label>
  );
}
