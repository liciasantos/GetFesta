import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { getAppUrl, trocarCodePorPerfilGoogle, type GoogleTipo } from "@/lib/google-oauth";

const TIPOS_PERMITIDOS: GoogleTipo[] = ["cliente", "profissional"];

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !TIPOS_PERMITIDOS.includes(state as GoogleTipo)) {
    return NextResponse.redirect(`${appUrl}/entrar?googleErro=1`);
  }
  const tipoNovaConta = state as GoogleTipo;

  const perfil = await trocarCodePorPerfilGoogle(code);
  if (!perfil || !perfil.emailVerificado) {
    return NextResponse.redirect(`${appUrl}/entrar?googleErro=1`);
  }

  const existente = await queryOne<{ id: string; tipo: "cliente" | "empresa" | "profissional" | "admin" }>(
    `SELECT id, tipo FROM usuarios WHERE email = $1 AND ativo = true`,
    [perfil.email]
  );

  if (existente) {
    await createSession({ usuarioId: existente.id, tipo: existente.tipo });
    return NextResponse.redirect(`${appUrl}${destinoPorTipo(existente.tipo)}`);
  }

  // Conta nova - email ja vem verificado pelo proprio Google.
  const usuario = await queryOne<{ id: string }>(
    `INSERT INTO usuarios (tipo, email, email_verificado) VALUES ($1, $2, true) RETURNING id`,
    [tipoNovaConta, perfil.email]
  );
  if (!usuario) return NextResponse.redirect(`${appUrl}/entrar?googleErro=1`);

  if (tipoNovaConta === "cliente") {
    await query(`INSERT INTO clientes (usuario_id, nome) VALUES ($1, $2)`, [usuario.id, perfil.nome]);
  } else {
    // Mesma regra de bonus de lancamento do cadastro por email/senha (ver
    // lib/actions/auth.ts registrarProfissional): os 20 primeiros ganham o
    // bonus Light (6 fotos + PDF) por 1 ano - calculado dinamicamente em
    // lib/data/limites-profissional.ts, nao precisa de assinatura aqui.
    const totalProfissionais = await queryOne<{ total: string }>(`SELECT count(*) AS total FROM profissionais`);
    const portfolioLiberadoGratis = Number(totalProfissionais?.total ?? 0) < 20;
    await query(
      `INSERT INTO profissionais (usuario_id, nome, consentimento_dados_em, portfolio_liberado_gratis) VALUES ($1, $2, now(), $3)`,
      [usuario.id, perfil.nome, portfolioLiberadoGratis]
    );
  }

  await createSession({ usuarioId: usuario.id, tipo: tipoNovaConta });
  return NextResponse.redirect(`${appUrl}${destinoPorTipo(tipoNovaConta)}`);
}

function destinoPorTipo(tipo: "cliente" | "empresa" | "profissional" | "admin"): string {
  if (tipo === "cliente") return "/meus-pedidos";
  if (tipo === "empresa") return "/painel";
  if (tipo === "profissional") return "/perfil-profissional";
  return "/admin";
}
