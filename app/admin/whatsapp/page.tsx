import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { getWhatsAppConfig } from "@/lib/whatsapp/fila";
import { formatarNumero } from "@/lib/whatsapp/regras";
import { statusSessao, wahaConfigurado } from "@/lib/whatsapp/waha";
import { WhatsAppConfigForm, WhatsAppFilaAcoes, WhatsAppTesteForm } from "@/components/admin/WhatsAppAdminForms";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  boas_vindas: "Boas-vindas",
  pedido_novo: "Pedido novo",
  vaga_nova: "Vaga nova",
  candidatura_nova: "Candidatura",
  vaga_selecionado: "Escolhido p/ vaga",
  vaga_desistencia: "Desistência",
  lembrete_vaga: "Lembrete",
};

const STATUS_COR: Record<string, string> = {
  enviado: "bg-ok-soft text-ok",
  pendente: "bg-surface-alt text-muted",
  enviando: "bg-info-soft text-info-dark",
  erro: "bg-danger-soft text-danger-dark",
  cancelado: "bg-surface-alt text-muted-2",
};

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function AdminWhatsAppPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const [cfg, sessao, numeros, fila, ultimos] = await Promise.all([
    getWhatsAppConfig(),
    wahaConfigurado() ? statusSessao() : Promise.resolve(null),
    query<{ tipo: string; n: number }>(`SELECT tipo::text, count(*)::int AS n FROM usuarios WHERE whatsapp_avisos GROUP BY tipo`),
    queryOne<{ pendentes: number; hoje: number; erros: number }>(
      `SELECT count(*) FILTER (WHERE status IN ('pendente', 'enviando'))::int AS pendentes,
              count(*) FILTER (WHERE status = 'enviado'
                AND enviado_em >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')::int AS hoje,
              count(*) FILTER (WHERE status = 'erro' AND criado_em > now() - interval '24 hours')::int AS erros
         FROM whatsapp_fila`
    ),
    query<{ id: string; tipo: string; status: string; erro: string | null; quando: string; nome: string }>(
      `SELECT f.id, f.tipo, f.status, f.erro,
              to_char(COALESCE(f.enviado_em, f.criado_em) AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI') AS quando,
              COALESCE(e.nome_fantasia, p.nome, u.email, '—') AS nome
         FROM whatsapp_fila f
         JOIN usuarios u ON u.id = f.usuario_id
         LEFT JOIN empresas e ON e.usuario_id = u.id
         LEFT JOIN profissionais p ON p.usuario_id = u.id
        ORDER BY f.id DESC LIMIT 20`
    ),
  ]);

  const pendencias = [
    !process.env.WAHA_URL && "WAHA_URL",
    !process.env.WAHA_API_KEY && "WAHA_API_KEY",
    !process.env.WHATSAPP_SECRET && "WHATSAPP_SECRET",
  ].filter(Boolean);
  const optEmpresas = numeros.find((n) => n.tipo === "empresa")?.n ?? 0;
  const optProfs = numeros.find((n) => n.tipo === "profissional")?.n ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>
      <div className="mb-1 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold">Avisos por WhatsApp</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.ativo ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger-dark"}`}>
          {cfg.ativo ? "Ligados" : "Desligados"}
        </span>
      </div>
      <p className="text-sm text-muted">
        Mensagens automáticas enviadas pelo número conectado no servidor WAHA, só para quem ativou no próprio perfil.
      </p>

      <Card titulo="Conexão">
        {pendencias.length > 0 && (
          <p className="mb-3 rounded-lg border border-note-border bg-note-bg p-3 text-[12.5px] text-note-text">
            Faltam variáveis de ambiente na Vercel: <b>{pendencias.join(", ")}</b>.
          </p>
        )}
        {sessao ? (
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sessao.ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger-dark"}`}>
              {sessao.status}
            </span>
            {sessao.numero && (
              <span>
                Número conectado: <b>{formatarNumero(sessao.numero)}</b>
                {sessao.nome && <> ({sessao.nome})</>}
              </span>
            )}
            {!sessao.ok && (
              <span className="text-muted">
                {sessao.status === "SCAN_QR_CODE" ? "Escaneie o QR code no painel do WAHA." : sessao.erro ?? "Abra o painel do WAHA e inicie a sessão."}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-muted">Servidor WAHA não configurado.</p>
        )}
        {process.env.WAHA_URL && (
          <a
            href={`${process.env.WAHA_URL.replace(/\/$/, "")}/dashboard`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[12.5px] font-bold text-accent-dark underline"
          >
            Abrir painel do WAHA ↗
          </a>
        )}
      </Card>

      <Card titulo="Números">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["Empresas com aviso", optEmpresas],
              ["Profissionais com aviso", optProfs],
              ["Na fila", fila?.pendentes ?? 0],
              ["Enviadas hoje", `${fila?.hoje ?? 0} / ${cfg.limiteDiario}`],
              ["Erros (24h)", fila?.erros ?? 0],
            ] as const
          ).map(([l, v]) => (
            <div key={l} className="rounded-lg bg-surface-alt p-3">
              <div className="text-[11px] font-bold uppercase text-muted">{l}</div>
              <div className="mt-1 text-lg font-extrabold">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <WhatsAppFilaAcoes />
        </div>
      </Card>

      <Card titulo="Regras de envio">
        <WhatsAppConfigForm cfg={cfg} />
      </Card>

      <Card titulo="Enviar mensagem de teste">
        <WhatsAppTesteForm />
      </Card>

      <Card titulo="Últimos avisos">
        {ultimos.length === 0 ? (
          <p className="text-[13px] text-muted">Nenhum aviso ainda.</p>
        ) : (
          <div className="divide-y divide-border text-[13px]">
            {ultimos.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="w-[86px] text-[12px] text-muted-2">{u.quando}</span>
                <span className="min-w-[120px] font-semibold">{TIPO_LABEL[u.tipo] ?? u.tipo}</span>
                <span className="min-w-0 flex-1 truncate">{u.nome}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_COR[u.status] ?? ""}`}>{u.status}</span>
                {u.erro && <span className="w-full text-[12px] text-danger-dark">{u.erro}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
