import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMinhasVagas, type MinhaVaga } from "@/lib/data/vagas";
import { listProfissionaisCompativeis, listCategoriasProfissionais } from "@/lib/data/profissionais";
import { listCidades } from "@/lib/data/geo";
import { Badge, buttonClass } from "@/components/ui";
import { formatCurrencyBRL } from "@/lib/format";
import { nomeDaVaga } from "@/lib/vaga";
import ProfissionaisPainel from "@/components/ProfissionaisPainel";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  preenchida: "Preenchida",
  cancelada: "Não preenchida",
};

const ENCERRADAS_VISIVEIS = 6;

export default async function MinhasVagasPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const [vagas, profissionaisDestaque, profissionaisBusca, cidades, categoriasProfissionais] = await Promise.all([
    listMinhasVagas(session.usuarioId),
    listProfissionaisCompativeis(session.usuarioId, true),
    listProfissionaisCompativeis(session.usuarioId, false),
    listCidades(),
    listCategoriasProfissionais(),
  ]);

  // Grupos pensados em "o que eu preciso fazer?":
  //  1. evento já passou e a vaga segue aberta -> a empresa precisa dizer se fechou;
  //  2. em aberto (recebendo candidatos), do evento mais próximo pro mais distante;
  //  3. equipe fechada, evento ainda vai acontecer;
  //  4. encerradas (histórico), da mais recente pra mais antiga.
  // Antes eram só "Em aberto" e "Encerradas", e vagas com o selo "Aberta"
  // apareciam dentro de "Encerradas".
  const porData = (a: MinhaVaga, b: MinhaVaga) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime();
  const precisamDeVoce = vagas.filter((v) => v.realizada && v.status === "aberta").sort(porData);
  const emAberto = vagas.filter((v) => !v.realizada && v.status === "aberta").sort(porData);
  const equipeFechada = vagas.filter((v) => !v.realizada && v.status === "preenchida").sort(porData);
  const encerradas = vagas
    .filter((v) => (v.realizada && v.status !== "aberta") || (!v.realizada && v.status === "cancelada"))
    .sort((a, b) => porData(b, a));

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* HERÓI MOBILE — fundo escuro encostado nas bordas, igual ao da Home
          do painel; no desktop o cabeçalho de sempre (abaixo) continua. */}
      <div className="-mx-6 -mt-8 bg-text px-6 pb-6 pt-6 text-white sm:hidden">
        <Link href="/painel" className="text-[12.5px] font-bold text-accent underline">
          ← Voltar
        </Link>
        <h1 className="mt-3 text-xl font-extrabold">Minhas vagas para profissionais</h1>
        <p className="mt-2 text-sm text-white/70">Freelas pontuais (ator, animador, garçom...) para um evento específico.</p>
        <Link href="/painel/vagas/nova" className={`${buttonClass("primary")} mt-4 w-full`}>
          Publicar Vaga
        </Link>
      </div>

      <div className="hidden sm:block">
        <Link href="/painel" className="text-[12.5px] font-bold text-accent-dark underline">
          ← Voltar
        </Link>

        <div className="mb-1 mt-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold">Minhas vagas para profissionais</h1>
          <Link href="/painel/vagas/nova" className={buttonClass("primary", "sm")}>
            + Publicar vaga
          </Link>
        </div>
        <p className="text-sm text-muted">Freelas pontuais (ator, animador, garçom...) para um evento específico.</p>
      </div>

      <nav aria-label="Resumo das vagas" className="mt-6 flex flex-wrap gap-2 text-[12.5px] font-bold">
        {precisamDeVoce.length > 0 && (
          <a href="#precisam" className="rounded-full border border-note-border bg-note-bg px-3 py-1.5 text-note-text">
            {precisamDeVoce.length} {precisamDeVoce.length === 1 ? "precisa" : "precisam"} de você
          </a>
        )}
        <a href="#abertas" className="rounded-full border border-border bg-surface px-3 py-1.5">
          {emAberto.length} em aberto
        </a>
        {equipeFechada.length > 0 && (
          <a href="#fechadas" className="rounded-full border border-border bg-surface px-3 py-1.5">
            {equipeFechada.length} com equipe fechada
          </a>
        )}
        {encerradas.length > 0 && (
          <a href="#encerradas" className="rounded-full border border-border bg-surface px-3 py-1.5 text-muted">
            {encerradas.length} {encerradas.length === 1 ? "encerrada" : "encerradas"}
          </a>
        )}
      </nav>

      {precisamDeVoce.length > 0 && (
        <Grupo
          id="precisam"
          titulo="Precisam de você"
          descricao="O evento já passou e a vaga continua aberta. Conte se fechou com alguém para encerrar e avaliar o profissional."
          destaque
        >
          {precisamDeVoce.map((v) => (
            <VagaRow key={v.id} vaga={v} />
          ))}
        </Grupo>
      )}

      <Grupo id="abertas" titulo="Em aberto" descricao="Recebendo candidatos — do evento mais próximo para o mais distante.">
        {emAberto.map((v) => (
          <VagaRow key={v.id} vaga={v} />
        ))}
        {emAberto.length === 0 && (
          <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-muted">
            Nenhuma vaga em aberto.{" "}
            <Link href="/painel/vagas/nova" className="font-bold text-accent-dark underline">
              Publicar uma
            </Link>
            .
          </p>
        )}
      </Grupo>

      {equipeFechada.length > 0 && (
        <Grupo id="fechadas" titulo="Equipe fechada" descricao="Todos os profissionais escolhidos — o evento ainda vai acontecer.">
          {equipeFechada.map((v) => (
            <VagaRow key={v.id} vaga={v} />
          ))}
        </Grupo>
      )}

      {encerradas.length > 0 && (
        <Grupo id="encerradas" titulo="Encerradas" descricao="Histórico, da mais recente para a mais antiga.">
          {encerradas.slice(0, ENCERRADAS_VISIVEIS).map((v) => (
            <VagaRow key={v.id} vaga={v} apagada />
          ))}
          {encerradas.length > ENCERRADAS_VISIVEIS && (
            <Link href="/painel/vagas/concluidas" className="self-start text-[12.5px] font-bold text-accent-dark underline">
              Ver histórico completo →
            </Link>
          )}
        </Grupo>
      )}

      <h2 className="mb-1 mt-10 text-lg font-extrabold">Profissionais em destaque</h2>
      <p className="mb-3 text-[12.5px] text-muted">Posição de anúncio — aparecem aqui por curadoria do time GetFesta.</p>
      {profissionaisDestaque.length === 0 ? (
        <p className="text-sm text-muted">Nenhum profissional em destaque no momento.</p>
      ) : (
        <ProfissionaisPainel inicial={profissionaisDestaque} porPagina={5} mostrarFiltros={false} />
      )}

      <h2 className="mb-1 mt-10 text-lg font-extrabold">Buscar profissionais</h2>
      <p className="mb-3 text-[12.5px] text-muted">
        Profissionais compatíveis com as categorias da sua empresa — ordem sorteada a cada busca.
      </p>
      {profissionaisBusca.length === 0 ? (
        <p className="text-sm text-muted">Nenhum profissional compatível com as categorias da sua empresa ainda.</p>
      ) : (
        <ProfissionaisPainel
          inicial={profissionaisBusca}
          cidades={cidades}
          categorias={categoriasProfissionais}
          porPagina={20}
        />
      )}
    </div>
  );
}

function Grupo({
  id,
  titulo,
  descricao,
  destaque = false,
  children,
}: {
  id: string;
  titulo: string;
  descricao: string;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-24">
      <h2 className={`text-[15px] font-extrabold ${destaque ? "text-note-text" : ""}`}>{titulo}</h2>
      <p className="mb-3 mt-0.5 text-[12.5px] text-muted">{descricao}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/** "hoje", "amanhã", "em 5 dias" (fuso de Brasília); null se já passou. */
function quandoFalta(dataEvento: string | Date) {
  const d = new Date(dataEvento);
  const evento = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const [y, m, dia] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })
    .format(new Date())
    .split("-")
    .map(Number);
  const dias = Math.round((evento - Date.UTC(y, m - 1, dia)) / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias > 1) return `em ${dias} dias`;
  return null;
}

function VagaRow({ vaga: v, apagada = false }: { vaga: MinhaVaga; apagada?: boolean }) {
  const precisaFechamento = v.realizada && v.status === "aberta";
  const d = new Date(v.data_evento);
  const falta = !v.realizada ? quandoFalta(v.data_evento) : null;
  const status = precisaFechamento
    ? { tone: "warn" as const, texto: "Fechou com alguém?" }
    : v.status === "aberta"
      ? { tone: "ok" as const, texto: "Aberta" }
      : v.status === "preenchida"
        ? { tone: "ok" as const, texto: v.realizada ? "Realizada" : "Equipe fechada" }
        : { tone: "muted" as const, texto: STATUS_LABEL[v.status] ?? v.status };
  return (
    <Link
      href={`/painel/vagas/${v.id}`}
      className={`card-hover flex items-center gap-4 rounded-xl border border-border bg-surface p-4 ${apagada ? "opacity-80" : ""}`}
    >
      {/* bloco de data: dá pra achar a vaga do dia certo só batendo o olho */}
      <div
        className={`flex w-14 shrink-0 flex-col items-center rounded-lg py-2 ${
          precisaFechamento ? "bg-note-bg text-note-text" : "bg-surface-alt"
        }`}
      >
        <span className="font-display text-xl font-extrabold leading-none">{String(d.getUTCDate()).padStart(2, "0")}</span>
        <span className="mt-0.5 text-[10.5px] font-bold tracking-wide text-muted">{MESES[d.getUTCMonth()]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold">{nomeDaVaga(v)}</span>
          {v.titulo && (
            <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-muted">{v.categoria_nome}</span>
          )}
          <Badge tone={status.tone}>{status.texto}</Badge>
          {v.vagas_desejadas > 1 && (
            <Badge tone="muted">
              {v.total_selecionados} de {v.vagas_desejadas} preenchidas
            </Badge>
          )}
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          {v.bairro_nome ?? v.cidade_nome} · {v.hora_inicio.slice(0, 5)} · {Number(v.duracao_horas)}h ·{" "}
          {v.valor ? formatCurrencyBRL(v.valor) : "a combinar"}
          {falta && <span className="font-semibold text-text"> · {falta}</span>}
        </p>
        {v.total_selecionados > 0 && (
          <p className="mt-1 text-[12px] font-semibold text-ok">
            ✓ {v.total_selecionados} {v.total_selecionados === 1 ? "profissional selecionado" : "profissionais selecionados"}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right text-[12.5px] font-bold text-accent-dark">
        {v.total_candidatos}
        <span className="hidden sm:inline"> {v.total_candidatos === 1 ? "candidato" : "candidatos"}</span> →
      </div>
    </Link>
  );
}
