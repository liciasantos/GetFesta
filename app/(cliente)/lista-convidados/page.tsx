import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMeusEventosRsvp, type EventoRsvpResumo } from "@/lib/data/rsvp";
import { Icon } from "@/components/Icon";
import NovoEventoRsvpForm from "@/components/rsvp/NovoEventoRsvpForm";
import { BarraConfirmacao, BlocoData, SecaoTitulo } from "@/components/cliente/ui";
import { diasAte, hojeBrasilia, rotuloContagem } from "@/lib/festa-datas";

export const dynamic = "force-dynamic";

export default async function ListaConvidadosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const eventos = await listMeusEventosRsvp(session.usuarioId);
  const hoje = hojeBrasilia();
  const futuras = eventos
    .filter((e) => diasAte(e.data_evento, hoje) >= 0)
    .sort((a, b) => diasAte(a.data_evento, hoje) - diasAte(b.data_evento, hoje));
  const passadas = eventos.filter((e) => diasAte(e.data_evento, hoje) < 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-[24px] font-extrabold leading-tight">Lista de convidados</h1>
      <p className="mt-1 text-[14px] text-muted">Convide pelo WhatsApp e acompanhe quem confirmou presença.</p>

      <div className="mt-5">
        <NovoEventoRsvpForm destaque={eventos.length === 0} />
      </div>

      {eventos.length === 0 ? (
        <ComoFunciona />
      ) : (
        <>
          {futuras.length > 0 && (
            <div className="mt-7">
              <SecaoTitulo>Próximas festas</SecaoTitulo>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {futuras.map((e) => (
                  <ListaCard key={e.id} evento={e} hoje={hoje} />
                ))}
              </div>
            </div>
          )}
          {passadas.length > 0 && (
            <div className="mt-7">
              <SecaoTitulo>Festas que já passaram</SecaoTitulo>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {passadas.map((e) => (
                  <ListaCard key={e.id} evento={e} hoje={hoje} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ListaCard({ evento: e, hoje }: { evento: EventoRsvpResumo; hoje: string }) {
  const aguardando = e.total_convidados - e.total_confirmados - e.total_recusados;
  const dias = diasAte(e.data_evento, hoje);
  return (
    <Link
      href={`/lista-convidados/${e.id}`}
      className={`card-hover rounded-2xl border border-border bg-surface p-4 ${dias < 0 ? "opacity-75" : ""}`}
    >
      <div className="flex items-center gap-3.5">
        <BlocoData data={e.data_evento} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-bold">{e.titulo}</h2>
          <p className={`text-[12.5px] font-semibold ${dias >= 0 ? "text-accent-dark" : "text-muted"}`}>{rotuloContagem(dias)}</p>
        </div>
        <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-muted-2" />
      </div>
      {e.total_convidados === 0 ? (
        <p className="mt-3 rounded-lg bg-surface-alt/70 px-3 py-2 text-[12.5px] text-muted">Nenhum convidado ainda — toque para adicionar.</p>
      ) : (
        <div className="mt-3.5">
          <BarraConfirmacao confirmados={e.total_confirmados} aguardando={aguardando} recusados={e.total_recusados} />
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
            <span className="font-bold text-ok">{e.total_confirmados} confirmados</span>
            <span className="text-muted">{aguardando} aguardando</span>
            {e.total_recusados > 0 && <span className="text-muted">{e.total_recusados} não vão</span>}
            <span className="ml-auto text-muted-2">{e.total_convidados} no total</span>
          </div>
        </div>
      )}
    </Link>
  );
}

function ComoFunciona() {
  const passos = [
    { icon: "calendar" as const, titulo: "Crie a lista", texto: "Dê um nome e a data da festa." },
    { icon: "share" as const, titulo: "Mande o link", texto: "Pelo WhatsApp, pra cada convidado ou num grupo." },
    { icon: "check" as const, titulo: "Acompanhe", texto: "Cada um confirma e diz quem vai junto, sem cadastro." },
  ];
  return (
    <div className="mt-7">
      <SecaoTitulo>Como funciona</SecaoTitulo>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {passos.map((p, i) => (
          <div key={p.titulo} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                <Icon name={p.icon} className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-bold text-muted-2">{i + 1}</span>
            </div>
            <p className="mt-2.5 text-[14px] font-bold">{p.titulo}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{p.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
