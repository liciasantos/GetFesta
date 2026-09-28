import Link from "next/link";
import {
  acoesPendentes,
  diasAte,
  formatDataCurta,
  getPerfilPermuta,
  getPermutaConfig,
  listAcordos,
  saldo,
  visaoDoAcordo,
} from "@/lib/data/permuta";

export type ResumoPermutaPainel =
  | { tipo: "desligada" }
  | { tipo: "nao_participa" }
  | {
      tipo: "participa";
      pausada: boolean;
      devo: number;
      devem: number;
      acoes: number;
      proxima: { acordoId: string; texto: string; data: string; dias: number } | null;
    };

/** Dados do card "Permutas" do Painel inicial - uma consulta só, usada nas
 * duas posições do card (coluna direita no desktop, topo no mobile). */
export async function getResumoPermutaPainel(empresaId: string): Promise<ResumoPermutaPainel> {
  try {
    const cfg = await getPermutaConfig();
    if (!cfg.ativa) return { tipo: "desligada" };
    const perfil = await getPerfilPermuta(empresaId, cfg);
    if (!perfil) return { tipo: "desligada" };
    const acordos = (await listAcordos(empresaId)).map((a) => visaoDoAcordo(a, empresaId));
    if (!perfil.participa && acordos.length === 0) return { tipo: "nao_participa" };
    const { devo, devem } = saldo(acordos);
    const proximas = acordos
      .filter((a) => a.status === "em_execucao")
      .flatMap((a) =>
        a.entregas
          .filter((e) => e.status === "agendada" && diasAte(e.data_evento) >= 0)
          .map((e) => ({
            acordoId: a.id,
            data: e.data_evento,
            dias: diasAte(e.data_evento),
            texto: e.prestador_id === empresaId ? `Você entrega para ${a.parceiroNome}` : `${a.parceiroNome} entrega para você`,
          }))
      )
      .sort((x, y) => x.data.localeCompare(y.data));
    return {
      tipo: "participa",
      pausada: !perfil.participa,
      devo,
      devem,
      acoes: acoesPendentes(acordos).length,
      proxima: proximas[0] ?? null,
    };
  } catch {
    // banco sem as tabelas da permuta: o painel inicial não pode quebrar por isso
    return { tipo: "desligada" };
  }
}

export default function PermutaResumoCard({ resumo }: { resumo: ResumoPermutaPainel }) {
  if (resumo.tipo === "desligada") return null;

  if (resumo.tipo === "nao_participa") {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Novo · Permutas</p>
        <p className="mt-1 text-[13.5px] font-bold">Pague com o seu serviço</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Troque serviços com outras empresas de eventos para a sua própria festa — sem dinheiro envolvido.
        </p>
        <Link href="/painel/permutas" className="mt-2.5 inline-block text-[12.5px] font-bold text-accent-dark underline">
          Conhecer a rede de permutas →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Permutas</p>
        {resumo.acoes > 0 && (
          <span className="rounded-full bg-accent-dark px-2 py-0.5 text-[11px] font-extrabold text-white">
            {resumo.acoes} {resumo.acoes === 1 ? "ação" : "ações"}
          </span>
        )}
      </div>
      {resumo.pausada && <p className="mt-1 text-[12px] font-semibold text-note-text">Participação pausada</p>}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-note-bg px-3 py-2">
          <div className="text-[11px] font-semibold text-note-text">Você deve</div>
          <div className="font-display text-[17px] font-extrabold">{resumo.devo}</div>
        </div>
        <div className="rounded-lg bg-ok-soft px-3 py-2">
          <div className="text-[11px] font-semibold text-ok">Te devem</div>
          <div className="font-display text-[17px] font-extrabold">{resumo.devem}</div>
        </div>
      </div>
      {resumo.proxima && (
        <Link href={`/painel/permutas/acordos/${resumo.proxima.acordoId}`} className="mt-2.5 block rounded-lg border border-border px-3 py-2 hover:bg-surface-alt">
          <div className="text-[11px] font-semibold text-muted">Próxima entrega</div>
          <div className="text-[12.5px] font-bold">{resumo.proxima.texto}</div>
          <div className="text-[11.5px] text-muted">
            {formatDataCurta(resumo.proxima.data)}
            {resumo.proxima.dias === 0 ? " · hoje" : ` · em ${resumo.proxima.dias} dia(s)`}
          </div>
        </Link>
      )}
      <Link href="/painel/permutas" className="mt-2.5 inline-block text-[12.5px] font-bold text-accent-dark underline">
        {resumo.acoes > 0 ? "Ver o que precisa da sua ação →" : "Abrir Permutas →"}
      </Link>
    </div>
  );
}
