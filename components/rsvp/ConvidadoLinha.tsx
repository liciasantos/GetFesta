"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { atualizarConfirmacaoConvidado, removerConvidado } from "@/lib/actions/rsvp";
import { Badge } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site-url";
import type { Convidado } from "@/lib/data/rsvp";

const STATUS: Record<string, { label: string; tone: "ok" | "danger" | "muted" }> = {
  confirmado: { label: "✓ Confirmado", tone: "ok" },
  recusado: { label: "Não vai", tone: "danger" },
  pendente: { label: "Aguardando", tone: "muted" },
};

function statusDe(confirmado: boolean | null): keyof typeof STATUS {
  if (confirmado === true) return "confirmado";
  if (confirmado === false) return "recusado";
  return "pendente";
}

export default function ConvidadoLinha({ convidado, eventoSlug }: { convidado: Convidado; eventoSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const status = statusDe(convidado.confirmado);

  function marcar(confirmado: boolean | null) {
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
      <div>
        <div className="flex items-center gap-2 text-[13px] font-bold">
          {convidado.nome}
          <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10.5px] font-semibold text-muted">
            {convidado.tipo_convidado === "crianca"
              ? `Criança${convidado.idade_anos !== null ? ` · ${convidado.idade_anos} anos` : ""}`
              : "Adulto"}
          </span>
        </div>
        {convidado.telefone && <div className="text-[11.5px] text-muted">{convidado.telefone}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>

        {convidado.telefone && (
          <a
            href={buildWhatsAppLink(
              convidado.telefone,
              `Oi ${convidado.nome}! Você tá convidado(a) 🎉 Confirma sua presença aqui: ${SITE_URL}/rsvp/${eventoSlug}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt"
          >
            💬 Convite
          </a>
        )}

        {status !== "confirmado" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => marcar(true)}
            className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
          >
            Confirmar
          </button>
        )}
        {status !== "recusado" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => marcar(false)}
            className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
          >
            Não vai
          </button>
        )}
        {status !== "pendente" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => marcar(null)}
            className="text-[11.5px] font-bold text-muted underline disabled:opacity-50"
          >
            Desfazer
          </button>
        )}

        {confirmandoRemocao ? (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isPending}
              onClick={remover}
              className="rounded-md bg-danger-dark px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-danger-dark/90 disabled:opacity-50"
            >
              Confirmar exclusão
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoRemocao(false)}
              className="text-[11.5px] font-bold text-muted underline"
            >
              Cancelar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoRemocao(true)}
            className="text-[11.5px] font-bold text-accent-dark underline"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
