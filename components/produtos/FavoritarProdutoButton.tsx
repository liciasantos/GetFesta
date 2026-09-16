"use client";

import { useEffect, useState } from "react";

const CHAVE_LOCALSTORAGE = "getfesta_favoritos_produtos";

function lerFavoritos(): string[] {
  try {
    const raw = window.localStorage.getItem(CHAVE_LOCALSTORAGE);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function salvarFavoritos(slugs: string[]) {
  try {
    window.localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(slugs));
  } catch {
    // localStorage indisponível (modo privado, navegador bloqueando) - favoritar simplesmente não persiste
  }
}

/** Coração de favoritar - guarda só no navegador (localStorage), sem exigir
 * conta nem tabela nova no banco (ver app/produtos/favoritos/page.tsx, que lê
 * essa mesma chave). `useEffect` evita mismatch de hidratação: no servidor
 * não tem como saber o que já está favoritado. */
export default function FavoritarProdutoButton({ slug }: { slug: string }) {
  const [favoritado, setFavoritado] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura do localStorage só existe no cliente, não tem como saber isso no lazy initializer (roda também no SSR)
    setFavoritado(lerFavoritos().includes(slug));
  }, [slug]);

  function alternar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const atuais = lerFavoritos();
    const novos = atuais.includes(slug) ? atuais.filter((s) => s !== slug) : [...atuais, slug];
    salvarFavoritos(novos);
    setFavoritado(!favoritado);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={favoritado ? "Remover dos favoritos" : "Favoritar"}
      aria-pressed={favoritado}
      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors ${
        favoritado ? "bg-accent text-white" : "bg-white/90 text-muted hover:text-accent-dark"
      }`}
    >
      <svg viewBox="0 0 24 24" fill={favoritado ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2 4.5 5.3 4c2-.3 3.9.6 5 2.2.8 1.1.7 1.1 1.5 0 1.1-1.6 3-2.5 5-2.2 3.3.5 4.8 3.8 3.3 7.2-2.5 4.7-10 9.3-10 9.3Z" />
      </svg>
    </button>
  );
}
