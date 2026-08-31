"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne, pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function validarDataFutura(data: string): string | null {
  if (!RE_DATA.test(data)) return "Data inválida.";
  const hoje = new Date().toISOString().slice(0, 10);
  if (data < hoje) return "Não é possível marcar um dia que já passou.";
  return null;
}

export type ToggleDiaResult = { error?: string; indisponivel?: boolean };

/** Alterna o dia INTEIRO entre disponível/indisponível (data no formato
 * YYYY-MM-DD). Sem registro = disponível. Marcar o dia inteiro limpa
 * qualquer horário específico já cadastrado nesse dia, já que passa a estar
 * coberto pelo bloqueio do dia todo. */
export async function alternarDiaIndisponivel(data: string): Promise<ToggleDiaResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  const erro = validarDataFutura(data);
  if (erro) return { error: erro };

  const existente = await queryOne<{ id: string }>(
    `SELECT id FROM profissional_dias_indisponiveis WHERE profissional_id = $1 AND data = $2 AND hora_inicio IS NULL`,
    [session.usuarioId, data]
  );

  if (existente) {
    await query(`DELETE FROM profissional_dias_indisponiveis WHERE id = $1`, [existente.id]);
    revalidatePath("/perfil-profissional");
    return { indisponivel: false };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM profissional_dias_indisponiveis WHERE profissional_id = $1 AND data = $2 AND hora_inicio IS NOT NULL`,
      [session.usuarioId, data]
    );
    await client.query(`INSERT INTO profissional_dias_indisponiveis (profissional_id, data) VALUES ($1, $2)`, [
      session.usuarioId,
      data,
    ]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  revalidatePath("/perfil-profissional");
  return { indisponivel: true };
}

export type BloqueioHorarioResult = { error?: string; ok?: boolean };

/** Marca um intervalo específico do dia como indisponível, deixando o resto
 * do dia disponível. */
export async function adicionarBloqueioHorario(
  data: string,
  horaInicio: string,
  horaFim: string
): Promise<BloqueioHorarioResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  const erroData = validarDataFutura(data);
  if (erroData) return { error: erroData };
  if (!RE_HORA.test(horaInicio) || !RE_HORA.test(horaFim)) return { error: "Horário inválido." };
  if (horaFim <= horaInicio) return { error: "O horário final precisa ser depois do horário inicial." };

  const diaInteiro = await queryOne<{ id: string }>(
    `SELECT id FROM profissional_dias_indisponiveis WHERE profissional_id = $1 AND data = $2 AND hora_inicio IS NULL`,
    [session.usuarioId, data]
  );
  if (diaInteiro) return { error: "Esse dia já está marcado como indisponível o dia inteiro." };

  try {
    await query(
      `INSERT INTO profissional_dias_indisponiveis (profissional_id, data, hora_inicio, hora_fim) VALUES ($1, $2, $3, $4)`,
      [session.usuarioId, data, horaInicio, horaFim]
    );
  } catch {
    return { error: "Esse horário já está cadastrado nesse dia." };
  }

  revalidatePath("/perfil-profissional");
  return { ok: true };
}

/** Remove um bloqueio de horário específico (por id) - só o dono pode remover. */
export async function removerBloqueioHorario(id: string): Promise<BloqueioHorarioResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  await query(`DELETE FROM profissional_dias_indisponiveis WHERE id = $1 AND profissional_id = $2`, [
    id,
    session.usuarioId,
  ]);
  revalidatePath("/perfil-profissional");
  return { ok: true };
}
