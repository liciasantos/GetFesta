"use client";

import { useState, useTransition } from "react";
import { alternarDiaIndisponivel } from "@/lib/actions/disponibilidade";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Calendário próprio pro profissional marcar dias indisponíveis - sem
 * depender de nenhum serviço externo (substitui a tentativa de integração
 * via Google Agenda/.ics, que gerava fricção e confusão sobre privacidade). */
export default function DisponibilidadeCalendar({ diasIndisponiveisIniciais }: { diasIndisponiveisIniciais: string[] }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeIso = toIsoDate(hoje);

  const [mesVisivel, setMesVisivel] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [dias, setDias] = useState<Set<string>>(() => new Set(diasIndisponiveisIniciais));
  const [pendingDia, setPendingDia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const primeiroDiaSemana = mesVisivel.getDay();
  const totalDiasMes = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 0).getDate();
  const podeVoltarMes =
    mesVisivel.getFullYear() > hoje.getFullYear() ||
    (mesVisivel.getFullYear() === hoje.getFullYear() && mesVisivel.getMonth() > hoje.getMonth());

  function mudarMes(delta: number) {
    setMesVisivel((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function toggleDia(iso: string, passado: boolean) {
    if (passado || pendingDia) return;
    setError(null);
    const jaIndisponivel = dias.has(iso);

    setDias((prev) => {
      const next = new Set(prev);
      if (jaIndisponivel) next.delete(iso);
      else next.add(iso);
      return next;
    });
    setPendingDia(iso);

    startTransition(async () => {
      const res = await alternarDiaIndisponivel(iso);
      setPendingDia(null);
      if (res.error) {
        setError(res.error);
        setDias((prev) => {
          const next = new Set(prev);
          if (jaIndisponivel) next.add(iso);
          else next.delete(iso);
          return next;
        });
      }
    });
  }

  const celulas: Array<{ iso: string; dia: number; passado: boolean } | null> = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= totalDiasMes; d++) {
    const iso = toIsoDate(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), d));
    celulas.push({ iso, dia: d, passado: iso < hojeIso });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => mudarMes(-1)}
          disabled={!podeVoltarMes}
          aria-label="Mês anterior"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-alt disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-[13px] font-bold">
          {MESES[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-alt"
        >
          →
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted-2">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celulas.map((c, i) => {
          if (!c) return <div key={`vazio-${i}`} />;
          const indisponivel = dias.has(c.iso);
          const isHoje = c.iso === hojeIso;
          return (
            <button
              key={c.iso}
              type="button"
              disabled={c.passado || pendingDia === c.iso}
              onClick={() => toggleDia(c.iso, c.passado)}
              className={`aspect-square rounded-md text-[11.5px] font-semibold transition-colors disabled:cursor-default ${
                c.passado
                  ? "text-muted-2 opacity-40"
                  : indisponivel
                  ? "bg-accent text-white hover:bg-accent-dark"
                  : "border border-border text-text hover:border-accent-soft-2 hover:bg-accent-soft"
              } ${isHoje && !indisponivel ? "ring-1 ring-inset ring-accent-dark" : ""}`}
            >
              {c.dia}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent" /> Indisponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border" /> Disponível
        </span>
      </div>
      {error && <p className="mt-2 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
      <p className="mt-2 text-[11px] text-muted">Clique num dia pra marcar como indisponível. Clique de novo pra desmarcar.</p>
    </div>
  );
}
