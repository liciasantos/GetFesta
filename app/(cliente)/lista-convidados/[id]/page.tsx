import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuEventoRsvp, listConvidados } from "@/lib/data/rsvp";
import { formatDateBR } from "@/lib/format";
import AdicionarConvidadoForm from "@/components/rsvp/AdicionarConvidadoForm";
import AparenciaEventoRsvpForm from "@/components/rsvp/AparenciaEventoRsvpForm";
import ConvidadoLinha from "@/components/rsvp/ConvidadoLinha";
import ExcluirEventoRsvpButton from "@/components/rsvp/ExcluirEventoRsvpButton";
import LinkPublicoRsvp from "@/components/rsvp/LinkPublicoRsvp";

export const dynamic = "force-dynamic";

export default async function EventoRsvpPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const { id } = await params;
  const evento = await getMeuEventoRsvp(id, session.usuarioId);
  if (!evento) notFound();

  const convidados = await listConvidados(id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/lista-convidados" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Lista de convidados
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold">{evento.titulo}</h1>
          <p className="text-[12.5px] text-muted">{formatDateBR(evento.data_evento)}</p>
        </div>
        <ExcluirEventoRsvpButton eventoRsvpId={evento.id} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Kpi value={evento.total_convidados} label="Convidados" />
        <Kpi value={evento.total_confirmados} label="Confirmados" />
        <Kpi value={evento.total_adultos} label="Adultos" />
        <Kpi value={evento.total_criancas} label="Crianças" />
      </div>

      <div className="mt-6">
        <LinkPublicoRsvp slug={evento.slug_publico} />
      </div>

      <div className="mt-6">
        <AparenciaEventoRsvpForm eventoRsvpId={evento.id} corFundo={evento.cor_fundo} imagemCapa={evento.imagem_capa} />
      </div>

      <div className="mt-6">
        <AdicionarConvidadoForm eventoRsvpId={evento.id} />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-2">
          Convidados ({convidados.length})
        </h2>
        <div className="flex flex-col gap-2">
          {convidados.map((c) => (
            <ConvidadoLinha key={c.id} convidado={c} eventoSlug={evento.slug_publico} />
          ))}
          {convidados.length === 0 && (
            <p className="text-sm text-muted">Nenhum convidado adicionado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-xl font-extrabold text-accent-dark">{value}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold text-muted">{label}</div>
    </div>
  );
}
