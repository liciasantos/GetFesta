import { getAppUrl } from "@/lib/google-oauth";

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

/** Moldura visual comum a todo email transacional (logo, cartao branco,
 * rodape) - HTML com tabelas e estilo inline, do jeito exigido pra renderizar
 * de forma consistente em clientes de email (Gmail, Outlook etc, que ignoram
 * <style> e boa parte do CSS moderno). */
function emailShell({
  preheader,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
}: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}): string {
  const logoUrl = `${getAppUrl()}/logo-getfesta-email.png`;
  const ano = new Date().getFullYear();

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf9f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e8e1d5;">
            <tr>
              <td style="padding:32px 32px 8px;text-align:center;">
                <img src="${logoUrl}" width="180" alt="GetFesta" style="display:block;margin:0 auto;border:0;max-width:180px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#1f2933;">${heading}</h1>
                <div style="font-size:14px;line-height:1.6;color:#1f2933;">${bodyHtml}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:8px;background:#ff6b4a;">
                      <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;font-size:12px;color:#6b7684;line-height:1.6;">${footerNote}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;border-top:1px solid #e8e1d5;">
                <p style="margin:16px 0 0;font-size:11px;color:#98a0ac;text-align:center;">© ${ano} GetFesta — quem faz sua festa acontecer</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function buildResetSenhaEmail(nome: string, linkReset: string): { subject: string; html: string } {
  return {
    subject: "Redefinir sua senha na GetFesta",
    html: emailShell({
      preheader: "Clique no link pra escolher uma nova senha.",
      heading: `Olá, ${nome}`,
      bodyHtml: `<p style="margin:0 0 20px;">Recebemos um pedido para redefinir a senha da sua conta na GetFesta. Clique no botão abaixo pra escolher uma nova senha:</p>`,
      ctaLabel: "Redefinir minha senha",
      ctaUrl: linkReset,
      footerNote: "Esse link vale por 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.",
    }),
  };
}

export function buildVagaSelecionadaEmail(
  nome: string,
  categoriaNome: string,
  empresaNome: string,
  dataEvento: string,
  horaInicio: string
): { subject: string; html: string } {
  const dataFormatada = new Date(dataEvento).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return {
    subject: `Você foi selecionado(a) para uma vaga de ${categoriaNome}!`,
    html: emailShell({
      preheader: `${empresaNome} escolheu você pra vaga de ${categoriaNome}.`,
      heading: `Boa notícia, ${nome}!`,
      bodyHtml: `<p style="margin:0 0 12px;">A empresa <b>${empresaNome}</b> escolheu você para a vaga de <b>${categoriaNome}</b> que você se candidatou na GetFesta.</p>
                 <p style="margin:0 0 20px;">Data do evento: <b>${dataFormatada}</b> às <b>${horaInicio.slice(0, 5)}</b>. Já bloqueamos esse horário na sua agenda automaticamente.</p>`,
      ctaLabel: "Ver na minha agenda",
      ctaUrl: `${getAppUrl()}/perfil-profissional`,
      footerNote: "A empresa pode entrar em contato com você pelo WhatsApp pra combinar os detalhes do evento.",
    }),
  };
}

export function buildConfirmacaoCadastroEmail(nome: string, linkConfirmacao: string): { subject: string; html: string } {
  return {
    subject: "Confirme seu cadastro na GetFesta",
    html: emailShell({
      preheader: "Confirme seu email pra ativar seu cadastro na GetFesta.",
      heading: `Bem-vindo(a) à GetFesta, ${nome}!`,
      bodyHtml: `<p style="margin:0 0 20px;">Seu cadastro foi criado com sucesso. Clique no botão abaixo para confirmar seu e-mail:</p>`,
      ctaLabel: "Confirmar meu e-mail",
      ctaUrl: linkConfirmacao,
      footerNote: "Se você não fez esse cadastro, pode ignorar este e-mail.",
    }),
  };
}
