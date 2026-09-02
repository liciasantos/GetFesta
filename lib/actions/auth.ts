"use server";

import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { createSession, destroySession, getSession, hashPassword, verifyPassword } from "@/lib/auth";
import {
  alterarSenhaSchema,
  esqueciSenhaSchema,
  loginSchema,
  redefinirSenhaSchema,
  registrarClienteSchema,
  registrarEmpresaSchema,
  registrarProfissionalSchema,
} from "@/lib/validators";
import { buildEmailVerificationToken } from "@/lib/email-verification";
import { buildConfirmacaoCadastroEmail, buildResetSenhaEmail, sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/google-oauth";
import { gerarSlugUnicoEmpresa, gerarSlugUnicoProfissional } from "@/lib/slug";
import { buildPasswordResetToken, decodePasswordResetToken, isPasswordResetTokenAindaValido } from "@/lib/password-reset";

async function enviarEmailConfirmacaoCadastro(usuarioId: string, email: string, nome: string) {
  const token = buildEmailVerificationToken(usuarioId);
  const link = `${getAppUrl()}/api/verificar-email?token=${token}`;
  const { subject, html } = buildConfirmacaoCadastroEmail(nome, link);
  await sendEmail({ to: email, subject, html });
}

export type ActionState = { error?: string; fieldErrors?: Record<string, string>; success?: boolean } | undefined;

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

  if (usuario.tipo === "empresa") {
    // veio da tela de resumo de contratação (ja escolheu plano+periodo antes
    // de logar) - continua direto pro seletor de plano do painel.
    const planoIntencao = formData.get("planoIntencao");
    const mesesIntencao = formData.get("mesesIntencao");
    redirect(
      planoIntencao ? `/painel?plano=${planoIntencao}${mesesIntencao ? `&meses=${mesesIntencao}` : ""}` : "/painel"
    );
  }
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
    aceitouTermos: formData.get("aceitouTermos") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await queryOne(`SELECT id FROM usuarios WHERE email = $1`, [parsed.data.email]);
  if (existente) {
    return { error: "Já existe uma conta com esse e-mail" };
  }

  const telefoneDuplicado = await queryOne(
    `SELECT id FROM usuarios WHERE telefone IS NOT NULL
       AND right(regexp_replace(telefone, '\\D', '', 'g'), 11) = right(regexp_replace($1, '\\D', '', 'g'), 11)`,
    [parsed.data.telefone]
  );
  if (telefoneDuplicado) {
    return { error: "Esse telefone já está cadastrado em outra conta." };
  }

  const senhaHash = await hashPassword(parsed.data.senha);
  const usuario = await queryOne<{ id: string }>(
    `INSERT INTO usuarios (tipo, email, senha_hash, telefone, termos_aceitos_em) VALUES ('cliente', $1, $2, $3, now()) RETURNING id`,
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
    aceitouTermos: formData.get("aceitouTermos") || undefined,
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

  const telefoneDuplicado = await queryOne(
    `SELECT id FROM usuarios WHERE telefone IS NOT NULL
       AND right(regexp_replace(telefone, '\\D', '', 'g'), 11) = right(regexp_replace($1, '\\D', '', 'g'), 11)`,
    [parsed.data.telefoneContato]
  );
  if (telefoneDuplicado) {
    return { error: "Esse telefone já está cadastrado em outra conta." };
  }

  const senhaHash = await hashPassword(parsed.data.senha);
  const usuario = await queryOne<{ id: string }>(
    `INSERT INTO usuarios (tipo, email, senha_hash, telefone, termos_aceitos_em) VALUES ('empresa', $1, $2, $3, now()) RETURNING id`,
    [parsed.data.email, senhaHash, parsed.data.telefoneContato]
  );
  if (!usuario) return { error: "Não foi possível criar a conta, tente novamente" };

  const slug = await gerarSlugUnicoEmpresa(parsed.data.nomeFantasia);
  await query(
    `INSERT INTO empresas (usuario_id, slug, razao_social, nome_fantasia, cnpj, instagram, telefone_contato, perfil_reivindicado)
     VALUES ($1,$2,$3,$4,$5,$6,$7, true)`,
    [
      usuario.id,
      slug,
      parsed.data.razaoSocial,
      parsed.data.nomeFantasia,
      parsed.data.cnpj,
      parsed.data.instagram ?? null,
      parsed.data.telefoneContato,
    ]
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

  // se veio de "Contratar {plano pago}" na home/tela de resumo, manda direto
  // pro seletor de plano do painel ja aberto nesse plano+periodo (o cadastro
  // em si sempre comeca no Gratis, sem cobranca - ver INSERT acima).
  const planoIntencao = formData.get("planoIntencao");
  const mesesIntencao = formData.get("mesesIntencao");
  redirect(
    planoIntencao ? `/painel?plano=${planoIntencao}${mesesIntencao ? `&meses=${mesesIntencao}` : ""}` : "/painel"
  );
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
    aceitouTermos: formData.get("aceitouTermos") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await queryOne(`SELECT id FROM usuarios WHERE email = $1`, [parsed.data.email]);
  if (existente) {
    return { error: "Já existe uma conta com esse e-mail" };
  }

  const telefoneDuplicado = await queryOne(
    `SELECT id FROM usuarios WHERE telefone IS NOT NULL
       AND right(regexp_replace(telefone, '\\D', '', 'g'), 11) = right(regexp_replace($1, '\\D', '', 'g'), 11)`,
    [parsed.data.telefone]
  );
  if (telefoneDuplicado) {
    return { error: "Esse telefone já está cadastrado em outra conta." };
  }

  const senhaHash = await hashPassword(parsed.data.senha);
  const usuario = await queryOne<{ id: string }>(
    `INSERT INTO usuarios (tipo, email, senha_hash, telefone, termos_aceitos_em) VALUES ('profissional', $1, $2, $3, now()) RETURNING id`,
    [parsed.data.email, senhaHash, parsed.data.telefone]
  );
  if (!usuario) return { error: "Não foi possível criar a conta, tente novamente" };

  const slug = await gerarSlugUnicoProfissional(parsed.data.nome);
  // portfolio em PDF liberado de graca so pros 30 primeiros profissionais -
  // marcado uma unica vez aqui no cadastro, nunca recalculado depois (ver
  // coluna profissional_liberado_gratis no schema).
  const totalProfissionais = await queryOne<{ total: string }>(`SELECT count(*) AS total FROM profissionais`);
  const portfolioLiberadoGratis = Number(totalProfissionais?.total ?? 0) < 30;
  await query(
    `INSERT INTO profissionais (usuario_id, slug, nome, bairro_id, consentimento_dados_em, portfolio_liberado_gratis)
     VALUES ($1,$2,$3,$4,now(),$5)`,
    [usuario.id, slug, parsed.data.nome, parsed.data.bairroId, portfolioLiberadoGratis]
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

// ---------------------------------------------------------------------
// SENHA — esqueci minha senha (link por e-mail) e trocar senha no perfil
// ---------------------------------------------------------------------

/** Sempre responde com sucesso, exista ou não o e-mail na base - evita que o
 * formulário sirva pra descobrir quais e-mails têm conta na GetFesta. */
export async function solicitarResetSenha(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = esqueciSenhaSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const usuario = await queryOne<{ id: string; senha_hash: string | null; nome: string | null }>(
    `SELECT u.id, u.senha_hash, COALESCE(c.nome, e.nome_fantasia, p.nome) AS nome
     FROM usuarios u
     LEFT JOIN clientes c ON c.usuario_id = u.id
     LEFT JOIN empresas e ON e.usuario_id = u.id
     LEFT JOIN profissionais p ON p.usuario_id = u.id
     WHERE u.email = $1 AND u.ativo = true`,
    [parsed.data.email]
  );

  if (usuario?.senha_hash) {
    const token = buildPasswordResetToken(usuario.id, usuario.senha_hash);
    const link = `${getAppUrl()}/redefinir-senha?token=${token}`;
    const { subject, html } = buildResetSenhaEmail(usuario.nome ?? "", link);
    await sendEmail({ to: parsed.data.email, subject, html });
  }

  return { success: true };
}

export async function redefinirSenha(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = redefinirSenhaSchema.safeParse({
    token: formData.get("token"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const decoded = decodePasswordResetToken(parsed.data.token);
  if (!decoded) return { error: "Esse link é inválido ou já expirou. Solicite um novo." };

  const usuario = await queryOne<{ senha_hash: string | null }>(`SELECT senha_hash FROM usuarios WHERE id = $1`, [
    decoded.usuarioId,
  ]);
  if (!usuario?.senha_hash || !isPasswordResetTokenAindaValido(decoded.fp, usuario.senha_hash)) {
    return { error: "Esse link já foi usado ou expirou. Solicite um novo." };
  }

  const novoHash = await hashPassword(parsed.data.novaSenha);
  await query(`UPDATE usuarios SET senha_hash = $1 WHERE id = $2`, [novoHash, decoded.usuarioId]);

  return { success: true };
}

/** Troca de senha feita de dentro do perfil (cliente/empresa/profissional
 * usam a mesma action - senha fica em usuarios, tipo-agnostico). */
export async function alterarSenhaPropria(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Sessão inválida." };

  const parsed = alterarSenhaSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    senhaNova: formData.get("senhaNova"),
    confirmarSenha: formData.get("confirmarSenha"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const usuario = await queryOne<{ senha_hash: string | null }>(`SELECT senha_hash FROM usuarios WHERE id = $1`, [
    session.usuarioId,
  ]);
  if (!usuario?.senha_hash || !(await verifyPassword(parsed.data.senhaAtual, usuario.senha_hash))) {
    return { error: "Senha atual incorreta." };
  }

  const novoHash = await hashPassword(parsed.data.senhaNova);
  await query(`UPDATE usuarios SET senha_hash = $1 WHERE id = $2`, [novoHash, session.usuarioId]);

  return { success: true };
}
