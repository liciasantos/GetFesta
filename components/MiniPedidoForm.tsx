"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui";
import type { Cidade } from "@/lib/data/geo";
import { ESTADOS } from "@/lib/estados";

const TIPOS_EVENTO = [
  "Aniversário infantil",
  "Debutante (15 anos)",
  "Casamento",
  "Formatura",
  "Confraternização",
  "Evento corporativo",
];

export default function MiniPedidoForm({ cidades, compact = false }: { cidades: Cidade[]; compact?: boolean }) {
  const router = useRouter();
  const [tipoEvento, setTipoEvento] = useState(TIPOS_EVENTO[0]);
  const [cidadeId, setCidadeId] = useState<number | string>(cidades[0]?.id ?? "");
  const [dataEvento, setDataEvento] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      tipoEvento,
      cidadeId: String(cidadeId),
      dataEvento,
    });
    router.push(`/publicar-pedido?${params.toString()}`);
  }

  const fieldClass = "bg-transparent text-[13.5px] font-semibold text-text outline-none";
  const fieldWrapClass = compact
    ? "flex flex-col gap-1.5 border-b border-border pb-2.5"
    : "flex flex-col gap-1.5 border-b border-border pb-2.5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "flex w-full flex-col gap-3 rounded-2xl border border-border-strong bg-surface p-4 text-left shadow-[var(--shadow-card)]"
          : "mx-auto grid max-w-3xl grid-cols-1 gap-3 rounded-2xl border border-border-strong bg-surface p-4 text-left shadow-[var(--shadow-card)] sm:grid-cols-[1.3fr_1fr_1fr_auto]"
      }
    >
      <div className={fieldWrapClass}>
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Tipo de festa</label>
        <select value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} className={fieldClass}>
          {TIPOS_EVENTO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className={fieldWrapClass}>
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Cidade</label>
        <select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)} className={fieldClass}>
          {/* agrupado por estado (RJ/SP/MG) pra ficar organizado, mas continua
              sendo uma unica escolha - esse form e o atalho rapido da home,
              o fluxo completo Estado > Cidade > Bairro fica no wizard de /publicar-pedido */}
          {ESTADOS.map((estado) => {
            const cidadesDoEstado = cidades.filter((c) => c.estado === estado.sigla);
            if (cidadesDoEstado.length === 0) return null;
            return (
              <optgroup key={estado.sigla} label={estado.nome}>
                {cidadesDoEstado.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>
      <div className={compact ? "flex flex-col gap-1.5 border-b border-border pb-2.5" : "flex flex-col gap-1.5 pb-1 sm:pb-0"}>
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Data do evento</label>
        <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} className={fieldClass} />
      </div>
      <button type="submit" className={`${buttonClass("primary", "lg")} ${compact ? "w-full" : ""}`}>
        Publicar grátis →
      </button>
    </form>
  );
}
