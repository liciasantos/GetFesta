import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuPerfilProfissional, listCategoriasProfissionais } from "@/lib/data/profissionais";
import { listCidades } from "@/lib/data/geo";
import { listVagasCompativeis } from "@/lib/data/vagas";
import { listDiasIndisponiveis } from "@/lib/data/disponibilidade";
import AvatarUpload from "@/components/AvatarUpload";
import GaleriaManager from "@/components/GaleriaManager";
import DisponibilidadeCalendar from "@/components/DisponibilidadeCalendar";
import CandidatarVagaButton from "@/components/CandidatarVagaButton";
import { adicionarFotoGaleriaProfissional, atualizarFotoProfissional, removerFotoGaleriaProfissional } from "@/lib/actions/perfil";
import { Badge } from "@/components/ui";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import PerfilProfissionalForm from "./PerfilProfissionalForm";

export const dynamic = "force-dynamic";

const DISPONIBILIDADE_LABEL: Record<string, string> = {
  disponivel: "Disponível para novos eventos",
  indisponivel: "Indisponível no momento",
  nao_informado: "Não informado",
};

export default async function PerfilProfissionalPage() {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") redirect("/entrar");

  const [perfil, categorias, cidades, vagas, diasIndisponiveis] = await Promise.all([
    getMeuPerfilProfissional(session.usuarioId),
    listCategoriasProfissionais(),
    listCidades(),
    listVagasCompativeis(session.usuarioId),
    listDiasIndisponiveis(session.usuarioId),
  ]);
  if (!perfil) redirect("/entrar");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-extrabold">Meu catálogo profissional</h1>
      <p className="mt-1 text-sm text-muted">
        Seu perfil não aparece para clientes finais — só empresas autenticadas na GetFesta podem ver e te contatar.
      </p>

      {/* Cadastro via Google não pede bairro/funcoes - avisa que falta completar */}
      {(!perfil.bairro_id || perfil.categorias.length === 0) && (
        <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-[#efece5] p-3 text-[12.5px] text-muted">
          ⚠️ Falta completar seu catálogo pra empresas te encontrarem:{" "}
          {!perfil.bairro_id && <b className="text-text">bairro</b>}
          {!perfil.bairro_id && perfil.categorias.length === 0 && " e "}
          {perfil.categorias.length === 0 && <b className="text-text">funções que você exerce</b>} — preencha no
          formulário abaixo.
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
        <AvatarUpload initialUrl={perfil.foto_perfil_url} name={perfil.nome} action={atualizarFotoProfissional} />
        <Badge tone={perfil.disponibilidade_status === "disponivel" ? "ok" : "muted"}>
          {DISPONIBILIDADE_LABEL[perfil.disponibilidade_status]}
        </Badge>
      </div>

      <h2 className="mb-2 mt-8 text-xs font-bold uppercase tracking-wide text-muted-2">
        Vagas compatíveis com suas funções e cidade
      </h2>
      <div className="overflow-hidden rounded-xl border border-border">
        {vagas.length === 0 && <p className="p-4 text-[12.5px] text-muted">Nenhuma vaga compatível por enquanto.</p>}
        {vagas.map((vaga) => (
          <div key={vaga.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 last:border-b-0">
            <div className="text-[12.5px]">
              <span className="font-bold">{vaga.categoria_nome}</span> · {vaga.bairro_nome ?? vaga.cidade_nome} ·{" "}
              {formatDateBR(vaga.data_evento)} · {vaga.hora_inicio.slice(0, 5)} · {Number(vaga.duracao_horas)}h
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold">
                  {vaga.valor ? formatCurrencyBRL(vaga.valor) : "Valor a combinar"}
                </span>
              </div>
              <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted">{vaga.descricao}</p>
            </div>
            <div>
              {vaga.ja_candidatado ? (
                <Badge tone="ok">Candidatura enviada</Badge>
              ) : (
                <CandidatarVagaButton vagaId={vaga.id} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Fotos (até 4)</h2>
        <GaleriaManager
          fotos={perfil.galeria}
          onAdd={adicionarFotoGaleriaProfissional}
          onRemove={removerFotoGaleriaProfissional}
          limite={4}
        />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Calendário de disponibilidade</h2>
        <DisponibilidadeCalendar diasIndisponiveisIniciais={diasIndisponiveis} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <PerfilProfissionalForm perfil={perfil} categorias={categorias} cidades={cidades} />
      </div>
    </div>
  );
}
