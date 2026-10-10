"use client";

import { useEffect } from "react";

/** Marca como visível (data-visivel) cada elemento `.reveal` da página quando
 * ele entra na tela - uma vez só, sem reanimar ao rolar de volta. A animação
 * em si é CSS (app/globals.css). Usar só em páginas de divulgação. */
export default function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not([data-visivel])");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-visivel", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-visivel", "");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -80px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
