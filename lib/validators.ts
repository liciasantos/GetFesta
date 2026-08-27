import { z } from "zod";

export const registrarClienteSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  cidadeId: z.coerce.number().optional(),
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
});

export const registrarProfissionalSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  bairroId: z.coerce.number({ message: "Selecione o bairro" }),
  categoriaIds: z.array(z.coerce.number()).min(1, "Selecione ao menos uma categoria"),
  consentimento: z.string().optional().refine((v) => v === "on", "É necessário aceitar o termo de uso de dados"),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

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

export const criarVagaSchema = z.object({
  categoriaProfissionalId: z.coerce.number({ message: "Selecione a função" }),
  cidadeId: z.coerce.number({ message: "Selecione a cidade" }),
  bairroId: z.coerce.number().optional().nullable(),
  dataEvento: z.string().min(8, "Informe a data do evento"),
  horaInicio: z.string().min(4, "Informe o horário de início"),
  duracaoHoras: z.coerce.number().min(0.5, "Informe a duração em horas").max(48),
  valor: z.coerce.number().min(0).optional().nullable(),
  descricao: z.string().min(10, "Conte mais sobre o que a vaga precisa"),
});
