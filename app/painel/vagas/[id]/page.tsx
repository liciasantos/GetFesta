import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAvaliacaoDaVaga, getVagaDaEmpresa, listCandidatosDaVaga } from "@/lib/data/vagas";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui";
import { FecharComCandidatoButton, NaoFechouButton, RemoverSelecaoButton } from "@/components/FecharVagaButton";
import AvaliarProfissionalForm from "@/components/AvaliarProfissionalForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  preenchida: "Preenchida",
  cancelada: "Não preenchida",
};

export default async function VagaCandidatosPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const { id } = await params;
  const vaga = await getVagaDaEmpresa(id, session.usuarioId);
  if (!vaga) notFound();

  const [candidatos, avaliacao] = await Promise.all([
    listCandidatosDaVaga(id, session.usuarioId),
    vaga.status === "preenchida" ? getAvaliacaoDaVaga(id, session.usuarioId) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/painel/vagas" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Minhas vagas
      </Link>

      <div className="mt-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-extrabold">{vaga.categoria_nome}</h1>
          <Badge tone={vaga.status === "aberta" ? "ok" : vaga.status === "preenchida" ? "ok" : "muted"}>
            {STATUS_LABEL[vaga.status] ?? vaga.status}
          </Badge>
          {vaga.realizada && vaga.status === "aberta" && <Badge tone="warn">Evento já passou — fechou com alguém?</Badge>}
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          {vaga.bairro_nome ?? vaga.cidade_nome} · {formatDateBR(vaga.data_evento)} · {vaga.hora_inicio.slice(0, 5)} ·{" "}
          {Number(vaga.duracao_horas)}h · {vaga.valor ? formatCurrencyBRL(vaga.valor) : "a combinar"}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed">{vaga.descricao}</p>

        {vaga.status === "preenchida" && vaga.profissional_selecionado_nome && vaga.profissional_selecionado_id && (
          <>
            <p className="mt-3 rounded-lg bg-ok-soft p-2.5 text-[12.5px] font-bold text-ok">
              ✓ Fechado com {vaga.profissional_selecionado_nome}
            </p>
            <div className="mt-2">
              <RemoverSelecaoButton vagaId={vaga.id} />
            </div>
            <AvaliarProfissionalForm
              vagaId={vaga.id}
              profissionalId={vaga.profissional_selecionado_id}
              profissionalNome={vaga.profissional_selecionado_nome}
              avaliacaoAtual={avaliacao}
            />
          </>
        )}
        {vaga.status === "cancelada" && (
          <p className="mt-3 rounded-lg bg-surface-alt p-2.5 text-[12.5px] font-semibold text-muted">
            Não fechou com nenhum candidato dessa vez.
          </p>
        )}
        {vaga.status === "aberta" && candidatos.length > 0 && (
          <div className="mt-3">
            <NaoFechouButton vagaId={vaga.id} />
          </div>
        )}
      </div>

      <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-muted-2">
        Candidatos ({candidatos.length})
      </h2>
      <div className="flex flex-col gap-2.5">
        {candidatos.map((c) => (
          <div key={c.profissional_id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <Link href={`/profissional/${c.profissional_slug}`} className="flex items-center gap-3 hover:underline">
              {c.foto_perfil_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.foto_perfil_url} alt={c.nome} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-extrabold text-accent-dark">
                  {c.nome[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-[13px] font-bold">
                  {c.nome} {vaga.profissional_selecionado_id === c.profissional_id && <span className="text-ok">✓</span>}
                </div>
                <div className="text-[11px] text-muted">candidatou-se em {formatDateBR(c.candidatado_em)}</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {c.telefone && (
                <a
                  href={buildWhatsAppLink(c.telefone, `Olá ${c.nome}! Vi seu interesse na vaga que publiquei na GetFesta.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-bold text-white hover:bg-accent-dark"
                >
                  💬 WhatsApp
                </a>
              )}
              {vaga.status === "aberta" && <FecharComCandidatoButton vagaId={vaga.id} profissionalId={c.profissional_id} />}
            </div>
          </div>
        ))}
        {candidatos.length === 0 && (
          <p className="text-sm text-muted">Nenhum candidato ainda — profissionais compatíveis já estão vendo essa vaga.</p>
        )}
      </div>
    </div>
  );
}
