"use client";

import { useMemo, useState, useTransition } from "react";
import {
  alternarDiaIndisponivel,
  adicionarBloqueioHorario,
  removerBloqueioHorario,
} from "@/lib/actions/disponibilidade";
import type { BloqueioDisponibilidade } from "@/lib/data/disponibilidade";
import { buttonClass } from "@/components/ui";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDiaSelecionado(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

/** Calendário próprio pro profissional marcar dias/horários indisponíveis -
 * sem depender de nenhum serviço externo (substitui a tentativa de
 * integração via Google Agenda, que gerava fricção e confusão sobre
 * privacidade). Clicar num dia abre um painel abaixo onde dá pra marcar o
 * dia inteiro OU só um intervalo de horário específico. */
export default function DisponibilidadeCalendar({
  bloqueiosIniciais,
}: {
  bloqueiosIniciais: BloqueioDisponibilidade[];
}) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeIso = toIsoDate(hoje);

  const [mesVisivel, setMesVisivel] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [bloqueios, setBloqueios] = useState<BloqueioDisponibilidade[]>(bloqueiosIniciais);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [novoInicio, setNovoInicio] = useState("");
  const [novoFim, setNovoFim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const porDia = useMemo(() => {
    const mapa = new Map<string, BloqueioDisponibilidade[]>();
    for (const b of bloqueios) {
      const lista = mapa.get(b.data) ?? [];
      lista.push(b);
      mapa.set(b.data, lista);
    }
    return mapa;
  }, [bloqueios]);

  const primeiroDiaSemana = mesVisivel.getDay();
  const totalDiasMes = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 0).getDate();
  const podeVoltarMes =
    mesVisivel.getFullYear() > hoje.getFullYear() ||
    (mesVisivel.getFullYear() === hoje.getFullYear() && mesVisivel.getMonth() > hoje.getMonth());

  function mudarMes(delta: number) {
    setMesVisivel((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function selecionarDia(iso: string, passado: boolean) {
    if (passado) return;
    setError(null);
    setNovoInicio("");
    setNovoFim("");
    setDiaSelecionado((atual) => (atual === iso ? null : iso));
  }

  function toggleDiaInteiro() {
    if (!diaSelecionado || isPending) return;
    setError(null);
    startTransition(async () => {
      const res = await alternarDiaIndisponivel(diaSelecionado);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) => {
        const semEsseDia = prev.filter((b) => b.data !== diaSelecionado);
        return res.indisponivel ? [...semEsseDia, { id: "temp", data: diaSelecionado, horaInicio: null, horaFim: null }] : semEsseDia;
      });
    });
  }

  function adicionarHorario() {
    if (!diaSelecionado || isPending) return;
    setError(null);
    if (!novoInicio || !novoFim) {
      setError("Preencha o horário de início e de fim.");
      return;
    }
    startTransition(async () => {
      const res = await adicionarBloqueioHorario(diaSelecionado, novoInicio, novoFim);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) => [
        ...prev,
        { id: `${diaSelecionado}-${novoInicio}`, data: diaSelecionado, horaInicio: novoInicio, horaFim: novoFim },
      ]);
      setNovoInicio("");
      setNovoFim("");
    });
  }

  function removerHorario(id: string) {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const res = await removerBloqueioHorario(id);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) => prev.filter((b) => b.id !== id));
    });
  }

  const celulas: Array<{ iso: string; dia: number; passado: boolean } | null> = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= totalDiasMes; d++) {
    const iso = toIsoDate(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), d));
    celulas.push({ iso, dia: d, passado: iso < hojeIso });
  }

  const bloqueiosDoDiaSelecionado = diaSelecionado ? (porDia.get(diaSelecionado) ?? []) : [];
  const diaInteiroBloqueado = bloqueiosDoDiaSelecionado.some((b) => !b.horaInicio);
  const horariosDoDia = bloqueiosDoDiaSelecionado.filter((b) => b.horaInicio);

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
          const bloqueiosDoDia = porDia.get(c.iso) ?? [];
          const diaInteiro = bloqueiosDoDia.some((b) => !b.horaInicio);
          const parcial = !diaInteiro && bloqueiosDoDia.length > 0;
          const isHoje = c.iso === hojeIso;
          const selecionado = c.iso === diaSelecionado;
          return (
            <button
              key={c.iso}
              type="button"
              disabled={c.passado}
              onClick={() => selecionarDia(c.iso, c.passado)}
              className={`relative aspect-square rounded-md text-[11.5px] font-semibold transition-colors disabled:cursor-default ${
                c.passado
                  ? "text-muted-2 opacity-40"
                  : diaInteiro
                  ? "bg-accent text-white hover:bg-accent-dark"
                  : "border border-border text-text hover:border-accent-soft-2 hover:bg-accent-soft"
              } ${isHoje && !diaInteiro ? "ring-1 ring-inset ring-accent-dark" : ""} ${
                selecionado ? "outline outline-2 outline-offset-1 outline-accent-dark" : ""
              }`}
            >
              {c.dia}
              {parcial && (
                <span className="absolute bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent" /> Dia inteiro indisponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative h-3 w-3 rounded border border-border">
            <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
          </span>
          Só um horário indisponível
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted">Clique num dia pra ver ou editar a disponibilidade dele.</p>

      {diaSelecionado && (
        <div className="mt-3 rounded-lg border border-border bg-surface-alt p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-bold capitalize">{formatDiaSelecionado(diaSelecionado)}</p>
            <button
              type="button"
              onClick={() => setDiaSelecionado(null)}
              className="text-[11px] font-bold text-muted hover:text-text"
            >
              Fechar
            </button>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={toggleDiaInteiro}
            className={`mt-2 w-full rounded-md border px-3 py-1.5 text-[12px] font-bold disabled:opacity-50 ${
              diaInteiroBloqueado
                ? "border-accent bg-accent-soft text-accent-dark"
                : "border-border-strong hover:bg-surface"
            }`}
          >
            {diaInteiroBloqueado ? "✓ Dia inteiro marcado como indisponível — clique pra desmarcar" : "Marcar dia inteiro como indisponível"}
          </button>

          {diaInteiroBloqueado ? (
            <p className="mt-2 text-[11px] text-muted">
              O dia inteiro já está bloqueado. Desmarque acima se quiser liberar horários específicos.
            </p>
          ) : (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Horários indisponíveis</p>
              {horariosDoDia.length === 0 && (
                <p className="mt-1 text-[11.5px] text-muted">Nenhum horário específico bloqueado nesse dia ainda.</p>
              )}
              <div className="mt-1.5 flex flex-col gap-1.5">
                {horariosDoDia.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px] font-semibold"
                  >
                    {b.horaInicio} – {b.horaFim}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => removerHorario(b.id)}
                      className="text-[11px] font-bold text-accent-dark hover:underline disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-0.5 text-[10.5px] font-bold uppercase text-muted-2">
                  Início
                  <input
                    type="time"
                    value={novoInicio}
                    onChange={(e) => setNovoInicio(e.target.value)}
                    className="rounded-md border border-border px-2 py-1 text-[12.5px]"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[10.5px] font-bold uppercase text-muted-2">
                  Fim
                  <input
                    type="time"
                    value={novoFim}
                    onChange={(e) => setNovoFim(e.target.value)}
                    className="rounded-md border border-border px-2 py-1 text-[12.5px]"
                  />
                </label>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={adicionarHorario}
                  className={buttonClass("secondary", "sm")}
                >
                  + Adicionar horário
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}
