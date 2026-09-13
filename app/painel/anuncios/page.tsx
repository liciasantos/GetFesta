import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMeusBannersCategoria, listMeusBannersHero } from "@/lib/data/banners";
import { getPainelKpis } from "@/lib/data/painel";
import { Badge } from "@/components/ui";
import { formatDateBR } from "@/lib/format";
import { buildAnunciarBannerMailto } from "@/lib/mailto";
import { getPainelHeaderInfo } from "@/lib/data/empresas";

export const dynamic = "force-dynamic";

export default async function MeusAnunciosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const [bannersCategoria, bannersHero, kpis, header] = await Promise.all([
    listMeusBannersCategoria(session.usuarioId),
    listMeusBannersHero(session.usuarioId),
    getPainelKpis(session.usuarioId),
    getPainelHeaderInfo(session.usuarioId),
  ]);

  const temAnuncio = bannersCategoria.length > 0 || bannersHero.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Meus anúncios</h1>
        <Link href="/painel" className="text-[12.5px] font-bold text-accent-dark underline">
          ← Voltar ao painel
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">Destaques da semana e banner principal que você já contratou.</p>

      {temAnuncio && (
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xl font-extrabold text-accent-dark">{kpis.visualizacoesBanner}</div>
            <div className="mt-0.5 text-[10.5px] font-semibold text-muted">Visualizações (todos os anúncios)</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xl font-extrabold text-accent-dark">{kpis.cliquesBanner}</div>
            <div className="mt-0.5 text-[10.5px] font-semibold text-muted">Cliques (todos os anúncios)</div>
          </div>
        </div>
      )}
      {temAnuncio && (
        <p className="mt-2 text-[11px] text-muted-2">
          Os números acima somam todos os seus anúncios juntos — ainda não conseguimos separar por anúncio individual.
        </p>
      )}

      <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-muted-2">Destaques da semana</h2>
      <div className="flex flex-col gap-2.5">
        {bannersCategoria.length === 0 && (
          <p className="text-[12.5px] text-muted">Você ainda não contratou um Destaque da semana.</p>
        )}
        {bannersCategoria.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5">
            <div className="text-[12.5px]">
              <span className="font-bold">{b.categoria_nome}</span>
              <div className="mt-0.5 text-[11px] text-muted-2">
                {formatDateBR(b.inicio_em)} até {formatDateBR(b.fim_em)}
              </div>
            </div>
            <Badge tone={b.ativo ? "ok" : "muted"}>{b.ativo ? "Ativo" : "Encerrado"}</Badge>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-muted-2">Banner principal</h2>
      <div className="flex flex-col gap-2.5">
        {bannersHero.length === 0 && (
          <p className="text-[12.5px] text-muted">Você ainda não tem um banner principal atribuído.</p>
        )}
        {bannersHero.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5">
            <span className="text-[12.5px] font-bold">{b.titulo}</span>
            <Badge tone={b.ativo ? "ok" : "muted"}>{b.ativo ? "Ativo" : "Inativo"}</Badge>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-accent-soft-2 bg-accent-soft p-4">
        <p className="text-[12.5px] font-bold text-accent-dark">Quer anunciar mais?</p>
        <p className="mt-1 text-[12px] text-accent-dark">
          Fale com a gente pra contratar um novo Destaque da semana ou o banner principal.
        </p>
        {header && (
          <a
            href={buildAnunciarBannerMailto(header.nomeFantasia, session.usuarioId)}
            className="mt-3 inline-flex rounded-lg bg-accent px-4 py-2 text-[12.5px] font-bold text-white hover:bg-accent-dark"
          >
            📣 Anunciar no banner principal
          </a>
        )}
      </div>
    </div>
  );
}
