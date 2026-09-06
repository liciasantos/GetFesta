import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CalculadoraEventosForm from "@/components/CalculadoraEventosForm";

const DICAS_BLOG = [
  {
    icone: "🍬",
    titulo: "Docinhos: varie no máximo 3 sabores",
    texto:
      "Mesa cheia de opção parece mais generosa, mas costuma sobrar de tudo um pouco e falhar no total. Escolha 2 ou 3 sabores e capriche na quantidade — fica mais bonito e mais fácil de calcular certo.",
  },
  {
    icone: "🥩",
    titulo: "Churrasco em conta sem perder qualidade",
    texto:
      "Misture cortes: um mais nobre (picanha, fraldinha) puxando o sabor e cortes mais em conta (coxão mole, linguiça, frango) garantindo volume. Ninguém nota a proporção, e o bolso agradece.",
  },
  {
    icone: "🕐",
    titulo: "O horário define o quanto as pessoas comem",
    texto:
      "Festa em horário de almoço ou jantar precisa de refeição de verdade — senão os convidados chegam com fome de refeição e só acham salgadinho. Já eventos de tarde funcionam bem só com mesa de doces.",
  },
];

export default async function CalculadoraEventosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/meus-pedidos" className="text-[12.5px] font-bold text-muted hover:underline">
        ← Meus pedidos
      </Link>

      <h1 className="mt-2 text-xl font-extrabold">Calculadora de festa</h1>
      <p className="mt-1 text-sm text-muted">
        Responda algumas perguntas sobre o seu evento e a gente estima quanto comprar de comida e bebida — sem faltar, e sem
        sobrar demais.
      </p>

      <div className="mt-6">
        <CalculadoraEventosForm />
      </div>

      <div className="mt-10">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Dicas para sua festa</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DICAS_BLOG.map((d) => (
            <div key={d.titulo} className="rounded-lg border border-border bg-surface p-4">
              <span className="text-xl">{d.icone}</span>
              <div className="mt-2 text-[12.5px] font-bold">{d.titulo}</div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{d.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
