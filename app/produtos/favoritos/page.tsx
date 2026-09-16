"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProdutosPorSlugsAction } from "@/lib/actions/produtos-afiliados";
import type { ProdutoAfiliado } from "@/lib/data/produtos-afiliados";
import ProdutoCard from "@/components/produtos/ProdutoCard";

const CHAVE_LOCALSTORAGE = "getfesta_favoritos_produtos";

export default function FavoritosPage() {
  const [produtos, setProdutos] = useState<ProdutoAfiliado[] | null>(null);

  useEffect(() => {
    let slugs: string[] = [];
    try {
      const raw = window.localStorage.getItem(CHAVE_LOCALSTORAGE);
      slugs = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      slugs = [];
    }
    listProdutosPorSlugsAction(slugs).then(setProdutos);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/produtos" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Produtos pra sua festa
      </Link>

      <h1 className="mt-3 text-xl font-extrabold">Meus favoritos</h1>
      <p className="mt-1 text-sm text-muted">
        Salvos só nesse navegador — pra levar pra outro aparelho, favorite de novo por lá.
      </p>

      {produtos === null ? (
        <p className="mt-6 text-[13px] text-muted">Carregando...</p>
      ) : produtos.length === 0 ? (
        <p className="mt-6 text-[13px] text-muted">
          Você ainda não favoritou nenhum produto —{" "}
          <Link href="/produtos" className="font-bold text-accent-dark underline">
            explore os produtos
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {produtos.map((p) => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
