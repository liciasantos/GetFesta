import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMinhasVagas, type MinhaVaga } from "@/lib/data/vagas";
import { listProfissionaisCompativeis, listCategoriasProfissionais } from "@/lib/data/profissionais";
import { listCidades } from "@/lib/data/geo";
import { Badge, buttonClass } from "@/components/ui";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import ProfissionalCard from "@/components/ProfissionalCard";
import BuscarProfissionaisPainel from "@/components/BuscarProfissionaisPainel";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  preenchida: "Preenchida",
  cancelada: "Não preenchida",
};

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
  const emAberto = vagas.filter((v) => !v.realizada && v.status === "aberta");
  const realizadas = vagas.filter((v) => v.realizada || v.status !== "aberta");

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
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

      <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-muted-2">Em aberto</h2>
      <div className="flex flex-col gap-3">
        {emAberto.map((v) => (
          <VagaRow key={v.id} vaga={v} />
        ))}
        {emAberto.length === 0 && (
          <p className="text-sm text-muted">
            Nenhuma vaga em aberto.{" "}
            <Link href="/painel/vagas/nova" className="font-bold text-accent-dark underline">
              Publicar uma
            </Link>
            .
          </p>
        )}
      </div>

      {realizadas.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">Encerradas</h2>
          <div className="flex flex-col gap-3">
            {realizadas.map((v) => (
              <VagaRow key={v.id} vaga={v} />
            ))}
          </div>
        </>
      )}

      <h2 className="mb-1 mt-10 text-lg font-extrabold">Profissionais em destaque</h2>
      <p className="mb-3 text-[12.5px] text-muted">Posição de anúncio — aparecem aqui por curadoria do time GetFesta.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {profissionaisDestaque.map((p) => (
          <ProfissionalCard key={p.usuario_id} p={p} />
        ))}
        {profissionaisDestaque.length === 0 && (
          <p className="col-span-full text-sm text-muted">Nenhum profissional em destaque no momento.</p>
        )}
      </div>

      <h2 className="mb-1 mt-10 text-lg font-extrabold">Buscar profissionais</h2>
      <p className="mb-3 text-[12.5px] text-muted">
        Profissionais compatíveis com as categorias da sua empresa — ordem sorteada a cada busca.
      </p>
      {profissionaisBusca.length === 0 ? (
        <p className="text-sm text-muted">Nenhum profissional compatível com as categorias da sua empresa ainda.</p>
      ) : (
        <BuscarProfissionaisPainel inicial={profissionaisBusca} cidades={cidades} categorias={categoriasProfissionais} />
      )}
    </div>
  );
}

function VagaRow({ vaga: v }: { vaga: MinhaVaga }) {
  const precisaFechamento = v.realizada && v.status === "aberta";
  return (
    <Link
      href={`/painel/vagas/${v.id}`}
      className="card-hover flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{v.categoria_nome}</span>
          <Badge tone={v.status === "aberta" ? "ok" : v.status === "preenchida" ? "ok" : "muted"}>
            {STATUS_LABEL[v.status] ?? v.status}
          </Badge>
          {precisaFechamento && <Badge tone="warn">Fechou com alguém?</Badge>}
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          {v.bairro_nome ?? v.cidade_nome} · {formatDateBR(v.data_evento)} · {v.hora_inicio.slice(0, 5)} ·{" "}
          {Number(v.duracao_horas)}h · {v.valor ? formatCurrencyBRL(v.valor) : "a combinar"}
        </p>
        {v.status === "preenchida" && v.profissional_selecionado_nome && (
          <p className="mt-1 text-[12px] font-semibold text-ok">✓ Fechado com {v.profissional_selecionado_nome}</p>
        )}
      </div>
      <div className="text-[12.5px] font-bold text-accent-dark">
        {v.total_candidatos} {v.total_candidatos === 1 ? "candidato" : "candidatos"} →
      </div>
    </Link>
  );
}
