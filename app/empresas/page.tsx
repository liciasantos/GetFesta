import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listPlanosEmpresa } from "@/lib/data/painel";
import { getConfiguracoesSite, CONFIG_CTA_FORNECEDOR_BG, CONFIG_CTA_FORNECEDOR_COR } from "@/lib/data/config";
import { PLANOS_BENEFICIOS, formatPrecoPlano } from "@/lib/planos-beneficios";
import { buttonClass, Badge } from "@/components/ui";
import { hexToRgba } from "@/lib/color";
import BgImage from "@/components/BgImage";

export default async function EmpresasPage() {
  const [session, planosEmpresa, config] = await Promise.all([getSession(), listPlanosEmpresa(), getConfiguracoesSite()]);
  const empresaLogada = session?.tipo === "empresa";

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <BgImage src={config[CONFIG_CTA_FORNECEDOR_BG]} className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0" style={{ backgroundColor: hexToRgba(config[CONFIG_CTA_FORNECEDOR_COR], 0.82) }} />

        <div className="relative mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
          <h2 className="section-kicker justify-center">Para empresas</h2>
          <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.15] text-white sm:text-[42px]">
            Clientes da sua região estão procurando os seus serviços agora.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/85 sm:text-[17px]">
            Receba pedidos qualificados e negocie direto pelo WhatsApp. Sem comissão por festa fechada.
          </p>
          <div className="mt-7">
            <Link href={empresaLogada ? "/painel" : "/cadastro/empresa"} className={buttonClass("primary", "lg")}>
              {empresaLogada ? "Ir para o meu painel" : "Cadastrar minha empresa"}
            </Link>
          </div>
        </div>
      </section>

      {/* OFERTA DE LANCAMENTO */}
      <section className="border-b border-border bg-[#fff3d6] px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 text-center">
          <Badge tone="ad">🏷️ Oferta de lançamento</Badge>
          <p className="max-w-2xl text-[14.5px] font-semibold leading-relaxed text-[#5c4a10]">
            As 20 primeiras empresas que se cadastrarem ganham 2 meses grátis no plano Light (até 30 orçamentos/mês).
            Em troca, você só precisa topar oferecer um desconto exclusivo pros clientes GetFesta. Vagas limitadas!
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <span className="section-kicker">Como funciona</span>
        <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Do cadastro ao contato liberado</h2>
        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <PassoCard n="1" titulo="Cadastre sua empresa" texto="Escolha suas categorias e a região onde atende — leva poucos minutos." />
          <PassoCard n="2" titulo="Receba pedidos" texto="Pedidos de clientes da sua região chegam direto no seu painel, sem disputa de leilão." />
          <PassoCard n="3" titulo="Decida com liberdade" texto="Veja o pedido e, se tiver interesse, seu contato é liberado — sem exposição desnecessária." />
          <PassoCard n="4" titulo="Feche pelo WhatsApp" texto="Negocie direto, sem intermediação nem comissão sobre o valor da festa." />
        </div>
      </section>

      {/* APAREÇA PRIMEIRO — banner + destaque */}
      <section className="border-t border-border bg-surface-alt px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <span className="section-kicker">Apareça primeiro</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Dois jeitos de se destacar</h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Além do fluxo gratuito de receber pedidos, a GetFesta tem dois formatos de anúncio pago pra quem quer
            aparecer primeiro:
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-bold">Banner principal da home</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Posição rotativa no topo do site — a primeira coisa que qualquer visitante vê ao entrar na GetFesta.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-bold">Destaques da semana</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Posição fixa dentro da sua categoria, visível direto na busca — pra quem já está comparando
                fornecedores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTRATE PROFISSIONAIS */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <span className="section-kicker">Reforce sua equipe</span>
        <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Contrate profissionais freelance direto pelo site</h2>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Precisa de um ator, garçom ou animador extra pra um evento específico? Veja portfólio, fotos e agenda de
          disponibilidade antes de decidir.
        </p>
        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <PassoCard n="1" titulo="Publique a vaga" texto={'Ex: "preciso de 1 garçom sábado à noite" — leva menos de um minuto.'} />
          <PassoCard n="2" titulo="Profissionais se candidatam" texto="Só quem é compatível com a função e a cidade vê a vaga e se candidata." />
          <PassoCard n="3" titulo="Você escolhe e fecha" texto="Compare os candidatos e feche direto pelo WhatsApp." />
        </div>
      </section>

      {/* PLANOS */}
      <section className="border-t border-border bg-surface-alt/60 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <span className="section-kicker">Planos</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Comece grátis, cresça no seu ritmo</h2>
          <p className="mt-1.5 max-w-lg text-[13.5px] text-muted">
            Sem contrato de fidelidade — mude de plano quando quiser, direto no seu painel.
          </p>

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLANOS_BENEFICIOS.map((p) => {
              const planoDb = planosEmpresa.find((pe) => pe.nome === p.nome);
              const gratis = !planoDb || Number(planoDb.valor_mensal) === 0;
              const href = empresaLogada
                ? planoDb
                  ? `/painel?plano=${planoDb.id}`
                  : "/painel"
                : gratis || !planoDb
                  ? "/cadastro/empresa"
                  : `/contratar/empresa?plano=${planoDb.id}`;
              return (
                <div
                  key={p.nome}
                  className={`relative rounded-2xl border p-6 ${
                    p.destaque ? "border-accent bg-surface shadow-card-hover" : "border-border bg-surface"
                  }`}
                >
                  {p.destaque && (
                    <span className="absolute -top-3 left-6">
                      <Badge tone="ad">Mais popular</Badge>
                    </span>
                  )}
                  <h3 className="text-[15px] font-bold">{p.nome}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-extrabold">
                      {formatPrecoPlano(planoDb ? Number(planoDb.valor_mensal) : 0)}
                    </span>
                    {!gratis && <span className="text-[12px] text-muted">/mês</span>}
                  </div>
                  <ul className="mt-5 flex flex-col gap-2.5 text-[12.5px] leading-relaxed">
                    {p.beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-0.5 text-ok">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={href}
                    className={`mt-6 block w-full rounded-lg py-2.5 text-center text-[13px] font-bold ${
                      p.destaque
                        ? "bg-accent text-white hover:bg-accent-dark"
                        : "border border-border-strong text-text hover:bg-surface-alt"
                    }`}
                  >
                    Contratar {p.nome}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POR QUE VALE A PENA */}
      <section className="border-t border-border bg-text">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <h2 className="section-kicker justify-center">Por que vale a pena</h2>
          <p className="mt-4 font-display text-[22px] font-bold leading-snug text-white sm:text-[28px]">
            Sem leilão de lead caro, sem comissão sobre a festa fechada — você decide quem atender e quanto investir
            em visibilidade.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Pronto pra receber seus primeiros pedidos?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={empresaLogada ? "/painel" : "/cadastro/empresa"} className={buttonClass("primary", "lg")}>
            {empresaLogada ? "Ir para o meu painel" : "Cadastrar minha empresa"}
          </Link>
        </div>
      </section>
    </div>
  );
}

function PassoCard({ n, titulo, texto }: { n: string; titulo: string; texto: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-extrabold text-accent-dark">{n}</div>
      <h3 className="mt-2 text-[14px] font-bold">{titulo}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{texto}</p>
    </div>
  );
}
