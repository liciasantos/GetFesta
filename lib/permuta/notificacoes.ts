import { queryOne } from "@/lib/db";
import { emailShell, sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/google-oauth";
import { formatDataCurta, getPermutaConfig } from "@/lib/data/permuta";

/** E-mails da Permuta B2B. Todos passam por sendEmail (Resend) - sem
 * RESEND_API_KEY o envio só vira um aviso no log, nunca quebra a ação que
 * disparou. O admin desliga tudo em /admin/permutas (emailsAtivos). */

export type AvisoPermuta =
  | { tipo: "proposta_recebida"; acordoId: string; de: string }
  | { tipo: "contraproposta"; acordoId: string; de: string; versao: number }
  | { tipo: "acordo_assinado"; acordoId: string; com: string }
  | { tipo: "proposta_recusada"; acordoId: string; por: string }
  | { tipo: "acordo_cancelado"; acordoId: string; por: string }
  | { tipo: "entrega_confirmada"; acordoId: string; por: string; nota: number }
  | { tipo: "disputa_aberta"; acordoId: string; por: string }
  | { tipo: "fotos_recebidas"; acordoId: string; de: string; quantidade: number }
  | { tipo: "lembrete_confirmar"; acordoId: string; de: string; servico: string; data: string }
  | { tipo: "lembrete_entrega"; acordoId: string; para: string; servico: string; data: string };

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function conteudo(a: AvisoPermuta, nome: string) {
  const link = `${getAppUrl()}/painel/permutas/acordos/${a.acordoId}`;
  const p = (t: string) => `<p style="margin:0 0 12px;">${t}</p>`;
  switch (a.tipo) {
    case "proposta_recebida":
      return {
        subject: `${a.de} quer trocar serviços com você`,
        heading: `Nova proposta de permuta, ${esc(nome)}`,
        body: p(`<b>${esc(a.de)}</b> enviou uma proposta de troca de serviços pela rede de permutas da GetFesta.`) +
          p("Revise as datas, o escopo e o equilíbrio de valores. Você pode assinar, recusar ou propor outros termos."),
        cta: "Ver proposta",
        link,
        nota: "Os contatos das duas empresas só são liberados depois que as duas assinam o acordo.",
      };
    case "contraproposta":
      return {
        subject: `${a.de} alterou os termos da permuta`,
        heading: "Os termos da proposta mudaram",
        body: p(`<b>${esc(a.de)}</b> fez uma contraproposta (versão ${a.versao}). Revise e assine se estiver de acordo.`),
        cta: "Revisar e assinar",
        link,
        nota: "A versão anterior deixou de valer — só a nova precisa da sua assinatura.",
      };
    case "acordo_assinado":
      return {
        subject: `Permuta com ${a.com} assinada`,
        heading: "Acordo assinado pelas duas empresas",
        body: p(`O acordo de permuta com <b>${esc(a.com)}</b> foi assinado pelas duas empresas. Os contatos estão liberados na página do acordo.`),
        cta: "Ver acordo e contatos",
        link,
        nota: "Depois de cada evento, quem recebeu o serviço confirma e avalia pela GetFesta.",
      };
    case "proposta_recusada":
      return {
        subject: `${a.por} recusou a proposta de permuta`,
        heading: "Proposta recusada",
        body: p(`<b>${esc(a.por)}</b> recusou a proposta de permuta. Você pode procurar outras empresas na vitrine de trocas.`),
        cta: "Ver detalhes",
        link,
        nota: "Propostas recusadas não contam no limite de empresas do seu plano.",
      };
    case "acordo_cancelado":
      return {
        subject: `Permuta com ${a.por} cancelada`,
        heading: "Acordo cancelado",
        body: p(`<b>${esc(a.por)}</b> cancelou o acordo de permuta. O motivo está registrado na página do acordo.`),
        cta: "Ver acordo",
        link,
        nota: "Se algo não saiu como combinado, você pode falar com a equipe GetFesta pela página do acordo.",
      };
    case "entrega_confirmada":
      return {
        subject: `${a.por} confirmou sua entrega (nota ${a.nota})`,
        heading: "Sua entrega foi confirmada",
        body: p(`<b>${esc(a.por)}</b> confirmou que o seu serviço foi realizado e deu nota <b>${a.nota}</b>. Isso soma no seu nível de confiança.`),
        cta: "Ver avaliação",
        link,
        nota: "Se a outra empresa enviar fotos do evento, você pode adicioná-las ao seu portfólio.",
      };
    case "disputa_aberta":
      return {
        subject: `Disputa aberta na permuta com ${a.por}`,
        heading: "Uma disputa foi aberta",
        body: p(`<b>${esc(a.por)}</b> abriu uma disputa neste acordo. Ele fica congelado até a equipe GetFesta analisar.`),
        cta: "Ver acordo",
        link,
        nota: "Use as mensagens do acordo para registrar a sua versão — a equipe analisa todo o histórico.",
      };
    case "fotos_recebidas":
      return {
        subject: `${a.de} enviou ${a.quantidade} foto(s) do evento`,
        heading: "Fotos do evento para o seu portfólio",
        body: p(`<b>${esc(a.de)}</b> enviou fotos do evento em que você prestou o serviço e autorizou o uso no seu portfólio.`) +
          p("Escolha quais entram na sua galeria."),
        cta: "Ver fotos",
        link,
        nota: "Nenhuma foto entra na sua galeria sem você escolher.",
      };
    case "lembrete_confirmar":
      return {
        subject: `Confirme a entrega de ${a.de}`,
        heading: "O serviço aconteceu?",
        body: p(`<b>${esc(a.de)}</b> tinha que entregar <b>${esc(a.servico)}</b> no seu evento de <b>${formatDataCurta(a.data)}</b>.`) +
          p("Confirme que o serviço foi realizado e deixe sua avaliação — leva menos de um minuto."),
        cta: "Confirmar e avaliar",
        link,
        nota: "Se não houver resposta no prazo, a entrega conta como realizada automaticamente. Se houve problema, abra uma disputa.",
      };
    case "lembrete_entrega":
      return {
        subject: `Sua entrega para ${a.para} é em breve`,
        heading: "Lembrete da sua entrega",
        body: p(`Você combinou entregar <b>${esc(a.servico)}</b> para <b>${esc(a.para)}</b> em <b>${formatDataCurta(a.data)}</b>.`) +
          p("Confira o escopo e alinhe os detalhes pelas mensagens do acordo."),
        cta: "Ver acordo",
        link,
        nota: "Se não puder comparecer, avise a outra empresa pelo acordo e combine um substituto verificado.",
      };
  }
}

/** Envia o aviso para a empresa (e-mail da conta). Nunca lança erro. */
export async function avisarEmpresa(empresaId: string, aviso: AvisoPermuta): Promise<void> {
  try {
    const cfg = await getPermutaConfig();
    if (!cfg.emailsAtivos) return;
    const dest = await queryOne<{ email: string | null; nome: string }>(
      `SELECT u.email, e.nome_fantasia AS nome FROM empresas e JOIN usuarios u ON u.id = e.usuario_id WHERE e.usuario_id = $1`,
      [empresaId]
    );
    if (!dest?.email) return;
    const c = conteudo(aviso, dest.nome);
    await sendEmail({
      to: dest.email,
      subject: c.subject,
      html: emailShell({
        preheader: c.subject,
        heading: c.heading,
        bodyHtml: c.body,
        ctaLabel: c.cta,
        ctaUrl: c.link,
        footerNote: c.nota,
      }),
    });
  } catch (err) {
    console.error("Falha ao montar/enviar aviso de permuta:", err);
  }
}

export async function nomeEmpresa(empresaId: string): Promise<string> {
  const r = await queryOne<{ nome_fantasia: string }>(`SELECT nome_fantasia FROM empresas WHERE usuario_id = $1`, [empresaId]);
  return r?.nome_fantasia ?? "Uma empresa";
}
