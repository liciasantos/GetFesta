import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuEventoRsvp, listConvidados } from "@/lib/data/rsvp";
import { formatDateBR } from "@/lib/format";
import { Icon } from "@/components/Icon";
import AdicionarConvidadoForm from "@/components/rsvp/AdicionarConvidadoForm";
import AparenciaEventoRsvpForm from "@/components/rsvp/AparenciaEventoRsvpForm";
import ConvidadosLista from "@/components/rsvp/ConvidadosLista";
import ExcluirEventoRsvpButton from "@/components/rsvp/ExcluirEventoRsvpButton";
import LinkPublicoRsvp from "@/components/rsvp/LinkPublicoRsvp";
import { BarraConfirmacao, BlocoData, SecaoTitulo } from "@/components/cliente/ui";
import { diasAte, rotuloContagem } from "@/lib/festa-datas";

export const dynamic = "force-dynamic";

export default async function EventoRsvpPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const { id } = await params;
  const evento = await getMeuEventoRsvp(id, session.usuarioId);
  if (!evento) notFound();

  const convidados = await listConvidados(id);
  const confirmados = evento.total_confirmados;
  const recusados = evento.total_recusados;
  const aguardando = evento.total_convidados - confirmados - recusados;
  const adultosConfirmados = convidados.filter((c) => c.confirmado === true && c.tipo_convidado === "adulto").length;
  const criancasConfirmadas = convidados.filter((c) => c.confirmado === true && c.tipo_convidado === "crianca").length;
  const previstos = evento.adultos_previstos + evento.criancas_previstas;
  const dias = diasAte(evento.data_evento);

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
      <Link href="/lista-convidados" className="inline-flex items-center gap-1 text-[13px] font-bold text-muted hover:text-text">
        <span aria-hidden>←</span> Minhas listas
      </Link>

      <div className="mt-3 flex items-center gap-4">
        <BlocoData data={evento.data_evento} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-[22px] font-extrabold leading-tight sm:text-[24px]">{evento.titulo}</h1>
          <p className="text-[13px] text-muted">
            {formatDateBR(evento.data_evento)} · <span className={dias >= 0 ? "font-semibold text-accent-dark" : ""}>{rotuloContagem(dias)}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* RESUMO */}
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[14px]">
              <b className="font-display text-[28px] font-extrabold leading-none">{confirmados}</b>
              <span className="text-muted"> de {evento.total_convidados} confirmaram</span>
            </p>
            {evento.total_convidados > 0 && (
              <span className="text-[13px] font-bold text-ok">{Math.round((confirmados / evento.total_convidados) * 100)}%</span>
            )}
          </div>
          <BarraConfirmacao confirmados={confirmados} aguardando={aguardando} recusados={recusados} className="mt-3 h-2.5" />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Numero valor={confirmados} rotulo="Vão" cor="bg-ok" />
            <Numero valor={aguardando} rotulo="Aguardando" cor="bg-border-strong" />
            <Numero valor={recusados} rotulo="Não vão" cor="bg-danger-soft" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5 text-[13px]">
            <span className="text-muted">
              Confirmados: <b className="text-text">{adultosConfirmados} adultos</b> e <b className="text-text">{criancasConfirmadas} crianças</b>
            </span>
            {previstos > 0 && (
              <Link href={`/calculadora-eventos?lista=${evento.id}`} className="inline-flex items-center gap-1.5 font-bold text-accent-dark hover:underline">
                <Icon name="calculator" className="h-4 w-4" /> Calcular comida e bebida
              </Link>
            )}
          </div>
        </section>

        <LinkPublicoRsvp slug={evento.slug_publico} titulo={evento.titulo} />
      </div>

      {/* CONVIDADOS */}
      <div className="mt-7">
        <SecaoTitulo>Convidados ({evento.total_convidados})</SecaoTitulo>
        <AdicionarConvidadoForm eventoRsvpId={evento.id} />
        <div className="mt-4">
          <ConvidadosLista convidados={convidados} eventoSlug={evento.slug_publico} eventoTitulo={evento.titulo} />
        </div>
      </div>

      {/* AJUSTES */}
      <div className="mt-8 flex flex-col gap-3">
        <details className="group rounded-2xl border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-[14px] font-bold">
            <span className="flex items-center gap-2">
              <Icon name="sparkles" className="h-4 w-4 text-accent-dark" /> Personalizar a página do convite
            </span>
            <span className="text-muted-2 transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="border-t border-border p-4 pt-3">
            <AparenciaEventoRsvpForm eventoRsvpId={evento.id} corFundo={evento.cor_fundo} imagemCapa={evento.imagem_capa} />
          </div>
        </details>
        <div className="flex justify-end">
          <ExcluirEventoRsvpButton eventoRsvpId={evento.id} />
        </div>
      </div>
    </div>
  );
}

function Numero({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: string }) {
  return (
    <div className="rounded-xl bg-surface-alt/60 px-2 py-2.5">
      <p className="font-display text-[20px] font-extrabold leading-none">{valor}</p>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-muted">
        <span className={`h-2 w-2 rounded-full ${cor}`} aria-hidden />
        {rotulo}
      </p>
    </div>
  );
}
