"use server";

import { getSession } from "@/lib/auth";
import { listProfissionaisCompativeis, type ProfissionalBusca, type FiltrosBuscaProfissional } from "@/lib/data/profissionais";

/** Refaz a busca de "Buscar profissionais" com os filtros escolhidos (cidade,
 * sexo, categoria) - chamado pelo cliente a cada troca de filtro, sem
 * recarregar a página inteira (ver BuscarProfissionaisPainel.tsx). */
export async function buscarProfissionaisAction(filtros: FiltrosBuscaProfissional): Promise<ProfissionalBusca[]> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return [];
  return listProfissionaisCompativeis(session.usuarioId, false, filtros);
}
