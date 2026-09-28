import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatDataCurta, getAcordo, listMensagensAcordo } from "@/lib/data/permuta";
import { CancelarAcordoAdmin, ResolverDisputaForm } from "@/components/admin/PermutaAdminForms";
import { StatusAcordo, StatusEntrega, formatValor } from "@/components/permuta/ui";

export const dynamic = "force-dynamic";

export default async function AdminAcordoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const a = await getAcordo(id);
  if (!a) notFound();
  const mensagens = await listMensagensAcordo(id);
  const nome = (empresaId: string) => (empresaId === a.proponente_id ? a.proponente_nome : a.destinatario_nome);
  const entregas = [...a.entregas].sort((x, y) => x.ordem - y.ordem);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin/permutas?aba=acordos" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Acordos de permuta
      </Link>
      <div className="mb-5 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold">
          {a.proponente_nome} ⇄ {a.destinatario_nome}
        </h1>
        <StatusAcordo status={a.status} />
        <span className="text-[12px] text-muted">
          #{a.id.slice(0, 8).toUpperCase()} · versão {a.versao} · criado em {new Date(a.criado_em).toLocaleDateString("pt-BR")}
        </span>
      </div>

      {a.status === "em_disputa" && (
        <div className="mb-5 rounded-xl border border-[#f1c9ca] bg-danger-soft p-4 text-[13px] text-danger-dark">
          <b>Disputa aberta por {a.disputa_aberta_por ? nome(a.disputa_aberta_por) : "—"}:</b> {a.disputa_motivo}
        </div>
      )}
      {a.motivo_encerramento && (
        <p className="mb-5 text-[13px] text-muted">
          Encerramento: {a.motivo_encerramento}
          {a.cancelado_fora_janela ? " (fora da janela — penalizado)" : ""}
        </p>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {entregas.map((e) => (
          <section key={e.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-[13px]">
            <div className="flex items-center justify-between">
              <b>
                Entrega {e.ordem}: {nome(e.prestador_id)} → {nome(e.beneficiario_id)}
              </b>
              <StatusEntrega status={e.status} />
            </div>
            <div>{e.titulo} · {formatValor(e.valor_referencia)}</div>
            <div className="text-muted">
              {formatDataCurta(e.data_evento)} · {e.local_evento || "local a combinar"}
            </div>
            {e.escopo && <div className="whitespace-pre-line text-muted">{e.escopo}</div>}
            {e.avaliacao && (
              <div>
                Avaliação: ★ {e.avaliacao.nota} {e.avaliacao.pontual ? "· pontual" : "· atrasou"} {e.avaliacao.comentario && `— “${e.avaliacao.comentario}”`}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-[14px] font-bold">{a.status === "em_disputa" ? "Resolver disputa" : "Ajustar entregas"}</h2>
          <ResolverDisputaForm
            acordoId={a.id}
            entregas={entregas.map((e) => ({
              id: e.id,
              status: e.status,
              label: `Entrega ${e.ordem} — ${nome(e.prestador_id)}`,
            }))}
          />
          {!["cancelado", "recusado", "concluido"].includes(a.status) && (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-2 text-[13px] font-bold">Cancelar acordo</h3>
              <CancelarAcordoAdmin acordoId={a.id} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-[14px] font-bold">Linha do tempo e mensagens</h2>
          <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto text-[12.5px]">
            {mensagens.map((m) => (
              <li key={m.id} className={m.remetente_id ? "rounded-lg bg-surface-alt px-3 py-2" : "text-muted"}>
                <b>{m.remetente_nome ?? "Sistema"}</b> · {new Date(m.enviado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                <div>{m.conteudo}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
