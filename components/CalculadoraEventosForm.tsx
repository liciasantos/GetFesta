"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { buttonClass } from "@/components/ui";
import { calcularEvento, TIPOS_CARDAPIO, DURACOES, type TipoCardapio, type Duracao } from "@/lib/calculadora-eventos";

/** Ícone de traço de cada item da lista de compras (lib/calculadora-eventos.ts
 * ainda manda um emoji em `icone`, ignorado aqui pra manter o visual do site). */
const ICONE_ITEM: Record<string, IconName> = {
  refrigerante: "copo",
  cerveja: "cerveja",
  docinhos: "doce",
  salgados: "salgado",
  bolo: "bolo",
  carne: "carne",
  carvao: "fogo",
  pao_de_alho: "pao",
  gelo: "gelo",
  copos: "taca",
  guardanapos: "guardanapo",
};

export type ListaParaCalculadora = { id: string; titulo: string; adultos: number; criancas: number };

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Menos ${label.toLowerCase()}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface text-lg font-bold hover:bg-surface-alt"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface-alt/60 px-2 text-center font-display text-[18px] font-extrabold outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Mais ${label.toLowerCase()}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface text-lg font-bold hover:bg-surface-alt"
        >
          +
        </button>
      </div>
    </div>
  );
}

function OptionCard({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
        selected ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <span className={`block text-[13.5px] font-bold ${selected ? "text-accent-dark" : ""}`}>{title}</span>
      {desc && <span className="mt-0.5 block text-[12px] leading-snug text-muted">{desc}</span>}
    </button>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-2 text-[14px] font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-text text-[12px] font-extrabold text-white">{n}</span>
        {titulo}
      </p>
      {children}
    </div>
  );
}

function Alternar({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-[13.5px] font-semibold">
      {children}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-6 w-10 shrink-0 rounded-full bg-border-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-ok peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
      />
    </label>
  );
}

export default function CalculadoraEventosForm({
  listas = [],
  listaInicial,
}: {
  /** listas de convidados do cliente logado, pra preencher os números com um toque */
  listas?: ListaParaCalculadora[];
  listaInicial?: string;
}) {
  const inicial = listas.find((l) => l.id === listaInicial);
  const [adultos, setAdultos] = useState(inicial?.adultos ?? 30);
  const [criancas, setCriancas] = useState(inicial?.criancas ?? 5);
  const [listaUsada, setListaUsada] = useState<string | null>(inicial?.id ?? null);
  const [tipoCardapio, setTipoCardapio] = useState<TipoCardapio>("infantil");
  const [duracao, setDuracao] = useState<Duracao>("media");
  const [ambienteQuente, setAmbienteQuente] = useState(false);
  const [servirAlcool, setServirAlcool] = useState(false);
  const [percentualBebeAlcool, setPercentualBebeAlcool] = useState(50);
  const [copiado, setCopiado] = useState(false);

  const resultado = useMemo(
    () => calcularEvento({ adultos, criancas, tipoCardapio, duracao, ambienteQuente, servirAlcool, percentualBebeAlcool }),
    [adultos, criancas, tipoCardapio, duracao, ambienteQuente, servirAlcool, percentualBebeAlcool]
  );

  const total = adultos + criancas;
  const cardapio = TIPOS_CARDAPIO.find((t) => t.value === tipoCardapio)!;
  const tempo = DURACOES.find((d) => d.value === duracao)!;

  function usarLista(l: ListaParaCalculadora) {
    setAdultos(l.adultos);
    setCriancas(l.criancas);
    setListaUsada(l.id);
  }

  function textoLista() {
    return [
      `Lista de compras da festa (${total} convidados: ${adultos} adultos, ${criancas} crianças)`,
      `${cardapio.label} · ${tempo.label}`,
      "",
      ...resultado.itens.map((i) => `• ${i.label}: ${i.quantidade} ${i.unidade}`),
      "",
      "Calculado na GetFesta (já com 10% de margem)",
    ].join("\n");
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoLista());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sem permissão de clipboard - o botão do WhatsApp continua funcionando
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* PERGUNTAS */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <Passo n={1} titulo="Quantas pessoas vão?">
          {listas.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[12px] text-muted">Usar os convidados previstos da sua lista:</p>
              <div className="flex flex-wrap gap-1.5">
                {listas.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => usarLista(l)}
                    aria-pressed={listaUsada === l.id}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold ${
                      listaUsada === l.id ? "border-ok bg-ok-soft text-ok" : "border-border bg-surface hover:border-border-strong"
                    }`}
                  >
                    <Icon name={listaUsada === l.id ? "check" : "users"} className="h-3.5 w-3.5" />
                    {l.titulo} <span className="font-semibold opacity-70">· {l.adultos + l.criancas}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Adultos"
              value={adultos}
              onChange={(v) => {
                setAdultos(v);
                setListaUsada(null);
              }}
            />
            <NumberField
              label="Crianças"
              value={criancas}
              onChange={(v) => {
                setCriancas(v);
                setListaUsada(null);
              }}
            />
          </div>
        </Passo>

        <Passo n={2} titulo="O que vai servir?">
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_CARDAPIO.map((t) => (
              <OptionCard key={t.value} selected={tipoCardapio === t.value} onClick={() => setTipoCardapio(t.value)} title={t.label} desc={t.desc} />
            ))}
          </div>
        </Passo>

        <Passo n={3} titulo="Quanto tempo de festa?">
          <div className="grid grid-cols-3 gap-2">
            {DURACOES.map((d) => (
              <OptionCard key={d.value} selected={duracao === d.value} onClick={() => setDuracao(d.value)} title={d.label} />
            ))}
          </div>
        </Passo>

        <Passo n={4} titulo="Detalhes">
          <div className="flex flex-col gap-2">
            <Alternar checked={ambienteQuente} onChange={setAmbienteQuente}>
              Festa ao ar livre ou em dia quente
            </Alternar>
            <Alternar checked={servirAlcool} onChange={setServirAlcool}>
              Vai servir bebida alcoólica
            </Alternar>
            {servirAlcool && (
              <div className="rounded-xl bg-surface-alt/60 px-3.5 py-3">
                <div className="flex items-center justify-between text-[13px] text-muted">
                  <span>Adultos que bebem</span>
                  <span className="font-bold text-text">{percentualBebeAlcool}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={percentualBebeAlcool}
                  onChange={(e) => setPercentualBebeAlcool(Number(e.target.value))}
                  aria-label="Porcentagem de adultos que bebem"
                  className="mt-2 w-full accent-[var(--color-accent)]"
                />
              </div>
            )}
          </div>
        </Passo>
      </div>

      {/* RESULTADO */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface lg:sticky lg:top-6" aria-live="polite">
        <div className="bg-text p-4 text-white sm:p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
            <Icon name="cart" className="h-3.5 w-3.5" /> Sua lista de compras
          </p>
          <p className="mt-1.5">
            <span className="font-display text-[30px] font-extrabold leading-none">{total}</span>
            <span className="ml-1.5 text-[14px] text-white/75">
              {total === 1 ? "convidado" : "convidados"} · {adultos} adultos, {criancas} crianças
            </span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold">{cardapio.label}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold">{tempo.label}</span>
          </div>
        </div>

        {total === 0 ? (
          <p className="p-5 text-[13.5px] text-muted">Informe ao menos 1 convidado para calcular.</p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {resultado.itens.map((item) => (
                <li key={item.chave} className="flex gap-3 px-4 py-3 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                    <Icon name={ICONE_ITEM[item.chave] ?? "cart"} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] font-bold">{item.label}</span>
                      <span className="shrink-0 text-right">
                        <span className="font-display text-[18px] font-extrabold text-accent-dark">{item.quantidade}</span>
                        <span className="ml-1 text-[12px] font-semibold text-muted">{item.unidade}</span>
                      </span>
                    </div>
                    {item.detalhe && <p className="mt-0.5 text-[12.5px] text-muted">{item.detalhe}</p>}
                    {item.nota && (
                      <p className="mt-1 flex gap-1 text-[12px] text-muted-2">
                        <Icon name="lightbulb" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {item.nota}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {resultado.avisos.length > 0 && (
              <div className="mx-4 mb-4 flex flex-col gap-1.5 rounded-xl border border-note-border bg-note-bg p-3 text-[12.5px] leading-relaxed text-note-text sm:mx-5">
                {resultado.avisos.map((a) => (
                  <p key={a} className="flex gap-1.5">
                    <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {a}
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 border-t border-border p-4 sm:px-5">
              <button type="button" onClick={copiar} className={buttonClass("secondary", "md")}>
                <Icon name={copiado ? "check" : "copy"} className="h-4 w-4" /> {copiado ? "Copiada" : "Copiar lista"}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(textoLista())}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("whatsapp", "md")}
              >
                <Icon name="chat" className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
