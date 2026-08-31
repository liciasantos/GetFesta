import Link from "next/link";
import { buttonClass } from "@/components/ui";
import BgImage from "@/components/BgImage";

export default function QuemSomosPage() {
  return (
    <div>
      {/* HERO — imagem de fundo com overlay escuro (garante leitura do texto
          em branco independente da imagem escolhida) + titulo/paragrafo editorial. */}
      <section className="relative overflow-hidden">
        <BgImage src="/quem-somos-exemplo.webp" className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/60" />

        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <h2 className="section-kicker">Quem somos</h2>
          <h1 className="mt-4 max-w-3xl font-display text-[32px] font-extrabold leading-[1.15] text-white sm:text-[44px]">
            O jeito GetFesta de fazer sua festa acontecer.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/85 sm:text-[19px]">
            A GetFesta é um marketplace que conecta quem está organizando uma festa a quem faz ela acontecer —
            buffets, decoradores, salões, fotógrafos, animadores e muito mais. Publicar um pedido é grátis, sempre:
            quem paga pela visibilidade é o fornecedor, nunca o cliente.
          </p>
        </div>
      </section>

      {/* FAIXA — resumo curto em destaque */}
      <div className="border-y border-border bg-text py-3">
        <p className="mx-auto max-w-5xl px-6 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
          Um marketplace independente para conectar clientes e fornecedores de festas
        </p>
      </div>

      {/* NUMEROS — reais e honestos: nada de estatistica inventada de uma plataforma nova */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Stat big="R$ 0" label="Para publicar um pedido — sempre grátis pro cliente" />
          <Stat big="2 cidades" label="Rio de Janeiro e São Paulo, no lançamento" />
          <Stat big="3 perfis" label="Cliente, empresa e profissional, cada um com seu espaço" />
        </div>
      </section>

      {/* COMO FUNCIONA — texto editorial */}
      <section className="border-t border-border bg-surface-alt">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-[1fr_1.4fr] sm:gap-10 sm:py-20">
          <h2 className="section-kicker self-start">Como funciona</h2>
          <p className="text-[18px] leading-relaxed text-text sm:text-[20px]">
            O cliente conta o que precisa (tipo de festa, data, orçamento) em poucos minutos, sem precisar criar
            conta. Fornecedores da região avaliam o pedido e manifestam interesse — só a partir daí o contato é
            liberado dos dois lados, direto no WhatsApp.
          </p>
        </div>
      </section>

      {/* PARA QUEM É — grid de publicos, no estilo das "verticais" da referencia */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h2 className="section-kicker">Para quem é</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Clientes que querem comparar opções sem sair ligando pra dezenas de fornecedores. Empresas que querem
          receber pedidos qualificados da sua região. E profissionais freelance (atores, animadores, garçons e
          outras funções de evento) que empresas podem contratar pontualmente através da plataforma.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PublicoCard
            titulo="Cliente"
            desc="Publica o que precisa e recebe interesse de fornecedores da região, sem gastar nada."
            href="/entrar?tipo=cliente"
          />
          <PublicoCard
            titulo="Empresa"
            desc="Recebe pedidos qualificados e responde direto pelo WhatsApp, sem intermediação."
            href="/entrar?tipo=empresa"
          />
          <PublicoCard
            titulo="Profissional"
            desc="Atores, animadores, garçons e outras funções que empresas contratam pontualmente."
            href="/entrar?tipo=profissional"
          />
        </div>
      </section>

      {/* NOSSO PAPEL — bloco de destaque, tipo citação em faixa escura */}
      <section className="border-t border-border bg-text">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <h2 className="section-kicker justify-center">Nosso papel</h2>
          <p className="mt-4 font-display text-[22px] font-bold leading-snug text-white sm:text-[28px]">
            &ldquo;A GetFesta facilita o encontro entre as partes — não é empregadora, não participa da contratação
            e não garante o serviço prestado.&rdquo;
          </p>
          <p className="mt-4 text-[13.5px] text-white/60">
            A responsabilidade pelo combinado é sempre entre cliente e fornecedor.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Bora fazer sua festa acontecer?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/publicar-pedido" className={buttonClass("primary", "lg")}>
            Publicar um pedido grátis
          </Link>
          <Link href="/cadastro/empresa" className={buttonClass("secondary", "lg")}>
            Cadastrar minha empresa
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div>
      <div className="font-display text-[34px] font-extrabold text-accent-dark sm:text-[40px]">{big}</div>
      <div className="mt-1.5 max-w-[220px] text-[13px] leading-snug text-muted">{label}</div>
    </div>
  );
}

function PublicoCard({ titulo, desc, href }: { titulo: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="card-hover flex flex-col justify-between gap-6 rounded-2xl border border-border bg-surface p-6"
    >
      <div>
        <h3 className="font-display text-lg font-extrabold">{titulo}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{desc}</p>
      </div>
      <span className="text-[12px] font-bold text-accent-dark">Saiba mais →</span>
    </Link>
  );
}
