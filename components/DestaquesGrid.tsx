"use client";

import { useRef } from "react";
import Link from "next/link";
import { Badge, PlaceholderImg } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { BannerCategoria } from "@/lib/data/banners";

export default function DestaquesGrid({
  banners,
  thumbSize = "default",
}: {
  banners: BannerCategoria[];
  /** "lg" = +20% de altura na foto (usado na area do cliente logado) */
  thumbSize?: "default" | "lg";
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Thumb sempre 1:1 (aspect-square); no "lg" (area do cliente logado) o card
  // fica ~20% mais largo, o que ja aumenta a foto proporcionalmente mantendo o quadrado.
  const cardWidthClass = thumbSize === "lg" ? "w-[56%] sm:w-[37%] lg:w-[23%]" : "w-[47%] sm:w-[31%] lg:w-[19%]";

  function scrollByCards(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 10 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  if (banners.length === 0) return null;

  return (
    <div className="relative">
      <div ref={scrollerRef} className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth pb-1">
        {banners.map((b) => (
          <div
            key={b.id}
            data-card
            className={`card-hover flex shrink-0 flex-col overflow-hidden rounded-lg border border-accent-soft-2 bg-white ${cardWidthClass}`}
          >
            <Link href={`/empresa/${b.empresa_id}`} className="flex flex-1 flex-col">
              {b.foto_capa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.foto_capa} alt={b.nome_fantasia} className="aspect-square w-full object-cover" />
              ) : (
                <PlaceholderImg className="aspect-square w-full" />
              )}
              <div className="flex-1 bg-gradient-to-br from-accent-soft to-white p-3 pb-0">
                <span className="text-[10px] font-bold uppercase tracking-wide text-accent-dark/70">{b.categoria_nome}</span>
                <span className="mt-1 block text-[12.5px] font-extrabold leading-tight">{b.nome_fantasia}</span>
              </div>
            </Link>
            <div className="bg-gradient-to-br from-accent-soft to-white p-3 pt-2">
              <WhatsAppButton
                empresaId={b.empresa_id}
                href={buildWhatsAppLink(b.telefone_contato ?? "", "Olá! Vi seu anúncio na GetFesta e quero saber mais.")}
                label="WhatsApp"
              />
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Destaques anteriores"
            onClick={() => scrollByCards(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface hover:bg-surface-alt"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Próximos destaques"
            onClick={() => scrollByCards(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface hover:bg-surface-alt"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export function DestaquesKicker() {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-2">Destaques da semana</h2>
      <Badge tone="ad">Anúncio</Badge>
    </div>
  );
}
