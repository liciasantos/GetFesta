import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // token de confirmacao vale 7 dias

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  // prefixo "verify" separa esse HMAC do usado em lib/auth.ts pro cookie de sessao
  return crypto.createHmac("sha256", SECRET).update(`verify:${data}`).digest("base64url");
}

/** Gera o token do link de confirmacao de email (usuarioId + timestamp assinados). */
export function buildEmailVerificationToken(usuarioId: string): string {
  const payload = base64url(JSON.stringify({ usuarioId, criadoEm: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

/** Valida o token do link e retorna o usuarioId, ou null se invalido/expirado/adulterado. */
export function readEmailVerificationToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const { usuarioId, criadoEm } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof usuarioId !== "string" || typeof criadoEm !== "number") return null;
    if (Date.now() - criadoEm > MAX_AGE_MS) return null;
    return usuarioId;
  } catch {
    return null;
  }
}
