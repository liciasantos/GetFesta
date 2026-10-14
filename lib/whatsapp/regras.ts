/** Regras dos avisos por WhatsApp - um JSON só em configuracoes_site (chave
 * CONFIG_WHATSAPP), editado pelo admin em /admin/whatsapp. Sem dependência
 * de servidor: pode ser importado por client components. */

export const CONFIG_WHATSAPP = "whatsapp_config";
/** Cookie que esconde a janela de convite por 30 dias ("Agora não"). */
export const COOKIE_CONVITE_WHATSAPP = "gf_whatsapp_convite";

export type WhatsAppConfig = {
  /** Liga/desliga tudo: sem isso o card do perfil some e nada é enviado. */
  ativo: boolean;
  pedidos: boolean;
  vagas: boolean;
  lembretes: boolean;
  /** Pausa aleatória entre uma mensagem e outra (segundos) - número com
   * envio em rajada é o que mais leva o WhatsApp a bloquear. */
  intervaloMin: number;
  intervaloMax: number;
  /** Teto de mensagens por dia (horário de Brasília). */
  limiteDiario: number;
  /** Só envia entre essas horas (Brasília); fora disso a fila espera. */
  horaInicio: number;
  horaFim: number;
};

export const WHATSAPP_PADRAO: WhatsAppConfig = {
  ativo: false,
  pedidos: true,
  vagas: true,
  lembretes: true,
  intervaloMin: 8,
  intervaloMax: 20,
  limiteDiario: 200,
  horaInicio: 8,
  horaFim: 21,
};

export function parseWhatsAppConfig(valor: string | null | undefined): WhatsAppConfig {
  if (!valor) return { ...WHATSAPP_PADRAO };
  try {
    const j = JSON.parse(valor) as Partial<WhatsAppConfig>;
    return { ...WHATSAPP_PADRAO, ...j };
  } catch {
    return { ...WHATSAPP_PADRAO };
  }
}

export type TipoAviso =
  | "boas_vindas"
  | "pedido_novo"
  | "vaga_nova"
  | "candidatura_nova"
  | "vaga_selecionado"
  | "vaga_desistencia"
  | "lembrete_vaga";

/** Qual chave da config controla cada tipo (boas-vindas sempre sai). */
export function eventoDoTipo(tipo: TipoAviso): "pedidos" | "vagas" | "lembretes" | null {
  if (tipo === "pedido_novo") return "pedidos";
  if (tipo === "lembrete_vaga") return "lembretes";
  if (tipo === "boas_vindas") return null;
  return "vagas";
}

/** Só dígitos, com DDI 55. Aceita "(11) 98765-4321", "+55 11 ...", etc.
 * Retorna null se não parecer um celular/fixo brasileiro. */
export function normalizarNumero(telefone: string | null | undefined): string | null {
  if (!telefone) return null;
  let d = telefone.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!d.startsWith("55") || (d.length !== 12 && d.length !== 13)) return null;
  return d;
}

export function formatarNumero(numero: string): string {
  const d = numero.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}
