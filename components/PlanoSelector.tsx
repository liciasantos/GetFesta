"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { alterarPlanoEmpresa } from "@/lib/actions/perfil";
import { buttonClass } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { PlanoEmpresa, PlanoPeriodoEmpresa } from "@/lib/data/painel";

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Step = "lista" | "confirmarGratis" | "periodo" | "sucesso";

export default function PlanoSelector({
  planos,
  planoAtualId,
  periodos,
  whatsapp,
  nomeFantasia,
}: {
  planos: PlanoEmpresa[];
  planoAtualId: number | null;
  periodos: PlanoPeriodoEmpresa[];
  whatsapp: string;
  nomeFantasia: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("lista");
  const [planoEscolhido, setPlanoEscolhido] = useState<PlanoEmpresa | null>(null);
  const [periodoEscolhido, setPeriodoEscolhido] = useState<PlanoPeriodoEmpresa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // veio de "?plano=ID" (clicou num plano na home, ja logado como empresa, ou
  // acabou de se cadastrar com um plano pago em mente) - abre direto na etapa
  // certa em vez de fazer a pessoa clicar em "Alterar plano" de novo.
  useEffect(() => {
    const planoParam = searchParams.get("plano");
    if (!planoParam) return;
    const mesesParam = searchParams.get("meses");
    const plano = planos.find((p) => p.id === Number(planoParam));
    router.replace(pathname, { scroll: false });
    if (!plano || plano.id === planoAtualId) return;
    setOpen(true);
    if (Number(plano.valor_mensal) === 0) {
      setPlanoEscolhido(plano);
      setStep("confirmarGratis");
    } else {
      setPlanoEscolhido(plano);
      const periodosDoPlano = periodos.filter((pp) => pp.plano_id === plano.id);
      const periodoPreSelecionado = mesesParam
        ? periodosDoPlano.find((pp) => pp.meses === Number(mesesParam))
        : undefined;
      setPeriodoEscolhido(periodoPreSelecionado ?? periodosDoPlano[0] ?? null);
      setStep("periodo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setOpen(false);
    setStep("lista");
    setPlanoEscolhido(null);
    setPeriodoEscolhido(null);
    setError(null);
  }

  function escolherPlano(p: PlanoEmpresa) {
    setError(null);
    setPlanoEscolhido(p);
    if (Number(p.valor_mensal) === 0) {
      setStep("confirmarGratis");
    } else {
      setPeriodoEscolhido(periodos.find((pp) => pp.plano_id === p.id) ?? null);
      setStep("periodo");
    }
  }

  function confirmarGratis() {
    if (!planoEscolhido) return;
    setError(null);
    startTransition(async () => {
      const res = await alterarPlanoEmpresa(planoEscolhido.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      reset();
      router.refresh();
    });
  }

  function confirmarPago() {
    if (!planoEscolhido || !periodoEscolhido) return;
    setError(null);
    startTransition(async () => {
      const res = await alterarPlanoEmpresa(planoEscolhido.id, periodoEscolhido.meses);
      if (res.error) {
        setError(res.error);
        return;
      }
      setStep("sucesso");
    });
  }

  const periodosDoPlano = planoEscolhido ? periodos.filter((p) => p.plano_id === planoEscolhido.id) : [];

  const mensagemWhatsApp =
    planoEscolhido && periodoEscolhido
      ? `Olá! Sou ${nomeFantasia} e quero contratar o plano ${planoEscolhido.nome} por ${periodoEscolhido.meses} ${
          periodoEscolhido.meses === 1 ? "mês" : "meses"
        } pra finalizar o pagamento e ativar no GetFesta.`
      : "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            reset();
          } else {
            setOpen(true);
            setStep("lista");
          }
        }}
        className={buttonClass("secondary", "sm")}
      >
        Alterar plano
      </button>

      {open && (
        <>
          {/* backdrop so mobile: fecha ao tocar fora e evita o painel brigar
              com o conteudo por baixo (era o que cortava a caixa no mobile) */}
          <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={reset} />
          <div
            className={`fixed left-4 right-4 top-1/2 z-50 max-h-[80vh] -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-3 shadow-card-hover sm:absolute sm:inset-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-72 sm:translate-y-0`}
          >
            {step === "lista" && (
              <div className="flex flex-col">
                {planos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isPending || p.id === planoAtualId}
                    onClick={() => escolherPlano(p)}
                    className={`flex w-full flex-col rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold hover:bg-surface-alt disabled:cursor-default disabled:opacity-60 ${
                      p.id === planoAtualId ? "bg-accent-soft text-accent-dark" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>{p.nome}</span>
                      <span className="text-muted">
                        {p.id === planoAtualId
                          ? "atual"
                          : `${formatBRL(Number(p.valor_mensal))}/mês`}
                      </span>
                    </span>
                    <span className="text-[10.5px] font-normal text-muted-2">
                      {p.limite_orcamentos_mes === null
                        ? "Orçamentos ilimitados"
                        : `${p.limite_orcamentos_mes} orçamentos/mês`}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === "confirmarGratis" && planoEscolhido && (
              <div className="p-2">
                <p className="text-[12.5px] font-semibold">
                  Trocar para o plano <b>{planoEscolhido.nome}</b>?
                </p>
                <p className="mt-1 text-[11px] text-muted">Essa troca já vale a partir de agora, sem cobrança.</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={confirmarGratis}
                    className={`${buttonClass("primary", "sm")} flex-1`}
                  >
                    {isPending ? "Trocando..." : "Sim, trocar"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStep("lista")}
                    className={`${buttonClass("secondary", "sm")} flex-1`}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}

            {step === "periodo" && planoEscolhido && (
              <div className="p-2">
                <p className="text-[12.5px] font-semibold">
                  Plano <b>{planoEscolhido.nome}</b> — escolha o período
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Plano pago: a ativação depende da confirmação do pagamento com o nosso time.
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {periodosDoPlano.map((periodo) => {
                    const valorCheio = Number(planoEscolhido.valor_mensal) * periodo.meses;
                    const desconto = Number(periodo.desconto_pct);
                    const valorComDesconto = valorCheio * (1 - desconto / 100);
                    const selecionado = periodoEscolhido?.id === periodo.id;
                    return (
                      <button
                        key={periodo.id}
                        type="button"
                        onClick={() => setPeriodoEscolhido(periodo)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12.5px] font-semibold ${
                          selecionado ? "border-accent bg-accent-soft text-accent-dark" : "border-border hover:bg-surface-alt"
                        }`}
                      >
                        <span>
                          {periodo.meses} {periodo.meses === 1 ? "mês" : "meses"}
                          {desconto > 0 && <span className="ml-1.5 text-[10.5px] font-bold text-ok">-{desconto}%</span>}
                        </span>
                        <span className="text-[11.5px]">{formatBRL(valorComDesconto)}</span>
                      </button>
                    );
                  })}
                </div>
                {error && <p className="mt-2 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={isPending || !periodoEscolhido}
                    onClick={confirmarPago}
                    className={`${buttonClass("primary", "sm")} flex-1`}
                  >
                    {isPending ? "Enviando..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStep("lista")}
                    className={`${buttonClass("secondary", "sm")} flex-1`}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}

            {step === "sucesso" && planoEscolhido && periodoEscolhido && (
              <div className="p-2">
                <p className="text-[12.5px] font-semibold">Solicitação registrada ✓</p>
                <p className="mt-1 text-[11px] text-muted">
                  Fale com a gente pelo WhatsApp pra finalizar o pagamento — assim que confirmarmos, o plano{" "}
                  <b>{planoEscolhido.nome}</b> é ativado.
                </p>
                {whatsapp ? (
                  <a
                    href={buildWhatsAppLink(whatsapp, mensagemWhatsApp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonClass("primary", "sm")} mt-3 block w-full text-center`}
                  >
                    Falar no WhatsApp
                  </a>
                ) : (
                  <p className="mt-3 text-[11px] font-semibold text-accent-dark">
                    WhatsApp de suporte ainda não configurado — fale com a gente por e-mail.
                  </p>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className={`${buttonClass("secondary", "sm")} mt-2 w-full`}
                >
                  Fechar
                </button>
              </div>
            )}

            {step === "lista" && error && (
              <p className="px-3 py-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
