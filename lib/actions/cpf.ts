"use server";

import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { completarCpfSchema } from "@/lib/validators";
import { formatCPF, normalizeCPF } from "@/lib/cpf";
import type { ActionState } from "@/lib/actions/auth";

/** Usado pelo gate obrigatório de /completar-cadastro/cpf (cadastro via
 * Google) - diferente de atualizarPerfilCliente/Profissional, aqui o CPF é
 * obrigatório e a única coisa que o formulário pede. */
export async function completarCpf(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.tipo !== "cliente" && session.tipo !== "profissional")) {
    return { error: "Sessão inválida." };
  }

  const parsed = completarCpfSchema.safeParse({ cpf: formData.get("cpf") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const tabela = session.tipo === "cliente" ? "clientes" : "profissionais";
  const cpfNormalizado = normalizeCPF(parsed.data.cpf);
  const cpfDuplicado = await queryOne(
    `SELECT usuario_id FROM ${tabela} WHERE cpf IS NOT NULL AND regexp_replace(cpf, '\\D', '', 'g') = $1 AND usuario_id <> $2`,
    [cpfNormalizado, session.usuarioId]
  );
  if (cpfDuplicado) return { error: "Esse CPF já está cadastrado em outra conta." };

  await query(`UPDATE ${tabela} SET cpf = $1 WHERE usuario_id = $2`, [formatCPF(parsed.data.cpf), session.usuarioId]);

  redirect(session.tipo === "cliente" ? "/meus-pedidos" : "/perfil-profissional");
}
