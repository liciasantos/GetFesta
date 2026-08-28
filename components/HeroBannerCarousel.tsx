"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui";
import type { HeroBanner } from "@/lib/data/banners";

const ROTATE_MS = 5500;

export default function Hero({ banners }: { banners: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const hasBanners = banners.length > 0;
  const current = hasBanners ? banners[index] : null;

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <section className="relative min-h-[360px] w-full overflow-hidden sm:min-h-[410px] lg:min-h-[480px]">
      {hasBanners ? (
        banners.map((b, i) => (
          <div
            key={b.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imagem_fundo} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/5 to-transparent" />
          </div>
        ))
      ) : (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/banner_wow-personagens.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/5 to-transparent" />
        </div>
      )}

      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="max-w-md -translate-y-[15%]">
            {hasBanners && current ? (
              <>
                <Badge tone="ad">Anúncio</Badge>
                <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] text-white sm:text-[42px]">
                  {current.titulo}
                </h2>
                {current.texto && <p className="mt-2 max-w-sm text-[13.5px] text-white/85">{current.texto}</p>}
                {current.botao_label && current.botao_url && (
                  <div className="mt-5">
                    <Link
                      href={current.botao_url}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-accent-dark hover:bg-white/90"
                    >
                      {current.botao_label}
                    </Link>
                  </div>
                )}
                {banners.length > 1 && (
                  <div className="mt-6 flex gap-1.5">
                    {banners.map((slide, i) => (
                      <button
                        key={slide.id}
                        type="button"
                        aria-label={`Ver banner ${slide.titulo}`}
                        onClick={() => setIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <Badge tone="ad">Espaço disponível</Badge>
                <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] text-white sm:text-[42px]">
                  Anuncie aqui e seja a primeira empresa que os clientes veem.
                </h2>
                <p className="mt-2 max-w-sm text-[13.5px] text-white/85">
                  5 posições fixas por categoria, com link direto para o seu WhatsApp.
                </p>
                <Link
                  href="/cadastro/empresa"
                  className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-accent-dark hover:bg-white/90"
                >
                  Quero anunciar →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
