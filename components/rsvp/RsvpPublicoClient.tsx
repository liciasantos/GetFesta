"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  buscarConvidadoPublico,
  confirmarConvidadoPublico,
  responderConvidadoPublico,
  type ConfirmarConvidadoPublicoResult,
  type ConvidadoPublico,
} from "@/lib/actions/rsvp";
import { buttonClass } from "@/components/ui";

type Etapa = "buscar" | "nao_encontrado" | "hub";

export default function RsvpPublicoClient({ slug }: { slug: string }) {
  const [etapa, setEtapa] = useState<Etapa>("buscar");
  const [convidado, setConvidado] = useState<ConvidadoPublico | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {etapa === "buscar" && (
        <BuscaConvidado
          slug={slug}
          onEncontrado={(c) => {
            setConvidado(c);
            setEtapa("hub");
          }}
          onNaoEncontrado={() => setEtapa("nao_encontrado")}
        />
      )}

      {etapa === "nao_encontrado" && (
        <ConfirmarNovoConvidado
          slug={slug}
          onConfirmado={(c) => {
            setConvidado(c);
            setEtapa("hub");
          }}
          onVoltar={() => setEtapa("buscar")}
        />
      )}

      {etapa === "hub" && convidado && <HubConvidado slug={slug} convidadoInicial={convidado} />}
    </div>
  );
}

function BuscaConvidado({
  slug,
  onEncontrado,
  onNaoEncontrado,
}: {
  slug: string;
  onEncontrado: (c: ConvidadoPublico) => void;
  onNaoEncontrado: () => void;
}) {
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function buscar() {
    setErro(null);
    if (telefone.replace(/\D/g, "").length < 10) {
      setErro("Informe um telefone válido");
      return;
    }
    startTransition(async () => {
      const encontrado = await buscarConvidadoPublico(slug, telefone);
      if (encontrado) onEncontrado(encontrado);
      else onNaoEncontrado();
    });
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4">
      <p className="text-[12.5px] font-bold">Digite seu telefone pra confirmar presença</p>
      <input
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        placeholder="(21) 99999-9999"
        className="rounded-md border border-border px-3 py-2.5 text-sm"
      />
      {erro && <p className="text-[11.5px] font-semibold text-accent-dark">{erro}</p>}
      <button type="button" disabled={isPending} onClick={buscar} className={buttonClass("primary")}>
        {isPending ? "Buscando..." : "Continuar"}
      </button>
    </div>
  );
}

/** Select de adulto/criança + campo de idade (só aparece pra criança) -
 * muitos buffets isentam cobrança até uma certa idade, então vale registrar
 * a idade de cada criança, não só a contagem total. Compartilhado entre o
 * auto-cadastro e a adição de acompanhante. */
function TipoConvidadoFields({ tipo, onTipoChange }: { tipo: "adulto" | "crianca"; onTipoChange: (t: "adulto" | "crianca") => void }) {
  return (
    <div className="flex gap-2">
      <select
        name="tipoConvidado"
        value={tipo}
        onChange={(e) => onTipoChange(e.target.value as "adulto" | "crianca")}
        className="flex-1 rounded-md border border-border px-3 py-2.5 text-sm"
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
    </div>
  );
}

function ConfirmarNovoConvidado({
  slug,
  onConfirmado,
  onVoltar,
}: {
  slug: string;
  onConfirmado: (c: ConvidadoPublico) => void;
  onVoltar: () => void;
}) {
  const [state, formAction, pending] = useActionState<ConfirmarConvidadoPublicoResult | undefined, FormData>(
    confirmarConvidadoPublico,
    undefined
  );
  const [tipo, setTipo] = useState<"adulto" | "crianca">("adulto");

  useEffect(() => {
    if (state?.convidado) onConfirmado(state.convidado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="contexto" value="principal" />
      <p className="text-[12.5px] font-bold">Não achamos seu convite — confirme presença mesmo assim:</p>
      <input name="nome" required minLength={2} placeholder="Seu nome" className="rounded-md border border-border px-3 py-2.5 text-sm" />
      <input
        name="telefone"
        required
        placeholder="Seu telefone (com DDD)"
        className="rounded-md border border-border px-3 py-2.5 text-sm"
      />
      <TipoConvidadoFields tipo={tipo} onTipoChange={setTipo} />
      {state?.error && <p className="text-[11.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Confirmando..." : "Confirmar presença"}
      </button>
      <button type="button" onClick={onVoltar} className="text-[11.5px] font-bold text-muted underline">
        Voltar
      </button>
    </form>
  );
}

function HubConvidado({ slug, convidadoInicial }: { slug: string; convidadoInicial: ConvidadoPublico }) {
  const [convidado, setConvidado] = useState(convidadoInicial);
  const [isPending, startTransition] = useTransition();

  function responder(confirmado: boolean) {
    startTransition(async () => {
      const res = await responderConvidadoPublico(convidado.id, slug, confirmado);
      if (!res.error) setConvidado((c) => ({ ...c, confirmado }));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface p-4 text-center">
        <p className="text-[13px]">
          Olá, <span className="font-bold">{convidado.nome}</span>! Você vai?
        </p>
        <div className="mt-3 flex justify-center gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={() => responder(true)}
            className={convidado.confirmado === true ? buttonClass("primary") : buttonClass("secondary")}
          >
            ✓ Vou
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => responder(false)}
            className={convidado.confirmado === false ? buttonClass("danger") : buttonClass("secondary")}
          >
            Não vou
          </button>
        </div>
      </div>

      {convidado.confirmado === true && <AdicionarAcompanhantes slug={slug} />}

      <div className="rounded-xl bg-text p-4 text-center text-white">
        <p className="text-[13px] font-bold">Vai organizar sua própria festa um dia?</p>
        <p className="mt-1 text-[12px] text-white/75">
          Crie sua conta grátis na GetFesta e monte sua própria lista de convidados.
        </p>
        <Link href="/cadastro/cliente" className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-[12.5px] font-bold text-text">
          Criar conta grátis
        </Link>
      </div>
    </div>
  );
}

function AdicionarAcompanhantes({ slug }: { slug: string }) {
  const [adicionados, setAdicionados] = useState<ConvidadoPublico[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"adulto" | "crianca">("adulto");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const res = await confirmarConvidadoPublico(undefined, formData);
      if (res.error) {
        setErro(res.error);
      } else if (res.convidado) {
        setAdicionados((lista) => [...lista, res.convidado!]);
        formRef.current?.reset();
        setTipo("adulto");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[12.5px] font-bold">Vai levar acompanhante?</p>
      <p className="mt-0.5 text-[11.5px] text-muted">Adicione quem vai com você (um de cada vez).</p>

      {adicionados.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {adicionados.map((a) => (
            <li key={a.id} className="text-[12.5px]">
              ✓ {a.nome}{" "}
              <span className="text-muted">
                ({a.tipo_convidado === "crianca" ? `criança${a.idade_anos !== null ? `, ${a.idade_anos} anos` : ""}` : "adulto"})
              </span>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={handleSubmit} className="mt-3 flex flex-col gap-2">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="contexto" value="acompanhante" />
        <input name="nome" required minLength={2} placeholder="Nome do acompanhante" className="rounded-md border border-border px-3 py-2.5 text-sm" />
        <input name="telefone" placeholder="Telefone do acompanhante (opcional)" className="rounded-md border border-border px-3 py-2.5 text-sm" />
        <TipoConvidadoFields tipo={tipo} onTipoChange={setTipo} />
        {erro && <p className="text-[11.5px] font-semibold text-accent-dark">{erro}</p>}
        <button type="submit" disabled={isPending} className={buttonClass("secondary", "sm")}>
          {isPending ? "Adicionando..." : "+ Adicionar acompanhante"}
        </button>
      </form>
    </div>
  );
}
