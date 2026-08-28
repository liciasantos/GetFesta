import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { readEmailVerificationToken } from "@/lib/email-verification";
import { getAppUrl } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const usuarioId = token ? readEmailVerificationToken(token) : null;

  if (!usuarioId) {
    return NextResponse.redirect(`${getAppUrl()}/entrar?emailErro=1`);
  }

  await query(`UPDATE usuarios SET email_verificado = true WHERE id = $1`, [usuarioId]);
  return NextResponse.redirect(`${getAppUrl()}/entrar?emailConfirmado=1`);
}
