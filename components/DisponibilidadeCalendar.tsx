"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  alternarDiaIndisponivel,
  adicionarBloqueioHorario,
  editarBloqueioHorario,
  editarObservacaoBloqueio,
  removerBloqueioHorario,
  definirDiasIndisponiveis,
} from "@/lib/actions/disponibilidade";
import type { BloqueioDisponibilidade } from "@/lib/data/disponibilidade";
import { buttonClass } from "@/components/ui";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatDiaSelecionado(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function formatDiaCurto(iso: string): { dia: string; mes: string } {
  const d = parseIsoDate(iso);
  return { dia: String(d.getDate()).padStart(2, "0"), mes: MESES_ABREV[d.getMonth()] };
}

/** Todas as datas ISO entre a e b (inclusive, em qualquer ordem), pulando
 * datas que já passaram - assim um arrasto/range que "esbarra" no passado
 * simplesmente não inclui esses dias, em vez de travar a seleção toda. */
function intervaloIso(a: string, b: string, hojeIso: string): string[] {
  let inicio = parseIsoDate(a);
  let fim = parseIsoDate(b);
  if (inicio > fim) [inicio, fim] = [fim, inicio];
  const out: string[] = [];
  const cursor = new Date(inicio);
  while (cursor <= fim) {
    const iso = toIsoDate(cursor);
    if (iso >= hojeIso) out.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Calendário próprio pro profissional marcar dias/horários indisponíveis -
 * sem depender de nenhum serviço externo. Suporta selecionar vários dias de
 * uma vez: arrastar o dedo no mobile, ou no desktop clicar num dia e
 * shift+clicar noutro pra selecionar o intervalo inteiro (ctrl/cmd+clique
 * soma dias avulsos à seleção). Com 1 dia só selecionado, mostra o editor
 * detalhado (dia inteiro OU horários específicos, cada um editável e com
 * observação opcional); com vários, mostra a lista dos dias escolhidos e uma
 * ação em lote pra marcar/desmarcar todos. */
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
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [novoInicio, setNovoInicio] = useState("");
  const [novoFim, setNovoFim] = useState("");
  const [novaObservacao, setNovaObservacao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const draggingRef = useRef(false);
  const dragStartRef = useRef<string | null>(null);
  const lastDragIsoRef = useRef<string | null>(null);

  const porDia = useMemo(() => {
    const mapa = new Map<string, BloqueioDisponibilidade[]>();
    for (const b of bloqueios) {
      const lista = mapa.get(b.data) ?? [];
      lista.push(b);
      mapa.set(b.data, lista);
    }
    return mapa;
  }, [bloqueios]);

  function diaInteiroBloqueadoEm(iso: string): boolean {
    return (porDia.get(iso) ?? []).some((b) => !b.horaInicio);
  }

  const primeiroDiaSemana = mesVisivel.getDay();
  const totalDiasMes = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 0).getDate();
  const podeVoltarMes =
    mesVisivel.getFullYear() > hoje.getFullYear() ||
    (mesVisivel.getFullYear() === hoje.getFullYear() && mesVisivel.getMonth() > hoje.getMonth());

  function mudarMes(delta: number) {
    setMesVisivel((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function limparEdicaoPontual() {
    setError(null);
    setNovoInicio("");
    setNovoFim("");
    setNovaObservacao("");
  }

  function endDrag() {
    draggingRef.current = false;
    dragStartRef.current = null;
    lastDragIsoRef.current = null;
  }

  function handleCellPointerDown(e: React.PointerEvent, iso: string, passado: boolean) {
    if (passado || isPending) return;
    limparEdicaoPontual();

    if (e.shiftKey && anchor) {
      setSelecionados(intervaloIso(anchor, iso, hojeIso));
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      setSelecionados((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]));
      setAnchor(iso);
      return;
    }
    if (selecionados.length === 1 && selecionados[0] === iso) {
      setSelecionados([]);
      setAnchor(null);
      return;
    }

    setSelecionados([iso]);
    setAnchor(iso);
    draggingRef.current = true;
    dragStartRef.current = iso;
    lastDragIsoRef.current = iso;
  }

  function handleGridPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !dragStartRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const cell = el?.closest<HTMLElement>("[data-iso]");
    if (!cell || cell.dataset.disabled === "true") return;
    const iso = cell.dataset.iso!;
    if (iso === lastDragIsoRef.current) return;
    lastDragIsoRef.current = iso;
    setSelecionados(intervaloIso(dragStartRef.current, iso, hojeIso));
  }

  function toggleDiaInteiro() {
    const iso = selecionados[0];
    if (!iso || isPending) return;
    setError(null);
    startTransition(async () => {
      const res = await alternarDiaIndisponivel(iso);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) => {
        const semEsseDia = prev.filter((b) => b.data !== iso);
        return res.indisponivel
          ? [...semEsseDia, { id: res.id!, data: iso, horaInicio: null, horaFim: null, observacao: null }]
          : semEsseDia;
      });
    });
  }

  function adicionarHorario() {
    const iso = selecionados[0];
    if (!iso || isPending) return;
    setError(null);
    if (!novoInicio || !novoFim) {
      setError("Preencha o horário de início e de fim.");
      return;
    }
    startTransition(async () => {
      const res = await adicionarBloqueioHorario(iso, novoInicio, novoFim, novaObservacao);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) => [
        ...prev,
        { id: res.id!, data: iso, horaInicio: novoInicio, horaFim: novoFim, observacao: novaObservacao.trim() || null },
      ]);
      setNovoInicio("");
      setNovoFim("");
      setNovaObservacao("");
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

  function salvarEdicaoHorario(id: string, horaInicio: string, horaFim: string, observacao: string) {
    setError(null);
    startTransition(async () => {
      const res = await editarBloqueioHorario(id, horaInicio, horaFim, observacao);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) =>
        prev.map((b) => (b.id === id ? { ...b, horaInicio, horaFim, observacao: observacao.trim() || null } : b))
      );
    });
  }

  function salvarObservacao(id: string, observacao: string) {
    setError(null);
    startTransition(async () => {
      const res = await editarObservacaoBloqueio(id, observacao);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) => prev.map((b) => (b.id === id ? { ...b, observacao: observacao.trim() || null } : b)));
    });
  }

  function aplicarEmLote(indisponivel: boolean) {
    if (selecionados.length === 0 || isPending) return;
    setError(null);
    const alvo = [...selecionados];
    startTransition(async () => {
      const res = await definirDiasIndisponiveis(alvo, indisponivel);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBloqueios((prev) => {
        const semEssesDias = prev.filter((b) => !alvo.includes(b.data));
        return indisponivel
          ? [
              ...semEssesDias,
              ...alvo.map((data) => ({ id: `lote-${data}`, data, horaInicio: null, horaFim: null, observacao: null })),
            ]
          : semEssesDias;
      });
      setSelecionados([]);
      setAnchor(null);
    });
  }

  const celulas: Array<{ iso: string; dia: number; passado: boolean } | null> = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= totalDiasMes; d++) {
    const iso = toIsoDate(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), d));
    celulas.push({ iso, dia: d, passado: iso < hojeIso });
  }

  const modoLote = selecionados.length > 1;
  const diaUnico = selecionados.length === 1 ? selecionados[0] : null;
  const bloqueiosDoDiaUnico = diaUnico ? (porDia.get(diaUnico) ?? []) : [];
  const diaInteiroBloqueado = bloqueiosDoDiaUnico.find((b) => !b.horaInicio) ?? null;
  const horariosDoDia = bloqueiosDoDiaUnico.filter((b) => b.horaInicio);
  const todosSelecionadosBloqueados = modoLote && selecionados.every(diaInteiroBloqueadoEm);

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
      <div
        className="mt-1 grid touch-none select-none grid-cols-7 gap-1"
        onPointerMove={handleGridPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        {celulas.map((c, i) => {
          if (!c) return <div key={`vazio-${i}`} />;
          const bloqueiosDoDia = porDia.get(c.iso) ?? [];
          const diaInteiro = bloqueiosDoDia.some((b) => !b.horaInicio);
          const parcial = !diaInteiro && bloqueiosDoDia.length > 0;
          const isHoje = c.iso === hojeIso;
          const selecionado = selecionados.includes(c.iso);
          return (
            <button
              key={c.iso}
              type="button"
              data-iso={c.iso}
              data-disabled={c.passado ? "true" : "false"}
              disabled={c.passado}
              onPointerDown={(e) => handleCellPointerDown(e, c.iso, c.passado)}
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
      <p className="mt-2 text-[11px] text-muted">
        Toque num dia (ou arraste pra selecionar vários). No computador: shift+clique seleciona um intervalo,
        ctrl/cmd+clique soma dias avulsos.
      </p>

      {diaUnico && (
        <div className="mt-3 rounded-lg border border-border bg-surface-alt p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-bold capitalize">
              {diaUnico === hojeIso && "Hoje. "}
              <span className="font-normal">{formatDiaSelecionado(diaUnico)}</span>
            </p>
            <button type="button" onClick={() => setSelecionados([])} className="text-[11px] font-bold text-muted hover:text-text">
              Fechar
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {diaInteiroBloqueado && (
              <AgendaRow
                label="Dia todo"
                observacao={diaInteiroBloqueado.observacao}
                salvando={isPending}
                onRemover={toggleDiaInteiro}
                onSalvarObservacao={(obs) => salvarObservacao(diaInteiroBloqueado.id, obs)}
              />
            )}
            {horariosDoDia.map((b) => (
              <AgendaRow
                key={b.id}
                label={`${b.horaInicio}\n${b.horaFim}`}
                horaInicio={b.horaInicio!}
                horaFim={b.horaFim!}
                observacao={b.observacao}
                salvando={isPending}
                onRemover={() => removerHorario(b.id)}
                onSalvarHorario={(horaInicio, horaFim, obs) => salvarEdicaoHorario(b.id, horaInicio, horaFim, obs)}
              />
            ))}
            {!diaInteiroBloqueado && horariosDoDia.length === 0 && (
              <p className="text-[11.5px] text-muted">Nenhum bloqueio nesse dia — você está disponível.</p>
            )}
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={toggleDiaInteiro}
            className={`mt-3 w-full rounded-md border px-3 py-1.5 text-[12px] font-bold disabled:opacity-50 ${
              diaInteiroBloqueado ? "border-accent bg-accent-soft text-accent-dark" : "border-border-strong hover:bg-surface"
            }`}
          >
            {diaInteiroBloqueado ? "✓ Dia inteiro marcado — clique pra desmarcar" : "Marcar dia inteiro como indisponível"}
          </button>

          {!diaInteiroBloqueado && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex flex-wrap items-end gap-2">
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
                <button type="button" disabled={isPending} onClick={adicionarHorario} className={buttonClass("secondary", "sm")}>
                  + Adicionar horário
                </button>
              </div>
              <input
                value={novaObservacao}
                onChange={(e) => setNovaObservacao(e.target.value)}
                maxLength={200}
                placeholder="Nota opcional (ex: consulta médica)"
                className="rounded-md border border-border px-2.5 py-1.5 text-[12px]"
              />
            </div>
          )}
        </div>
      )}

      {modoLote && (
        <div className="mt-3 rounded-lg border border-border bg-surface-alt p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-bold">{selecionados.length} dias selecionados</p>
            <button
              type="button"
              onClick={() => {
                setSelecionados([]);
                setAnchor(null);
              }}
              className="text-[11px] font-bold text-muted hover:text-text"
            >
              Limpar seleção
            </button>
          </div>

          <div className="mt-3 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {[...selecionados]
              .sort()
              .map((iso) => {
                const { dia, mes } = formatDiaCurto(iso);
                const bloqueado = diaInteiroBloqueadoEm(iso);
                return (
                  <div key={iso} className="flex items-stretch gap-3 rounded-md border border-border bg-surface p-2">
                    <span className={`w-1 shrink-0 rounded-full ${bloqueado ? "bg-accent" : "bg-border-strong"}`} />
                    <div className="flex w-9 shrink-0 flex-col items-center justify-center text-[11px] font-bold leading-tight text-muted-2">
                      <span className="text-[13px] text-text">{dia}</span>
                      <span>{mes}</span>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 border-l border-border pl-2.5 text-[12px]">
                      <span className="font-semibold capitalize">{formatDiaSelecionado(iso).split(",")[0]}</span>
                      <span className={bloqueado ? "font-bold text-accent-dark" : "text-muted"}>
                        {bloqueado ? "Indisponível" : "Disponível"}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Remover da seleção"
                      onClick={() => setSelecionados((prev) => prev.filter((d) => d !== iso))}
                      className="shrink-0 text-muted-2 hover:text-text"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => aplicarEmLote(!todosSelecionadosBloqueados)}
            className={`${buttonClass("primary", "sm")} mt-3 w-full`}
          >
            {isPending
              ? "Salvando..."
              : todosSelecionadosBloqueados
                ? `Desmarcar ${selecionados.length} dias`
                : `Marcar ${selecionados.length} dias como indisponíveis`}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}

/** Uma linha de bloqueio (dia todo OU horário específico). Sem horaInicio/
 * horaFim passados, é tratada como "dia todo" - só a observação é editável.
 * Com eles, o lápis também deixa editar o intervalo de horário. */
function AgendaRow({
  label,
  horaInicio,
  horaFim,
  observacao,
  salvando,
  onRemover,
  onSalvarHorario,
  onSalvarObservacao,
}: {
  label: string;
  horaInicio?: string;
  horaFim?: string;
  observacao: string | null;
  salvando: boolean;
  onRemover: () => void;
  onSalvarHorario?: (horaInicio: string, horaFim: string, observacao: string) => void;
  onSalvarObservacao?: (observacao: string) => void;
}) {
  const [linha1, linha2] = label.split("\n");
  const editavelPorHorario = !!onSalvarHorario;
  const [editando, setEditando] = useState(false);
  const [formInicio, setFormInicio] = useState(horaInicio ?? "");
  const [formFim, setFormFim] = useState(horaFim ?? "");
  const [formObs, setFormObs] = useState(observacao ?? "");

  function abrirEdicao() {
    setFormInicio(horaInicio ?? "");
    setFormFim(horaFim ?? "");
    setFormObs(observacao ?? "");
    setEditando(true);
  }

  function salvar() {
    if (editavelPorHorario) onSalvarHorario!(formInicio, formFim, formObs);
    else onSalvarObservacao!(formObs);
    setEditando(false);
  }

  if (editando) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-accent-soft-2 bg-surface p-2.5">
        {editavelPorHorario && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-0.5 text-[10px] font-bold uppercase text-muted-2">
              Início
              <input
                type="time"
                value={formInicio}
                onChange={(e) => setFormInicio(e.target.value)}
                className="rounded-md border border-border px-2 py-1 text-[12px]"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] font-bold uppercase text-muted-2">
              Fim
              <input
                type="time"
                value={formFim}
                onChange={(e) => setFormFim(e.target.value)}
                className="rounded-md border border-border px-2 py-1 text-[12px]"
              />
            </label>
          </div>
        )}
        <input
          value={formObs}
          onChange={(e) => setFormObs(e.target.value)}
          maxLength={200}
          placeholder="Nota opcional (ex: consulta médica)"
          className="rounded-md border border-border px-2.5 py-1.5 text-[12px]"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={salvando || (editavelPorHorario && (!formInicio || !formFim))}
            onClick={salvar}
            className={`${buttonClass("primary", "sm")} flex-1`}
          >
            Salvar
          </button>
          <button type="button" onClick={() => setEditando(false)} className={`${buttonClass("secondary", "sm")} flex-1`}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-3 rounded-md border border-border bg-surface p-2.5">
      <span className="w-1 shrink-0 rounded-full bg-accent" />
      <div className="flex w-12 shrink-0 flex-col justify-center text-[11px] font-bold leading-tight text-muted-2">
        <span>{linha1}</span>
        {linha2 && <span>{linha2}</span>}
      </div>
      <div className="flex flex-1 items-center justify-between gap-2 border-l border-border pl-2.5">
        <div className="min-w-0">
          <span className="text-[12.5px] font-bold">Indisponível</span>
          {observacao && <p className="truncate text-[11px] text-muted">{observacao}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button type="button" aria-label="Editar bloqueio" onClick={abrirEdicao} className="text-muted-2 hover:text-accent-dark">
            ✏️
          </button>
          <button type="button" aria-label="Remover bloqueio" onClick={onRemover} className="text-muted-2 hover:text-accent-dark">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
