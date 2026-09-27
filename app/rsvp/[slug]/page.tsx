import { notFound } from "next/navigation";
import { getEventoRsvpPorSlug } from "@/lib/data/rsvp";
import { formatDateBR } from "@/lib/format";
import RsvpPublicoClient from "@/components/rsvp/RsvpPublicoClient";

export const dynamic = "force-dynamic";

export default async function RsvpPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const evento = await getEventoRsvpPorSlug(slug);
  if (!evento) notFound();

  return (
    <div className="min-h-[80vh]" style={evento.cor_fundo ? { backgroundColor: evento.cor_fundo } : undefined}>
      <div className="mx-auto max-w-md px-6 py-10">
        <div className="overflow-hidden rounded-xl border border-border bg-surface text-center">
          {evento.imagem_capa && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={evento.imagem_capa} alt="" className="h-40 w-full object-cover" />
          )}
          <div className="p-5">
            <p className="text-[12.5px] font-bold uppercase tracking-wide text-accent-dark">Você foi convidado(a)!</p>
            <h1 className="mt-1 text-xl font-extrabold">{evento.titulo}</h1>
            <p className="mt-1 text-[13px] text-muted">
              {formatDateBR(evento.data_evento)} · por {evento.anfitriao_nome}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <RsvpPublicoClient slug={evento.slug_publico} />
        </div>
      </div>
    </div>
  );
}
