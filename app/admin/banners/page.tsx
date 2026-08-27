import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listBannersAdmin } from "@/lib/data/admin";
import { Badge, buttonClass } from "@/components/ui";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import BannerRowActions from "@/components/admin/BannerRowActions";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const banners = await listBannersAdmin();
  const hoje = new Date();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <div className="mb-1 mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">Banner principal &amp; destaques</h1>
        <Link href="/admin/banners/nova" className={buttonClass("primary", "sm")}>
          + Incluir anúncio
        </Link>
      </div>
      <p className="text-sm text-muted">
        A ordem aqui controla a sequência do carrossel no banner principal da home e nos "Destaques da semana".
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {banners.map((b, i) => {
          const vencido = new Date(b.fim_em) < hoje;
          return (
            <div key={b.id} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{b.nome_fantasia}</span>
                  <Badge tone="muted">{b.categoria_nome}</Badge>
                  <Badge tone={b.ativo && !vencido ? "ok" : "warn"}>
                    {!b.ativo ? "Desativado" : vencido ? "Vencido" : "No ar"}
                  </Badge>
                </div>
                <p className="mt-1 text-[12px] text-muted">
                  {formatDateBR(b.inicio_em)} → {formatDateBR(b.fim_em)} · {formatCurrencyBRL(b.valor_pago)} · ordem {b.ordem}
                </p>
              </div>
              <BannerRowActions
                bannerId={b.id}
                ativo={b.ativo}
                isPrimeiro={i === 0}
                isUltimo={i === banners.length - 1}
              />
            </div>
          );
        })}
        {banners.length === 0 && <p className="text-sm text-muted">Nenhum banner cadastrado ainda.</p>}
      </div>
    </div>
  );
}
