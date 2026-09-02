"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import type { Cidade, Bairro, Categoria } from "@/lib/data/geo";
import { ESTADOS } from "@/lib/estados";
import { getBairrosAction, criarBairroCustomAction } from "@/lib/actions/geo";
import { criarPedido } from "@/lib/actions/pedidos";
import { registrarCliente, type ActionState } from "@/lib/actions/auth";
import { detectContactLeak } from "@/lib/contact-filter";

const STEPS = ["Evento", "Local", "Data", "Categorias", "Orçamento", "Descrição", "Contato"];

const TIPOS_EVENTO = [
  "Aniversário infantil",
  "Debutante (15 anos)",
  "Casamento",
  "Formatura",
  "Confraternização",
  "Evento corporativo",
];

const SUGESTOES_POR_TIPO: Record<string, string[]> = {
  "Aniversário infantil": ["decoracao", "baloes", "buffet", "personagens_vivos"],
  "Debutante (15 anos)": ["buffet", "decoracao", "fotografia", "saloes"],
  Casamento: ["saloes", "decoracao", "buffet", "fotografia"],
  Formatura: ["saloes", "buffet", "fotografia"],
  Confraternização: ["buffet", "decoracao", "estacoes"],
  "Evento corporativo": ["saloes", "buffet", "fotografia"],
};

const FAIXAS: Array<{ value: "ate_700" | "700_3000" | "3000_8000" | "acima_8000"; label: string }> = [
  { value: "ate_700", label: "Até R$ 700" },
  { value: "700_3000", label: "R$ 700 – R$ 3.000" },
  { value: "3000_8000", label: "R$ 3.000 – R$ 8.000" },
  { value: "acima_8000", label: "Acima de R$ 8.000" },
];

const BAIRRO_OUTRO = "outro";

export default function PublicarPedidoWizard({
  cidades,
  categorias,
  prefill,
}: {
  cidades: Cidade[];
  categorias: Categoria[];
  prefill: { tipoEvento?: string; cidadeId?: string; dataEvento?: string };
}) {
  const [step, setStep] = useState(0);
  const [tipoEvento, setTipoEvento] = useState(prefill.tipoEvento && TIPOS_EVENTO.includes(prefill.tipoEvento) ? prefill.tipoEvento : TIPOS_EVENTO[0]);
  const [estado, setEstado] = useState(
    () => cidades.find((c) => c.id === (prefill.cidadeId ? Number(prefill.cidadeId) : undefined))?.estado ?? ""
  );
  const [cidadeId, setCidadeId] = useState<number | "">(prefill.cidadeId ? Number(prefill.cidadeId) : "");
  const [bairroId, setBairroId] = useState<number | "" | typeof BAIRRO_OUTRO>("");
  const [bairroCustomNome, setBairroCustomNome] = useState("");
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [dataEvento, setDataEvento] = useState(prefill.dataEvento ?? "");
  const [categoriaIds, setCategoriaIds] = useState<number[]>([]);
  const [categoriasAutoAplicadas, setCategoriasAutoAplicadas] = useState(false);
  const [orcamentoFaixa, setOrcamentoFaixa] = useState<"ate_700" | "700_3000" | "3000_8000" | "acima_8000">("3000_8000");
  const [descricao, setDescricao] = useState("");
  const [detalheOutros, setDetalheOutros] = useState("");
  const [nomeTemp, setNomeTemp] = useState("");
  const [telefoneTemp, setTelefoneTemp] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ pedidoId: string } | null>(null);

  // busca bairros quando a cidade muda
  useEffect(() => {
    if (!cidadeId) return;
    getBairrosAction(Number(cidadeId)).then(setBairros);
  }, [cidadeId]);

  function handleCidadeChange(value: string) {
    setCidadeId(value ? Number(value) : "");
    setBairroId("");
    setBairros([]);
  }

  // sugere categorias automaticamente conforme o tipo de evento (so uma vez, o
  // usuario pode ajustar livremente depois) - fica como effect (nao vira um
  // handler unico) porque precisa rodar tanto no valor inicial/prefill quanto
  // em cliques subsequentes no OptionCard.
  useEffect(() => {
    if (categoriasAutoAplicadas || categorias.length === 0) return;
    const slugs = SUGESTOES_POR_TIPO[tipoEvento] ?? [];
    const ids = categorias.filter((c) => slugs.includes(c.slug)).map((c) => c.id);
    if (ids.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoriaIds(ids);
      setCategoriasAutoAplicadas(true);
    }
  }, [tipoEvento, categorias, categoriasAutoAplicadas]);

  const cidadesDoEstado = useMemo(() => cidades.filter((c) => c.estado === estado), [cidades, estado]);

  function handleEstadoChange(value: string) {
    setEstado(value);
    setCidadeId("");
  }

  const leak = useMemo(() => (descricao.length > 5 ? detectContactLeak(descricao) : { blocked: false, motivos: [] }), [descricao]);
  const categoriaOutrosId = useMemo(() => categorias.find((c) => c.slug === "outros")?.id, [categorias]);
  const outrosSelecionado = categoriaOutrosId !== undefined && categoriaIds.includes(categoriaOutrosId);

  function toggleCategoria(id: number) {
    setCategoriaIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return !!tipoEvento;
      case 1:
        return !!estado && !!cidadeId && (bairroId !== BAIRRO_OUTRO || bairroCustomNome.trim().length >= 2);
      case 2:
        return !!dataEvento;
      case 3:
        return categoriaIds.length > 0 && (!outrosSelecionado || detalheOutros.trim().length >= 3);
      case 4:
        return !!orcamentoFaixa;
      case 5:
        return descricao.trim().length >= 10 && !leak.blocked;
      case 6:
        return nomeTemp.trim().length >= 2 && telefoneTemp.trim().length >= 10;
      default:
        return true;
    }
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
      orcamentoFaixa,
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
    return <Confirmacao pedidoId={resultado.pedidoId} nomeTemp={nomeTemp} telefoneTemp={telefoneTemp} />;
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-x-0 gap-y-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex w-[92px] flex-col items-center gap-1.5 relative">
            <div
              className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 text-[11.5px] font-bold ${
                i < step
                  ? "border-ok bg-ok text-white"
                  : i === step
                  ? "border-accent bg-accent text-white"
                  : "border-border-strong bg-surface text-muted-2"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <div className={`text-center text-[10.5px] font-semibold ${i === step ? "text-text" : "text-muted"}`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        {step === 0 && (
          <StepBlock title="Que tipo de evento você está planejando?">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {TIPOS_EVENTO.map((t) => (
                <OptionCard key={t} selected={tipoEvento === t} onClick={() => setTipoEvento(t)}>
                  {t}
                </OptionCard>
              ))}
            </div>
          </StepBlock>
        )}

        {step === 1 && (
          <StepBlock title="Onde vai ser a festa?">
            <div className="flex flex-col gap-3">
              <select
                value={estado}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="rounded-md border border-border px-3 py-2.5 text-sm"
              >
                <option value="">Selecione o estado</option>
                {ESTADOS.map((e) => (
                  <option key={e.sigla} value={e.sigla}>
                    {e.nome}
                  </option>
                ))}
              </select>
              <select
                value={cidadeId}
                onChange={(e) => handleCidadeChange(e.target.value)}
                disabled={!estado}
                className="rounded-md border border-border px-3 py-2.5 text-sm disabled:opacity-50"
              >
                <option value="">{estado ? "Selecione a cidade" : "Escolha o estado primeiro"}</option>
                {cidadesDoEstado.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {bairros.length > 0 && (
                <select
                  value={bairroId}
                  onChange={(e) =>
                    setBairroId(e.target.value === BAIRRO_OUTRO ? BAIRRO_OUTRO : e.target.value ? Number(e.target.value) : "")
                  }
                  className="rounded-md border border-border px-3 py-2.5 text-sm"
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
                <input
                  value={bairroCustomNome}
                  onChange={(e) => setBairroCustomNome(e.target.value)}
                  placeholder="Digite o nome do bairro"
                  className="rounded-md border border-border px-3 py-2.5 text-sm"
                />
              )}
            </div>
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock title="Quando vai ser?">
            <input
              type="date"
              value={dataEvento}
              onChange={(e) => setDataEvento(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
            />
          </StepBlock>
        )}

        {step === 3 && (
          <StepBlock title="Quais serviços você precisa?" hint="sugerido automaticamente pelo tipo de evento — ajuste à vontade">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {categorias.map((c) => (
                <OptionCard key={c.id} selected={categoriaIds.includes(c.id)} onClick={() => toggleCategoria(c.id)}>
                  {c.nome}
                </OptionCard>
              ))}
            </div>
            {outrosSelecionado && (
              <div className="mt-3">
                <label className="text-[11px] font-bold uppercase text-muted-2">Detalhe o serviço &quot;Outros&quot;</label>
                <textarea
                  value={detalheOutros}
                  onChange={(e) => setDetalheOutros(e.target.value)}
                  rows={2}
                  placeholder="Ex: Cerimonial completo com mestre de cerimônias"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-sm"
                />
              </div>
            )}
          </StepBlock>
        )}

        {step === 4 && (
          <StepBlock title="Qual sua faixa de orçamento?">
            <div className="flex flex-wrap gap-2">
              {FAIXAS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setOrcamentoFaixa(f.value)}
                  className={`flex-1 min-w-[130px] rounded-full border-2 px-3 py-2.5 text-center text-[12.5px] font-bold ${
                    orcamentoFaixa === f.value ? "border-accent bg-accent-soft text-accent-dark" : "border-border text-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </StepBlock>
        )}

        {step === 5 && (
          <StepBlock title="Descreva o que você imagina">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              placeholder="Ex: Festa temática Frozen para minha filha, com decoração azul e branca, mesa de doces para 40 convidados..."
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
            />
            {leak.blocked && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-note-border bg-note-bg p-3 text-[12px] text-note-text">
                ⚠️ Detectamos uma possível informação de contato (telefone ou e-mail) no texto. Remova esse trecho — o
                contato é liberado automaticamente quando uma empresa demonstra interesse no seu pedido.
              </div>
            )}
          </StepBlock>
        )}

        {step === 6 && (
          <StepBlock title="Como podemos te avisar?">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={nomeTemp}
                onChange={(e) => setNomeTemp(e.target.value)}
                placeholder="Seu nome"
                className="rounded-md border border-border px-3 py-2.5 text-sm"
              />
              <input
                value={telefoneTemp}
                onChange={(e) => setTelefoneTemp(e.target.value)}
                placeholder="Telefone com DDD"
                className="rounded-md border border-border px-3 py-2.5 text-sm"
              />
            </div>
            <p className="mt-2 text-[11.5px] text-muted">
              Você ainda não precisa criar conta — a conta é opcional e serve pra você acompanhar quem respondeu.
            </p>
            {serverError && <p className="mt-2 text-[12.5px] font-semibold text-accent-dark">{serverError}</p>}
          </StepBlock>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={buttonClass("secondary")}
          >
            ← Voltar
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" disabled={!canAdvance()} onClick={() => setStep((s) => s + 1)} className={buttonClass("primary")}>
              Continuar →
            </button>
          ) : (
            <button type="button" disabled={!canAdvance() || submitting} onClick={handleSubmit} className={buttonClass("primary")}>
              {submitting ? "Publicando..." : "Publicar pedido"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBlock({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-[14.5px] font-bold">
        {title} {hint && <span className="font-normal text-[11.5px] text-muted">({hint})</span>}
      </h4>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 px-2.5 py-3 text-center text-[12.5px] font-semibold ${
        selected ? "border-accent bg-accent-soft text-accent-dark" : "border-border text-text hover:border-border-strong"
      }`}
    >
      {children}
    </button>
  );
}

function Confirmacao({ pedidoId, nomeTemp, telefoneTemp }: { pedidoId: string; nomeTemp: string; telefoneTemp: string }) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registrarCliente, undefined);
  const [, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center">
      <div className="mb-2 text-3xl">🎉</div>
      <h2 className="text-lg font-extrabold">Pedido publicado!</h2>
      <p className="mt-1 text-sm text-muted">
        As empresas da sua região já podem ver seu pedido. Crie uma conta grátis pra acompanhar quem demonstrou interesse.
      </p>

      {!showForm ? (
        <div className="mt-5 flex flex-col items-center gap-2.5">
          <button type="button" onClick={() => setShowForm(true)} className={buttonClass("primary")}>
            Criar conta grátis agora
          </button>
          <Link href="/" className="text-[12.5px] font-semibold text-muted underline">
            Continuar sem conta por enquanto
          </Link>
        </div>
      ) : (
        <form
          action={(fd) => startTransition(() => formAction(fd))}
          className="mx-auto mt-5 flex max-w-sm flex-col gap-2.5 text-left"
        >
          <input type="hidden" name="pedidoId" value={pedidoId} />
          <input type="hidden" name="nome" value={nomeTemp} />
          <input type="hidden" name="telefone" value={telefoneTemp} />
          <label className="text-[11px] font-bold uppercase text-muted-2">E-mail</label>
          <input name="email" type="email" required className="rounded-md border border-border px-3 py-2 text-sm" />
          <label className="text-[11px] font-bold uppercase text-muted-2">Crie uma senha</label>
          <input name="senha" type="password" required minLength={6} className="rounded-md border border-border px-3 py-2 text-sm" />
          {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "Criando conta..." : "Criar conta e ver meus pedidos"}
          </button>
        </form>
      )}
    </div>
  );
}
