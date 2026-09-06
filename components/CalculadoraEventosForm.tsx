"use client";

import { useMemo, useState } from "react";
import {
  calcularEvento,
  TIPOS_CARDAPIO,
  DURACOES,
  type TipoCardapio,
  type Duracao,
} from "@/lib/calculadora-eventos";

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-wide text-muted-2">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface font-bold hover:bg-surface-alt"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full rounded-lg border border-border bg-surface-alt px-2 py-2 text-center text-[15px] font-bold outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface font-bold hover:bg-surface-alt"
        >
          +
        </button>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 px-3 py-2.5 text-left text-[12.5px] font-semibold ${
        selected ? "border-accent bg-accent-soft text-accent-dark" : "border-border text-text hover:border-border-strong"
      }`}
    >
      <div>{title}</div>
      {desc && <div className="mt-0.5 text-[11px] font-normal text-muted">{desc}</div>}
    </button>
  );
}

export default function CalculadoraEventosForm() {
  const [adultos, setAdultos] = useState(30);
  const [criancas, setCriancas] = useState(5);
  const [tipoCardapio, setTipoCardapio] = useState<TipoCardapio>("infantil");
  const [duracao, setDuracao] = useState<Duracao>("media");
  const [ambienteQuente, setAmbienteQuente] = useState(false);
  const [servirAlcool, setServirAlcool] = useState(false);
  const [percentualBebeAlcool, setPercentualBebeAlcool] = useState(50);

  const resultado = useMemo(
    () =>
      calcularEvento({
        adultos,
        criancas,
        tipoCardapio,
        duracao,
        ambienteQuente,
        servirAlcool,
        percentualBebeAlcool,
      }),
    [adultos, criancas, tipoCardapio, duracao, ambienteQuente, servirAlcool, percentualBebeAlcool]
  );

  const totalConvidados = adultos + criancas;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
      {/* PERGUNTAS */}
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Convidados adultos" value={adultos} onChange={setAdultos} />
          <NumberField label="Convidados crianças" value={criancas} onChange={setCriancas} />
        </div>

        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-muted-2">O que vai servir?</p>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_CARDAPIO.map((t) => (
              <OptionCard
                key={t.value}
                selected={tipoCardapio === t.value}
                onClick={() => setTipoCardapio(t.value)}
                title={t.label}
                desc={t.desc}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-muted-2">Duração da festa</p>
          <div className="grid grid-cols-3 gap-2">
            {DURACOES.map((d) => (
              <OptionCard key={d.value} selected={duracao === d.value} onClick={() => setDuracao(d.value)} title={d.label} />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-[12.5px] font-semibold">
          <input type="checkbox" checked={ambienteQuente} onChange={(e) => setAmbienteQuente(e.target.checked)} className="h-4 w-4" />
          Festa ao ar livre ou em dia quente
        </label>

        <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface-alt px-3 py-2.5">
          <label className="flex items-center gap-2.5 text-[12.5px] font-semibold">
            <input type="checkbox" checked={servirAlcool} onChange={(e) => setServirAlcool(e.target.checked)} className="h-4 w-4" />
            Vai servir bebida alcoólica
          </label>
          {servirAlcool && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>% dos adultos que bebem</span>
                <span className="font-bold text-text">{percentualBebeAlcool}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={percentualBebeAlcool}
                onChange={(e) => setPercentualBebeAlcool(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--color-accent)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* RESULTADO */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-[15px] font-bold">Sua lista de compras</h2>
        <p className="mt-1 text-[12px] text-muted">
          Para {totalConvidados} {totalConvidados === 1 ? "convidado" : "convidados"} ({adultos} adultos, {criancas} crianças)
        </p>

        {totalConvidados === 0 ? (
          <p className="mt-4 text-[12.5px] text-muted">Informe ao menos 1 convidado para calcular.</p>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-2.5">
              {resultado.itens.map((item) => (
                <div key={item.chave} className="rounded-lg border border-border bg-surface-alt p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icone}</span>
                      <span className="text-[12.5px] font-bold">{item.label}</span>
                    </div>
                    <span className="whitespace-nowrap font-display text-[15px] font-extrabold text-accent-dark">
                      {item.quantidade} <span className="text-[11px] font-semibold text-text">{item.unidade}</span>
                    </span>
                  </div>
                  {item.detalhe && <p className="mt-1 text-[11px] text-muted">{item.detalhe}</p>}
                  {item.nota && <p className="mt-1 text-[11px] italic text-muted-2">💡 {item.nota}</p>}
                </div>
              ))}
            </div>

            {resultado.avisos.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-note-border bg-note-bg p-3 text-[11.5px] leading-relaxed text-note-text">
                {resultado.avisos.map((a) => (
                  <p key={a}>⚠️ {a}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
