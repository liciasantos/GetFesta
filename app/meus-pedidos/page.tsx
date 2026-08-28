import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMeusPedidos } from "@/lib/data/pedidos";
import { getMeuPerfilCliente } from "@/lib/data/clientes";
import { listBannersAtivos } from "@/lib/data/banners";
import { Badge } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppButton from "@/components/WhatsAppButton";
import DestaquesGrid, { DestaquesKicker } from "@/components/DestaquesGrid";
import { budgetRangeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

const DICAS = [
  { icone: "💌", titulo: "Faça seu convite", desc: "Monte um convite online com foto, data e local em minutos." },
  { icone: "✅", titulo: "Confirmação de presença (RSVP)", desc: "Saiba quantos adultos e crianças confirmaram presença." },
  { icone: "🧮", titulo: "Calculadora de custos", desc: "Estime o orçamento por convidado antes de fechar com o fornecedor." },
];

export default async function MeusPedidosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const [pedidos, perfil, banners] = await Promise.all([
    listMeusPedidos(session.usuarioId),
    getMeuPerfilCliente(session.usuarioId),
    listBannersAtivos(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* PERFIL */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          {perfil?.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.foto_url} alt={perfil.nome} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft font-display text-base font-extrabold text-accent-dark">
              {perfil?.nome?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <div className="text-[14.5px] font-bold">Olá, {perfil?.nome ?? "cliente"} 👋</div>
            <div className="text-[12px] text-muted">{perfil?.cidade_nome ?? "Cidade não informada"}</div>
          </div>
        </div>
        <Link href="/meu-perfil" className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] font-bold hover:bg-surface-alt">
          Editar perfil
        </Link>
      </div>

      {/* Cadastro via Google não pede cidade - avisa que falta completar */}
      {perfil && !perfil.cidade_id && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border-strong bg-[#efece5] p-3 text-[12.5px] text-muted">
          <span>⚠️ Falta informar sua cidade pra gente mostrar pedidos e fornecedores certos pra você.</span>
          <Link href="/meu-perfil" className="font-bold text-accent-dark underline">
            Completar perfil
          </Link>
        </div>
      )}

      {/* DESTAQUES DA SEMANA */}
      {banners.length > 0 && (
        <div className="mt-6">
          <DestaquesKicker />
          <div className="mt-3">
            <DestaquesGrid banners={banners} thumbSize="lg" />
          </div>
        </div>
      )}

      {/* MEUS PEDIDOS */}
      <div className="mt-8">
        <h1 className="text-xl font-extrabold">Meus pedidos</h1>
        <p className="mt-1 text-sm text-muted">Acompanhe quais empresas demonstraram interesse no seu pedido.</p>

        <div className="mt-5 flex flex-col gap-4">
          {pedidos.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold">{p.tipo_evento}</span> · {p.bairro_nome ?? p.cidade_nome} ·{" "}
                  {new Date(p.data_evento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                </div>
                <Badge tone={p.status === "aberto" ? "ok" : "muted"}>{STATUS_LABEL[p.status] ?? p.status}</Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.categorias.map((c) => (
                  <span key={c} className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold">
                    {c}
                  </span>
                ))}
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold">
                  {budgetRangeLabel(p.orcamento_min ? Number(p.orcamento_min) : null, p.orcamento_max ? Number(p.orcamento_max) : null)}
                </span>
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-2">
                  Empresas interessadas ({p.empresasInteressadas.length})
                </h4>
                {p.empresasInteressadas.length === 0 ? (
                  <p className="text-[12.5px] text-muted">Nenhuma empresa demonstrou interesse ainda.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {p.empresasInteressadas.map((e) => (
                      <div key={e.empresa_id} className="flex items-center justify-between rounded-lg bg-surface-alt p-2.5">
                        <Link href={`/empresa/${e.empresa_id}`} className="text-[12.5px] font-bold hover:underline">
                          {e.nome_fantasia}
                        </Link>
                        {e.telefone_contato && (
                          <WhatsAppButton empresaId={e.empresa_id} href={buildWhatsAppLink(e.telefone_contato)} label="WhatsApp" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {pedidos.length === 0 && (
            <p className="text-sm text-muted">
              Você ainda não publicou nenhum pedido.{" "}
              <Link href="/publicar-pedido" className="font-bold text-accent-dark underline">
                Publicar agora
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      {/* DICAS PARA A FESTA */}
      <div className="mt-8">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Dicas para sua festa</h2>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {DICAS.map((d) => (
            <div key={d.titulo} className="rounded-lg border border-border bg-surface p-3.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xl">{d.icone}</span>
                <Badge tone="muted">Em breve</Badge>
              </div>
              <div className="mt-2 text-[12.5px] font-bold">{d.titulo}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{d.desc}</p>
            </div>
          ))}

          <div className="flex flex-col justify-between rounded-lg bg-text p-3.5 text-white">
            <div>
              <span className="text-xl">🎁</span>
              <div className="mt-2 text-[12.5px] font-bold">Tudo em um só lugar</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white/75">
                Convite, RSVP, calculadora e fornecedores — em breve, benefícios exclusivos pra quem organiza pela GetFesta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
