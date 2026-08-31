import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const MAX_AGE_MS = 1000 * 60 * 60; // link de redefinicao vale 1 hora

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  // prefixo "reset" separa esse HMAC dos outros usados no app (sessao, verificacao de email)
  return crypto.createHmac("sha256", SECRET).update(`reset:${data}`).digest("base64url");
}

/** Fingerprint da senha_hash atual (nao o hash em si) - embutido no token pra
 * que, assim que a senha for trocada (por esse link ou pelo perfil), o link
 * antigo pare de funcionar sozinho, sem precisar de tabela no banco pra
 * marcar "usado". */
function fingerprintSenha(senhaHash: string): string {
  return crypto.createHmac("sha256", SECRET).update(`senha:${senhaHash}`).digest("base64url");
}

export function buildPasswordResetToken(usuarioId: string, senhaHashAtual: string): string {
  const payload = base64url(JSON.stringify({ usuarioId, fp: fingerprintSenha(senhaHashAtual), criadoEm: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

/** Valida assinatura + validade do token e devolve o usuarioId e o fingerprint
 * embutido, sem consultar o banco - quem chama ainda precisa comparar o
 * fingerprint com o hash atual (ver isPasswordResetTokenAindaValido). */
export function decodePasswordResetToken(token: string): { usuarioId: string; fp: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const { usuarioId, fp, criadoEm } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof usuarioId !== "string" || typeof fp !== "string" || typeof criadoEm !== "number") return null;
    if (Date.now() - criadoEm > MAX_AGE_MS) return null;
    return { usuarioId, fp };
  } catch {
    return null;
  }
}

export function isPasswordResetTokenAindaValido(fp: string, senhaHashAtual: string): boolean {
  return fp === fingerprintSenha(senhaHashAtual);
}
