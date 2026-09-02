import Link from "next/link";
import { getSession } from "@/lib/auth";
import { buttonClass, Badge } from "@/components/ui";

export default async function ProfissionaisPage() {
  const session = await getSession();
  const profissionalLogado = session?.tipo === "profissional";

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-text">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
          <h2 className="section-kicker justify-center">Para profissionais</h2>
          <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.15] text-white sm:text-[42px]">
            Sua agenda cheia e seu talento em destaque.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/85 sm:text-[17px]">
            Conecte-se com empresas que precisam do seu trabalho pontual. Gerencie seus dias livres numa única
            plataforma.
          </p>
          <div className="mt-7">
            <Link href={profissionalLogado ? "/perfil-profissional" : "/cadastro/profissional"} className={buttonClass("primary", "lg")}>
              {profissionalLogado ? "Ir para meu catálogo" : "Criar meu catálogo"}
            </Link>
          </div>
        </div>
      </section>

      {/* VANTAGEM PIONEIROS */}
      <section className="border-b border-border bg-[#fff3d6] px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 text-center">
          <Badge tone="ad">✨ Vantagem para os pioneiros</Badge>
          <p className="max-w-2xl text-[14.5px] font-semibold leading-relaxed text-[#5c4a10]">
            Seja um dos 30 primeiros profissionais a criar um perfil e liberamos a função de anexar seu portfólio em
            PDF permanentemente e de graça — um recurso exclusivo das contas premium.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <span className="section-kicker">Como funciona</span>
        <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Do catálogo ao primeiro job</h2>
        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <PassoCard n="1" titulo="Monte seu catálogo" texto="Fotos, funções que você exerce e, se quiser, medidas pra personagem." />
          <PassoCard n="2" titulo="Marque sua agenda" texto="Bloqueie dias inteiros ou só um horário específico — você controla." />
          <PassoCard n="3" titulo="Empresas te encontram" texto="Só empresas autenticadas veem seu perfil — nunca aparece pra cliente final." />
          <PassoCard n="4" titulo="Feche pelo WhatsApp" texto="Candidate-se a vagas ou seja contatado direto, sem intermediação." />
        </div>
      </section>

      {/* AGENDA — mockup visual simples */}
      <section className="border-t border-border bg-surface-alt px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 sm:grid-cols-2">
          <div>
            <span className="section-kicker">Sua agenda, do seu jeito</span>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Bloqueie o dia inteiro ou só um horário</h2>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
              Sem depender de sincronizar com nenhum app externo — o calendário é próprio da GetFesta, simples de
              usar direto do celular.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card-hover">
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 28 }, (_, i) => {
                const bloqueadoTotal = [3, 4, 5, 17].includes(i);
                const bloqueadoParcial = [10, 18, 23].includes(i);
                return (
                  <div
                    key={i}
                    className={`flex aspect-square items-center justify-center rounded-md text-[10.5px] font-bold ${
                      bloqueadoTotal
                        ? "bg-accent text-white"
                        : bloqueadoParcial
                          ? "border border-accent-soft-2 bg-accent-soft text-accent-dark"
                          : "border border-border text-muted-2"
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-accent" /> Dia inteiro indisponível
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-accent-soft-2 bg-accent-soft" /> Horário específico
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUE VALE A PENA */}
      <section className="border-t border-border bg-text">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <h2 className="section-kicker justify-center">Por que vale a pena</h2>
          <p className="mt-4 font-display text-[22px] font-bold leading-snug text-white sm:text-[28px]">
            Empresas te encontram pelo que você mostra — suas fotos, seu portfólio e sua agenda já filtram quem entra
            em contato de verdade.
          </p>
          <p className="mt-4 text-[13.5px] text-white/60">
            Nada de mandar currículo pra todo mundo: seu perfil trabalha por você.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Bora colocar seu talento em destaque?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={profissionalLogado ? "/perfil-profissional" : "/cadastro/profissional"} className={buttonClass("primary", "lg")}>
            {profissionalLogado ? "Ir para meu catálogo" : "Criar meu catálogo"}
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
