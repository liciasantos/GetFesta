import Link from "next/link";
import {
  PERIODO_LIMITE_LABEL,
  PLANO_PERMUTA_LABEL,
  type PermutaConfig,
  type PlanoPermuta,
} from "@/lib/permuta/regras";
import type { PerfilPermuta, UsoPlanoPermuta } from "@/lib/data/permuta";
import { AtivarParticipacaoForm } from "@/components/permuta/ParticipacaoForms";

/** Explicação da rede de permutas - é o que a empresa vê em /painel/permutas
 * enquanto não decidiu participar (a participação é opcional), e também a
 * aba "Como funciona" pra quem já participa. */
export default function Apresentacao({
  cfg,
  perfil,
  uso,
  planos,
  mostrarAdesao,
}: {
  cfg: PermutaConfig;
  perfil: PerfilPermuta;
  uso: UsoPlanoPermuta;
  planos: { id: number; chave: PlanoPermuta; nome: string; valor: number }[];
  mostrarAdesao: boolean;
}) {
  const periodo = PERIODO_LIMITE_LABEL[cfg.periodoLimitePlano];
  const ordem: PlanoPermuta[] = ["gratis", "light", "completo"];
  const requisitos = [
    ...(cfg.exigirCnpjValidado ? [{ ok: perfil.cnpjValidado, txt: "CNPJ validado" }] : []),
    ...(cfg.minFotosPortfolio > 0
      ? [{ ok: perfil.fotos >= cfg.minFotosPortfolio, txt: `Portfólio com pelo menos ${cfg.minFotosPortfolio} fotos (você tem ${perfil.fotos})` }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl bg-text text-white">
        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <span className="text-[11.5px] font-bold uppercase tracking-wide text-[#ffb89f]">Opcional · só para empresas</span>
          <h2 className="max-w-2xl font-display text-[24px] font-extrabold leading-tight sm:text-[30px]">
            Pague com o seu serviço: troque com outras empresas de eventos
          </h2>
          <p className="max-w-2xl text-[14px] leading-relaxed text-white/85">
            Vai fazer o aniversário do seu filho, a confraternização da equipe ou precisa de fotos novas para o portfólio?
            Na rede de permutas você oferece o que faz de melhor e recebe o serviço de outro fornecedor verificado — sem
            dinheiro envolvido, com tudo registrado num acordo digital.
          </p>
          <p className="text-[12.5px] text-white/70">
            Participar é uma escolha sua. Quem não ativa não aparece para outras empresas e não recebe propostas.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[15px] font-extrabold">Como funciona</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Passo n="1" titulo="Diga o que oferece e o que busca" texto='Ex: oferece "buffet para 60 pessoas" (R$ 2.400) e busca DJ e decoração.' />
          <Passo n="2" titulo="Encontre quem combina" texto="A vitrine mostra primeiro as empresas que buscam o que você oferece e oferecem o que você busca." />
          <Passo n="3" titulo="Feche um acordo digital" texto="Datas, escopo e valores dos dois lados, assinados pelas duas empresas. Aí os contatos são liberados." />
          <Passo n="4" titulo="Cada um entrega e avalia" texto="Depois de cada evento, quem recebeu confirma e avalia. Você sempre sabe quem já fez o evento de quem." />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[15px] font-extrabold">Regras para todos ficarem seguros</h3>
          <ul className="mt-3 flex flex-col gap-2.5 text-[13px] leading-relaxed text-muted">
            <li>
              <b className="text-text">Rede fechada:</b> só empresas verificadas participam. Clientes não veem suas ofertas nem
              suas trocas.
            </li>
            <li>
              <b className="text-text">Acordo antes do WhatsApp:</b> telefone e e-mail só aparecem depois das duas assinaturas.
            </li>
            <li>
              <b className="text-text">Cancelamento:</b> sem penalidade até {cfg.janelaCancelamentoDias} dias antes de cada
              entrega. Depois de uma entrega feita, o acordo não pode ser cancelado por um lado só.
            </li>
            <li>
              <b className="text-text">Confirmação:</b> sem resposta em {cfg.horasConfirmacaoAutomatica} h após o evento, a entrega
              conta como realizada.
            </li>
            <li>
              <b className="text-text">Reputação:</b> boas trocas sobem seu nível de confiança e dão um selo no perfil público.
              Não comparecer suspende a participação e, na reincidência, remove a empresa da rede.
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[15px] font-extrabold">Quantas empresas por plano</h3>
          <p className="mt-1 text-[12.5px] text-muted">Número de empresas diferentes com quem você pode trocar {periodo}. Trocar de novo com a mesma empresa não conta como nova.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ordem.map((k) => {
              const limite = cfg.limitesPlano[k];
              const atual = uso.plano === k;
              const planoDb = planos.find((p) => p.chave === k);
              return (
                <div
                  key={k}
                  className={`flex flex-col gap-1 rounded-xl border p-3 text-center ${atual ? "border-2 border-accent-dark bg-accent-soft/40" : "border-border"}`}
                >
                  <span className="text-[12px] font-bold text-muted">{planoDb?.nome ?? PLANO_PERMUTA_LABEL[k]}</span>
                  <span className="font-display text-[22px] font-extrabold">{limite > 0 ? limite : "∞"}</span>
                  <span className="text-[11.5px] text-muted">{limite > 0 ? (limite === 1 ? "empresa" : "empresas") : "sem limite"}</span>
                  {atual && <span className="text-[11px] font-bold text-accent-dark">Seu plano</span>}
                </div>
              );
            })}
          </div>
          {uso.plano !== "completo" && (
            <Link href="/painel" className="mt-3 inline-block text-[12.5px] font-bold text-accent-dark underline">
              Ver planos e fazer upgrade
            </Link>
          )}
        </section>
      </div>

      {mostrarAdesao && (
        <section className="flex flex-col gap-4 rounded-xl border-2 border-accent-soft-2 bg-surface p-5 sm:p-6">
          <h3 className="text-[16px] font-extrabold">Quer participar?</h3>
          {requisitos.length > 0 && (
            <ul className="flex flex-col gap-1.5 text-[13px]">
              {requisitos.map((r) => (
                <li key={r.txt} className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-extrabold ${r.ok ? "bg-ok-soft text-ok" : "bg-note-bg text-note-text"}`}>
                    {r.ok ? "✓" : "!"}
                  </span>
                  {r.txt}
                </li>
              ))}
            </ul>
          )}
          {requisitos.some((r) => !r.ok) && (
            <p className="text-[12.5px] text-muted">
              Você já pode ativar agora — sua empresa aparece na vitrine assim que completar os itens acima em{" "}
              <Link href="/painel/perfil" className="font-bold text-accent-dark underline">
                Perfil da empresa
              </Link>
              .
            </p>
          )}
          <AtivarParticipacaoForm />
        </section>
      )}
    </div>
  );
}

function Passo({ n, titulo, texto }: { n: string; titulo: string; texto: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-display text-2xl font-extrabold text-accent-dark">{n}</div>
      <div className="mt-1 text-[13.5px] font-bold">{titulo}</div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{texto}</p>
    </div>
  );
}
