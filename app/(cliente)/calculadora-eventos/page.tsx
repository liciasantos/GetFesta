import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMeusEventosRsvp } from "@/lib/data/rsvp";
import CalculadoraEventosForm, { type ListaParaCalculadora } from "@/components/CalculadoraEventosForm";
import { Icon, type IconName } from "@/components/Icon";
import { SecaoTitulo } from "@/components/cliente/ui";
import { diasAte } from "@/lib/festa-datas";

export const dynamic = "force-dynamic";

const DICAS: Array<{ icon: IconName; titulo: string; texto: string }> = [
  {
    icon: "doce",
    titulo: "Docinhos: no máximo 3 sabores",
    texto:
      "Mesa cheia de opção parece mais generosa, mas costuma sobrar de tudo um pouco e faltar no total. Escolha 2 ou 3 sabores e capriche na quantidade.",
  },
  {
    icon: "carne",
    titulo: "Churrasco em conta sem perder qualidade",
    texto:
      "Misture um corte nobre (picanha, fraldinha) puxando o sabor com cortes mais em conta (coxão mole, linguiça, frango) garantindo volume.",
  },
  {
    icon: "clock",
    titulo: "O horário define quanto se come",
    texto:
      "Festa em horário de almoço ou jantar pede refeição de verdade. Já à tarde, mesa de doces e salgados costuma bastar.",
  },
];

export default async function CalculadoraEventosPage({ searchParams }: { searchParams: Promise<{ lista?: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const sp = await searchParams;
  const listas: ListaParaCalculadora[] = (await listMeusEventosRsvp(session.usuarioId))
    .filter((l) => diasAte(l.data_evento) >= 0 && l.adultos_previstos + l.criancas_previstas > 0)
    .map((l) => ({ id: l.id, titulo: l.titulo, adultos: l.adultos_previstos, criancas: l.criancas_previstas }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-[24px] font-extrabold leading-tight">Calculadora de festa</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-muted">
        Responda 4 perguntas e veja quanto comprar de comida e bebida — sem faltar e sem sobrar demais.
      </p>

      <div className="mt-5">
        <CalculadoraEventosForm listas={listas} listaInicial={sp.lista} />
      </div>

      <div className="mt-10">
        <SecaoTitulo>Dicas para acertar na compra</SecaoTitulo>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DICAS.map((d) => (
            <div key={d.titulo} className="rounded-2xl border border-border bg-surface p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                <Icon name={d.icon} className="h-5 w-5" />
              </span>
              <p className="mt-2.5 text-[14px] font-bold">{d.titulo}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{d.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
