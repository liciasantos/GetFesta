"use server";

import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registrarClienteSchema, registrarEmpresaSchema, registrarProfissionalSchema } from "@/lib/validators";
import { buildEmailVerificationToken } from "@/lib/email-verification";
import { buildConfirmacaoCadastroEmail, sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/google-oauth";

async function enviarEmailConfirmacaoCadastro(usuarioId: string, email: string, nome: string) {
  const token = buildEmailVerificationToken(usuarioId);
  const link = `${getAppUrl()}/api/verificar-email?token=${token}`;
  const { subject, html } = buildConfirmacaoCadastroEmail(nome, link);
  await sendEmail({ to: email, subject, html });
}

export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const usuario = await queryOne<{ id: string; tipo: string; senha_hash: string | null }>(
    `SELECT id, tipo, senha_hash FROM usuarios WHERE email = $1 AND ativo = true`,
    [parsed.data.email]
  );
  if (!usuario || !usuario.senha_hash || !(await verifyPassword(parsed.data.senha, usuario.senha_hash))) {
    return { error: "E-mail ou senha incorretos" };
  }

  await createSession({ usuarioId: usuario.id, tipo: usuario.tipo as "cliente" | "empresa" | "profissional" | "admin" });

  if (usuario.tipo === "empresa") redirect("/painel");
  if (usuario.tipo === "cliente") redirect("/meus-pedidos");
  if (usuario.tipo === "profissional") redirect("/perfil-profissional");
  if (usuario.tipo === "admin") redirect("/admin");
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function registrarCliente(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registrarClienteSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    senha: formData.get("senha"),
    cidadeId: formData.get("cidadeId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await queryOne(`SELECT id FROM usuarios WHERE email = $1`, [parsed.data.email]);
  if (existente) {
    return { error: "Já existe uma conta com esse e-mail" };
  }

  const senhaHash = await hashPassword(parsed.data.senha);
  const usuario = await queryOne<{ id: string }>(
    `INSERT INTO usuarios (tipo, email, senha_hash, telefone) VALUES ('cliente', $1, $2, $3) RETURNING id`,
    [parsed.data.email, senhaHash, parsed.data.telefone]
  );
  if (!usuario) return { error: "Não foi possível criar a conta, tente novamente" };

  await query(`INSERT INTO clientes (usuario_id, nome, cidade_id) VALUES ($1, $2, $3)`, [
    usuario.id,
    parsed.data.nome,
    parsed.data.cidadeId ?? null,
  ]);

  // Se veio de um pedido publicado sem login, vincula o pedido a essa conta agora.
  const pedidoIdParaVincular = formData.get("pedidoId");
  if (typeof pedidoIdParaVincular === "string" && pedidoIdParaVincular.length > 0) {
    await query(`UPDATE pedidos SET cliente_id = $1 WHERE id = $2 AND cliente_id IS NULL`, [
      usuario.id,
      pedidoIdParaVincular,
    ]);
  }

  await enviarEmailConfirmacaoCadastro(usuario.id, parsed.data.email, parsed.data.nome);
  await createSession({ usuarioId: usuario.id, tipo: "cliente" });
  redirect("/meus-pedidos");
}

export async function registrarEmpresa(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registrarEmpresaSchema.safeParse({
    nomeFantasia: formData.get("nomeFantasia"),
    razaoSocial: formData.get("razaoSocial"),
    cnpj: formData.get("cnpj"),
    email: formData.get("email"),
    telefoneContato: formData.get("telefoneContato"),
    instagram: formData.get("instagram") || undefined,
    senha: formData.get("senha"),
    cidadeId: formData.get("cidadeId"),
    categoriaIds: formData.getAll("categoriaIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const cnpjLimpo = parsed.data.cnpj.replace(/\D/g, "");

  const existente = await queryOne(
    `SELECT u.id FROM usuarios u WHERE u.email = $1
     UNION SELECT e.usuario_id FROM empresas e WHERE regexp_replace(e.cnpj, '\\D', '', 'g') = $2`,
    [parsed.data.email, cnpjLimpo]
  );
  if (existente) {
    return { error: "Já existe uma conta com esse e-mail ou CNPJ" };
  }

  const senhaHash = await hashPassword(parsed.data.senha);
  const usuario = await queryOne<{ id: string }>(
    `INSERT INTO usuarios (tipo, email, senha_hash, telefone) VALUES ('empresa', $1, $2, $3) RETURNING id`,
    [parsed.data.email, senhaHash, parsed.data.telefoneContato]
  );
  if (!usuario) return { error: "Não foi possível criar a conta, tente novamente" };

  await query(
    `INSERT INTO empresas (usuario_id, razao_social, nome_fantasia, cnpj, instagram, telefone_contato, perfil_reivindicado)
     VALUES ($1,$2,$3,$4,$5,$6, true)`,
    [usuario.id, parsed.data.razaoSocial, parsed.data.nomeFantasia, parsed.data.cnpj, parsed.data.instagram ?? null, parsed.data.telefoneContato]
  );

  for (const categoriaId of parsed.data.categoriaIds) {
    await query(`INSERT INTO empresa_categorias (empresa_id, categoria_id) VALUES ($1,$2)`, [usuario.id, categoriaId]);
  }
  await query(`INSERT INTO empresa_areas_atuacao (empresa_id, cidade_id, bairro_id) VALUES ($1,$2,NULL)`, [
    usuario.id,
    parsed.data.cidadeId,
  ]);

  // Todo cadastro comeca no plano Gratis (sem cobranca, com o limite de
  // orcamentos/mes do plano) - a empresa faz upgrade quando quiser no painel.
  const planoGratis = await queryOne<{ id: number }>(`SELECT id FROM planos WHERE tipo = 'empresa_gratis' LIMIT 1`);
  if (planoGratis) {
    await query(`INSERT INTO assinaturas (usuario_id, plano_id, status) VALUES ($1,$2,'ativa')`, [
      usuario.id,
      planoGratis.id,
    ]);
  }

  await enviarEmailConfirmacaoCadastro(usuario.id, parsed.data.email, parsed.data.nomeFantasia);
  await createSession({ usuarioId: usuario.id, tipo: "empresa" });
  redirect("/painel");
}

export async function registrarProfissional(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registrarProfissionalSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    senha: formData.get("senha"),
    bairroId: formData.get("bairroId"),
    categoriaIds: formData.getAll("categoriaIds"),
    consentimento: formData.get("consentimento") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await queryOne(`SELECT id FROM usuarios WHERE email = $1`, [parsed.data.email]);
  if (existente) {
    return { error: "Já existe uma conta com esse e-mail" };
  }

  const senhaHash = await hashPassword(parsed.data.senha);
  const usuario = await queryOne<{ id: string }>(
    `INSERT INTO usuarios (tipo, email, senha_hash, telefone) VALUES ('profissional', $1, $2, $3) RETURNING id`,
    [parsed.data.email, senhaHash, parsed.data.telefone]
  );
  if (!usuario) return { error: "Não foi possível criar a conta, tente novamente" };

  await query(
    `INSERT INTO profissionais (usuario_id, nome, bairro_id, consentimento_dados_em) VALUES ($1,$2,$3, now())`,
    [usuario.id, parsed.data.nome, parsed.data.bairroId]
  );

  for (const categoriaId of parsed.data.categoriaIds) {
    await query(`INSERT INTO profissional_categorias (profissional_id, categoria_id) VALUES ($1,$2)`, [
      usuario.id,
      categoriaId,
    ]);
  }

  // Lancamento: acesso pleno gratuito por tempo limitado (secao 4 do plano).
  const planoProfissional = await queryOne<{ id: number }>(`SELECT id FROM planos WHERE tipo = 'profissional' LIMIT 1`);
  if (planoProfissional) {
    await query(`INSERT INTO assinaturas (usuario_id, plano_id, status) VALUES ($1,$2,'trial')`, [
      usuario.id,
      planoProfissional.id,
    ]);
  }

  await enviarEmailConfirmacaoCadastro(usuario.id, parsed.data.email, parsed.data.nome);
  await createSession({ usuarioId: usuario.id, tipo: "profissional" });
  redirect("/perfil-profissional");
}
