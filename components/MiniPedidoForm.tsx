"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui";
import type { Cidade } from "@/lib/data/geo";
import { agruparCidadesPorMacrorregiao } from "@/lib/estados";

const TIPOS_EVENTO = [
  "Aniversário infantil",
  "Debutante (15 anos)",
  "Casamento",
  "Formatura",
  "Confraternização",
  "Evento corporativo",
];

export default function MiniPedidoForm({
  cidades,
  compact = false,
  estadoPreferido,
}: {
  cidades: Cidade[];
  compact?: boolean;
  /** sigla escolhida no filtro de região - se houver, as cidades desse estado aparecem primeiro */
  estadoPreferido?: string | null;
}) {
  const router = useRouter();
  const [tipoEvento, setTipoEvento] = useState(TIPOS_EVENTO[0]);
  // começa vazio ("Selecione a cidade") - antes vinha marcada a primeira cidade
  // da lista (Araruama), o que parecia uma escolha feita pelo site
  const [cidadeId, setCidadeId] = useState<number | string>("");
  const cidadesOrdenadas = estadoPreferido
    ? [...cidades.filter((c) => c.estado === estadoPreferido), ...cidades.filter((c) => c.estado !== estadoPreferido)]
    : cidades;
  const [dataEvento, setDataEvento] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ tipoEvento });
    if (cidadeId) params.set("cidadeId", String(cidadeId));
    if (dataEvento) params.set("dataEvento", dataEvento);
    router.push(`/publicar-pedido?${params.toString()}`);
  }

  const fieldClass = "w-full min-w-0 bg-transparent text-[13.5px] font-semibold text-text outline-none";
  const fieldWrapClass = compact
    ? "flex flex-col gap-1.5 border-b border-border pb-2.5"
    : "flex min-w-0 flex-col gap-1.5 border-b border-border pb-2.5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "flex w-full flex-col gap-3 rounded-2xl border border-border-strong bg-surface p-4 text-left shadow-[var(--shadow-card)]"
          : // 4 colunas só a partir do lg: - entre 640 e 1024px o botão estourava pra fora do card
            "mx-auto grid max-w-3xl grid-cols-1 gap-3 rounded-2xl border border-border-strong bg-surface p-4 text-left shadow-[var(--shadow-card)] sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]"
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
          <option value="">Selecione a cidade</option>
          {/* agrupado por macrorregiao pra ficar organizado, mas continua
              sendo uma unica escolha - esse form e o atalho rapido da home,
              o fluxo completo Estado > Cidade > Bairro fica no wizard de /publicar-pedido */}
          {[...agruparCidadesPorMacrorregiao(cidadesOrdenadas).entries()].map(([regiao, cidadesDaRegiao]) => (
            <optgroup key={regiao} label={regiao}>
              {cidadesDaRegiao.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className={compact ? "flex flex-col gap-1.5 border-b border-border pb-2.5" : "flex min-w-0 flex-col gap-1.5 pb-1 lg:pb-0"}>
        <label className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Data do evento</label>
        <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} className={fieldClass} />
      </div>
      <button type="submit" className={`${buttonClass("primary", "lg")} ${compact ? "w-full" : "sm:self-end lg:self-auto"}`}>
        Publicar grátis →
      </button>
    </form>
  );
}
