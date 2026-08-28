const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export type GoogleTipo = "cliente" | "profissional";

export function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3100";
}

function getRedirectUri(): string {
  return `${getAppUrl()}/api/auth/google/callback`;
}

/** Monta a URL de consentimento do Google. `tipo` volta no `state` pra sabermos, no callback, que tipo de conta criar se for um cadastro novo. */
export function buildGoogleAuthUrl(tipo: GoogleTipo): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: tipo,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

type GoogleProfile = {
  email: string;
  emailVerificado: boolean;
  nome: string;
};

/** Troca o `code` do callback por um perfil (email + nome) da conta Google. */
export async function trocarCodePorPerfilGoogle(code: string): Promise<GoogleProfile | null> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      code,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return null;
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return null;

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!userRes.ok) return null;
  const userJson = (await userRes.json()) as { email?: string; email_verified?: boolean; name?: string };
  if (!userJson.email) return null;

  return {
    email: userJson.email,
    emailVerificado: userJson.email_verified ?? false,
    nome: userJson.name ?? userJson.email.split("@")[0],
  };
}
