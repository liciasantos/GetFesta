import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAssinaturasAdmin, listPlanosEmpresaParaSelect } from "@/lib/data/admin";
import { Badge } from "@/components/ui";
import AssinaturaRowActions from "@/components/admin/AssinaturaRowActions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "ok" | "warn" | "muted" | "ad"> = {
  ativa: "ok",
  trial: "muted",
  atrasada: "warn",
  cancelada: "muted",
  expirada: "muted",
};
const STATUS_LABEL: Record<string, string> = {
  ativa: "Em dia",
  trial: "Teste grátis",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
  expirada: "Expirada",
};

export default async function AdminPagamentosPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [assinaturas, planos] = await Promise.all([listAssinaturasAdmin(), listPlanosEmpresaParaSelect()]);
  const mpConectado = !!process.env.MERCADO_PAGO_ACCESS_TOKEN;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>

      <h1 className="mb-1 mt-3 text-xl font-extrabold">Pagamentos das empresas</h1>
      <p className="text-sm text-muted">
        Quem está em dia, quem está atrasado, e a possibilidade de trocar o plano manualmente. Quem ficar atrasado
        por mais de 5 dias volta automaticamente pro plano Grátis (roda todo dia de madrugada).
      </p>

      <div
        className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
          mpConectado ? "border-ok bg-ok-soft" : "border-dashed border-border-strong bg-[#efece5]"
        }`}
      >
        <div>
          <div className="text-[13px] font-bold">{mpConectado ? "✓ Mercado Pago conectado" : "Mercado Pago não conectado"}</div>
          <p className="mt-0.5 text-[12px] text-muted">
            {mpConectado
              ? "Cobranças automáticas ativas. O acompanhamento manual abaixo continua disponível pra ajustes pontuais."
              : "Por enquanto o controle de pagamento é manual (marcar pago/atrasado abaixo). Pra automatizar a cobrança, é preciso conectar uma conta Mercado Pago."}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {assinaturas.map((a) => (
          <div key={a.usuario_id} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/empresa/${a.slug}`} target="_blank" className="font-bold hover:underline">
                  {a.nome_fantasia}
                </Link>
                <Badge tone={a.status ? STATUS_TONE[a.status] ?? "muted" : "muted"}>
                  {a.status ? STATUS_LABEL[a.status] ?? a.status : "Sem assinatura"}
                </Badge>
                {a.dias_atraso !== null && a.dias_atraso > 0 && (
                  <Badge tone="warn">{a.dias_atraso}d de atraso</Badge>
                )}
              </div>
              <p className="mt-1 text-[12px] text-muted">
                {a.plano_nome ?? "—"}
                {a.valor_mensal && ` · R$ ${Number(a.valor_mensal).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês`}
                {a.fim_em && ` · vence em ${new Date(a.fim_em).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <AssinaturaRowActions empresaId={a.usuario_id} planoAtualId={a.plano_id} planos={planos} />
          </div>
        ))}
        {assinaturas.length === 0 && <p className="text-sm text-muted">Nenhuma empresa cadastrada ainda.</p>}
      </div>
    </div>
  );
}
