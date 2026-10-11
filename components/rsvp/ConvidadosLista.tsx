"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { Convidado } from "@/lib/data/rsvp";
import ConvidadoLinha, { statusDe, type StatusConvidado } from "./ConvidadoLinha";

type Filtro = "todos" | StatusConvidado;

const FILTROS: Array<{ id: Filtro; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "confirmado", label: "Vão" },
  { id: "pendente", label: "Aguardando" },
  { id: "recusado", label: "Não vão" },
];

function semAcento(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Lista do anfitrião com filtro por status, busca por nome e exportação
 * em planilha (CSV, abre no Excel/Google Planilhas). */
export default function ConvidadosLista({ convidados, eventoSlug, eventoTitulo }: { convidados: Convidado[]; eventoSlug: string; eventoTitulo: string }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");

  const contagem = useMemo(() => {
    const c: Record<Filtro, number> = { todos: convidados.length, confirmado: 0, pendente: 0, recusado: 0 };
    for (const g of convidados) c[statusDe(g.confirmado)]++;
    return c;
  }, [convidados]);

  const visiveis = useMemo(() => {
    const q = semAcento(busca.trim());
    return convidados.filter(
      (g) => (filtro === "todos" || statusDe(g.confirmado) === filtro) && (!q || semAcento(g.nome).includes(q))
    );
  }, [convidados, filtro, busca]);

  function exportar() {
    const rotulo: Record<StatusConvidado, string> = { confirmado: "Vai", pendente: "Aguardando", recusado: "Não vai" };
    const linhas = [
      ["Nome", "Telefone", "Tipo", "Idade", "Presença"],
      ...convidados.map((g) => [
        g.nome,
        g.telefone ?? "",
        g.tipo_convidado === "crianca" ? "Criança" : "Adulto",
        g.idade_anos?.toString() ?? "",
        rotulo[statusDe(g.confirmado)],
      ]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\r\n");
    // BOM pro Excel reconhecer os acentos
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `convidados-${semAcento(eventoTitulo).replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (convidados.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-6 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
          <Icon name="userPlus" className="h-5 w-5" />
        </span>
        <p className="mt-3 text-[14px] font-bold">Nenhum convidado ainda</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
          Adicione os nomes acima — ou mande o link da festa e cada convidado entra na lista ao confirmar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                filtro === f.id ? "border-text bg-text text-white" : "border-border bg-surface text-muted hover:text-text"
              }`}
            >
              {f.label} <span className={filtro === f.id ? "text-white/70" : "text-muted-2"}>{contagem[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
            <span className="sr-only">Buscar convidado</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pelo nome"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-base sm:text-[13px]"
            />
          </label>
          <button
            type="button"
            onClick={exportar}
            title="Baixar lista em planilha"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] font-bold hover:bg-surface-alt"
          >
            <Icon name="download" className="h-4 w-4" />
            <span className="hidden sm:inline">Planilha</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {visiveis.map((c) => (
          <ConvidadoLinha key={c.id} convidado={c} eventoSlug={eventoSlug} />
        ))}
        {visiveis.length === 0 && <p className="py-4 text-center text-[13px] text-muted">Ninguém nesse filtro.</p>}
      </div>
    </div>
  );
}
