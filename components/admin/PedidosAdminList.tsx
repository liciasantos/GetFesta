"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removerPedidosEmLote } from "@/lib/actions/admin";
import PedidoRowActions from "@/components/admin/PedidoRowActions";
import BulkToolbar from "@/components/admin/BulkToolbar";
import { Badge } from "@/components/ui";
import { formatDateBR } from "@/lib/format";
import type { PedidoAdmin } from "@/lib/data/admin";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

export default function PedidosAdminList({ pedidos }: { pedidos: PedidoAdmin[] }) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function removerSelecionados() {
    if (!window.confirm(`Remover ${selecionados.size} pedido(s) definitivamente? Não pode ser desfeito.`)) return;
    startTransition(async () => {
      const res = await removerPedidosEmLote(Array.from(selecionados));
      if (res?.error) window.alert(res.error);
      setSelecionados(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      <BulkToolbar
        total={selecionados.size}
        onLimpar={() => setSelecionados(new Set())}
        onRemover={removerSelecionados}
        isPending={isPending}
      />
      <div className="flex flex-col gap-2">
        {pedidos.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3.5"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selecionados.has(p.id)}
                onChange={() => toggle(p.id)}
                className="mt-1 h-4 w-4 shrink-0"
                aria-label={`Selecionar pedido de ${p.nome_temp ?? "cliente"}`}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{p.tipo_evento}</span>
                  <Badge tone="muted">{STATUS_LABEL[p.status] ?? p.status}</Badge>
                  {p.oculto_admin && <Badge tone="warn">Oculto</Badge>}
                </div>
                <p className="mt-1 text-[12px] text-muted">
                  {p.nome_temp ?? "cliente"} · {p.cidade_nome} · {formatDateBR(p.data_evento)}
                </p>
              </div>
            </div>
            <PedidoRowActions pedidoId={p.id} oculto={p.oculto_admin} />
          </div>
        ))}
        {pedidos.length === 0 && <p className="text-sm text-muted">Nenhum pedido publicado ainda.</p>}
      </div>
    </div>
  );
}
