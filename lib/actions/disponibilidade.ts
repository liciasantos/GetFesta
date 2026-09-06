"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne, pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validarDataFutura(data: string): string | null {
  if (!RE_DATA.test(data)) return "Data inválida.";
  const hoje = new Date().toISOString().slice(0, 10);
  if (data < hoje) return "Não é possível marcar um dia que já passou.";
  return null;
}

/** Nota livre é opcional - normaliza string vazia pra null e corta no limite
 * da coluna (VARCHAR(200)) em vez de deixar o banco rejeitar o insert. */
function normalizarObservacao(observacao: string | null | undefined): string | null {
  const limpa = observacao?.trim();
  return limpa ? limpa.slice(0, 200) : null;
}

export type ToggleDiaResult = { error?: string; indisponivel?: boolean; id?: string };

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
    const inserido = await client.query<{ id: string }>(
      `INSERT INTO profissional_dias_indisponiveis (profissional_id, data) VALUES ($1, $2) RETURNING id`,
      [session.usuarioId, data]
    );
    await client.query("COMMIT");
    revalidatePath("/perfil-profissional");
    return { indisponivel: true, id: inserido.rows[0].id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export type DefinirDiasResult = { error?: string; datas?: string[]; indisponivel?: boolean };

/** Marca (ou desmarca) o dia INTEIRO como indisponível pra uma lista de datas
 * de uma vez só - usado pela seleção múltipla (arrastar no mobile, ctrl/shift
 * + clique no desktop) do calendário, pra não exigir um clique por dia. */
export async function definirDiasIndisponiveis(datas: string[], indisponivel: boolean): Promise<DefinirDiasResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (datas.length === 0) return { error: "Nenhum dia selecionado." };

  for (const data of datas) {
    const erro = validarDataFutura(data);
    if (erro) return { error: erro };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const data of datas) {
      await client.query(
        `DELETE FROM profissional_dias_indisponiveis WHERE profissional_id = $1 AND data = $2 AND hora_inicio IS NOT NULL`,
        [session.usuarioId, data]
      );
      if (indisponivel) {
        await client.query(
          `INSERT INTO profissional_dias_indisponiveis (profissional_id, data) VALUES ($1, $2)
           ON CONFLICT (profissional_id, data) WHERE hora_inicio IS NULL DO NOTHING`,
          [session.usuarioId, data]
        );
      } else {
        await client.query(
          `DELETE FROM profissional_dias_indisponiveis WHERE profissional_id = $1 AND data = $2 AND hora_inicio IS NULL`,
          [session.usuarioId, data]
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  revalidatePath("/perfil-profissional");
  return { datas, indisponivel };
}

export type BloqueioHorarioResult = { error?: string; ok?: boolean; id?: string };

/** Marca um intervalo específico do dia como indisponível, deixando o resto
 * do dia disponível. observacao é uma nota livre e opcional (ex: "consulta
 * médica"), só pra organização do próprio profissional. */
export async function adicionarBloqueioHorario(
  data: string,
  horaInicio: string,
  horaFim: string,
  observacao?: string | null
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

  let novoId: string;
  try {
    const inserido = await queryOne<{ id: string }>(
      `INSERT INTO profissional_dias_indisponiveis (profissional_id, data, hora_inicio, hora_fim, observacao)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [session.usuarioId, data, horaInicio, horaFim, normalizarObservacao(observacao)]
    );
    novoId = inserido!.id;
  } catch {
    return { error: "Esse horário já está cadastrado nesse dia." };
  }

  revalidatePath("/perfil-profissional");
  return { ok: true, id: novoId };
}

/** Edita o horário e/ou a observação de um bloqueio de horário específico já
 * existente (não se aplica a bloqueio de dia inteiro, que não tem horário). */
export async function editarBloqueioHorario(
  id: string,
  horaInicio: string,
  horaFim: string,
  observacao?: string | null
): Promise<BloqueioHorarioResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (!RE_UUID.test(id)) return { error: "Bloqueio inválido." };
  if (!RE_HORA.test(horaInicio) || !RE_HORA.test(horaFim)) return { error: "Horário inválido." };
  if (horaFim <= horaInicio) return { error: "O horário final precisa ser depois do horário inicial." };

  try {
    const atualizado = await queryOne<{ id: string }>(
      `UPDATE profissional_dias_indisponiveis
       SET hora_inicio = $1, hora_fim = $2, observacao = $3
       WHERE id = $4 AND profissional_id = $5 AND hora_inicio IS NOT NULL
       RETURNING id`,
      [horaInicio, horaFim, normalizarObservacao(observacao), id, session.usuarioId]
    );
    if (!atualizado) return { error: "Bloqueio não encontrado." };
  } catch {
    return { error: "Já existe um bloqueio nesse horário." };
  }

  revalidatePath("/perfil-profissional");
  return { ok: true, id };
}

/** Edita só a observação de um bloqueio (dia inteiro OU horário específico -
 * o único dos dois campos que um bloqueio de dia inteiro tem pra editar). */
export async function editarObservacaoBloqueio(id: string, observacao: string | null): Promise<BloqueioHorarioResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (!RE_UUID.test(id)) return { error: "Bloqueio inválido." };

  const atualizado = await queryOne<{ id: string }>(
    `UPDATE profissional_dias_indisponiveis SET observacao = $1 WHERE id = $2 AND profissional_id = $3 RETURNING id`,
    [normalizarObservacao(observacao), id, session.usuarioId]
  );
  if (!atualizado) return { error: "Bloqueio não encontrado." };

  revalidatePath("/perfil-profissional");
  return { ok: true, id };
}

/** Remove um bloqueio de horário específico (por id) - só o dono pode remover. */
export async function removerBloqueioHorario(id: string): Promise<BloqueioHorarioResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (!RE_UUID.test(id)) return { error: "Bloqueio inválido." };

  await query(`DELETE FROM profissional_dias_indisponiveis WHERE id = $1 AND profissional_id = $2`, [
    id,
    session.usuarioId,
  ]);
  revalidatePath("/perfil-profissional");
  return { ok: true };
}
