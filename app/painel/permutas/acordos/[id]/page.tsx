import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  diasAte,
  formatDataCurta,
  getAcordo,
  getContatoEmpresa,
  getPerfilPermuta,
  getPermutaConfig,
  hojeISO,
  listMensagensAcordo,
  listFotosAcordo,
  contarFotosGaleria,
  MAX_FOTOS_POR_ENTREGA,
  type FotoEntrega,
  visaoDoAcordo,
  type EntregaPermuta,
} from "@/lib/data/permuta";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  AssinaturaAcoes,
  ConfirmarEntregaForm,
  DisputaCancelamento,
  EditarTermosForm,
  MensagemForm,
} from "@/components/permuta/AcordoClient";
import { Equilibrio } from "@/components/permuta/PropostaForm";
import FotosEntrega from "@/components/permuta/FotosEntrega";
import { EmpresaAvatar, NivelBadge, StatusAcordo, StatusEntrega, formatValor } from "@/components/permuta/ui";

export const dynamic = "force-dynamic";

export default async function AcordoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const acordoRaw = await getAcordo(id);
  if (!acordoRaw || ![acordoRaw.proponente_id, acordoRaw.destinatario_id].includes(session.usuarioId)) notFound();
  const a = visaoDoAcordo(acordoRaw, session.usuarioId);

  const cfg = await getPermutaConfig();
  const assinado = !!(a.assinado_proponente_em && a.assinado_destinatario_em);
  const [mensagens, perfilParceiro, contato, fotos, fotosGaleria] = await Promise.all([
    listMensagensAcordo(id),
    getPerfilPermuta(a.parceiroId, cfg),
    assinado ? getContatoEmpresa(a.parceiroId) : Promise.resolve(null),
    listFotosAcordo(id),
    contarFotosGaleria(session.usuarioId),
  ]);

  const entregas = [...a.entregas].sort((x, y) => x.ordem - y.ordem);
  const feitas = entregas.filter((e) => e.status === "confirmada").length;
  const hoje = hojeISO();
  const whatsapp = contato?.telefone_contato ? buildWhatsAppLink(contato.telefone_contato, `Olá! Sobre a nossa permuta pela GetFesta.`) : null;

  const banner = (() => {
    if (a.status === "proposta")
      return a.minhaAssinatura
        ? { cls: "bg-info-soft text-info-dark", txt: `Você já assinou a versão ${a.versao}. Aguardando ${a.parceiroNome} revisar e assinar.` }
        : { cls: "bg-note-bg text-note-text", txt: `${a.parceiroNome} assinou a versão ${a.versao}. Revise os termos e assine para liberar os contatos.` };
    if (a.status === "em_disputa") return { cls: "bg-danger-soft text-danger-dark", txt: "Acordo em disputa — congelado até a equipe GetFesta analisar." };
    if (a.status === "concluido") return { cls: "bg-ok-soft text-ok", txt: "Permuta concluída: as duas entregas foram realizadas." };
    if (a.status === "cancelado" || a.status === "recusado")
      return { cls: "bg-surface-alt text-muted", txt: `${a.status === "recusado" ? "Proposta recusada" : "Acordo cancelado"}${a.motivo_encerramento ? `: ${a.motivo_encerramento}` : "."}` };
    const minha = a.minhaEntrega;
    const dele = a.entregaParceiro;
    if (minha?.status === "confirmada" && dele?.status === "agendada")
      return { cls: "bg-ok-soft text-ok", txt: `Você já fez a sua parte. Falta a entrega de ${a.parceiroNome} em ${formatDataCurta(dele.data_evento)}.` };
    if (dele?.status === "confirmada" && minha?.status === "agendada")
      return { cls: "bg-note-bg text-note-text", txt: `${a.parceiroNome} já fez a entrega. A sua é em ${formatDataCurta(minha.data_evento)}.` };
    return { cls: "bg-info-soft text-info-dark", txt: "Acordo assinado pelas duas empresas. Contatos liberados." };
  })();

  const podeCancelar = a.status === "em_execucao" && feitas === 0;
  const proximaDias = Math.min(...entregas.filter((e) => e.status === "agendada").map((e) => diasAte(e.data_evento)));
  const textoCancelamento =
    feitas > 0
      ? "Como uma entrega já foi feita, o acordo só pode ser encerrado pela equipe GetFesta. Se não puder comparecer, combine um substituto verificado pelo chat."
      : proximaDias < cfg.janelaCancelamentoDias
        ? `Faltam ${proximaDias} dia(s) para a próxima entrega: cancelar agora reduz seu nível por ${cfg.diasPenalidadeCancelamento} dias.`
        : `Você pode cancelar sem penalidade até ${cfg.janelaCancelamentoDias} dias antes de cada entrega.`;

  return (
    <div className="flex flex-col gap-5">
      <nav className="text-[12.5px] text-muted">
        <Link href="/painel/permutas" className="font-bold text-accent-dark underline">
          Permutas
        </Link>{" "}
        / Acordo #{a.id.slice(0, 8).toUpperCase()}
      </nav>

      <div className="flex flex-wrap items-center gap-4">
        <EmpresaAvatar id={a.parceiroId} nome={a.parceiroNome} temLogo={a.parceiroTemLogo} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">Permuta com {a.parceiroNome}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            {perfilParceiro && <NivelBadge nivel={perfilParceiro.nivel} />}
            <StatusAcordo status={a.status} />
            {a.status === "em_execucao" && <span>{feitas} de 2 entregas feitas</span>}
            <span>Versão {a.versao}</span>
          </div>
        </div>
        <Link href={`/empresa/${a.parceiroSlug}`} className="text-[12.5px] font-bold text-accent-dark underline">
          Ver perfil
        </Link>
      </div>

      <div className={`rounded-xl px-4 py-3 text-[13.5px] font-semibold ${banner.cls}`}>{banner.txt}</div>
      {a.disputa_resolucao && (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-[13px]">
          <b>Decisão da equipe GetFesta:</b> {a.disputa_resolucao}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {entregas.map((e) => (
          <EntregaCard
            key={e.id}
            e={e}
            eu={e.prestador_id === session.usuarioId}
            parceiro={a.parceiroNome}
            status={a.status}
            hoje={hoje}
            horas={cfg.horasConfirmacaoAutomatica}
            fotos={fotos.filter((f) => f.entrega_id === e.id)}
            vagasGaleria={Math.max(0, 12 - fotosGaleria)}
          />
        ))}
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-[14.5px] font-extrabold">Equilíbrio</h3>
        <Equilibrio meu={a.minhaEntrega?.valor_referencia ?? 0} dele={a.entregaParceiro?.valor_referencia ?? 0} />
        {a.compensacao && <p className="mt-2 text-[13px]">Compensação combinada: <b>{a.compensacao}</b></p>}
      </section>

      {a.status === "proposta" && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14.5px] font-extrabold">Assinatura</h3>
          <ul className="text-[13px] text-muted">
            <li>
              {a.souProponente ? "Você" : a.proponente_nome}: {a.assinado_proponente_em ? "assinou" : "ainda não assinou"}
            </li>
            <li>
              {a.souProponente ? a.destinatario_nome : "Você"}: {a.assinado_destinatario_em ? "assinou" : "ainda não assinou"}
            </li>
          </ul>
          <AssinaturaAcoes acordoId={a.id} podeAssinar={!a.minhaAssinatura} souDestinatario={!a.souProponente} />
          <EditarTermosForm
            acordoId={a.id}
            parceiroNome={a.parceiroNome}
            atuais={{
              dataMinha: a.minhaEntrega?.data_evento ?? "",
              dataParceiro: a.entregaParceiro?.data_evento ?? "",
              localMinha: a.minhaEntrega?.local_evento ?? "",
              localParceiro: a.entregaParceiro?.local_evento ?? "",
              escopoMinha: a.minhaEntrega?.escopo ?? "",
              escopoParceiro: a.entregaParceiro?.escopo ?? "",
              compensacao: a.compensacao ?? "",
            }}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-[14.5px] font-extrabold">Contato de {a.parceiroNome}</h3>
          {contato ? (
            <div className="flex flex-col gap-1.5 text-[13px]">
              {contato.telefone_contato && <div>Telefone: {contato.telefone_contato}</div>}
              {contato.instagram && <div>Instagram: {contato.instagram}</div>}
              {contato.email && <div>E-mail: {contato.email}</div>}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-1 font-bold text-ok underline">
                  Chamar no WhatsApp
                </a>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Os contatos são liberados depois que as duas empresas assinam o acordo.</p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14.5px] font-extrabold">Mensagens e histórico</h3>
          <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {mensagens.map((m) =>
              m.remetente_id === null ? (
                <div key={m.id} className="text-center text-[11.5px] text-muted">
                  {m.conteudo} · {new Date(m.enviado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </div>
              ) : (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
                    m.remetente_id === session.usuarioId ? "self-end bg-accent-soft" : "self-start bg-surface-alt"
                  }`}
                >
                  {m.conteudo}
                  <div className="mt-0.5 text-[11px] text-muted">
                    {m.remetente_id === session.usuarioId ? "Você" : m.remetente_nome} ·{" "}
                    {new Date(m.enviado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>
              )
            )}
          </div>
          {!["recusado", "cancelado"].includes(a.status) && (
            <MensagemForm acordoId={a.id} aviso={assinado ? null : "Telefones, e-mails e links ficam bloqueados até as duas assinaturas."} />
          )}
        </section>
      </div>

      {(a.status === "em_execucao" || a.status === "concluido") && (
        <DisputaCancelamento
          acordoId={a.id}
          podeCancelar={podeCancelar}
          textoCancelamento={a.status === "concluido" ? "Se algo não saiu como combinado, a equipe GetFesta pode analisar." : textoCancelamento}
          entregaIds={entregas.map((e) => ({
            id: e.id,
            label: e.prestador_id === session.usuarioId ? `Sua entrega: ${e.titulo}` : `Entrega de ${a.parceiroNome}: ${e.titulo}`,
          }))}
        />
      )}
    </div>
  );
}

function EntregaCard({
  e,
  eu,
  parceiro,
  status,
  hoje,
  horas,
  fotos,
  vagasGaleria,
}: {
  e: EntregaPermuta;
  eu: boolean;
  parceiro: string;
  status: string;
  hoje: string;
  horas: number;
  fotos: FotoEntrega[];
  vagasGaleria: number;
}) {
  const recebo = !eu;
  const podeConfirmar = recebo && status === "em_execucao" && e.status === "agendada" && e.data_evento <= hoje;
  const podeAvaliar = recebo && e.status === "confirmada" && !e.avaliacao;
  return (
    <section className={`flex flex-col gap-3 rounded-xl border bg-surface p-5 ${eu ? "border-accent-soft-2" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Entrega {e.ordem}</div>
          <h3 className="text-[15px] font-extrabold">{eu ? `Você → ${parceiro}` : `${parceiro} → Você`}</h3>
        </div>
        <StatusEntrega status={status === "proposta" ? "proposta" : e.status} />
      </div>
      <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[13px]">
        <dt className="text-muted">Serviço</dt>
        <dd className="font-semibold">{e.titulo}</dd>
        <dt className="text-muted">Data</dt>
        <dd>{formatDataCurta(e.data_evento)}</dd>
        <dt className="text-muted">Local</dt>
        <dd>{e.local_evento || "A combinar"}</dd>
        <dt className="text-muted">Preço normal</dt>
        <dd>{formatValor(e.valor_referencia)}</dd>
        {e.escopo && (
          <>
            <dt className="text-muted">Escopo</dt>
            <dd className="whitespace-pre-line">{e.escopo}</dd>
          </>
        )}
      </dl>
      {e.status === "confirmada" && (
        <div className="rounded-lg bg-bg p-3 text-[12.5px]">
          {e.confirmacao_automatica ? "Confirmada automaticamente (sem resposta no prazo)" : "Confirmada no check-in"}
          {e.confirmada_em ? ` · ${new Date(e.confirmada_em).toLocaleDateString("pt-BR")}` : ""}
          {e.avaliacao && (
            <div className="mt-1">
              Avaliação: <b>★ {e.avaliacao.nota}</b> {e.avaliacao.pontual ? "· pontual" : "· atrasou"}
              {e.avaliacao.comentario && <div className="mt-0.5 italic text-muted">“{e.avaliacao.comentario}”</div>}
            </div>
          )}
        </div>
      )}
      {recebo && status === "em_execucao" && e.status === "agendada" && !podeConfirmar && (
        <p className="text-[12.5px] text-muted">
          A confirmação abre no dia do evento. Você terá {horas} h para confirmar e avaliar.
        </p>
      )}
      {(podeConfirmar || podeAvaliar) && <ConfirmarEntregaForm entregaId={e.id} jaConfirmada={e.status === "confirmada"} />}
      {e.status === "confirmada" && (
        <FotosEntrega
          entregaId={e.id}
          modo={recebo ? "enviar" : "receber"}
          fotos={fotos}
          parceiroNome={parceiro}
          limite={MAX_FOTOS_POR_ENTREGA}
          vagasGaleria={vagasGaleria}
        />
      )}
    </section>
  );
}
