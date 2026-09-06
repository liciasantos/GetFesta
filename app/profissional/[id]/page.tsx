import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuPerfilProfissional, getTelefoneProfissional } from "@/lib/data/profissionais";
import { listBloqueiosIndisponibilidade } from "@/lib/data/disponibilidade";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Badge, PlaceholderImg } from "@/components/ui";
import GaleriaLightbox from "@/components/GaleriaLightbox";
import PortfolioPdfViewer from "@/components/PortfolioPdfViewer";
import VideoGallery from "@/components/VideoGallery";
import { StatRing } from "@/components/StatRing";

export const dynamic = "force-dynamic";

const DISPONIBILIDADE_LABEL: Record<string, string> = {
  disponivel: "Disponível para novos eventos",
  indisponivel: "Indisponível no momento",
  nao_informado: "Não informado",
};

const SEXO_LABEL: Record<string, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  nao_binario: "Não binário",
  prefiro_nao_informar: "Prefiro não informar",
};

/**
 * Perfil completo do profissional (fotos, medidas, calendário) - só para
 * empresas autenticadas. Nunca é visível para cliente final nem indexável
 * publicamente (secao 6 do schema: profissional so e visivel para empresa).
 */
export default async function PerfilProfissionalParaEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.tipo !== "empresa" && session.tipo !== "admin")) redirect("/entrar?tipo=empresa");

  const { id } = await params;
  const perfil = await getMeuPerfilProfissional(id);
  if (!perfil) notFound();

  const [telefone, bloqueiosDisponibilidade] = await Promise.all([
    getTelefoneProfissional(perfil.usuario_id),
    listBloqueiosIndisponibilidade(perfil.usuario_id),
  ]);
  const diasInteiros = bloqueiosDisponibilidade.filter((b) => !b.horaInicio);
  const horariosEspecificos = bloqueiosDisponibilidade.filter((b) => b.horaInicio);

  // rings do cabeçalho mobile - só entram na lista se houver dado real.
  const rings: Array<{ label: string; value: string; percent: number; color: string }> = [
    {
      label: "Avaliação",
      value: perfil.nota_media ? Number(perfil.nota_media).toFixed(1) : "novo",
      percent: perfil.nota_media ? (Number(perfil.nota_media) / 5) * 100 : 0,
      color: "var(--color-gold)",
    },
  ];
  if (perfil.total_avaliacoes) {
    rings.push({
      label: "Avaliações",
      value: String(perfil.total_avaliacoes),
      percent: Math.min(100, (perfil.total_avaliacoes / 30) * 100),
      color: "var(--color-accent)",
    });
  }
  if (perfil.tempo_experiencia_meses !== null) {
    rings.push({
      label: "Experiência",
      value: formatTempoExperiencia(perfil.tempo_experiencia_meses),
      percent: Math.min(100, (perfil.tempo_experiencia_meses / 120) * 100),
      color: "var(--color-ok)",
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/painel/vagas" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Voltar
      </Link>

      {/* CABEÇALHO MOBILE — cartão estilo "perfil social": capa + avatar
          sobreposto + nome centralizado + anéis de estatística. Só aparece
          abaixo do breakpoint sm; do sm pra cima o cartão de baixo assume. */}
      <div className="-mx-6 mt-3 sm:hidden">
        <div className="relative h-40 w-full overflow-hidden bg-surface-alt">
          {perfil.galeria[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.galeria[0].url} alt="" className="h-full w-full object-cover" />
          ) : (
            <PlaceholderImg className="h-full w-full" />
          )}
        </div>
        <div className="px-6 pb-2 text-center">
          {perfil.foto_perfil_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={perfil.foto_perfil_url}
              alt={perfil.nome}
              className="relative -mt-11 mx-auto h-[88px] w-[88px] rounded-full border-4 border-bg object-cover shadow-card"
            />
          ) : (
            <div className="relative -mt-11 mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-bg bg-accent-soft font-display text-2xl font-extrabold text-accent-dark shadow-card">
              {perfil.nome[0]?.toUpperCase()}
            </div>
          )}

          <h1 className="mt-3 text-lg font-extrabold">{perfil.nome}</h1>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {perfil.categorias[0]?.nome ?? perfil.bairro_nome ?? perfil.cidade_nome ?? "Profissional de festas"}
          </p>

          <div className="mt-5 flex items-center justify-center gap-5">
            {rings.map((r) => (
              <StatRing key={r.label} {...r} />
            ))}
          </div>

          {telefone && (
            <a
              href={buildWhatsAppLink(telefone, `Olá ${perfil.nome}! Vi seu perfil na GetFesta.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark"
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 hidden flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5 sm:flex">
        <div className="flex items-center gap-4">
          {perfil.foto_perfil_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.foto_perfil_url} alt={perfil.nome} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft font-display text-xl font-extrabold text-accent-dark">
              {perfil.nome[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-lg font-extrabold">{perfil.nome}</h1>
            <p className="text-[12px] text-muted">{perfil.bairro_nome ?? perfil.cidade_nome ?? "Cidade não informada"}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {perfil.categorias.map((c) => (
                <span key={c.id} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10.5px] font-semibold">
                  {c.nome}
                </span>
              ))}
            </div>
          </div>
        </div>
        {telefone && (
          <a
            href={buildWhatsAppLink(telefone, `Olá ${perfil.nome}! Vi seu perfil na GetFesta.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark"
          >
            💬 WhatsApp
          </a>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge tone={perfil.disponibilidade_status === "disponivel" ? "ok" : "muted"}>
          {DISPONIBILIDADE_LABEL[perfil.disponibilidade_status]}
        </Badge>
        {perfil.sexo && <Badge tone="muted">{SEXO_LABEL[perfil.sexo] ?? perfil.sexo}</Badge>}
        {perfil.tempo_experiencia_meses !== null && (
          <Badge tone="muted">🕓 {formatTempoExperiencia(perfil.tempo_experiencia_meses)} de experiência</Badge>
        )}
        {perfil.nota_media !== null && (
          <Badge tone="ad">
            ⭐ {Number(perfil.nota_media).toFixed(1)} ({perfil.total_avaliacoes})
          </Badge>
        )}
      </div>

      {perfil.portfolio_pdf_url && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Portfólio/currículo</h2>
          <PortfolioPdfViewer url={perfil.portfolio_pdf_url} nome={perfil.portfolio_pdf_nome ?? "portfolio.pdf"} />
        </div>
      )}

      {perfil.galeria.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Fotos</h2>
          <GaleriaLightbox fotos={perfil.galeria} />
        </div>
      )}

      {perfil.videoLinks.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Vídeos de performance</h2>
          <VideoGallery videos={perfil.videoLinks} />
        </div>
      )}

      {perfil.medidas_habilitadas && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Medidas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Medida label="Altura" value={perfil.altura_cm ? `${perfil.altura_cm} cm` : null} />
            <Medida label="Peso" value={perfil.peso_kg ? `${perfil.peso_kg} kg` : null} />
            <Medida label="Cintura" value={perfil.cintura_cm ? `${perfil.cintura_cm} cm` : null} />
            <Medida label="Manequim" value={perfil.manequim} />
            <Medida label="Calçado" value={perfil.calcado} />
            <Medida label="Tatuagem" value={perfil.tem_tatuagem === "sim" ? "Sim" : perfil.tem_tatuagem === "nao" ? "Não" : null} />
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-2">Calendário de disponibilidade</h2>
        {diasInteiros.length === 0 && horariosEspecificos.length === 0 ? (
          <p className="mt-1 text-[12.5px] text-ok">✓ Nenhum bloqueio cadastrado — sem restrição por enquanto.</p>
        ) : (
          <>
            {diasInteiros.length > 0 && (
              <div className="mt-2">
                <p className="mb-1.5 text-[11px] font-bold uppercase text-muted-2">Dias inteiros indisponíveis</p>
                <div className="flex flex-wrap gap-1.5">
                  {diasInteiros.map((b) => (
                    <span
                      key={b.id}
                      className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-dark"
                    >
                      {new Date(b.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {horariosEspecificos.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-bold uppercase text-muted-2">Horários específicos indisponíveis</p>
                <div className="flex flex-wrap gap-1.5">
                  {horariosEspecificos.map((b) => (
                    <span
                      key={b.id}
                      className="rounded-full border border-border bg-surface-alt px-2.5 py-1 text-[11px] font-bold text-text"
                    >
                      {new Date(b.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })} ·{" "}
                      {b.horaInicio}–{b.horaFim}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatTempoExperiencia(meses: number): string {
  if (meses < 12) return meses === 1 ? "1 mês" : `${meses} meses`;
  const anos = Math.round(meses / 12);
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

function Medida({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-border p-2.5 text-center">
      <div className="text-[13px] font-bold">{value}</div>
      <div className="text-[10px] font-semibold uppercase text-muted-2">{label}</div>
    </div>
  );
}
