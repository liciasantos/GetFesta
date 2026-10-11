"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useState, useTransition } from "react";
import { atualizarConfirmacaoConvidado, removerConvidado } from "@/lib/actions/rsvp";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site-url";
import type { Convidado } from "@/lib/data/rsvp";
import { formatarNumero } from "@/lib/whatsapp/regras";

export type StatusConvidado = "confirmado" | "pendente" | "recusado";

export function statusDe(confirmado: boolean | null): StatusConvidado {
  if (confirmado === true) return "confirmado";
  if (confirmado === false) return "recusado";
  return "pendente";
}

const OPCOES: Array<{ valor: boolean | null; status: StatusConvidado; label: string; icon: "check" | "clock" | "x"; ativo: string }> = [
  { valor: true, status: "confirmado", label: "Vai", icon: "check", ativo: "bg-ok text-white" },
  { valor: null, status: "pendente", label: "Aguardando", icon: "clock", ativo: "bg-text text-white" },
  { valor: false, status: "recusado", label: "Não vai", icon: "x", ativo: "bg-danger-dark text-white" },
];

const AVATAR: Record<StatusConvidado, string> = {
  confirmado: "bg-ok-soft text-ok",
  pendente: "bg-surface-alt text-muted",
  recusado: "bg-danger-soft text-danger-dark",
};

/** Uma linha da lista do anfitrião: quem é, status em 3 botões (vai /
 * aguardando / não vai), convite individual no WhatsApp e remover. */
export default function ConvidadoLinha({ convidado, eventoSlug }: { convidado: Convidado; eventoSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const status = statusDe(convidado.confirmado);

  function marcar(confirmado: boolean | null) {
    if (statusDe(confirmado) === status) return;
    startTransition(async () => {
      await atualizarConfirmacaoConvidado(convidado.id, confirmado);
      router.refresh();
    });
  }

  function remover() {
    startTransition(async () => {
      await removerConvidado(convidado.id);
      router.refresh();
    });
  }

  const meta = [
    convidado.tipo_convidado === "crianca"
      ? `Criança${convidado.idade_anos !== null ? ` · ${convidado.idade_anos} anos` : ""}`
      : "Adulto",
    convidado.telefone && formatarNumero(convidado.telefone),
  ].filter(Boolean);

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl border border-border bg-surface p-3 ${isPending ? "opacity-60" : ""}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-extrabold ${AVATAR[status]}`}>
        {convidado.nome[0]?.toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold">{convidado.nome}</p>
        <p className="truncate text-[12px] text-muted">{meta.join(" · ")}</p>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="flex flex-1 rounded-lg border border-border bg-surface-alt/50 p-0.5 sm:flex-none" role="group" aria-label={`Presença de ${convidado.nome}`}>
          {OPCOES.map((o) => {
            const ativo = status === o.status;
            return (
              <button
                key={o.status}
                type="button"
                disabled={isPending}
                onClick={() => marcar(o.valor)}
                aria-pressed={ativo}
                title={o.label}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-bold transition-colors sm:flex-none ${
                  ativo ? o.ativo : "text-muted hover:text-text"
                }`}
              >
                <Icon name={o.icon} className="h-3.5 w-3.5" />
                <span className={ativo ? "" : "sr-only sm:not-sr-only"}>{o.label}</span>
              </button>
            );
          })}
        </div>

        {convidado.telefone && (
          <a
            href={buildWhatsAppLink(
              convidado.telefone,
              `Oi ${convidado.nome}! Você está convidado(a) 🎉 Confirma sua presença aqui: ${SITE_URL}/rsvp/${eventoSlug}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            title="Enviar convite no WhatsApp"
            aria-label={`Enviar convite para ${convidado.nome} no WhatsApp`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-ok hover:bg-ok-soft"
          >
            <Icon name="chat" className="h-4 w-4" />
          </a>
        )}

        {confirmandoRemocao ? (
          <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={isPending}
              onClick={remover}
              className="rounded-lg bg-danger-dark px-2.5 py-2 text-[12px] font-bold text-white hover:bg-danger-dark/90"
            >
              Remover
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoRemocao(false)}
              aria-label="Cancelar remoção"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-alt"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoRemocao(true)}
            title="Remover da lista"
            aria-label={`Remover ${convidado.nome} da lista`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-2 hover:bg-danger-soft hover:text-danger-dark"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
