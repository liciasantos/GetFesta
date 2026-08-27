import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuPerfilProfissional, getTelefoneProfissional } from "@/lib/data/profissionais";
import { listDiasIndisponiveis } from "@/lib/data/disponibilidade";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Badge } from "@/components/ui";
import GaleriaLightbox from "@/components/GaleriaLightbox";

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
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const { id } = await params;
  const [perfil, telefone, diasIndisponiveis] = await Promise.all([
    getMeuPerfilProfissional(id),
    getTelefoneProfissional(id),
    listDiasIndisponiveis(id),
  ]);
  if (!perfil) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/painel/vagas" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Voltar
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5">
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
      </div>

      {perfil.galeria.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Fotos</h2>
          <GaleriaLightbox fotos={perfil.galeria} />
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
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-2">Calendário de disponibilidade</h2>
        {diasIndisponiveis.length > 0 ? (
          <div className="mt-2">
            <p className="mb-1.5 text-[11px] font-bold uppercase text-muted-2">Dias marcados como indisponível</p>
            <div className="flex flex-wrap gap-1.5">
              {diasIndisponiveis.map((d) => (
                <span key={d} className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-dark">
                  {new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[12.5px] text-ok">✓ Nenhum dia marcado como indisponível — sem restrição por enquanto.</p>
        )}
      </div>
    </div>
  );
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
