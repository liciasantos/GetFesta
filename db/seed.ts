/* eslint-disable no-console */
import "dotenv/config";
import { pool } from "../lib/db";
import { hashPassword } from "../lib/auth";

// Placeholder de foto 100% local (SVG em data URI) - evita depender de um CDN
// de imagens externo (picsum.photos etc.), que pode estar bloqueado em redes
// corporativas/sandboxes. Cor e sigla variam por empresa+indice pra nao ficar
// tudo identico na galeria.
const PALETTE = ["#d9603b", "#b8492a", "#e8a06a", "#7a9e7e", "#c98f5e"];
function placeholderPhoto(seedText: string, index: number): string {
  const color = PALETTE[(seedText.length + index) % PALETTE.length];
  const label = seedText
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
    <rect width="100%" height="100%" fill="${color}"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="64" fill="#ffffff"
      text-anchor="middle" dominant-baseline="middle" opacity="0.85">${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  console.log("Seed: limpando dados existentes...");
  // TRUNCATE em cascata cobre todas as tabelas dependentes.
  await pool.query(`
    TRUNCATE TABLE
      usuarios, cidades, bairros, categorias, categorias_profissionais,
      planos, empresa_avaliacoes_google
    RESTART IDENTITY CASCADE;
  `);

  console.log("Seed: cidades e bairros (lancamento: Rio de Janeiro/RJ e Sao Paulo/SP)...");
  const cidades: Record<string, number> = {};
  for (const [estado, nome] of [
    ["RJ", "Rio de Janeiro"],
    ["SP", "São Paulo"],
    // Baixada Fluminense - municipios separados do Rio de Janeiro
    ["RJ", "Duque de Caxias"],
    ["RJ", "Nova Iguaçu"],
    ["RJ", "São João de Meriti"],
    ["RJ", "Belford Roxo"],
    ["RJ", "Nilópolis"],
    ["RJ", "Mesquita"],
    ["RJ", "Queimados"],
    // Região dos Lagos
    ["RJ", "Cabo Frio"],
    ["RJ", "Armação dos Búzios"],
    ["RJ", "Arraial do Cabo"],
    ["RJ", "Araruama"],
    ["RJ", "Iguaba Grande"],
    ["RJ", "São Pedro da Aldeia"],
    ["RJ", "Rio das Ostras"],
    ["RJ", "Casimiro de Abreu"],
    ["RJ", "Saquarema"],
  ]) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO cidades (estado, nome) VALUES ($1, $2) RETURNING id`,
      [estado, nome]
    );
    cidades[nome] = rows[0].id;
  }

  const bairros: Record<string, number> = {};
  const bairroSeed: Array<[string, string]> = [
    // Rio de Janeiro - lista ampliada (zona sul, zona norte, zona oeste e centro)
    // pra cobrir a maioria das buscas sem depender da opcao "Outro bairro".
    ["Rio de Janeiro", "Barra da Tijuca"],
    ["Rio de Janeiro", "Copacabana"],
    ["Rio de Janeiro", "Ipanema"],
    ["Rio de Janeiro", "Leblon"],
    ["Rio de Janeiro", "Botafogo"],
    ["Rio de Janeiro", "Flamengo"],
    ["Rio de Janeiro", "Laranjeiras"],
    ["Rio de Janeiro", "Leme"],
    ["Rio de Janeiro", "Gávea"],
    ["Rio de Janeiro", "Jardim Botânico"],
    ["Rio de Janeiro", "Lagoa"],
    ["Rio de Janeiro", "Centro"],
    ["Rio de Janeiro", "Santa Teresa"],
    ["Rio de Janeiro", "Lapa"],
    ["Rio de Janeiro", "Tijuca"],
    ["Rio de Janeiro", "Vila Isabel"],
    ["Rio de Janeiro", "Méier"],
    ["Rio de Janeiro", "Madureira"],
    ["Rio de Janeiro", "Penha"],
    ["Rio de Janeiro", "Ilha do Governador"],
    ["Rio de Janeiro", "São Cristóvão"],
    ["Rio de Janeiro", "Jacarepaguá"],
    ["Rio de Janeiro", "Recreio dos Bandeirantes"],
    ["Rio de Janeiro", "Campo Grande"],
    ["Rio de Janeiro", "Bangu"],
    ["Rio de Janeiro", "Realengo"],
    ["Rio de Janeiro", "Santa Cruz"],
    ["Rio de Janeiro", "Guaratiba"],
    ["Rio de Janeiro", "Ilha de Guaratiba"],
    ["Rio de Janeiro", "Pedra de Guaratiba"],
    ["Rio de Janeiro", "Sepetiba"],
    ["Rio de Janeiro", "Paciência"],
    // Baixada Fluminense e Região dos Lagos - cada uma como cidade separada,
    // só com um bairro "Centro" de partida (o resto entra via "Outro bairro")
    ["Duque de Caxias", "Centro"],
    ["Nova Iguaçu", "Centro"],
    ["São João de Meriti", "Centro"],
    ["Belford Roxo", "Centro"],
    ["Nilópolis", "Centro"],
    ["Mesquita", "Centro"],
    ["Queimados", "Centro"],
    ["Cabo Frio", "Centro"],
    ["Armação dos Búzios", "Centro"],
    ["Arraial do Cabo", "Centro"],
    ["Araruama", "Centro"],
    ["Iguaba Grande", "Centro"],
    ["São Pedro da Aldeia", "Centro"],
    ["Rio das Ostras", "Centro"],
    ["Casimiro de Abreu", "Centro"],
    ["Saquarema", "Centro"],
    // São Paulo - principais bairros/regioes
    ["São Paulo", "Pinheiros"],
    ["São Paulo", "Vila Madalena"],
    ["São Paulo", "Itaim Bibi"],
    ["São Paulo", "Jardins"],
    ["São Paulo", "Moema"],
    ["São Paulo", "Vila Mariana"],
    ["São Paulo", "Morumbi"],
    ["São Paulo", "Brooklin"],
    ["São Paulo", "Perdizes"],
    ["São Paulo", "Consolação"],
    ["São Paulo", "Bela Vista"],
    ["São Paulo", "Centro"],
    ["São Paulo", "Santana"],
    ["São Paulo", "Tatuapé"],
    ["São Paulo", "Ipiranga"],
    ["São Paulo", "Vila Prudente"],
    ["São Paulo", "Campo Belo"],
    ["São Paulo", "Butantã"],
    ["São Paulo", "Lapa"],
    ["São Paulo", "Vila Olímpia"],
  ];
  for (const [cidadeNome, bairroNome] of bairroSeed) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO bairros (cidade_id, nome) VALUES ($1, $2) RETURNING id`,
      [cidades[cidadeNome], bairroNome]
    );
    bairros[`${cidadeNome}/${bairroNome}`] = rows[0].id;
  }

  console.log("Seed: categorias de servico...");
  // Lista base do schema + "buffet", que o proprio plano usa em varios exemplos
  // (banners de categoria, KPIs, formulario guiado) mas nao estava no seed original.
  const categoriaSeed: Array<[string, string]> = [
    ["baloes", "Balões"],
    ["personagens_vivos", "Personagens vivos"],
    ["animacao", "Animação"],
    ["decoracao", "Decoração"],
    ["decoracao_pegue_monte", "Decoração pegue e monte"],
    ["buffet", "Buffet"],
    ["fotografia", "Fotografia"],
    ["estacoes", "Estações"],
    ["brinquedos", "Brinquedos"],
    ["papelaria", "Papelaria"],
    ["brindes", "Brindes"],
    ["centro_de_mesa", "Centro de mesa"],
    ["sitios", "Sítios"],
    ["saloes", "Salões"],
    ["assessoria_cerimonial", "Assessoria e Cerimonial"],
    ["beleza", "Beleza (Dia da Noiva e do Noivo)"],
    ["musica_som", "Música e Som"],
    ["outros", "Outros"],
  ];
  const categorias: Record<string, number> = {};
  for (const [slug, nome] of categoriaSeed) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO categorias (slug, nome) VALUES ($1, $2) RETURNING id`,
      [slug, nome]
    );
    categorias[slug] = rows[0].id;
  }

  console.log("Seed: categorias profissionais...");
  const categoriaProfSeed: Array<[string, string]> = [
    ["ator", "Ator/atriz"],
    ["animador", "Animador(a)"],
    ["promotor", "Promotor(a)"],
    ["atendente", "Atendente de festa"],
    ["monitor", "Monitor(a)"],
    ["recreador", "Recreador(a)"],
    ["garcom", "Garçom/garçonete"],
    ["cozinheiro", "Cozinheiro(a)"],
    ["cosplayer", "Cosplayer"],
    ["dj", "DJ"],
    ["mestre_de_cerimonia", "Mestre de cerimônia"],
    ["seguranca", "Segurança"],
  ];
  for (const [slug, nome] of categoriaProfSeed) {
    await pool.query(`INSERT INTO categorias_profissionais (slug, nome) VALUES ($1, $2)`, [slug, nome]);
  }

  console.log("Seed: planos...");
  const planoIds: Record<string, number> = {};
  // limite = null significa sem restricao de quantos orcamentos responder no mes;
  // mesesDestaque = quantos meses de elegibilidade a "Destaques da semana" o
  // plano da de brinde ao assinar (renovacao exige o plano bimestral).
  for (const [tipo, nome, valor, descontoAnual, limite, mesesDestaque] of [
    ["empresa_gratis", "Grátis", 0.0, 0, 6, 0],
    ["empresa_leads", "Light", 25.9, 5, 30, 0],
    ["empresa_completo", "Completo", 60.0, 5, null, 3],
    ["profissional", "Profissional", 2.5, 0, null, 0],
  ] as const) {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO planos (tipo, nome, valor_mensal, desconto_anual_pct, limite_orcamentos_mes, meses_destaque_incluidos)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [tipo, nome, valor, descontoAnual, limite, mesesDestaque]
    );
    planoIds[tipo] = rows[0].id;
  }

  console.log("Seed: periodicidade com desconto (Light e Completo)...");
  for (const tipo of ["empresa_leads", "empresa_completo"] as const) {
    for (const [meses, descontoPct] of [
      [1, 0],
      [3, 10],
      [12, 20],
      [24, 30],
    ] as const) {
      await pool.query(`INSERT INTO plano_periodos (plano_id, meses, desconto_pct) VALUES ($1,$2,$3)`, [
        planoIds[tipo],
        meses,
        descontoPct,
      ]);
    }
  }

  console.log("Seed: senha padrão de demonstração...");
  const senhaHash = await hashPassword("teste123");

  async function criarUsuario(tipo: string, email: string, telefoneVerificado = true) {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO usuarios (tipo, email, senha_hash, telefone_verificado, email_verificado)
       VALUES ($1,$2,$3,$4,true) RETURNING id`,
      [tipo, email, senhaHash, telefoneVerificado]
    );
    return rows[0].id;
  }

  console.log("Seed: cliente de demonstração...");
  const clienteUserId = await criarUsuario("cliente", "cliente@teste.com");
  await pool.query(
    `INSERT INTO clientes (usuario_id, tipo_pessoa, nome, cidade_id, bairro_id)
     VALUES ($1, 'fisica', 'Licia Santos', $2, $3)`,
    [clienteUserId, cidades["Rio de Janeiro"], bairros["Rio de Janeiro/Copacabana"]]
  );

  console.log("Seed: empresas de demonstração...");
  type EmpresaSeed = {
    email: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    instagram: string;
    telefone: string;
    descricao: string;
    capacidade: number | null;
    precoAPartirDe: number;
    notaMedia: number;
    totalAvaliacoes: number;
    tempoRespostaMin: number;
    taxaRespostaPct: number;
    seloVerificado: boolean;
    aprovadaDestaque: boolean;
    categoriasSlugs: string[];
    areas: Array<[string, string | null]>; // [cidade, bairro|null]
    estrutura: string[];
    pacotes: Array<[string, string, number]>;
    galeria: number; // quantidade de fotos placeholder
    googleFallback?: { placeId: string; nota: number; total: number; url: string };
  };

  const empresasSeed: EmpresaSeed[] = [
    {
      email: "casadefestaslua@teste.com",
      razaoSocial: "Lua Eventos e Festas Ltda",
      nomeFantasia: "Casa de Festas Lua",
      cnpj: "12.345.678/0001-90",
      instagram: "@casadefestaslua",
      telefone: "21987650001",
      descricao: "Salão de festas completo em Icaraí, com estrutura para até 120 convidados.",
      capacidade: 120,
      precoAPartirDe: 4500,
      notaMedia: 4.8,
      totalAvaliacoes: 62,
      tempoRespostaMin: 18,
      taxaRespostaPct: 91,
      seloVerificado: true,
      aprovadaDestaque: true,
      categoriasSlugs: ["saloes", "buffet", "decoracao"],
      areas: [["Rio de Janeiro", "Barra da Tijuca"], ["Rio de Janeiro", "Recreio dos Bandeirantes"]],
      estrutura: ["ar_condicionado", "estacionamento", "cozinha"],
      pacotes: [
        ["Festa completa (até 60 convidados)", "Salão + decoração básica + monitor de festa", 4500],
        ["Festa completa (até 120 convidados)", "Salão + decoração temática + buffet parceiro", 7800],
      ],
      galeria: 4,
    },
    {
      email: "doceestacao@teste.com",
      razaoSocial: "Doce Estação Buffet Ltda",
      nomeFantasia: "Doce Estação Buffet",
      cnpj: "23.456.789/0001-01",
      instagram: "@doceestacaobuffet",
      telefone: "21987650002",
      descricao: "Buffet especializado em festas infantis, com estações de doces personalizadas.",
      capacidade: 80,
      precoAPartirDe: 2800,
      notaMedia: 4.6,
      totalAvaliacoes: 28,
      tempoRespostaMin: 35,
      taxaRespostaPct: 78,
      seloVerificado: false,
      aprovadaDestaque: false,
      categoriasSlugs: ["buffet", "estacoes"],
      areas: [["São Paulo", null]],
      estrutura: ["cozinha"],
      pacotes: [["Estação de doces para 50 pessoas", "Brigadeiro, beijinho, cake pops e mesa temática", 1200]],
      galeria: 3,
    },
    {
      email: "fantasykids@teste.com",
      razaoSocial: "Fantasy Kids Personagens Ltda",
      nomeFantasia: "Fantasy Kids",
      cnpj: "34.567.890/0001-12",
      instagram: "@fantasykidsrj",
      telefone: "21987650003",
      descricao: "Personagens vivos para festas infantis temáticas - princesas, super-heróis e mais.",
      capacidade: null,
      precoAPartirDe: 600,
      notaMedia: 4.9,
      totalAvaliacoes: 140,
      tempoRespostaMin: 12,
      taxaRespostaPct: 95,
      seloVerificado: true,
      aprovadaDestaque: true,
      categoriasSlugs: ["personagens_vivos", "animacao"],
      areas: [["São Paulo", null], ["Rio de Janeiro", "Barra da Tijuca"]],
      estrutura: [],
      pacotes: [["Pacote 1 personagem (2h)", "Interação, fotos e uma música tema", 600]],
      galeria: 4,
    },
    {
      email: "atelieflor@teste.com",
      razaoSocial: "Ateliê Flor Decorações Ltda",
      nomeFantasia: "Ateliê Flor Decorações",
      cnpj: "45.678.901/0001-23",
      instagram: "@atelieflordecor",
      telefone: "21987650004",
      descricao: "Decoração temática para festas infantis e adultas, do balão ao centro de mesa.",
      capacidade: null,
      precoAPartirDe: 900,
      notaMedia: 4.7,
      totalAvaliacoes: 51,
      tempoRespostaMin: 22,
      taxaRespostaPct: 84,
      seloVerificado: true,
      aprovadaDestaque: false,
      categoriasSlugs: ["decoracao", "baloes", "centro_de_mesa"],
      areas: [["Rio de Janeiro", null]],
      estrutura: [],
      pacotes: [["Decoração temática completa", "Painel, balões e centro de mesa a combinar", 900]],
      galeria: 3,
    },
    {
      // Empresa recem-cadastrada via cadastro assistido: sem avaliacao nativa ainda,
      // usa o fallback de nota importada do Google (secao 14 do schema).
      email: "sitiorecantoverde@teste.com",
      razaoSocial: "Recanto Verde Eventos Ltda",
      nomeFantasia: "Sítio Recanto Verde",
      cnpj: "56.789.012/0001-34",
      instagram: "@recantoverdesitio",
      telefone: "21987650005",
      descricao: "Sítio para festas e eventos ao ar livre, com área verde e estrutura completa.",
      capacidade: 200,
      precoAPartirDe: 6000,
      notaMedia: 0,
      totalAvaliacoes: 0,
      tempoRespostaMin: 0,
      taxaRespostaPct: 0,
      seloVerificado: false,
      aprovadaDestaque: false,
      categoriasSlugs: ["sitios"],
      areas: [["São Paulo", null]],
      estrutura: ["estacionamento", "seguranca"],
      pacotes: [],
      galeria: 2,
      googleFallback: {
        placeId: "ChIJ_demo_recanto_verde",
        nota: 4.5,
        total: 37,
        url: "https://maps.google.com/?cid=000000demo",
      },
    },
  ];

  const empresaIds: Record<string, string> = {};
  for (const e of empresasSeed) {
    const userId = await criarUsuario("empresa", e.email);
    empresaIds[e.nomeFantasia] = userId;
    await pool.query(
      `INSERT INTO empresas (
         usuario_id, razao_social, nome_fantasia, cnpj, cnpj_validado, cnpj_validado_em,
         instagram, telefone_contato, descricao, capacidade_convidados, preco_a_partir_de,
         nota_media, total_avaliacoes, tempo_resposta_medio_minutos, taxa_resposta_pct,
         selo_verificado, elegivel_destaque, aprovada_para_destaque, perfil_reivindicado
       ) VALUES ($1,$2,$3,$4,true,now(),$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, $17)`,
      [
        userId,
        e.razaoSocial,
        e.nomeFantasia,
        e.cnpj,
        e.instagram,
        e.telefone,
        e.descricao,
        e.capacidade,
        e.precoAPartirDe,
        e.notaMedia,
        e.totalAvaliacoes,
        e.tempoRespostaMin,
        e.taxaRespostaPct,
        e.seloVerificado,
        e.notaMedia >= 4.5,
        e.aprovadaDestaque,
        e.googleFallback ? false : true, // cadastro assistido = perfil ainda nao reivindicado
      ]
    );

    // assinatura ativa no plano completo, pra dar acesso ao painel completo na demo
    await pool.query(
      `INSERT INTO assinaturas (usuario_id, plano_id, status, ciclo) VALUES ($1,$2,'ativa','mensal')`,
      [userId, planoIds["empresa_completo"]]
    );

    for (const slug of e.categoriasSlugs) {
      await pool.query(`INSERT INTO empresa_categorias (empresa_id, categoria_id) VALUES ($1,$2)`, [
        userId,
        categorias[slug],
      ]);
    }

    for (const [cidadeNome, bairroNome] of e.areas) {
      await pool.query(
        `INSERT INTO empresa_areas_atuacao (empresa_id, cidade_id, bairro_id) VALUES ($1,$2,$3)`,
        [userId, cidades[cidadeNome], bairroNome ? bairros[`${cidadeNome}/${bairroNome}`] : null]
      );
    }

    for (const item of e.estrutura) {
      await pool.query(`INSERT INTO empresa_estrutura (empresa_id, item) VALUES ($1,$2)`, [userId, item]);
    }

    for (const [nome, descricao, preco] of e.pacotes) {
      await pool.query(
        `INSERT INTO empresa_pacotes (empresa_id, nome, descricao, preco) VALUES ($1,$2,$3,$4)`,
        [userId, nome, descricao, preco]
      );
    }

    for (let i = 0; i < e.galeria; i++) {
      await pool.query(
        `INSERT INTO empresa_galeria (empresa_id, url, ordem) VALUES ($1,$2,$3)`,
        [userId, placeholderPhoto(e.nomeFantasia, i), i]
      );
    }

    if (e.googleFallback) {
      await pool.query(
        `INSERT INTO empresa_avaliacoes_google
           (empresa_id, google_place_id, nota_media_google, total_avaliacoes_google, url_perfil_google, ultima_sincronizacao_em)
         VALUES ($1,$2,$3,$4,$5, now())`,
        [userId, e.googleFallback.placeId, e.googleFallback.nota, e.googleFallback.total, e.googleFallback.url]
      );
    }
  }

  console.log("Seed: banners de categoria premium (link direto WhatsApp)...");
  const bannersSeed: Array<[string, string]> = [
    ["decoracao", "Ateliê Flor Decorações"],
    ["personagens_vivos", "Fantasy Kids"],
    ["buffet", "Doce Estação Buffet"],
    ["saloes", "Casa de Festas Lua"],
    ["sitios", "Sítio Recanto Verde"],
  ];
  for (let i = 0; i < bannersSeed.length; i++) {
    const [categoriaSlug, nomeFantasia] = bannersSeed[i];
    await pool.query(
      `INSERT INTO banners_categoria (categoria_id, empresa_id, inicio_em, fim_em, valor_pago, ativo, ordem)
       VALUES ($1, $2, now(), now() + interval '30 days', 500, true, $3)`,
      [categorias[categoriaSlug], empresaIds[nomeFantasia], i]
    );
  }

  console.log("Seed: banner principal da home (administrado, sem empresa)...");
  await pool.query(
    `INSERT INTO banners_hero (titulo, texto, botao_label, botao_url, imagem_fundo, ativo, ordem)
     VALUES ($1, $2, $3, $4, $5, true, 0)`,
    [
      "Encontre quem faz sua festa acontecer",
      "Publique seu pedido grátis e receba interesse de fornecedores da sua região.",
      "Publicar pedido",
      "/publicar-pedido",
      "/banner_wow-personagens.webp",
    ]
  );

  console.log("Seed: pedidos de demonstração (publicados sem login)...");
  const pedidosSeed = [
    {
      nomeTemp: "Marina Torres",
      telefoneTemp: "21988887777",
      tipoEvento: "Aniversário infantil",
      dataEvento: "2026-09-15",
      cidade: "Rio de Janeiro",
      bairro: "Copacabana",
      descricao: "Festa temática Frozen para minha filha de 6 anos, cerca de 40 convidados.",
      orcamentoMin: 3000,
      orcamentoMax: 8000,
      categoriasSlugs: ["decoracao", "baloes"],
    },
    {
      nomeTemp: "Rafael Oliveira",
      telefoneTemp: "21988887778",
      tipoEvento: "Debutante (15 anos)",
      dataEvento: "2026-10-03",
      cidade: "São Paulo",
      bairro: "Pinheiros",
      descricao: "Festa de 15 anos para 80 convidados, buscando buffet completo e fotografia profissional.",
      orcamentoMin: 8000,
      orcamentoMax: null,
      categoriasSlugs: ["buffet", "fotografia"],
    },
    {
      nomeTemp: "Carla Mendes",
      telefoneTemp: "21988887779",
      tipoEvento: "Casamento",
      dataEvento: "2026-11-20",
      cidade: "Rio de Janeiro",
      bairro: null,
      descricao: "Casamento intimista para 60 pessoas, procurando salão e decoração.",
      orcamentoMin: null,
      orcamentoMax: 3000,
      categoriasSlugs: ["saloes", "decoracao"],
    },
    {
      nomeTemp: "Bruno Farias",
      telefoneTemp: "21988887780",
      tipoEvento: "Formatura",
      dataEvento: "2026-12-05",
      cidade: "Rio de Janeiro",
      bairro: "Barra da Tijuca",
      descricao: "Formatura de faculdade para 120 formandos, buscando salão amplo e buffet completo.",
      orcamentoMin: 8000,
      orcamentoMax: null,
      categoriasSlugs: ["saloes", "buffet"],
    },
    {
      nomeTemp: "Juliana Prado",
      telefoneTemp: "21988887781",
      tipoEvento: "Aniversário infantil",
      dataEvento: "2026-09-28",
      cidade: "Rio de Janeiro",
      bairro: "Tijuca",
      descricao: "Festa de 3 anos tema Patrulha Canina, 25 convidados, prefiro em casa mesmo.",
      orcamentoMin: null,
      orcamentoMax: 3000,
      categoriasSlugs: ["personagens_vivos", "baloes"],
    },
    {
      nomeTemp: "Diego Almeida",
      telefoneTemp: "21988887782",
      tipoEvento: "Confraternização",
      dataEvento: "2026-12-18",
      cidade: "São Paulo",
      bairro: "Centro",
      descricao: "Confraternização de fim de ano da empresa, 50 pessoas, buscando espaço com estrutura de som.",
      orcamentoMin: 3000,
      orcamentoMax: 8000,
      categoriasSlugs: ["saloes", "estacoes"],
    },
    {
      nomeTemp: "Fernanda Costa",
      telefoneTemp: "21988887783",
      tipoEvento: "Debutante (15 anos)",
      dataEvento: "2027-01-16",
      cidade: "Rio de Janeiro",
      bairro: "Ipanema",
      descricao: "15 anos com tema princesas, 100 convidados, quero decoração completa e centro de mesa temático.",
      orcamentoMin: 8000,
      orcamentoMax: null,
      categoriasSlugs: ["decoracao", "centro_de_mesa"],
    },
    {
      nomeTemp: "Thiago Ramos",
      telefoneTemp: "21988887784",
      tipoEvento: "Evento corporativo",
      dataEvento: "2026-10-22",
      cidade: "Rio de Janeiro",
      bairro: "Copacabana",
      descricao: "Lançamento de produto para 80 convidados, precisamos de fotografia profissional e papelaria personalizada.",
      orcamentoMin: 8000,
      orcamentoMax: null,
      categoriasSlugs: ["fotografia", "papelaria"],
    },
    {
      nomeTemp: "Patrícia Neves",
      telefoneTemp: "21988887785",
      tipoEvento: "Aniversário infantil",
      dataEvento: "2026-11-08",
      cidade: "São Paulo",
      bairro: "Moema",
      descricao: "Aniversário de 8 anos tema super-heróis, 35 convidados, buscando brinquedos e recreação.",
      orcamentoMin: null,
      orcamentoMax: 3000,
      categoriasSlugs: ["brinquedos", "animacao"],
    },
    {
      nomeTemp: "Renata Vidal",
      telefoneTemp: "21988887786",
      tipoEvento: "Casamento",
      dataEvento: "2027-02-14",
      cidade: "Rio de Janeiro",
      bairro: "Botafogo",
      descricao: "Casamento ao ar livre para 150 convidados, procurando sítio com estrutura completa.",
      orcamentoMin: 8000,
      orcamentoMax: null,
      categoriasSlugs: ["sitios", "buffet"],
    },
    {
      nomeTemp: "Gustavo Lima",
      telefoneTemp: "21988887787",
      tipoEvento: "Aniversário infantil",
      dataEvento: "2026-09-20",
      cidade: "Rio de Janeiro",
      bairro: "Barra da Tijuca",
      descricao: "Festa de 1 aninho, tema safári, 40 convidados, quero mesa de doces e lembrancinhas.",
      orcamentoMin: 3000,
      orcamentoMax: 8000,
      categoriasSlugs: ["estacoes", "brindes"],
    },
    {
      nomeTemp: "Camila Duarte",
      telefoneTemp: "21988887788",
      tipoEvento: "Debutante (15 anos)",
      dataEvento: "2026-12-12",
      cidade: "São Paulo",
      bairro: "Vila Mariana",
      descricao: "15 anos simples, 50 convidados, buscando decoração pegue e monte pra economizar.",
      orcamentoMin: null,
      orcamentoMax: 3000,
      categoriasSlugs: ["decoracao_pegue_monte"],
    },
    {
      nomeTemp: "Lucas Barreto",
      telefoneTemp: "21988887789",
      tipoEvento: "Confraternização",
      dataEvento: "2026-10-30",
      cidade: "Rio de Janeiro",
      bairro: "Lapa",
      descricao: "Aniversário de casamento (bodas de prata) para 30 pessoas, algo intimista e elegante.",
      orcamentoMin: 3000,
      orcamentoMax: 8000,
      categoriasSlugs: ["decoracao", "buffet"],
    },
    {
      nomeTemp: "Beatriz Sales",
      telefoneTemp: "21988887790",
      tipoEvento: "Aniversário infantil",
      dataEvento: "2026-11-25",
      cidade: "Rio de Janeiro",
      bairro: "Copacabana",
      descricao: "Festa de 5 anos tema unicórnios, 45 convidados, personagem vivo e decoração completa.",
      orcamentoMin: 3000,
      orcamentoMax: 8000,
      categoriasSlugs: ["personagens_vivos", "decoracao"],
    },
  ];

  for (const p of pedidosSeed) {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO pedidos (
         nome_temp, telefone_temp, telefone_verificado_temp, tipo_evento, data_evento,
         cidade_id, bairro_id, descricao, orcamento_min, orcamento_max, status
       ) VALUES ($1,$2,true,$3,$4,$5,$6,$7,$8,$9,'aberto') RETURNING id`,
      [
        p.nomeTemp,
        p.telefoneTemp,
        p.tipoEvento,
        p.dataEvento,
        cidades[p.cidade],
        p.bairro ? bairros[`${p.cidade}/${p.bairro}`] : null,
        p.descricao,
        p.orcamentoMin,
        p.orcamentoMax,
      ]
    );
    const pedidoId = rows[0].id;
    for (const slug of p.categoriasSlugs) {
      await pool.query(`INSERT INTO pedido_categorias (pedido_id, categoria_id) VALUES ($1,$2)`, [
        pedidoId,
        categorias[slug],
      ]);
    }
  }

  console.log("Seed: pedido concluído + avaliações de demonstração...");
  const pedidoConcluido = await pool.query<{ id: string }>(
    `INSERT INTO pedidos (
       cliente_id, tipo_evento, data_evento, cidade_id, bairro_id, descricao, orcamento_min, orcamento_max, status
     ) VALUES ($1,'Aniversário infantil','2026-06-10',$2,$3,'Festa de 5 anos, tema super-heróis, 50 convidados.',3000,8000,'concluido') RETURNING id`,
    [clienteUserId, cidades["Rio de Janeiro"], bairros["Rio de Janeiro/Copacabana"]]
  );
  await pool.query(
    `INSERT INTO avaliacoes (pedido_id, cliente_id, empresa_id, nota, comentario, empresa_confirmou_conclusao)
     VALUES ($1,$2,$3,5,'Atendimento excelente, salão lindo e no horário combinado. Recomendo!', true)`,
    [pedidoConcluido.rows[0].id, clienteUserId, empresaIds["Casa de Festas Lua"]]
  );
  await pool.query(
    `INSERT INTO avaliacoes (pedido_id, cliente_id, empresa_id, nota, comentario, empresa_confirmou_conclusao)
     VALUES ($1,$2,$3,4,'Boa estrutura, só achei o estacionamento pequeno para o número de convidados.', true)`,
    [pedidoConcluido.rows[0].id, clienteUserId, empresaIds["Ateliê Flor Decorações"]]
  );

  console.log("Seed concluído com sucesso.");
  console.log("Login de teste (cliente): cliente@teste.com / teste123");
  console.log("Login de teste (empresa): casadefestaslua@teste.com / teste123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
