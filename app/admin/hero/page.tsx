import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listHeroBannersAdmin } from "@/lib/data/admin";
import { Badge, buttonClass } from "@/components/ui";
import HeroBannerRowActions from "@/components/admin/HeroBannerRowActions";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const banners = await listHeroBannersAdmin();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <div className="mb-1 mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">Banner principal da home</h1>
        <Link href="/admin/hero/nova" className={buttonClass("primary", "sm")}>
          + Novo banner
        </Link>
      </div>
      <p className="text-sm text-muted">
        Título, texto, botão e imagem de fundo do carrossel no topo da home. Independe de empresa — é conteúdo
        institucional/promocional que você controla.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imagem_fundo} alt="" className="h-14 w-24 shrink-0 rounded-md object-cover" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{b.titulo}</span>
                  <Badge tone={b.ativo ? "ok" : "warn"}>{b.ativo ? "No ar" : "Desativado"}</Badge>
                </div>
                <p className="mt-1 max-w-md text-[12px] text-muted">
                  {b.texto ?? <em className="text-muted-2">sem texto</em>} · ordem {b.ordem}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin/hero/${b.id}/editar`}
                aria-label="Editar banner"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-alt"
              >
                <PencilIcon />
              </Link>
              <HeroBannerRowActions bannerId={b.id} ativo={b.ativo} isPrimeiro={i === 0} isUltimo={i === banners.length - 1} />
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-muted">Nenhum banner cadastrado ainda.</p>}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
