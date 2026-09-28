"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { mensagemConsultaCnpj, validarCnpjDaEmpresa } from "@/lib/cnpj-validacao";

export type CnpjActionResult = { ok?: boolean; error?: string; mensagem?: string };

function revalidar(empresaId: string) {
  revalidatePath("/painel/perfil");
  revalidatePath("/painel/permutas", "layout");
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/permutas", "layout");
  revalidatePath(`/empresa/${empresaId}`);
}

/** Botão "Validar meu CNPJ" em Perfil da empresa. */
export async function validarMeuCnpj(): Promise<CnpjActionResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };
  const r = await validarCnpjDaEmpresa(session.usuarioId);
  const m = mensagemConsultaCnpj(r);
  revalidar(session.usuarioId);
  return m.ok ? { ok: true, mensagem: m.texto } : { error: m.texto };
}

/** Admin: roda a consulta automática para uma empresa. */
export async function revalidarCnpjAdmin(empresaId: string): Promise<CnpjActionResult> {
  const session = await getSession();
  if (!session || session.tipo !== "admin") return { error: "Sessão inválida." };
  const r = await validarCnpjDaEmpresa(empresaId);
  const m = mensagemConsultaCnpj(r);
  revalidar(empresaId);
  return m.ok ? { ok: true, mensagem: m.texto } : { error: m.texto };
}

/** Admin: marca/desmarca manualmente (quando a consulta automática não resolve). */
export async function alternarCnpjValidadoAdmin(empresaId: string): Promise<CnpjActionResult> {
  const session = await getSession();
  if (!session || session.tipo !== "admin") return { error: "Sessão inválida." };
  await query(
    `UPDATE empresas SET cnpj_validado = NOT cnpj_validado, cnpj_validado_em = now() WHERE usuario_id = $1`,
    [empresaId]
  );
  revalidar(empresaId);
  return { ok: true };
}
