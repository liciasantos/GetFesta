// Envio de email via API REST do Resend (sem SDK - evita depender de um pacote
// novo so pra isso). Se RESEND_API_KEY nao estiver configurada, falha em
// silencio (log de aviso) pra nunca travar um cadastro por causa do email.
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_PADRAO = "GetFesta <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.warn("RESEND_API_KEY nao configurada - email nao enviado:", subject, "para", to);
    return;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? FROM_PADRAO,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error("Falha ao enviar email via Resend:", res.status, await res.text());
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Erro ao chamar a API do Resend:", err);
  }
}

export function buildResetSenhaEmail(nome: string, linkReset: string): { subject: string; html: string } {
  return {
    subject: "Redefinir sua senha na GetFesta",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2933;">
        <h1 style="color: #e14f30; font-size: 20px;">Olá, ${nome}</h1>
        <p style="font-size: 14px; line-height: 1.6;">
          Recebemos um pedido para redefinir a senha da sua conta na GetFesta. Clique no botão abaixo pra escolher
          uma nova senha:
        </p>
        <p style="margin: 24px 0;">
          <a href="${linkReset}" style="background: #ff6b4a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Redefinir minha senha
          </a>
        </p>
        <p style="font-size: 12px; color: #6b7684;">
          Esse link vale por 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha
          continua a mesma.
        </p>
      </div>
    `,
  };
}

export function buildConfirmacaoCadastroEmail(nome: string, linkConfirmacao: string): { subject: string; html: string } {
  return {
    subject: "Confirme seu cadastro na GetFesta",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2933;">
        <h1 style="color: #e14f30; font-size: 20px;">Bem-vindo(a) à GetFesta, ${nome}!</h1>
        <p style="font-size: 14px; line-height: 1.6;">
          Seu cadastro foi criado com sucesso. Clique no botão abaixo para confirmar seu e-mail:
        </p>
        <p style="margin: 24px 0;">
          <a href="${linkConfirmacao}" style="background: #ff6b4a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Confirmar meu e-mail
          </a>
        </p>
        <p style="font-size: 12px; color: #6b7684;">
          Se você não fez esse cadastro, pode ignorar este e-mail.
        </p>
      </div>
    `,
  };
}
