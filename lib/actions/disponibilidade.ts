"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ToggleDiaResult = { error?: string; indisponivel?: boolean };

/** Alterna um dia entre disponível/indisponível no calendário próprio do
 * profissional (data no formato YYYY-MM-DD). Sem registro = disponível. */
export async function alternarDiaIndisponivel(data: string): Promise<ToggleDiaResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { error: "Data inválida." };
  const hoje = new Date().toISOString().slice(0, 10);
  if (data < hoje) return { error: "Não é possível marcar um dia que já passou." };

  const existente = await query<{ id: string }>(
    `SELECT id FROM profissional_dias_indisponiveis WHERE profissional_id = $1 AND data = $2`,
    [session.usuarioId, data]
  );

  if (existente.length > 0) {
    await query(`DELETE FROM profissional_dias_indisponiveis WHERE profissional_id = $1 AND data = $2`, [
      session.usuarioId,
      data,
    ]);
    revalidatePath("/perfil-profissional");
    return { indisponivel: false };
  }

  await query(`INSERT INTO profissional_dias_indisponiveis (profissional_id, data) VALUES ($1, $2)`, [
    session.usuarioId,
    data,
  ]);
  revalidatePath("/perfil-profissional");
  return { indisponivel: true };
}
