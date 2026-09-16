import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProdutosAfiliadosAdmin } from "@/lib/data/admin";
import { Badge, buttonClass, PlaceholderImg } from "@/components/ui";
import { formatCurrencyBRL } from "@/lib/format";
import { labelCategoriaProduto } from "@/lib/produtos-afiliados-constantes";
import ProdutoAfiliadoRowActions from "@/components/admin/ProdutoAfiliadoRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProdutosAfiliadosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const produtos = await listProdutosAfiliadosAdmin();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <div className="mb-1 mt-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">Produtos para sua festa</h1>
        <Link href="/admin/produtos-afiliados/novo" className={buttonClass("primary", "sm")}>
          + Cadastrar produto
        </Link>
      </div>
      <p className="text-sm text-muted">
        Vitrine de fantasias e acessórios afiliados do Mercado Livre — controla o que aparece em{" "}
        <Link href="/produtos" className="font-bold text-accent-dark underline">
          /produtos
        </Link>
        .
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              {p.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagem_url} alt={p.nome} className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <PlaceholderImg className="h-14 w-14 rounded-lg" />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{p.nome}</span>
                  <Badge tone="muted">{labelCategoriaProduto(p.categoria)}</Badge>
                  {p.tema && <Badge tone="muted">{p.tema}</Badge>}
                  {p.destaque && <Badge tone="ad">Destaque</Badge>}
                  <Badge tone={p.ativo ? "ok" : "muted"}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
                  {!p.url_afiliado && <Badge tone="warn">Sem link de afiliado</Badge>}
                </div>
                <p className="mt-1 text-[12px] text-muted">{formatCurrencyBRL(Number(p.preco))}</p>
              </div>
            </div>
            <ProdutoAfiliadoRowActions produtoId={p.id} ativo={p.ativo} destaque={p.destaque} />
          </div>
        ))}
        {produtos.length === 0 && <p className="text-sm text-muted">Nenhum produto cadastrado ainda.</p>}
      </div>
    </div>
  );
}
