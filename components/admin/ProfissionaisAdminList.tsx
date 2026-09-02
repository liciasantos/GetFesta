"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { removerProfissionaisEmLote } from "@/lib/actions/admin";
import ProfissionalRowActions from "@/components/admin/ProfissionalRowActions";
import BulkToolbar from "@/components/admin/BulkToolbar";
import { Badge } from "@/components/ui";
import type { ProfissionalAdmin, PlanoParaSelect } from "@/lib/data/admin";

export default function ProfissionaisAdminList({
  profissionais,
  planos,
}: {
  profissionais: ProfissionalAdmin[];
  planos: PlanoParaSelect[];
}) {
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
    if (!window.confirm(`Remover ${selecionados.size} profissional(is) definitivamente? Não pode ser desfeito.`)) return;
    startTransition(async () => {
      const res = await removerProfissionaisEmLote(Array.from(selecionados));
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
      <div className="flex flex-col gap-2.5">
        {profissionais.map((p) => (
          <div
            key={p.usuario_id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selecionados.has(p.usuario_id)}
                onChange={() => toggle(p.usuario_id)}
                className="mt-1 h-4 w-4 shrink-0"
                aria-label={`Selecionar ${p.nome}`}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/profissional/${p.slug}`} className="font-bold hover:underline" target="_blank">
                    {p.nome}
                  </Link>
                  {p.nota_media !== null && (
                    <span className="text-[11.5px] font-semibold text-accent-dark">
                      ⭐ {Number(p.nota_media).toFixed(1)} ({p.total_avaliacoes})
                    </span>
                  )}
                  {p.plano_atual_tipo === "profissional_premium" && <Badge tone="ad">Premium</Badge>}
                  {p.plano_atual_tipo === "profissional_light" && <Badge tone="ok">Light</Badge>}
                  {p.portfolio_liberado_gratis && p.plano_atual_tipo !== "profissional_premium" && p.plano_atual_tipo !== "profissional_light" && (
                    <Badge tone="ok">Portfólio grátis (20 primeiros)</Badge>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-muted">
                  {p.email ?? "sem e-mail"} · {p.categorias.join(", ") || "sem categoria"} · desde{" "}
                  {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <ProfissionalRowActions
              profissionalId={p.usuario_id}
              nome={p.nome}
              aprovadaParaDestaque={p.aprovada_para_destaque}
              planoAtualId={p.plano_atual_id}
              planos={planos}
            />
          </div>
        ))}
        {profissionais.length === 0 && <p className="text-sm text-muted">Nenhum profissional cadastrado ainda.</p>}
      </div>
    </div>
  );
}
