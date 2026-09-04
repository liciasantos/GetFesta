import { z } from "zod";

const aceitouTermosSchema = z
  .string()
  .optional()
  .refine((v) => v === "on", "É necessário aceitar a Política de Privacidade e os Termos de Uso");

const aceitouLgpdImagensSchema = z
  .string()
  .optional()
  .refine((v) => v === "on", "É necessário confirmar a declaração sobre imagens de crianças e adolescentes");

export const registrarClienteSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  cidadeId: z.coerce.number().optional(),
  aceitouTermos: aceitouTermosSchema,
});

export const registrarEmpresaSchema = z.object({
  nomeFantasia: z.string().min(2, "Informe o nome fantasia"),
  razaoSocial: z.string().min(2, "Informe a razão social"),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido")
    .refine((v) => v.replace(/\D/g, "").length === 14, "CNPJ deve ter 14 dígitos"),
  email: z.string().email("E-mail inválido"),
  telefoneContato: z.string().min(10, "Telefone inválido"),
  instagram: z.string().optional(),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  cidadeId: z.coerce.number({ message: "Selecione a cidade de atuação" }),
  categoriaIds: z.array(z.coerce.number()).min(1, "Selecione ao menos uma categoria"),
  aceitouTermos: aceitouTermosSchema,
  aceitouLgpdImagens: aceitouLgpdImagensSchema,
});

/** Mesmo shape de registrarEmpresaSchema, sem os checkboxes de aceite - quem
 * está preenchendo é o admin em nome da empresa (ver /admin/empresas/nova),
 * não a própria empresa. */
export const criarEmpresaManualSchema = z.object({
  nomeFantasia: z.string().min(2, "Informe o nome fantasia"),
  razaoSocial: z.string().min(2, "Informe a razão social"),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido")
    .refine((v) => v.replace(/\D/g, "").length === 14, "CNPJ deve ter 14 dígitos"),
  email: z.string().email("E-mail inválido"),
  telefoneContato: z.string().min(10, "Telefone inválido"),
  instagram: z.string().optional(),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  cidadeId: z.coerce.number({ message: "Selecione a cidade de atuação" }),
  categoriaIds: z.array(z.coerce.number()).min(1, "Selecione ao menos uma categoria"),
});

export const registrarProfissionalSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  bairroId: z.coerce.number({ message: "Selecione o bairro" }),
  categoriaIds: z.array(z.coerce.number()).min(1, "Selecione ao menos uma categoria"),
  consentimento: z.string().optional().refine((v) => v === "on", "É necessário aceitar o termo de uso de dados"),
  aceitouTermos: aceitouTermosSchema,
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export const criarAdminSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
});

export const esqueciSenhaSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const redefinirSenhaSchema = z
  .object({
    token: z.string().min(1, "Link inválido"),
    novaSenha: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmarSenha: z.string(),
  })
  .refine((v) => v.novaSenha === v.confirmarSenha, { message: "As senhas não coincidem", path: ["confirmarSenha"] });

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual"),
    senhaNova: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmarSenha: z.string(),
  })
  .refine((v) => v.senhaNova === v.confirmarSenha, { message: "As senhas não coincidem", path: ["confirmarSenha"] });

export const atualizarPerfilClienteSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  cidadeId: z.coerce.number().optional().nullable(),
});

export const atualizarPerfilEmpresaSchema = z.object({
  descricao: z.string().max(2000).optional(),
  capacidadeConvidados: z.coerce.number().optional().nullable(),
  precoAPartirDe: z.coerce.number().optional().nullable(),
  instagram: z.string().max(100).optional(),
  telefoneContato: z.string().min(10, "Telefone inválido"),
});

export const avaliacaoGoogleSchema = z.object({
  notaMediaGoogle: z.coerce.number().min(0, "Nota mínima é 0").max(5, "Nota máxima é 5"),
  totalAvaliacoesGoogle: z.coerce.number().int().min(0, "Não pode ser negativo"),
  urlPerfilGoogle: z
    .string()
    .url("Cole o link completo do seu perfil no Google (Maps ou Google Meu Negócio)")
    .max(500),
  googlePlaceId: z.string().max(120).optional(),
});

export const atualizarPerfilProfissionalSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  bairroId: z.coerce.number().optional().nullable(),
  disponibilidadeStatus: z.enum(["disponivel", "indisponivel", "nao_informado"]),
  categoriaIds: z.array(z.coerce.number()).min(1, "Selecione ao menos uma categoria"),
  sexo: z.enum(["feminino", "masculino", "nao_binario", "prefiro_nao_informar"]).optional().nullable(),
  medidasHabilitadas: z.string().optional(),
  alturaCm: z.coerce.number().optional().nullable(),
  pesoKg: z.coerce.number().optional().nullable(),
  cinturaCm: z.coerce.number().optional().nullable(),
  manequim: z.string().max(10).optional(),
  calcado: z.string().max(10).optional(),
  temTatuagem: z.enum(["sim", "nao"]).optional().nullable(),
  tempoExperienciaAnos: z.coerce.number().min(0, "Não pode ser negativo").max(80, "Verifique o valor").optional().nullable(),
});

export const ORCAMENTO_FAIXAS = ["ate_700", "700_3000", "3000_8000", "acima_8000"] as const;

export const publicarPedidoSchema = z.object({
  nomeTemp: z.string().min(2, "Informe seu nome"),
  telefoneTemp: z.string().min(10, "Telefone inválido"),
  tipoEvento: z.string().min(2, "Selecione o tipo de evento"),
  dataEvento: z.string().min(8, "Informe a data do evento"),
  cidadeId: z.coerce.number({ message: "Selecione a cidade" }),
  bairroId: z.coerce.number().optional().nullable(),
  categoriaIds: z.array(z.coerce.number()).min(1, "Selecione ao menos uma categoria"),
  orcamentoFaixa: z.enum(ORCAMENTO_FAIXAS),
  descricao: z.string().min(10, "Conte um pouco mais sobre a festa"),
  detalheOutrosServico: z.string().max(500).optional().nullable(),
});

export type PublicarPedidoInput = z.infer<typeof publicarPedidoSchema>;

export function orcamentoFaixaParaMinMax(faixa: PublicarPedidoInput["orcamentoFaixa"]): {
  min: number | null;
  max: number | null;
} {
  switch (faixa) {
    case "ate_700":
      return { min: null, max: 700 };
    case "700_3000":
      return { min: 700, max: 3000 };
    case "3000_8000":
      return { min: 3000, max: 8000 };
    case "acima_8000":
      return { min: 8000, max: null };
  }
}

export const criarBairroCustomSchema = z.object({
  cidadeId: z.coerce.number({ message: "Selecione a cidade" }),
  nome: z.string().min(2, "Informe o bairro").max(120),
});

export const alterarPlanoEmpresaSchema = z.object({
  planoId: z.coerce.number(),
  meses: z.coerce.number().int().min(1).max(60).optional(),
});

export const criarBannerSchema = z
  .object({
    categoriaId: z.coerce.number({ message: "Selecione a categoria" }),
    empresaId: z.string().uuid("Selecione a empresa"),
    inicioEm: z.string().min(8, "Informe a data de início"),
    fimEm: z.string().min(8, "Informe a data de término"),
    valorPago: z.coerce.number().min(0, "Informe o valor pago"),
  })
  .refine((v) => v.fimEm >= v.inicioEm, { message: "Data de término precisa ser depois do início", path: ["fimEm"] });

export const atualizarBannerSchema = z
  .object({
    id: z.string().uuid(),
    categoriaId: z.coerce.number({ message: "Selecione a categoria" }),
    empresaId: z.string().uuid("Selecione a empresa"),
    inicioEm: z.string().min(8, "Informe a data de início"),
    fimEm: z.string().min(8, "Informe a data de término"),
    valorPago: z.coerce.number().min(0, "Informe o valor pago"),
  })
  .refine((v) => v.fimEm >= v.inicioEm, { message: "Data de término precisa ser depois do início", path: ["fimEm"] });

export const criarBannerHeroSchema = z.object({
  titulo: z.string().min(2, "Informe um título").max(160),
  texto: z.string().max(300).optional(),
  botaoLabel: z.string().max(60).optional(),
  botaoUrl: z.string().max(500).optional(),
  botao2Label: z.string().max(60).optional(),
  botao2Url: z.string().max(500).optional(),
  imagemFundo: z.string().min(4, "Escolha uma imagem de fundo (desktop)"),
  imagemFundoMobile: z.string().optional(),
  regiaoAlvo: z.enum(["RJ", "SP", "MG"]).optional(),
});

export const atualizarBannerHeroSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(2, "Informe um título").max(160),
  texto: z.string().max(300).optional(),
  botaoLabel: z.string().max(60).optional(),
  botaoUrl: z.string().max(500).optional(),
  botao2Label: z.string().max(60).optional(),
  botao2Url: z.string().max(500).optional(),
  imagemFundo: z.string().min(4, "Escolha uma imagem de fundo (desktop)"),
  imagemFundoMobile: z.string().optional(),
  regiaoAlvo: z.enum(["RJ", "SP", "MG"]).optional(),
});

export const criarPlanoPeriodoSchema = z.object({
  planoId: z.coerce.number({ message: "Selecione o plano" }),
  meses: z.coerce.number().int().min(1, "Informe quantos meses").max(60, "Máximo 60 meses"),
  descontoPct: z.coerce.number().min(0, "Não pode ser negativo").max(100, "Máximo 100%"),
});

export const marcarAssinaturaPagaSchema = z.object({
  empresaId: z.string().uuid(),
  meses: z.coerce.number().int().min(1).max(60),
});

export const trocarPlanoManualSchema = z.object({
  empresaId: z.string().uuid(),
  planoId: z.coerce.number(),
});

export const avaliarProfissionalSchema = z.object({
  vagaId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  nota: z.coerce.number().int().min(1, "Escolha uma nota").max(5),
  comentario: z.string().max(500).optional(),
});

export const criarVagaSchema = z.object({
  categoriaProfissionalId: z.coerce.number({ message: "Selecione a função" }),
  cidadeId: z.coerce.number({ message: "Selecione a cidade" }),
  bairroId: z.coerce.number().optional().nullable(),
  dataEvento: z.string().min(8, "Informe a data do evento"),
  horaInicio: z.string().min(4, "Informe o horário de início"),
  duracaoHoras: z.coerce.number().min(0.5, "Informe a duração em horas").max(48),
  valor: z.coerce.number().min(0).optional().nullable(),
  descricao: z.string().min(10, "Conte mais sobre o que a vaga precisa"),
  sexoDesejado: z.enum(["feminino", "masculino", "indiferente"]).optional(),
});
