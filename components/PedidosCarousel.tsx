"use client";

import { useRef } from "react";
import { budgetRangeLabel, timeAgo } from "@/lib/format";
import { maskContactLeak } from "@/lib/contact-filter";
import { categoryColor } from "@/lib/category-colors";
import type { PedidoFeedItem } from "@/lib/data/pedidos";

export default function PedidosCarousel({ pedidos }: { pedidos: PedidoFeedItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCards(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  if (pedidos.length === 0) {
    return <p className="text-sm text-muted">Nenhum pedido publicado ainda — que tal ser o primeiro?</p>;
  }

  return (
    <div className="relative">
      <div ref={scrollerRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2">
        {pedidos.map((p, i) => {
          const color = categoryColor(p.categorias[0] ?? i);
          return (
          <div
            key={p.id}
            data-card
            className="card-hover w-[78%] shrink-0 snap-start rounded-xl border border-border bg-surface p-4 sm:w-[46%] md:w-[31%] lg:w-[23%] xl:w-[18.5%]"
          >
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-bold ${color.bg} ${color.text}`}>
              {p.categorias[0] ?? p.tipo_evento}
            </span>
            <h3 className="mt-3 text-[17px] font-bold leading-tight">{p.tipo_evento}</h3>
            <p className="mt-1 text-[11.5px] font-semibold text-muted">
              {p.bairro_nome ?? p.cidade_nome} ·{" "}
              {new Date(p.data_evento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
            </p>
            <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted">{maskContactLeak(p.descricao)}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-border pt-2.5">
              <span className="text-[10.5px] font-bold text-accent-dark">
                {budgetRangeLabel(p.orcamento_min ? Number(p.orcamento_min) : null, p.orcamento_max ? Number(p.orcamento_max) : null)}
              </span>
              <span className="text-[10px] font-semibold text-muted-2">{timeAgo(p.criado_em)}</span>
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Pedidos anteriores"
          onClick={() => scrollByCards(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface hover:bg-surface-alt"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Próximos pedidos"
          onClick={() => scrollByCards(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface hover:bg-surface-alt"
        >
          →
        </button>
      </div>
    </div>
  );
}
