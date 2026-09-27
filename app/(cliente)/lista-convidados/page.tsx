import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMeusEventosRsvp } from "@/lib/data/rsvp";
import { formatDateBR } from "@/lib/format";
import { Badge } from "@/components/ui";
import NovoEventoRsvpForm from "@/components/rsvp/NovoEventoRsvpForm";

export const dynamic = "force-dynamic";

export default async function ListaConvidadosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const eventos = await listMeusEventosRsvp(session.usuarioId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-extrabold">Lista de convidados</h1>
      <p className="mt-1 text-sm text-muted">
        Monte a lista de quem você vai convidar e acompanhe quem já confirmou presença.
      </p>

      <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-[#efece5] p-3 text-[12.5px] text-muted">
        <span className="font-bold text-text">Como funciona:</span> crie uma lista com o nome e a data da festa,
        adicione os convidados (ou deixe que eles se cadastrem sozinhos) e compartilhe o link de confirmação por
        WhatsApp. Cada convidado abre o link, confirma presença e pode incluir quem vai com ele — sem precisar de
        login.
      </div>

      <div className="mt-5">
        <NovoEventoRsvpForm />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {eventos.map((e) => (
          <Link
            key={e.id}
            href={`/lista-convidados/${e.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-4 hover:border-border-strong"
          >
            <div>
              <div className="font-bold">{e.titulo}</div>
              <div className="text-[12px] text-muted">{formatDateBR(e.data_evento)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="muted">{e.total_convidados} convidados</Badge>
              {e.total_confirmados > 0 && <Badge tone="ok">{e.total_confirmados} confirmados</Badge>}
            </div>
          </Link>
        ))}
        {eventos.length === 0 && (
          <p className="text-sm text-muted">Você ainda não criou nenhuma lista de convidados.</p>
        )}
      </div>
    </div>
  );
}
