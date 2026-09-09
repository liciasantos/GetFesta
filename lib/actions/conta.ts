"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getSession, destroySession } from "@/lib/auth";

export type ExcluirContaState = { error?: string } | undefined;

/** Apaga a própria conta de cliente e encerra a sessão. Mesma limpeza de
 * removerCliente (lib/actions/admin.ts), mas o alvo é sempre o próprio
 * usuário logado (session.usuarioId) - nunca um id vindo do form. */
export async function excluirContaCliente(_prev: ExcluirContaState, formData: FormData): Promise<ExcluirContaState> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };
  if (formData.get("confirmacao") !== "EXCLUIR") return { error: 'Digite "EXCLUIR" para confirmar.' };

  const clienteId = session.usuarioId;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM avaliacoes WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM avaliacoes_cliente WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM eventos_rsvp WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM conversas WHERE cliente_id = $1`, [clienteId]);
    await client.query(`UPDATE pedidos SET cliente_id = NULL WHERE cliente_id = $1`, [clienteId]);
    await client.query(`DELETE FROM usuarios WHERE id = $1`, [clienteId]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Não foi possível excluir sua conta agora. Tente novamente mais tarde." };
  } finally {
    client.release();
  }

  await destroySession();
  redirect("/");
}

/** Apaga a própria conta de profissional e encerra a sessão. Mesma limpeza
 * de removerProfissionaisEmLote (lib/actions/admin.ts). */
export async function excluirContaProfissional(_prev: ExcluirContaState, formData: FormData): Promise<ExcluirContaState> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (formData.get("confirmacao") !== "EXCLUIR") return { error: 'Digite "EXCLUIR" para confirmar.' };

  const profissionalId = session.usuarioId;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE vagas_profissionais SET profissional_selecionado_id = NULL WHERE profissional_selecionado_id = $1`,
      [profissionalId]
    );
    await client.query(`DELETE FROM conversas WHERE profissional_id = $1`, [profissionalId]);
    await client.query(
      `DELETE FROM pagamentos WHERE assinatura_id IN (SELECT id FROM assinaturas WHERE usuario_id = $1)`,
      [profissionalId]
    );
    await client.query(`DELETE FROM assinaturas WHERE usuario_id = $1`, [profissionalId]);
    await client.query(`DELETE FROM usuarios WHERE id = $1`, [profissionalId]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Não foi possível excluir sua conta agora. Tente novamente mais tarde." };
  } finally {
    client.release();
  }

  await destroySession();
  redirect("/");
}

/** Apaga a própria conta de empresa e encerra a sessão. Mesma limpeza de
 * removerEmpresa (lib/actions/admin.ts), mais a limpeza de pagamentos que
 * removerEmpresa ainda não faz (pagamentos.assinatura_id não tem cascade). */
export async function excluirContaEmpresa(_prev: ExcluirContaState, formData: FormData): Promise<ExcluirContaState> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };
  if (formData.get("confirmacao") !== "EXCLUIR") return { error: 'Digite "EXCLUIR" para confirmar.' };

  const empresaId = session.usuarioId;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM creditos_compensacao WHERE empresa_id = $1
         OR pedido_interesse_id IN (SELECT id FROM pedido_interesses WHERE empresa_id = $1)`,
      [empresaId]
    );
    await client.query(`DELETE FROM avaliacoes WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM avaliacoes_cliente WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM banners_categoria WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM destaques WHERE empresa_id = $1`, [empresaId]);
    await client.query(`DELETE FROM conversas WHERE empresa_id = $1`, [empresaId]);
    await client.query(
      `DELETE FROM pagamentos WHERE assinatura_id IN (SELECT id FROM assinaturas WHERE usuario_id = $1)`,
      [empresaId]
    );
    await client.query(`DELETE FROM assinaturas WHERE usuario_id = $1`, [empresaId]);
    // usuarios -> empresas tem ON DELETE CASCADE, que arrasta o resto
    // (galeria, categorias, areas_atuacao, pacotes, vagas, etc.)
    await client.query(`DELETE FROM usuarios WHERE id = $1`, [empresaId]);
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return { error: "Não foi possível excluir sua conta agora. Tente novamente mais tarde." };
  } finally {
    client.release();
  }

  await destroySession();
  redirect("/");
}
