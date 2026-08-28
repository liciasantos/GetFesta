"use client";

import { useState, useTransition } from "react";
import { alternarCompatibilidade } from "@/lib/actions/admin";

export default function CompatibilidadeMatrix({
  categoriasProfissionais,
  categorias,
  paresIniciais,
}: {
  categoriasProfissionais: { id: number; nome: string }[];
  categorias: { id: number; nome: string }[];
  paresIniciais: string[];
}) {
  const [pares, setPares] = useState(() => new Set(paresIniciais));
  const [, startTransition] = useTransition();

  function toggle(categoriaProfissionalId: number, categoriaId: number) {
    const key = `${categoriaProfissionalId}-${categoriaId}`;
    setPares((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    startTransition(async () => {
      const res = await alternarCompatibilidade(categoriaProfissionalId, categoriaId);
      if (res?.error) {
        window.alert(res.error);
        // reverte o otimismo se deu erro
        setPares((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-border bg-surface p-2 text-left font-bold">
              Função ↓ / Categoria →
            </th>
            {categorias.map((c) => (
              <th
                key={c.id}
                className="border-b border-border bg-surface-alt p-2 text-center font-bold"
                style={{ writingMode: "vertical-rl", minWidth: 32 }}
                title={c.nome}
              >
                <span className="inline-block rotate-180 whitespace-nowrap">{c.nome}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categoriasProfissionais.map((cp) => (
            <tr key={cp.id}>
              <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-surface p-2 font-semibold">
                {cp.nome}
              </td>
              {categorias.map((c) => {
                const marcado = pares.has(`${cp.id}-${c.id}`);
                return (
                  <td key={c.id} className="border-b border-border text-center">
                    <button
                      type="button"
                      onClick={() => toggle(cp.id, c.id)}
                      aria-label={`${cp.nome} x ${c.nome}`}
                      className={`m-1 h-5 w-5 rounded ${
                        marcado ? "bg-accent" : "border border-border-strong bg-surface hover:bg-surface-alt"
                      }`}
                    >
                      {marcado && <span className="text-[10px] text-white">✓</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
