"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/Icon";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import type { Cidade, Bairro, Categoria } from "@/lib/data/geo";
import { ESTADOS, agruparCidadesPorMacrorregiao } from "@/lib/estados";
import { getBairrosAction, criarBairroCustomAction } from "@/lib/actions/geo";
import { criarPedido } from "@/lib/actions/pedidos";
import { registrarCliente, type ActionState } from "@/lib/actions/auth";
import { detectContactLeak } from "@/lib/contact-filter";

/** 4 passos (antes eram 7 telas): o tipo de evento avança sozinho ao tocar;
 * data e local dividem uma tela; serviços e orçamento outra; e a descrição
 * fica junto do contato - que já vem preenchido pra quem está logado. */
const STEPS = ["Evento", "Data e local", "Serviços", "Detalhes"];

const TIPOS_EVENTO: Array<{ nome: string; icon: IconName }> = [
  { nome: "Aniversário infantil", icon: "bolo" },
  { nome: "Debutante (15 anos)", icon: "coroa" },
  { nome: "Casamento", icon: "alianca" },
  { nome: "Formatura", icon: "capelo" },
  { nome: "Confraternização", icon: "taca" },
  { nome: "Evento corporativo", icon: "maleta" },
];

const SUGESTOES_POR_TIPO: Record<string, string[]> = {
  "Aniversário infantil": ["decoracao", "baloes", "buffet", "personagens_vivos"],
  "Debutante (15 anos)": ["buffet", "decoracao", "fotografia", "saloes"],
  Casamento: ["saloes", "decoracao", "buffet", "fotografia"],
  Formatura: ["saloes", "buffet", "fotografia"],
  Confraternização: ["buffet", "decoracao", "estacoes"],
  "Evento corporativo": ["saloes", "buffet", "fotografia"],
};

type Faixa = "ate_700" | "700_3000" | "3000_8000" | "acima_8000";
const FAIXAS: Array<{ value: Faixa; label: string; dica: string }> = [
  { value: "ate_700", label: "Até R$ 700", dica: "Algo simples" },
  { value: "700_3000", label: "R$ 700 – 3 mil", dica: "Festa pequena/média" },
  { value: "3000_8000", label: "R$ 3 – 8 mil", dica: "Festa completa" },
  { value: "acima_8000", label: "Acima de R$ 8 mil", dica: "Evento grande" },
];

const BAIRRO_OUTRO = "outro";
const campo = "w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base outline-none focus:border-accent sm:text-[14px]";

function formatarData(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function PublicarPedidoWizard({
  cidades,
  categorias,
  prefill,
  contato,
}: {
  cidades: Cidade[];
  categorias: Categoria[];
  prefill: { tipoEvento?: string; cidadeId?: string; dataEvento?: string };
  /** cliente logado: nome e telefone do cadastro (o passo de contato só confirma) */
  contato?: { nome: string; telefone: string } | null;
}) {
  const tipoPrefill = TIPOS_EVENTO.some((t) => t.nome === prefill.tipoEvento) ? prefill.tipoEvento! : "";
  // vindo da busca da home com tudo preenchido, já começa nos serviços
  const passoInicial = tipoPrefill ? (prefill.cidadeId && prefill.dataEvento ? 2 : 1) : 0;

  const [step, setStep] = useState(passoInicial);
  const [tipoEvento, setTipoEvento] = useState(tipoPrefill);
  const [estado, setEstado] = useState(
    () => cidades.find((c) => c.id === (prefill.cidadeId ? Number(prefill.cidadeId) : undefined))?.estado ?? ""
  );
  const [cidadeId, setCidadeId] = useState<number | "">(prefill.cidadeId ? Number(prefill.cidadeId) : "");
  const [bairroId, setBairroId] = useState<number | "" | typeof BAIRRO_OUTRO>("");
  const [bairroCustomNome, setBairroCustomNome] = useState("");
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [dataEvento, setDataEvento] = useState(prefill.dataEvento ?? "");
  const sugeridos = (tipo: string) => {
    const slugs = SUGESTOES_POR_TIPO[tipo] ?? [];
    return categorias.filter((c) => slugs.includes(c.slug)).map((c) => c.id);
  };
  const [categoriaIds, setCategoriaIds] = useState<number[]>(() => (tipoPrefill ? sugeridos(tipoPrefill) : []));
  // depois que a pessoa mexe nos serviços, trocar o tipo não sobrescreve mais
  const [servicosMexidos, setServicosMexidos] = useState(false);
  const [orcamentoFaixa, setOrcamentoFaixa] = useState<Faixa | "">("");
  const [descricao, setDescricao] = useState("");
  const [detalheOutros, setDetalheOutros] = useState("");
  const [nomeTemp, setNomeTemp] = useState(contato?.nome ?? "");
  const [telefoneTemp, setTelefoneTemp] = useState(contato?.telefone ?? "");
  const [editandoContato, setEditandoContato] = useState(!contato || !contato.telefone);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ pedidoId: string } | null>(null);
  const [hoje] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()));

  useEffect(() => {
    if (!cidadeId) return;
    getBairrosAction(Number(cidadeId)).then(setBairros);
  }, [cidadeId]);

  const cidadesDoEstado = useMemo(() => cidades.filter((c) => c.estado === estado), [cidades, estado]);
  const cidadesPorMacrorregiao = useMemo(() => agruparCidadesPorMacrorregiao(cidadesDoEstado), [cidadesDoEstado]);
  const leak = useMemo(() => (descricao.length > 5 ? detectContactLeak(descricao) : { blocked: false, motivos: [] }), [descricao]);
  const categoriaOutrosId = useMemo(() => categorias.find((c) => c.slug === "outros")?.id, [categorias]);
  const outrosSelecionado = categoriaOutrosId !== undefined && categoriaIds.includes(categoriaOutrosId);
  const cidadeNome = cidades.find((c) => c.id === cidadeId)?.nome;
  const bairroNome = bairroId === BAIRRO_OUTRO ? bairroCustomNome : bairros.find((b) => b.id === bairroId)?.nome;

  function escolherTipo(t: string) {
    setTipoEvento(t);
    if (!servicosMexidos) setCategoriaIds(sugeridos(t));
    irPara(1);
  }

  function toggleCategoria(id: number) {
    setServicosMexidos(true);
    setCategoriaIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  const passoOk = [
    !!tipoEvento,
    !!dataEvento && dataEvento >= hoje && !!estado && !!cidadeId && (bairroId !== BAIRRO_OUTRO || bairroCustomNome.trim().length >= 2),
    categoriaIds.length > 0 && (!outrosSelecionado || detalheOutros.trim().length >= 3) && !!orcamentoFaixa,
    descricao.trim().length >= 10 && !leak.blocked && nomeTemp.trim().length >= 2 && telefoneTemp.replace(/\D/g, "").length >= 10,
  ];

  function irPara(n: number) {
    setStep(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setServerError(null);

    let resolvedBairroId: number | null = bairroId && bairroId !== BAIRRO_OUTRO ? Number(bairroId) : null;
    if (bairroId === BAIRRO_OUTRO && cidadeId) {
      const bairro = await criarBairroCustomAction(Number(cidadeId), bairroCustomNome.trim());
      if (!bairro) {
        setSubmitting(false);
        setServerError("Não foi possível salvar esse bairro, tente novamente.");
        return;
      }
      resolvedBairroId = bairro.id;
    }

    const res = await criarPedido({
      nomeTemp,
      telefoneTemp,
      tipoEvento,
      dataEvento,
      cidadeId: Number(cidadeId),
      bairroId: resolvedBairroId,
      categoriaIds,
      orcamentoFaixa: orcamentoFaixa as Faixa,
      descricao,
      detalheOutrosServico: outrosSelecionado ? detalheOutros.trim() : null,
    });
    setSubmitting(false);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    if (res.pedidoId) setResultado({ pedidoId: res.pedidoId });
  }

  if (resultado) {
    return <Confirmacao pedidoId={resultado.pedidoId} nomeTemp={nomeTemp} telefoneTemp={telefoneTemp} logado={!!contato} />;
  }

  const ultimo = step === STEPS.length - 1;
  const servicosEscolhidos = categorias.filter((c) => categoriaIds.includes(c.id)).map((c) => c.nome);
  const faixa = FAIXAS.find((f) => f.value === orcamentoFaixa);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
      <div className="min-w-0">
        {/* PROGRESSO */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-bold">
              Passo {step + 1} de {STEPS.length} <span className="font-semibold text-muted">· {STEPS[step]}</span>
            </span>
            {step > 0 && (
              <button type="button" onClick={() => irPara(step - 1)} className="font-bold text-muted hover:text-text">
                ← Voltar
              </button>
            )}
          </div>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent-strong" : "bg-border"}`} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
          {step === 0 && (
            <Passo titulo="Que tipo de festa você está planejando?">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {TIPOS_EVENTO.map((t) => {
                  const sel = tipoEvento === t.nome;
                  return (
                    <button
                      key={t.nome}
                      type="button"
                      onClick={() => escolherTipo(t.nome)}
                      aria-pressed={sel}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-4 text-center transition-colors ${
                        sel ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong hover:bg-surface-alt/50"
                      }`}
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${sel ? "bg-accent-strong text-white" : "bg-accent-soft text-accent-dark"}`}>
                        <Icon name={t.icon} className="h-6 w-6" />
                      </span>
                      <span className={`text-[13.5px] font-bold leading-tight ${sel ? "text-accent-dark" : ""}`}>{t.nome}</span>
                    </button>
                  );
                })}
              </div>
            </Passo>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <Passo titulo="Quando vai ser?">
                <input
                  type="date"
                  value={dataEvento}
                  min={hoje}
                  onChange={(e) => setDataEvento(e.target.value)}
                  aria-label="Data da festa"
                  className={campo}
                />
                {dataEvento && dataEvento < hoje && <p className="mt-1.5 text-[12.5px] font-semibold text-accent-dark">Escolha uma data a partir de hoje.</p>}
              </Passo>
              <Passo titulo="Onde vai ser?">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[180px_1fr]">
                  <select value={estado} onChange={(e) => { setEstado(e.target.value); setCidadeId(""); setBairroId(""); setBairros([]); }} aria-label="Estado" className={campo}>
                    <option value="">Estado</option>
                    {ESTADOS.map((e) => (
                      <option key={e.sigla} value={e.sigla}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={cidadeId}
                    onChange={(e) => { setCidadeId(e.target.value ? Number(e.target.value) : ""); setBairroId(""); setBairros([]); }}
                    disabled={!estado}
                    aria-label="Cidade"
                    className={`${campo} disabled:opacity-50`}
                  >
                    <option value="">{estado ? "Cidade" : "Escolha o estado primeiro"}</option>
                    {[...cidadesPorMacrorregiao.entries()].map(([regiao, lista]) => (
                      <optgroup key={regiao} label={regiao}>
                        {lista.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {bairros.length > 0 && (
                  <select
                    value={bairroId}
                    onChange={(e) => setBairroId(e.target.value === BAIRRO_OUTRO ? BAIRRO_OUTRO : e.target.value ? Number(e.target.value) : "")}
                    aria-label="Bairro"
                    className={`${campo} mt-2.5`}
                  >
                    <option value="">Bairro (opcional)</option>
                    {bairros.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome}
                      </option>
                    ))}
                    <option value={BAIRRO_OUTRO}>Outro (não está na lista)</option>
                  </select>
                )}
                {bairroId === BAIRRO_OUTRO && (
                  <input value={bairroCustomNome} onChange={(e) => setBairroCustomNome(e.target.value)} placeholder="Nome do bairro" className={`${campo} mt-2.5`} />
                )}
              </Passo>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <Passo titulo="Quais serviços você precisa?" dica={tipoEvento ? `Já marcamos os mais pedidos para ${tipoEvento.toLowerCase()} — ajuste à vontade.` : undefined}>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => {
                    const sel = categoriaIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategoria(c.id)}
                        aria-pressed={sel}
                        className={`flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-[13px] font-bold transition-colors ${
                          sel ? "border-accent bg-accent-soft text-accent-dark" : "border-border text-text hover:border-border-strong"
                        }`}
                      >
                        {sel && <Icon name="check" className="h-3.5 w-3.5" />}
                        {c.nome}
                      </button>
                    );
                  })}
                </div>
                {outrosSelecionado && (
                  <textarea
                    value={detalheOutros}
                    onChange={(e) => setDetalheOutros(e.target.value)}
                    rows={2}
                    placeholder='Conte qual é o serviço "Outros" (ex.: mestre de cerimônias)'
                    className={`${campo} mt-3`}
                  />
                )}
              </Passo>
              <Passo titulo="Quanto pretende investir?" dica="Ajuda as empresas a mandarem propostas que cabem no seu bolso.">
                <div className="grid grid-cols-2 gap-2.5">
                  {FAIXAS.map((f) => {
                    const sel = orcamentoFaixa === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setOrcamentoFaixa(f.value)}
                        aria-pressed={sel}
                        className={`rounded-2xl border-2 px-3 py-3 text-left transition-colors ${
                          sel ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong"
                        }`}
                      >
                        <span className={`block text-[14px] font-extrabold ${sel ? "text-accent-dark" : ""}`}>{f.label}</span>
                        <span className="block text-[12px] text-muted">{f.dica}</span>
                      </button>
                    );
                  })}
                </div>
              </Passo>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <Passo titulo="Conte como você imagina a festa" dica="Tema, número de convidados, o que não pode faltar...">
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={5}
                  placeholder="Ex.: Festa tema Frozen para minha filha de 6 anos, decoração azul e branca, mesa de doces para 40 convidados."
                  className={campo}
                />
                <div className="mt-1.5 flex justify-between text-[12px] text-muted">
                  <span>Não coloque telefone nem e-mail aqui — o contato é liberado quando uma empresa se interessa.</span>
                  {descricao.trim().length < 10 && <span className="shrink-0 pl-2">mín. 10 letras</span>}
                </div>
                {leak.blocked && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-note-border bg-note-bg p-3 text-[12.5px] text-note-text">
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                    Parece que tem um telefone ou e-mail no texto. Remova esse trecho — o contato é liberado automaticamente quando uma empresa demonstra
                    interesse.
                  </div>
                )}
              </Passo>

              <Passo titulo="Onde as empresas te encontram?">
                {editandoContato ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input value={nomeTemp} onChange={(e) => setNomeTemp(e.target.value)} placeholder="Seu nome" autoComplete="name" className={campo} />
                    <input
                      value={telefoneTemp}
                      onChange={(e) => setTelefoneTemp(e.target.value)}
                      placeholder="WhatsApp com DDD"
                      inputMode="tel"
                      autoComplete="tel"
                      className={campo}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-surface-alt/70 p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                      <Icon name="chat" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold">{nomeTemp}</p>
                      <p className="text-[13px] text-muted">{telefoneTemp}</p>
                    </div>
                    <button type="button" onClick={() => setEditandoContato(true)} className="shrink-0 text-[13px] font-bold text-accent-dark hover:underline">
                      Alterar
                    </button>
                  </div>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
                  <Icon name="lock" className="h-3.5 w-3.5" /> Seu telefone só aparece para a empresa que demonstrar interesse.
                </p>
              </Passo>
              {serverError && <p className="text-[13px] font-semibold text-accent-dark">{serverError}</p>}
            </div>
          )}

          {/* AÇÃO: fixa no rodapé no celular, dentro do cartão no resto */}
          {step > 0 && (
            <div data-barra-inferior className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              {ultimo ? (
                <button type="button" disabled={!passoOk[3] || submitting} onClick={handleSubmit} className={`${buttonClass("primary", "lg")} w-full`}>
                  {submitting ? "Publicando..." : "Publicar pedido grátis"}
                </button>
              ) : (
                <button type="button" disabled={!passoOk[step]} onClick={() => irPara(step + 1)} className={`${buttonClass("primary", "lg")} w-full`}>
                  Continuar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RESUMO (computador) */}
      <aside className="sticky top-6 mt-0 hidden rounded-2xl border border-border bg-surface p-5 lg:block">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-2">Seu pedido</p>
        <dl className="mt-3 flex flex-col gap-3 text-[13.5px]">
          <Resumo icon="party" rotulo="Evento" valor={tipoEvento} onEditar={step > 0 ? () => irPara(0) : undefined} />
          <Resumo icon="calendar" rotulo="Data" valor={formatarData(dataEvento)} onEditar={step > 1 ? () => irPara(1) : undefined} />
          <Resumo icon="pin" rotulo="Local" valor={[bairroNome, cidadeNome].filter(Boolean).join(", ")} onEditar={step > 1 ? () => irPara(1) : undefined} />
          <Resumo icon="sparkles" rotulo="Serviços" valor={servicosEscolhidos.join(", ")} onEditar={step > 2 ? () => irPara(2) : undefined} />
          <Resumo icon="tag" rotulo="Orçamento" valor={faixa?.label ?? ""} onEditar={step > 2 ? () => irPara(2) : undefined} />
        </dl>
      </aside>
    </div>
  );
}

function Passo({ titulo, dica, children }: { titulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[17px] font-extrabold leading-snug">{titulo}</h2>
      {dica && <p className="mt-0.5 text-[13px] text-muted">{dica}</p>}
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

function Resumo({ icon, rotulo, valor, onEditar }: { icon: IconName; rotulo: string; valor: string; onEditar?: () => void }) {
  return (
    <div className="flex gap-2.5">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${valor ? "bg-accent-soft text-accent-dark" : "bg-surface-alt text-muted-2"}`}>
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11.5px] font-semibold text-muted">{rotulo}</dt>
        <dd className={valor ? "font-bold" : "text-muted-2"}>{valor || "—"}</dd>
      </div>
      {onEditar && valor && (
        <button type="button" onClick={onEditar} className="self-start text-[12px] font-bold text-accent-dark hover:underline">
          Editar
        </button>
      )}
    </div>
  );
}

function Confirmacao({ pedidoId, nomeTemp, telefoneTemp, logado }: { pedidoId: string; nomeTemp: string; telefoneTemp: string; logado: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registrarCliente, undefined);
  const [, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok">
        <Icon name="check" className="h-8 w-8" />
      </span>
      <h2 className="mt-4 font-display text-[22px] font-extrabold">Pedido publicado!</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">
        As empresas da sua região já podem ver seu pedido. Quem se interessar aparece {logado ? "no seu painel" : "pra você"} com o botão do WhatsApp.
      </p>

      {logado ? (
        <Link href="/meus-pedidos" className={`${buttonClass("primary", "lg")} mt-6`}>
          Acompanhar no meu painel
        </Link>
      ) : !showForm ? (
        <div className="mt-6 flex flex-col items-center gap-2.5">
          <button type="button" onClick={() => setShowForm(true)} className={buttonClass("primary", "lg")}>
            Criar conta grátis para acompanhar
          </button>
          <Link href="/" className="text-[13px] font-semibold text-muted underline">
            Continuar sem conta por enquanto
          </Link>
        </div>
      ) : (
        <form action={(fd) => startTransition(() => formAction(fd))} className="mx-auto mt-6 flex max-w-sm flex-col gap-2.5 text-left">
          <input type="hidden" name="pedidoId" value={pedidoId} />
          <input type="hidden" name="nome" value={nomeTemp} />
          <input type="hidden" name="telefone" value={telefoneTemp} />
          <label className="text-[11px] font-bold uppercase text-muted-2">E-mail</label>
          <input name="email" type="email" required className={campo} />
          <label className="text-[11px] font-bold uppercase text-muted-2">Crie uma senha</label>
          <input name="senha" type="password" required minLength={6} className={campo} />
          {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
          <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
            {pending ? "Criando conta..." : "Criar conta e ver meus pedidos"}
          </button>
        </form>
      )}
    </div>
  );
}
