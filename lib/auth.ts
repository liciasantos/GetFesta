import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "getfesta_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export type SessionPayload = {
  usuarioId: string;
  tipo: "cliente" | "empresa" | "profissional" | "admin";
};

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

/** Gera o valor do cookie de sessao: payload em base64url + assinatura HMAC */
export function encodeSession(payload: SessionPayload): string {
  const data = base64url(JSON.stringify(payload));
  const signature = sign(data);
  return `${data}.${signature}`;
}

/** Valida a assinatura e decodifica o payload; retorna null se invalido/adulterado */
export function decodeSession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = sign(data);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Le a sessao atual a partir do cookie (server components, route handlers, actions) */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verifyPassword(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
