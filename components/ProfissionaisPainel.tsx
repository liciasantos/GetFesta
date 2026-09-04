"use client";

import { useMemo, useState, useTransition } from "react";
import { buscarProfissionaisAction } from "@/lib/actions/profissionais";
import ProfissionalCard from "@/components/ProfissionalCard";
import type { ProfissionalBusca, FiltrosBuscaProfissional } from "@/lib/data/profissionais";
import type { Cidade } from "@/lib/data/geo";
import type { CategoriaProfissional } from "@/lib/data/profissionais";

const SEXO_OPCOES = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
];

/** Grade paginada de profissionais, reaproveitada em dois lugares de
 * /painel/vagas: "Buscar profissionais" (com filtros, 20 por página = 5
 * colunas x 4 linhas) e "Profissionais em destaque" (sem filtros, 5 por
 * página = 1 linha) - os dois embaralhados a cada carregamento (ver
 * listProfissionaisCompativeis). */
export default function ProfissionaisPainel({
  inicial,
  cidades = [],
  categorias = [],
  porPagina = 20,
  mostrarFiltros = true,
}: {
  inicial: ProfissionalBusca[];
  cidades?: Cidade[];
  categorias?: CategoriaProfissional[];
  porPagina?: number;
  mostrarFiltros?: boolean;
}) {
  const [lista, setLista] = useState(inicial);
  const [pagina, setPagina] = useState(0);
  const [cidadeId, setCidadeId] = useState("");
  const [sexo, setSexo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [isPending, startTransition] = useTransition();

  const cidadesPorEstado = useMemo(() => {
    const grupos = new Map<string, Cidade[]>();
    for (const c of cidades) {
      const grupo = grupos.get(c.estado) ?? [];
      grupo.push(c);
      grupos.set(c.estado, grupo);
    }
    return grupos;
  }, [cidades]);

  function aplicarFiltros(novo: Partial<{ cidadeId: string; sexo: string; categoriaId: string }>) {
    const filtroCidade = novo.cidadeId ?? cidadeId;
    const filtroSexo = novo.sexo ?? sexo;
    const filtroCategoria = novo.categoriaId ?? categoriaId;
    if (novo.cidadeId !== undefined) setCidadeId(novo.cidadeId);
    if (novo.sexo !== undefined) setSexo(novo.sexo);
    if (novo.categoriaId !== undefined) setCategoriaId(novo.categoriaId);

    const filtros: FiltrosBuscaProfissional = {
      cidadeId: filtroCidade ? Number(filtroCidade) : undefined,
      sexo: filtroSexo || undefined,
      categoriaId: filtroCategoria ? Number(filtroCategoria) : undefined,
    };
    startTransition(async () => {
      const res = await buscarProfissionaisAction(filtros);
      setLista(res);
      setPagina(0);
    });
  }

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const visiveis = lista.slice(pagina * porPagina, pagina * porPagina + porPagina);

  return (
    <div>
      {mostrarFiltros && (
        <div className="mb-4 flex flex-wrap gap-2.5">
          <select
            value={cidadeId}
            onChange={(e) => aplicarFiltros({ cidadeId: e.target.value })}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-2 text-[12.5px] disabled:opacity-50"
          >
            <option value="">Todas as localizações</option>
            {[...cidadesPorEstado.entries()].map(([estado, cidadesDoEstado]) => (
              <optgroup key={estado} label={estado}>
                {cidadesDoEstado.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            value={sexo}
            onChange={(e) => aplicarFiltros({ sexo: e.target.value })}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-2 text-[12.5px] disabled:opacity-50"
          >
            <option value="">Feminino ou masculino</option>
            {SEXO_OPCOES.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <select
            value={categoriaId}
            onChange={(e) => aplicarFiltros({ categoriaId: e.target.value })}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-2 text-[12.5px] disabled:opacity-50"
          >
            <option value="">Todas as funções</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 ${isPending ? "opacity-50" : ""}`}>
        {visiveis.map((p) => (
          <ProfissionalCard key={p.usuario_id} p={p} />
        ))}
        {visiveis.length === 0 && !isPending && (
          <p className="col-span-full text-sm text-muted">Nenhum profissional encontrado com esses filtros.</p>
        )}
      </div>

      {lista.length > porPagina && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={isPending || pagina === 0}
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            aria-label="Ver profissionais anteriores"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-muted hover:bg-surface-alt disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-[11.5px] font-semibold text-muted">
            {pagina + 1} de {totalPaginas}
          </span>
          <button
            type="button"
            disabled={isPending || pagina >= totalPaginas - 1}
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
            aria-label="Ver mais profissionais"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-muted hover:bg-surface-alt disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
