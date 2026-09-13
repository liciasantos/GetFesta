import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/components/ui";
import CalculadoraEventosForm from "@/components/CalculadoraEventosForm";

export const metadata: Metadata = {
  title: "Calculadora de Festa Grátis: Quanto Comprar de Comida e Bebida",
  description:
    "Informe o número de convidados e o cardápio da sua festa e veja na hora quantos salgados, doces, bebidas e descartáveis comprar. Grátis e sem cadastro, só na GetFesta.",
  openGraph: {
    title: "Calculadora de Festa Grátis | GetFesta",
    description: "Veja na hora quanto comprar de comida e bebida pra sua festa — grátis e sem cadastro.",
    type: "website",
    locale: "pt_BR",
  },
};

const FAQ = [
  {
    pergunta: "Quantos salgados por pessoa eu preciso pra festa?",
    resposta:
      "Depende do horário e do tipo de evento, mas a conta rápida é de 8 a 12 salgadinhos por adulto em festas de tarde — e mais que isso se for no horário de almoço ou jantar. A calculadora acima já ajusta esse número pra você, é só informar a duração e o horário da sua festa.",
  },
  {
    pergunta: "Como calcular bebida pra festa infantil?",
    resposta:
      "O consumo das crianças é bem menor que o dos adultos — cerca de meio litro de suco ou refrigerante por criança costuma bastar. Informe o número de convidados por faixa etária na calculadora que a gente já separa essa conta.",
  },
  {
    pergunta: "Quanto custa contratar um buffet ou fornecedor de festa?",
    resposta:
      "O valor varia bastante conforme a cidade, o tipo de evento e o número de convidados. Depois de calcular as quantidades aqui em cima, publique seu pedido de graça e receba propostas reais de fornecedores da sua região pra comparar preços.",
  },
  {
    pergunta: "A calculadora de festa é gratuita e preciso criar conta pra usar?",
    resposta:
      "É 100% grátis e não pede cadastro — você pode calcular quantas vezes quiser antes de decidir contratar qualquer fornecedor.",
  },
  {
    pergunta: "O resultado muda se a festa for ao ar livre ou tiver bebida alcoólica?",
    resposta:
      "Sim: dias quentes e festas ao ar livre aumentam o consumo de bebida não alcoólica, e quando tem álcool a calculadora pergunta quantos adultos bebem pra não superestimar a quantidade. Esses ajustes já estão inclusos no cálculo.",
  },
];

export default async function ClientesPage() {
  const session = await getSession();
  const clienteLogado = session?.tipo === "cliente";

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.pergunta,
              acceptedAnswer: { "@type": "Answer", text: f.resposta },
            })),
          }),
        }}
      />

      {/* HERO */}
      <section className="border-b border-border bg-surface-alt">
        <div className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
          <span className="section-kicker justify-center">Para clientes</span>
          <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.15] sm:text-[42px]">
            Calculadora de festa: descubra quanto comprar antes de fechar com qualquer fornecedor
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted sm:text-[17px]">
            Responda perguntas rápidas sobre convidados e cardápio e veja, na hora, quanto comprar de comida e
            bebida — sem precisar criar conta. Depois, é só publicar seu pedido e receber propostas de fornecedores
            da sua região.
          </p>
          <div className="mt-7">
            <Link href={clienteLogado ? "/publicar-pedido" : "/cadastro/cliente"} className={buttonClass("primary", "lg")}>
              {clienteLogado ? "Publicar meu pedido" : "Criar minha conta grátis"}
            </Link>
          </div>
        </div>
      </section>

      {/* CALCULADORA */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <span className="section-kicker">Calculadora de festa</span>
        <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Calcule quanto comprar de comida e bebida</h2>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Informe o número de convidados e o que pretende servir — a gente estima as quantidades certas pra não
          faltar, nem sobrar demais.
        </p>

        <div className="mt-9">
          <CalculadoraEventosForm />
        </div>

        {!clienteLogado && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-accent-soft-2 bg-accent-soft px-6 py-8 text-center">
            <p className="text-[15px] font-bold text-accent-dark">Gostou do resultado?</p>
            <p className="max-w-md text-[13px] leading-relaxed text-accent-dark">
              Crie sua conta grátis e publique seu pedido — fornecedores da sua região recebem e enviam propostas
              direto pra você.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-3">
              <Link href="/cadastro/cliente" className={buttonClass("primary", "md")}>
                Criar conta grátis
              </Link>
              <Link href="/entrar?tipo=cliente" className={buttonClass("secondary", "md")}>
                Já tenho conta
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="border-t border-border px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="section-kicker">Dúvidas frequentes</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Perguntas frequentes sobre festas</h2>
          <div className="mt-9 flex flex-col gap-7">
            {FAQ.map((f) => (
              <div key={f.pergunta}>
                <h3 className="text-[14.5px] font-bold">{f.pergunta}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-t border-border bg-surface-alt px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <span className="section-kicker">Como funciona</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Do pedido ao fornecedor fechado</h2>
          <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <PassoCard n="1" titulo="Monte seu pedido" texto="Conte o que precisa pra sua festa — leva menos de 2 minutos, e você não precisa criar conta agora." />
            <PassoCard n="2" titulo="Receba propostas" texto="Empresas da sua região com interesse liberam contato direto com você." />
            <PassoCard n="3" titulo="Feche pelo WhatsApp" texto="Negocie direto com o fornecedor, sem intermediação nem comissão sobre o valor da festa." />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Pronto pra começar a organizar sua festa?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={clienteLogado ? "/publicar-pedido" : "/cadastro/cliente"} className={buttonClass("primary", "lg")}>
            {clienteLogado ? "Publicar meu pedido" : "Criar minha conta grátis"}
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
