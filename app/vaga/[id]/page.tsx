import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getVagaPublica, getCandidaturaStatus } from "@/lib/data/vagas";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { Badge, buttonClass } from "@/components/ui";
import CandidatarVagaButton from "@/components/CandidatarVagaButton";
import CompartilharVagaButton from "@/components/CompartilharVagaButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  preenchida: "Preenchida",
  cancelada: "Encerrada",
};

const SEXO_LABEL: Record<string, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  indiferente: "Indiferente",
};

/** Página pública de uma vaga - existe pra dar um link compartilhável (ver
 * CompartilharVagaButton), já que o feed normal de vagas só mostra pra
 * profissionais compatíveis (mesma categoria/estado/sexo). Qualquer pessoa
 * pode abrir; só quem está logado como profissional vê o botão de
 * candidatura. */
export default async function VagaPublicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vaga = await getVagaPublica(id);
  if (!vaga) notFound();

  const session = await getSession();
  const candidaturaStatus =
    session?.tipo === "profissional" ? await getCandidaturaStatus(id, session.usuarioId) : null;
  const souDono = session?.tipo === "empresa" && session.usuarioId === vaga.empresa_id;

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-extrabold">{vaga.categoria_nome}</h1>
          <Badge tone={vaga.status === "aberta" ? "ok" : vaga.status === "preenchida" ? "ok" : "muted"}>
            {STATUS_LABEL[vaga.status] ?? vaga.status}
          </Badge>
          {vaga.vagas_desejadas > 1 && (
            <Badge tone="muted">
              {vaga.vagas_selecionadas} de {vaga.vagas_desejadas} preenchidas
            </Badge>
          )}
        </div>

        <p className="mt-1 text-[12.5px] text-muted">
          Publicada por{" "}
          <Link href={`/empresa/${vaga.empresa_slug}`} className="font-bold text-accent-dark underline">
            {vaga.empresa_nome_fantasia}
          </Link>
        </p>

        <p className="mt-3 text-[12.5px] text-muted">
          {vaga.bairro_nome ?? vaga.cidade_nome} · {formatDateBR(vaga.data_evento)} · {vaga.hora_inicio.slice(0, 5)} ·{" "}
          {Number(vaga.duracao_horas)}h · {vaga.valor ? formatCurrencyBRL(vaga.valor) : "Valor a combinar"}
        </p>
        <p className="mt-1 text-[12.5px] text-muted">Gênero desejado: {SEXO_LABEL[vaga.sexo_desejado] ?? vaga.sexo_desejado}</p>

        <p className="mt-3 text-[13px] leading-relaxed">{vaga.descricao}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <CompartilharVagaButton
            vagaId={vaga.id}
            variant="secondary"
            mensagem={`Vaga de ${vaga.categoria_nome} em ${vaga.cidade_nome} pra ${formatDateBR(vaga.data_evento)} - confira na GetFesta:`}
          />

          {souDono && (
            <Link href={`/painel/vagas/${vaga.id}`} className={buttonClass("secondary", "sm")}>
              Gerenciar candidatos
            </Link>
          )}

          {session?.tipo === "profissional" && vaga.status === "aberta" && (
            <>
              {candidaturaStatus === "selecionado" && <Badge tone="ok">🎉 Você foi selecionado!</Badge>}
              {candidaturaStatus === "recusado" && <Badge tone="muted">Não foi dessa vez</Badge>}
              {candidaturaStatus === "candidatado" && <Badge tone="ok">Candidatura enviada</Badge>}
              {!candidaturaStatus && <CandidatarVagaButton vagaId={vaga.id} />}
            </>
          )}

          {vaga.status !== "aberta" && !candidaturaStatus && <Badge tone="muted">Vaga encerrada</Badge>}

          {(!session || session.tipo === "cliente") && vaga.status === "aberta" && (
            <Link href="/entrar?tipo=profissional" className={buttonClass("primary", "sm")}>
              Sou profissional, quero me candidatar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
