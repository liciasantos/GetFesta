"use client";

import { useActionState, useState, useTransition } from "react";
import {
  alternarOfertaAdmin,
  cancelarAcordoAdmin,
  resolverDisputa,
  salvarConfigPermuta,
  salvarControleEmpresaPermuta,
  type PermutaActionState,
} from "@/lib/actions/permuta";
import { buttonClass } from "@/components/ui";
import {
  NIVEL_LABEL,
  PERIODO_LIMITE_LABEL,
  PLANO_PERMUTA_LABEL,
  STATUS_ENTREGA_LABEL,
  type NivelPermuta,
  type PermutaConfig,
  type PlanoPermuta,
} from "@/lib/permuta/regras";

const inputCls = "mt-1 w-full rounded-md border border-border px-2.5 py-2 text-sm font-normal normal-case";
const labelCls = "text-[11px] font-bold uppercase text-muted";

function Salvar({ pending, state }: { pending: boolean; state: PermutaActionState }) {
  return (
    <div className="flex items-center gap-2">
      <button disabled={pending} className={buttonClass("primary", "sm")}>
        {pending ? "Salvando..." : "Salvar"}
      </button>
      {state?.ok && <span className="text-[12px] font-semibold text-ok">Salvo!</span>}
      {state?.error && <span className="text-[12px] font-semibold text-danger-dark">{state.error}</span>}
    </div>
  );
}

function Check({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-[13px]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5" />
      <span>
        <b>{label}</b>
        {hint && <span className="block text-[12px] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function Num({ name, label, value, step = 1 }: { name: string; label: string; value: number; step?: number }) {
  return (
    <label className={labelCls}>
      {label}
      <input type="number" name={name} defaultValue={value} step={step} min={0} className={inputCls} />
    </label>
  );
}

/** Todas as regras da permuta num formulário só (salva o JSON inteiro). */
export function PermutaConfigForm({ cfg }: { cfg: PermutaConfig }) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(salvarConfigPermuta, undefined);
  const [, startTransition] = useTransition();
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="flex flex-col gap-5"
    >
      <Bloco titulo="Funcionamento geral">
        <Check name="ativa" label="Rede de permutas ativa" defaultChecked={cfg.ativa} hint="Desligado: a seção some do painel das empresas (os dados ficam guardados)." />
        <Check name="exigirCnpjValidado" label="Exigir CNPJ validado para participar" defaultChecked={cfg.exigirCnpjValidado} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Num name="minFotosPortfolio" label="Mín. de fotos no portfólio" value={cfg.minFotosPortfolio} />
        </div>
      </Bloco>

      <Bloco
        titulo="Limite por plano"
        descricao="Com quantas empresas diferentes cada plano pode trocar (0 = sem limite). Trocar de novo com a mesma empresa não gasta vaga, e uma proposta recebida só conta depois que a empresa assina."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {(["gratis", "light", "completo"] as PlanoPermuta[]).map((k) => (
            <Num key={k} name={`plano_${k}`} label={`Plano ${PLANO_PERMUTA_LABEL[k]}`} value={cfg.limitesPlano[k]} />
          ))}
          <label className={labelCls}>
            Contar empresas
            <select name="periodoLimitePlano" defaultValue={cfg.periodoLimitePlano} className={inputCls}>
              {(["mes", "simultaneo", "total"] as const).map((p) => (
                <option key={p} value={p}>
                  {PERIODO_LIMITE_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[12px] text-muted">
          “Por mês” conta os acordos iniciados no mês corrente; “ao mesmo tempo” conta só os acordos abertos; “no total”
          conta todas as empresas com quem já trocou. O benefício aparece automaticamente nos cards de planos do site.
        </p>
      </Bloco>

      <Bloco titulo="Níveis de confiança" descricao="Requisitos para subir de nível e, opcionalmente, quantas permutas cada nível pode ter abertas ao mesmo tempo (0 = sem limite — o limite principal passa a ser o do plano).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted">
                <th className="py-1.5">Nível</th>
                <th>Permutas concluídas</th>
                <th>Nota mínima</th>
                <th>Permutas simultâneas</th>
              </tr>
            </thead>
            <tbody>
              {(["novo", "c", "b", "a"] as NivelPermuta[]).map((n) => (
                <tr key={n} className="border-t border-border">
                  <td className="py-2 pr-3 font-bold">{NIVEL_LABEL[n]}</td>
                  <td className="pr-3">
                    {n === "novo" ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <input type="number" min={0} name={`req_${n}_concluidas`} defaultValue={cfg.requisitos[n].concluidas} className={inputCls} />
                    )}
                  </td>
                  <td className="pr-3">
                    {n === "novo" ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <input type="number" min={0} max={5} step={0.1} name={`req_${n}_nota`} defaultValue={cfg.requisitos[n].nota} className={inputCls} />
                    )}
                  </td>
                  <td>
                    <input type="number" min={0} name={`limite_${n}`} defaultValue={cfg.limites[n]} className={inputCls} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>

      <Bloco titulo="Prazos e penalidades">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Num name="janelaCancelamentoDias" label="Cancelar sem penalidade até (dias antes)" value={cfg.janelaCancelamentoDias} />
          <Num name="horasConfirmacaoAutomatica" label="Confirmação automática após (horas)" value={cfg.horasConfirmacaoAutomatica} />
          <Num name="diasPenalidadeCancelamento" label="Cancelamento fora da janela cai 1 nível por (dias)" value={cfg.diasPenalidadeCancelamento} />
          <Num name="furosParaSuspender" label="Furos em 12 meses para suspender" value={cfg.furosParaSuspender} />
          <Num name="diasSuspensao" label="Duração da suspensão (dias)" value={cfg.diasSuspensao} />
        </div>
        <p className="text-[12px] text-muted">
          Um furo além do limite de suspensão remove a empresa da rede (banimento). Furo = entrega marcada como “não
          realizada” ao resolver uma disputa.
        </p>
      </Bloco>

      <Bloco titulo="Divulgação no site">
        <Check name="exibirSeloPerfilPublico" label="Mostrar selo de nível e nº de permutas no perfil público" defaultChecked={cfg.exibirSeloPerfilPublico} />
        <Check name="secaoEmpresasVisivel" label='Mostrar a seção sobre permuta na página "Para empresas" (/empresas)' defaultChecked={cfg.secaoEmpresasVisivel} />
        <label className={labelCls}>
          Título da seção
          <input name="secaoEmpresasTitulo" defaultValue={cfg.secaoEmpresasTitulo} className={inputCls} />
        </label>
        <label className={labelCls}>
          Texto da seção
          <textarea name="secaoEmpresasTexto" rows={4} defaultValue={cfg.secaoEmpresasTexto} className={inputCls} />
        </label>
      </Bloco>

      <Salvar pending={pending} state={state} />
    </form>
  );
}

function Bloco({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-[14px] font-bold">{titulo}</h2>
        {descricao && <p className="mt-1 text-[12.5px] text-muted">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

/** Controle manual do admin sobre uma empresa: nível forçado, suspensão, banimento. */
export function ControleEmpresaForm({
  empresaId,
  nivelManual,
  suspensaAte,
  banida,
  observacao,
}: {
  empresaId: string;
  nivelManual: NivelPermuta | null;
  suspensaAte: string | null;
  banida: boolean;
  observacao: string | null;
}) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(salvarControleEmpresaPermuta, undefined);
  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <input type="hidden" name="empresaId" value={empresaId} />
      <label className={labelCls}>
        Nível
        <select name="nivelManual" defaultValue={nivelManual ?? ""} className={inputCls}>
          <option value="">Calculado automaticamente</option>
          {(["novo", "c", "b", "a"] as NivelPermuta[]).map((n) => (
            <option key={n} value={n}>
              Forçar {NIVEL_LABEL[n]}
            </option>
          ))}
        </select>
      </label>
      <label className={labelCls}>
        Suspensa até
        <input type="date" name="suspensaAte" defaultValue={suspensaAte ? suspensaAte.slice(0, 10) : ""} className={inputCls} />
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-[13px] font-bold">
        <input type="checkbox" name="banida" defaultChecked={banida} /> Removida da rede
      </label>
      <label className={`${labelCls} sm:col-span-3`}>
        Observação interna
        <input name="observacao" defaultValue={observacao ?? ""} className={inputCls} />
      </label>
      <div className="sm:col-span-3">
        <Salvar pending={pending} state={state} />
      </div>
    </form>
  );
}

export function ResolverDisputaForm({
  acordoId,
  entregas,
}: {
  acordoId: string;
  entregas: { id: string; label: string; status: string }[];
}) {
  const [state, formAction, pending] = useActionState<PermutaActionState, FormData>(resolverDisputa, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="acordoId" value={acordoId} />
      {entregas.map((e) => (
        <label key={e.id} className={labelCls}>
          {e.label}
          <select name={`entrega_${e.id}`} defaultValue={e.status === "em_disputa" ? "agendada" : e.status} className={inputCls}>
            {["agendada", "confirmada", "nao_realizada", "cancelada"].map((s) => (
              <option key={s} value={s}>
                {STATUS_ENTREGA_LABEL[s]}
                {s === "nao_realizada" ? " (conta como furo)" : ""}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className={labelCls}>
        Decisão (as duas empresas verão)
        <textarea name="resolucao" rows={3} required className={inputCls} />
      </label>
      <Salvar pending={pending} state={state} />
    </form>
  );
}

export function CancelarAcordoAdmin({ acordoId }: { acordoId: string }) {
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <label className={labelCls}>
        Motivo
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls} />
      </label>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await cancelarAcordoAdmin(acordoId, motivo);
            setMsg(r?.error ?? "Acordo cancelado.");
          })
        }
        className={`${buttonClass("danger", "sm")} self-start`}
      >
        Cancelar acordo
      </button>
      {msg && <span className="text-[12px] font-semibold">{msg}</span>}
    </div>
  );
}

export function AlternarOfertaAdminButton({ ofertaId, ativa }: { ofertaId: string; ativa: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => void (await alternarOfertaAdmin(ofertaId)))}
      className={buttonClass("secondary", "sm")}
    >
      {ativa ? "Ocultar oferta" : "Reativar"}
    </button>
  );
}
