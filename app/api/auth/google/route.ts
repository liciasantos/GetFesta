import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl, getAppUrl, type GoogleTipo } from "@/lib/google-oauth";

const TIPOS_PERMITIDOS: GoogleTipo[] = ["cliente", "profissional"];

export async function GET(request: NextRequest) {
  const tipo = request.nextUrl.searchParams.get("tipo");
  if (!TIPOS_PERMITIDOS.includes(tipo as GoogleTipo)) {
    return NextResponse.redirect(`${getAppUrl()}/entrar`);
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(`${getAppUrl()}/entrar?googleErro=1`);
  }
  return NextResponse.redirect(buildGoogleAuthUrl(tipo as GoogleTipo));
}
