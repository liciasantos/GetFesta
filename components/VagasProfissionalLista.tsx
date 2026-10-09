"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import Sanfona from "@/components/Sanfona";
import CandidatarVagaButton from "@/components/CandidatarVagaButton";
import RetirarCandidaturaButton from "@/components/RetirarCandidaturaButton";
import CompartilharVagaButton from "@/components/CompartilharVagaButton";
import { nomeDaVaga } from "@/lib/vaga";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export type VagaProfissional = {
  id: string;
  titulo: string | null;
  categoria_nome: string;
  cidade_nome: string;
  bairro_nome: string | null;
  empresa_nome_fantasia: string;
  /** só vem quando o profissional foi selecionado (ver lib/data/vagas.ts) */
  empresa_telefone: string | null;
  /** YYYY-MM-DD */
  data_evento: string;
  hora_inicio: string;
  duracao_horas: number;
  valor: string | null;
  descricao: string;
  /** YYYY-MM-DD */
  criado_em: string;
  status: string;
  candidatura_status: string | null;
  ja_candidatado: boolean;
  vagas_desejadas: number;
  vagas_selecionadas: number;
};

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// Cartões e filtros no estilo "mural de vagas" (ver comentário do componente).
type Quando = "" | "semana" | "mes";
type Situacao = "" | "abrir" | "minhas";

/** dias entre duas datas YYYY-MM-DD (negativo se `dia` é anterior a `base`) */
function diasEntre(base: string, dia: string): number {
  const [y1, m1, d1] = base.split("-").map(Number);
  const [y2, m2, d2] = dia.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function dataCurta(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const TAG_TONES = {
  accent: "bg-accent-soft text-accent-dark",
  gold: "bg-gold-soft text-[#8a6300]",
  ok: "bg-ok-soft text-ok",
  okSolid: "bg-ok text-white",
  muted: "bg-surface-alt text-muted",
  outline: "border border-border-strong bg-surface text-text",
} as const;

function Tag({ tone, children }: { tone: keyof typeof TAG_TONES; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${TAG_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`min-h-9 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold transition-colors sm:min-h-8 sm:px-3 sm:py-1 sm:text-[12px] ${
        ativo
          ? "border-accent bg-accent-soft text-accent-dark"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function GrupoFiltro({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sm:flex sm:items-center sm:gap-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2 sm:mt-0 sm:gap-1.5">{children}</div>
    </div>
  );
}

/** Lista de vagas do profissional no estilo "mural": cartões separados com
 * etiquetas no topo, título grande e filtros em cima. Os filtros rodam aqui no
 * navegador porque a lista já vem inteira do servidor (poucas vagas por
 * profissional); se um dia for centenas, precisa virar filtro no servidor com
 * paginação. `hoje` (YYYY-MM-DD, fuso de Brasília) vem do servidor pra não
 * divergir entre servidor e navegador na virada do dia. */
export default function VagasProfissionalLista({ vagas, hoje }: { vagas: VagaProfissional[]; hoje: string }) {
  const [busca, setBusca] = useState("");
  const [quando, setQuando] = useState<Quando>("");
  const [situacao, setSituacao] = useState<Situacao>("");
  const [funcao, setFuncao] = useState("");
  const [cidade, setCidade] = useState("");
  const [filtrosAbertosNoCelular, setFiltrosAbertosNoCelular] = useState(false);

  // Três grupos: (1) selecionado e o evento ainda vai acontecer -> destaque no topo;
  // (2) candidatou e não deu (vaga encerrada/preenchida, recusado ou evento passado) ->
  // histórico recolhido, pra não poluir a lista; (3) o resto -> lista de vagas com filtros.
  // Selecionado em evento que já passou sai daqui: aparece em "Vagas concluídas" na página.
  const selecionadasProximas: VagaProfissional[] = [];
  const historico: VagaProfissional[] = [];
  const ativas: VagaProfissional[] = [];
  for (const v of vagas) {
    const passou = diasEntre(hoje, v.data_evento) < 0;
    if (v.candidatura_status === "selecionado") {
      if (!passou) selecionadasProximas.push(v);
    } else if (v.ja_candidatado && (passou || v.status !== "aberta" || v.candidatura_status === "recusado")) {
      historico.push(v);
    } else {
      ativas.push(v);
    }
  }

  if (vagas.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-[13px] leading-relaxed text-muted">
        Nenhuma vaga compatível por enquanto. Confira se suas funções, seu bairro e o campo de gênero estão
        preenchidos no perfil — é com eles que a gente encontra vagas pra você.
      </div>
    );
  }

  const funcoes = [...new Set(ativas.map((v) => v.categoria_nome))].sort();
  const cidades = [...new Set(ativas.map((v) => v.cidade_nome))].sort();
  const termo = semAcento(busca.trim());

  const filtradas = ativas.filter((v) => {
    const dias = diasEntre(hoje, v.data_evento);
    const passou = dias < 0;
    if (quando === "semana" && !(dias >= 0 && dias <= 7)) return false;
    if (quando === "mes" && !(dias >= 0 && dias <= 30)) return false;
    if (situacao === "abrir" && (v.ja_candidatado || v.status !== "aberta" || passou)) return false;
    if (situacao === "minhas" && !v.ja_candidatado) return false;
    if (funcao && v.categoria_nome !== funcao) return false;
    if (cidade && v.cidade_nome !== cidade) return false;
    if (termo) {
      const texto = semAcento(
        [v.titulo, v.categoria_nome, v.empresa_nome_fantasia, v.cidade_nome, v.bairro_nome, v.descricao].join(" ")
      );
      if (!texto.includes(termo)) return false;
    }
    return true;
  });

  const ativos = [quando, situacao, funcao, cidade, busca.trim()].filter(Boolean).length;
  const mostrarGrupos = filtrosAbertosNoCelular ? "flex" : "hidden";

  function limpar() {
    setBusca("");
    setQuando("");
    setSituacao("");
    setFuncao("");
    setCidade("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SELECIONADO(A) - destaque no topo */}
      {selecionadasProximas.length > 0 && (
        <section aria-label="Vagas em que você foi selecionado" className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ok">
            <Icon name="party" className="h-4 w-4" /> Você foi selecionado(a) · {selecionadasProximas.length}
          </p>
          <div className={`grid grid-cols-1 gap-4 ${selecionadasProximas.length > 1 ? "xl:grid-cols-2" : ""}`}>
            {selecionadasProximas.map((v) => (
              <CartaoSelecionada key={v.id} v={v} hoje={hoje} />
            ))}
          </div>
        </section>
      )}

      {ativas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-[13px] text-muted">
          Nenhuma vaga nova compatível agora. Quando surgir uma, ela aparece aqui.
        </div>
      )}

      {/* FILTROS */}
      {ativas.length > 0 && (
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-4" aria-label="Filtrar vagas">
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div className="sm:flex sm:items-baseline sm:gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-dark">Filtrar vagas</p>
            <p className="mt-0.5 text-[14px] text-muted sm:mt-0" aria-live="polite">
              <b className="text-text">{filtradas.length}</b> {filtradas.length === 1 ? "vaga" : "vagas"}
              {filtradas.length !== ativas.length && <> de {ativas.length}</>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {ativos > 0 && (
              <button type="button" onClick={limpar} className="text-[12.5px] font-bold text-accent-dark underline">
                Limpar
              </button>
            )}
            <button
              type="button"
              aria-expanded={filtrosAbertosNoCelular}
              onClick={() => setFiltrosAbertosNoCelular((v) => !v)}
              className="min-h-9 rounded-full border border-border-strong px-3.5 py-1.5 text-[12.5px] font-bold sm:hidden"
            >
              Filtros
            </button>
          </div>
        </div>

        <div className="relative mt-3 sm:mt-2.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Título, empresa, cidade, função…"
            aria-label="Buscar vagas"
            className="w-full rounded-full border border-border bg-surface-alt/50 py-3 pl-11 pr-4 text-[14px] sm:py-2 sm:text-[13.5px]"
          />
        </div>

        <div className={`${mostrarGrupos} mt-4 flex-col gap-x-6 gap-y-4 sm:mt-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-y-2`}>
          <GrupoFiltro label="Quando">
            <Chip ativo={quando === "semana"} onClick={() => setQuando(quando === "semana" ? "" : "semana")}>
              Próximos 7 dias
            </Chip>
            <Chip ativo={quando === "mes"} onClick={() => setQuando(quando === "mes" ? "" : "mes")}>
              Próximos 30 dias
            </Chip>
          </GrupoFiltro>

          <GrupoFiltro label="Situação">
            <Chip ativo={situacao === "abrir"} onClick={() => setSituacao(situacao === "abrir" ? "" : "abrir")}>
              Ainda não me candidatei
            </Chip>
            <Chip ativo={situacao === "minhas"} onClick={() => setSituacao(situacao === "minhas" ? "" : "minhas")}>
              Minhas candidaturas
            </Chip>
          </GrupoFiltro>

          {funcoes.length > 1 && (
            <GrupoFiltro label="Função">
              {funcoes.map((f) => (
                <Chip key={f} ativo={funcao === f} onClick={() => setFuncao(funcao === f ? "" : f)}>
                  {f}
                </Chip>
              ))}
            </GrupoFiltro>
          )}

          {cidades.length > 1 && (
            <div className="sm:flex sm:items-center sm:gap-2.5">
              <label htmlFor="filtro-cidade" className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Cidade
              </label>
              <select
                id="filtro-cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="mt-2 block min-h-9 rounded-full border border-border bg-surface-alt/50 px-3.5 py-1.5 text-[12.5px] font-bold sm:mt-0 sm:min-h-8 sm:py-1 sm:text-[12px]"
              >
                <option value="">Todas as cidades</option>
                {cidades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>
      )}

      {/* CARTÕES */}
      {filtradas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-strong p-6 text-center text-[13px] text-muted">
          Nenhuma vaga com esses filtros.{" "}
          <button type="button" onClick={limpar} className="font-bold text-accent-dark underline">
            Limpar filtros
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      {filtradas.map((v) => {
        const dias = diasEntre(hoje, v.data_evento);
        const passou = dias < 0;
        const nova = !v.ja_candidatado && !passou && diasEntre(v.criado_em, hoje) <= 2;
        const [, mes, dia] = v.data_evento.split("-");
        const local = v.bairro_nome ?? v.cidade_nome;
        const urgencia = dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : dias >= 2 && dias <= 7 ? `Em ${dias} dias` : null;

        const situacaoTag =
          v.candidatura_status === "selecionado" ? (
            <Tag tone="ok">
              <Icon name="party" className="h-3 w-3" /> Selecionado!
            </Tag>
          ) : v.status === "cancelada" ? (
            <Tag tone="muted">Vaga encerrada</Tag>
          ) : v.candidatura_status === "recusado" ? (
            <Tag tone="muted">Não foi dessa vez</Tag>
          ) : v.ja_candidatado ? (
            <Tag tone="ok">Candidatura enviada</Tag>
          ) : null;

        const podeRetirar =
          (v.candidatura_status === "candidatado" || v.candidatura_status === "selecionado") &&
          v.status !== "cancelada" &&
          !passou;

        return (
          <article key={v.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-1.5">
              {nova && (
                <Tag tone="accent">
                  <Icon name="sparkles" className="h-3 w-3" /> Nova
                </Tag>
              )}
              {urgencia && <Tag tone="gold">{urgencia}</Tag>}
              {passou && <Tag tone="muted">Evento já passou</Tag>}
              {v.titulo && <Tag tone="outline">{v.categoria_nome}</Tag>}
              {situacaoTag}
            </div>

            <h3 className="mt-3 font-display text-[22px] font-extrabold leading-tight text-text">{nomeDaVaga(v)}</h3>
            <p className="mt-1 text-[14px] text-muted">
              <b className="font-bold text-text">{v.empresa_nome_fantasia}</b> · {local}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[12.5px] font-semibold">
                <Icon name="clock" className="h-3.5 w-3.5" />
                {dia} {MESES[Number(mes) - 1]} · {v.hora_inicio.slice(0, 5)} · {Number(v.duracao_horas)}h
              </span>
              <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-[12.5px] font-bold">
                {v.valor ? formatCurrencyBRL(v.valor) : "Valor a combinar"}
              </span>
              {v.vagas_desejadas > 1 && (
                <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-[12.5px] font-semibold text-muted">
                  Vaga pra {v.vagas_desejadas} pessoas · {v.vagas_selecionadas} selecionada
                  {v.vagas_selecionadas === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted">{v.descricao}</p>

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <span className="text-[12px] text-muted">Publicada em {dataCurta(v.criado_em)}</span>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center [&_button]:w-full sm:[&_button]:w-auto [&>div]:w-full sm:[&>div]:w-auto">
                <CompartilharVagaButton
                  vagaId={v.id}
                  mensagem={`Vaga de ${nomeDaVaga(v)} em ${v.cidade_nome} pra ${formatDateBR(v.data_evento)} - confira na GetFesta:`}
                />
                {podeRetirar && (
                  <RetirarCandidaturaButton vagaId={v.id} selecionado={v.candidatura_status === "selecionado"} />
                )}
                {!v.ja_candidatado && v.status === "aberta" && !passou && <CandidatarVagaButton vagaId={v.id} />}
              </div>
            </div>
          </article>
        );
      })}
      </div>

      {historico.length > 0 && (
        <Sanfona
          id="historico-candidaturas"
          titulo="Histórico de candidaturas"
          descricao="Vagas que se encerraram sem você ser selecionado(a)."
          total={historico.length}
        >
          {historico.map((v) => (
            <LinhaHistorico key={v.id} v={v} hoje={hoje} />
          ))}
        </Sanfona>
      )}
    </div>
  );
}

/** Vaga em que o profissional foi escolhido e o evento ainda não aconteceu -
 * visual bem diferente dos demais cartões (borda e fundo verdes) pra ele
 * perceber de cara que ganhou o trabalho. */
function CartaoSelecionada({ v, hoje }: { v: VagaProfissional; hoje: string }) {
  const dias = diasEntre(hoje, v.data_evento);
  const [, mes, dia] = v.data_evento.split("-");
  const urgencia = dias === 0 ? "Hoje" : dias === 1 ? "Amanhã" : dias >= 2 && dias <= 7 ? `Em ${dias} dias` : null;
  return (
    <article className="rounded-2xl border-2 border-ok bg-ok-soft p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone="okSolid">
          <Icon name="party" className="h-3 w-3" /> Selecionado(a)
        </Tag>
        {urgencia && <Tag tone="gold">{urgencia}</Tag>}
      </div>
      <h3 className="mt-3 font-display text-[22px] font-extrabold leading-tight text-text">{nomeDaVaga(v)}</h3>
      <p className="mt-1 text-[14px] text-muted">
        <b className="font-bold text-text">{v.empresa_nome_fantasia}</b> · {v.bairro_nome ?? v.cidade_nome}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 bg-surface px-3 py-1 text-[12.5px] font-semibold">
          <Icon name="clock" className="h-3.5 w-3.5" />
          {dia} {MESES[Number(mes) - 1]} · {v.hora_inicio.slice(0, 5)} · {Number(v.duracao_horas)}h
        </span>
        <span className="inline-flex items-center rounded-full border border-ok/40 bg-surface px-3 py-1 text-[12.5px] font-bold">
          {v.valor ? formatCurrencyBRL(v.valor) : "Valor a combinar"}
        </span>
      </div>
      <p className="mt-3 rounded-xl bg-surface p-3 text-[13px] leading-relaxed text-text">
        A empresa escolheu você. Ela pode entrar em contato pelo WhatsApp pra combinar os detalhes — e o horário já
        está bloqueado no seu calendário.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ok/30 pt-3">
        {/* contato só existe enquanto ele está selecionado: se desistir, a candidatura some
            e este botão junto (o telefone nem chega aqui) */}
        {v.empresa_telefone ? (
          <a
            href={buildWhatsAppLink(
              v.empresa_telefone,
              `Olá! Fui selecionado(a) para a vaga de ${nomeDaVaga(v)} do dia ${dataCurta(v.data_evento)} pela GetFesta. Podemos combinar os detalhes?`
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Falar com ${v.empresa_nome_fantasia} no WhatsApp`}
            title={`Falar com ${v.empresa_nome_fantasia} no WhatsApp`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ok text-white shadow-sm transition-transform hover:scale-105 hover:bg-ok/90"
          >
            <Icon name="chat" className="h-5 w-5" />
          </a>
        ) : (
          <span />
        )}
        <RetirarCandidaturaButton vagaId={v.id} selecionado />
      </div>
    </article>
  );
}

function LinhaHistorico({ v, hoje }: { v: VagaProfissional; hoje: string }) {
  const passou = diasEntre(hoje, v.data_evento) < 0;
  const motivo =
    v.status === "cancelada"
      ? "Vaga encerrada"
      : v.candidatura_status === "recusado"
        ? "Não foi dessa vez"
        : passou
          ? "Evento já passou"
          : "Vaga preenchida";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-bold">{nomeDaVaga(v)}</p>
        <p className="text-[12.5px] text-muted">
          {v.empresa_nome_fantasia} · {v.bairro_nome ?? v.cidade_nome} · {dataCurta(v.data_evento)}
        </p>
      </div>
      <Tag tone="muted">{motivo}</Tag>
    </div>
  );
}
