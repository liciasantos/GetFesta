-- =====================================================================
-- MARKETPLACE DE FESTAS E EVENTOS — SCHEMA DE BANCO DE DADOS (PostgreSQL)
-- =====================================================================
-- Reflete as regras de negocio definidas no plano:
--   - cliente pode publicar pedido sem login (dados temporarios ate confirmar conta)
--   - contato da empresa (instagram/telefone) so libera apos login + aceite da empresa
--   - profissional (ator/animador/etc) nunca visivel para cliente final, so para empresa
--   - plano vencido do profissional = modo limitado (1 foto perfil + 1 foto galeria,
--     so recebe mensagem, nao pode iniciar)
--   - empresa pode ter multiplas categorias e multiplas cidades de atuacao
--   - destaque pago exige nota minima + aprovacao manual do admin
--   - integracao opcional com Google Agenda (so free/busy, nunca conteudo do evento)
--   - catalogo de profissionais por categoria estruturada (nao campo livre) - ator,
--     animador, garcom, cozinheiro, cosplayer etc. - permite terceirizacao ampla
--   - credito de compensacao quando lead "esfria" (nao gera resposta do cliente)
--   - banners de categoria premium com link direto a WhatsApp (pula funil de interesse)
--   - fase 1: empresa recem-cadastrada (inclusive via cadastro assistido) ainda sem
--     avaliacao nativa pode exibir nota importada do Google, ate acumular avaliacao propria
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
CREATE TYPE tipo_usuario AS ENUM ('cliente', 'empresa', 'profissional', 'admin');
CREATE TYPE tipo_pessoa AS ENUM ('fisica', 'juridica');
CREATE TYPE status_pedido AS ENUM ('aberto', 'em_andamento', 'concluido', 'expirado', 'cancelado');
CREATE TYPE status_interesse AS ENUM ('interesse_manifestado', 'contato_liberado', 'recusado');
CREATE TYPE status_vinculo AS ENUM ('pendente', 'aceito', 'recusado', 'desvinculado');
CREATE TYPE status_vaga AS ENUM ('aberta', 'preenchida', 'cancelada');
CREATE TYPE status_candidatura AS ENUM ('candidatado', 'selecionado', 'recusado');
CREATE TYPE status_assinatura AS ENUM ('trial', 'ativa', 'atrasada', 'cancelada', 'expirada');
CREATE TYPE tipo_plano AS ENUM ('empresa_gratis', 'empresa_leads', 'empresa_completo', 'profissional');
CREATE TYPE status_disponibilidade AS ENUM ('disponivel', 'indisponivel', 'nao_informado');
CREATE TYPE contexto_conversa AS ENUM ('pedido_cliente_empresa', 'empresa_profissional');
CREATE TYPE tipo_denuncia_alvo AS ENUM ('usuario', 'pedido', 'avaliacao', 'mensagem');
CREATE TYPE status_moderacao AS ENUM ('pendente', 'em_analise', 'procedente', 'improcedente');

-- ---------------------------------------------------------------------
-- 1. USUARIOS (tabela raiz de autenticacao — todo mundo tem uma linha aqui)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo                tipo_usuario NOT NULL,
    email               VARCHAR(255) UNIQUE,
    senha_hash          VARCHAR(255),
    telefone            VARCHAR(20),
    telefone_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    email_verificado    BOOLEAN NOT NULL DEFAULT FALSE,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    banido              BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

-- ---------------------------------------------------------------------
-- 1-B. CONFIGURACOES DO SITE (chave/valor, editavel pelo admin)
-- ---------------------------------------------------------------------
-- Conteudo do site editavel sem deploy. Chaves usadas hoje (ver lib/data/config.ts):
--   'como_funciona_bg' / 'busca_banner_bg' - imagens de fundo (ver /admin/aparencia),
--     valor e um data URI (mesmo padrao de logo/galeria) ou path de /public como fallback.
--   'social_instagram' / 'social_tiktok' / 'social_youtube' - links do rodape/contato
--     (ver /admin/site); valor vazio = icone fica desabilitado.
--   'contato_email' / 'contato_telefone' / 'contato_whatsapp' - pagina /contato.
CREATE TABLE configuracoes_site (
    chave         VARCHAR(60) PRIMARY KEY,
    valor         TEXT NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. LOCALIDADES (usado por empresas, profissionais, pedidos, clientes)
-- ---------------------------------------------------------------------
CREATE TABLE cidades (
    id      SERIAL PRIMARY KEY,
    estado  CHAR(2) NOT NULL,
    nome    VARCHAR(120) NOT NULL,
    UNIQUE (estado, nome)
);

CREATE TABLE bairros (
    id        SERIAL PRIMARY KEY,
    cidade_id INTEGER NOT NULL REFERENCES cidades(id),
    nome      VARCHAR(120) NOT NULL,
    UNIQUE (cidade_id, nome)
);

-- ---------------------------------------------------------------------
-- 3. CATEGORIAS DE SERVICO
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
    id    SERIAL PRIMARY KEY,
    slug  VARCHAR(60) UNIQUE NOT NULL,
    nome  VARCHAR(80) NOT NULL
    -- seed: baloes, personagens_vivos, animacao, decoracao, decoracao_pegue_monte,
    --       fotografia, estacoes, brinquedos, papelaria, brindes, centro_de_mesa,
    --       sitios, saloes
);

-- ---------------------------------------------------------------------
-- 4. CLIENTES (pessoa fisica ou juridica que PROCURA servico)
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    usuario_id   UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_pessoa  tipo_pessoa NOT NULL DEFAULT 'fisica',
    nome         VARCHAR(180) NOT NULL,
    foto_url     TEXT,                     -- avatar do cliente (data URI, comprimido no client antes do upload)
    cnpj         VARCHAR(18),              -- obrigatorio se tipo_pessoa = 'juridica'
    cidade_id    INTEGER REFERENCES cidades(id),
    bairro_id    INTEGER REFERENCES bairros(id),
    CONSTRAINT chk_cliente_cnpj CHECK (
        (tipo_pessoa = 'fisica') OR (tipo_pessoa = 'juridica' AND cnpj IS NOT NULL)
    )
);

-- ---------------------------------------------------------------------
-- 5. EMPRESAS FORNECEDORAS (sempre pessoa juridica — nunca CPF)
-- ---------------------------------------------------------------------
CREATE TABLE empresas (
    usuario_id            UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    slug                    VARCHAR(80) UNIQUE NOT NULL,      -- URL bonita: /empresa/slug (gerado do nome_fantasia no cadastro)
    razao_social           VARCHAR(180) NOT NULL,
    nome_fantasia           VARCHAR(180) NOT NULL,
    cnpj                    VARCHAR(18) UNIQUE NOT NULL,
    cnpj_validado           BOOLEAN NOT NULL DEFAULT FALSE,   -- validado via API Receita Federal
    cnpj_validado_em        TIMESTAMPTZ,                       -- data da ultima consulta automatica
    instagram               VARCHAR(100),
    telefone_contato        VARCHAR(20),
    descricao               TEXT,
    logo_url                TEXT,
    capacidade_convidados   INTEGER,                           -- opcional, para espacos/saloes
    preco_a_partir_de       NUMERIC(10,2),
    nota_media              NUMERIC(2,1) DEFAULT 0,           -- recalculada a partir de avaliacoes
    total_avaliacoes        INTEGER NOT NULL DEFAULT 0,
    tempo_resposta_medio_minutos INTEGER,                     -- recalculado a partir de mensagens
    taxa_resposta_pct       NUMERIC(5,2),                      -- % de pedidos com interesse que geraram resposta
    selo_verificado         BOOLEAN NOT NULL DEFAULT FALSE,   -- calculado: cnpj_validado + 6 meses de conta + nota minima
    elegivel_destaque       BOOLEAN NOT NULL DEFAULT FALSE,   -- nota minima atingida
    aprovada_para_destaque  BOOLEAN NOT NULL DEFAULT FALSE,   -- curadoria manual do admin
    perfil_reivindicado     BOOLEAN NOT NULL DEFAULT TRUE,    -- FALSE = cadastro assistido, empresa ainda nao confirmou a conta
    criado_em               TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN empresas.nota_media IS
'Nota publica exibida no card/perfil da empresa. Fase 1 (poucas avaliacoes nativas):
a aplicacao pode exibir nota_media_google (ver tabela empresa_avaliacoes_google) no lugar
desta coluna, com selo de atribuicao "Nota no Google". Assim que total_avaliacoes (nativas)
atinge o limiar definido na aplicacao (sugestao: 5), nota_media passa a refletir somente
avaliacoes nativas e o registro em empresa_avaliacoes_google e marcado como ativo = FALSE.
Nunca usar nota_media_google para o calculo de selo_verificado (ver secao 14).';

COMMENT ON COLUMN empresas.perfil_reivindicado IS
'FALSE quando o perfil foi criado pela equipe da GetFesta via cadastro assistido
(dados publicos de Instagram/Google Maps), antes de a empresa confirmar a conta.
Perfis com perfil_reivindicado = FALSE devem mostrar um aviso tipo "Perfil ainda nao
confirmado pelo fornecedor" e nao podem contratar planos pagos ate reivindicar.';

CREATE TABLE empresa_estrutura (
    empresa_id UUID REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    item       VARCHAR(40) NOT NULL,   -- ar_condicionado / estacionamento / cozinha / seguranca / etc.
    PRIMARY KEY (empresa_id, item)
);

CREATE TABLE empresa_pacotes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id  UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    nome        VARCHAR(120) NOT NULL,
    descricao   TEXT,
    preco       NUMERIC(10,2)
);

-- empresa pode atuar em varias categorias
CREATE TABLE empresa_categorias (
    empresa_id   UUID REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias(id),
    PRIMARY KEY (empresa_id, categoria_id)
);

-- empresa pode atuar em varias cidades/bairros
-- NOTA DE CORRECAO: o Postgres forca NOT NULL em toda coluna que faz parte de uma
-- PRIMARY KEY composta - por isso bairro_id NAO pode estar na PK e ao mesmo tempo
-- ser nullable (o comentario original "nullable = atua na cidade toda" nao seria
-- respeitado). Solucao: chave surrogate (id) + dois indices unicos parciais, um
-- para quando bairro_id e informado e outro para quando a empresa atua na cidade
-- toda (bairro_id IS NULL) - preserva a regra de negocio sem violar a constraint.
CREATE TABLE empresa_areas_atuacao (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    cidade_id  INTEGER NOT NULL REFERENCES cidades(id),
    bairro_id  INTEGER REFERENCES bairros(id)   -- NULL = atua na cidade toda
);
CREATE UNIQUE INDEX uq_empresa_area_com_bairro ON empresa_areas_atuacao(empresa_id, cidade_id, bairro_id) WHERE bairro_id IS NOT NULL;
CREATE UNIQUE INDEX uq_empresa_area_cidade_toda ON empresa_areas_atuacao(empresa_id, cidade_id) WHERE bairro_id IS NULL;

CREATE TABLE empresa_galeria (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    ordem      INTEGER NOT NULL DEFAULT 0,
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 6. PROFISSIONAIS (ator, animador, promotor, atendente, monitor, recreador...)
--    NUNCA visivel para cliente final — so para empresas autenticadas.
-- ---------------------------------------------------------------------
-- categorias de atuacao profissional (estruturado, cresce sem alterar o schema)
-- seed inicial: ator, animador, promotor, atendente, monitor, recreador, garcom,
--               cozinheiro, cosplayer, dj, mestre_de_cerimonia, seguranca, etc.
CREATE TABLE categorias_profissionais (
    id   SERIAL PRIMARY KEY,
    slug VARCHAR(60) UNIQUE NOT NULL,
    nome VARCHAR(80) NOT NULL
);

CREATE TABLE profissionais (
    usuario_id               UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    slug                      VARCHAR(80) UNIQUE NOT NULL,   -- URL bonita: /profissional/slug (gerado do nome no cadastro)
    nome                      VARCHAR(180) NOT NULL,
    foto_perfil_url            TEXT,
    sexo                        VARCHAR(20),           -- feminino / masculino / nao_binario / prefiro_nao_informar
    medidas_habilitadas         BOOLEAN NOT NULL DEFAULT FALSE, -- opt-in: exibe as medidas abaixo (uso ator/cosplayer)
    altura_cm                  SMALLINT,
    peso_kg                    SMALLINT,
    cintura_cm                  SMALLINT,
    manequim                   VARCHAR(10),
    calcado                    VARCHAR(10),
    bairro_id                  INTEGER REFERENCES bairros(id),
    tem_veiculo                 BOOLEAN DEFAULT FALSE,
    tipo_veiculo                VARCHAR(20),           -- carro / moto / nenhum
    tempo_experiencia_meses      INTEGER,
    pessoa_juridica              BOOLEAN NOT NULL DEFAULT FALSE,
    cnpj                        VARCHAR(18),           -- se atua como PJ
    disponibilidade_status       status_disponibilidade NOT NULL DEFAULT 'nao_informado',
    consentimento_dados_em       TIMESTAMPTZ,           -- aceite do termo especifico LGPD
    aprovada_para_destaque       BOOLEAN NOT NULL DEFAULT FALSE, -- curadoria manual do admin (anuncio pago), mesmo padrao de empresas.aprovada_para_destaque
    criado_em                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- um profissional pode atuar em mais de uma categoria (ex.: ator + garcom)
CREATE TABLE profissional_categorias (
    profissional_id UUID REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    categoria_id    INTEGER REFERENCES categorias_profissionais(id),
    PRIMARY KEY (profissional_id, categoria_id)
);

-- define quais funcoes de profissional fazem sentido pra quais categorias de
-- empresa (ex.: Cozinheiro -> Buffet/Estacoes/Saloes/Sitios, nao Animacao) -
-- controla quem aparece em "buscar profissionais" no painel de cada empresa
-- (ver lib/data/profissionais.ts:listProfissionaisCompativeis)
CREATE TABLE categoria_profissional_compatibilidade (
    categoria_profissional_id INTEGER NOT NULL REFERENCES categorias_profissionais(id) ON DELETE CASCADE,
    categoria_id              INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    PRIMARY KEY (categoria_profissional_id, categoria_id)
);

-- avaliacao que a empresa deixa pro profissional apos fechar uma vaga -
-- alimenta a pontuacao usada pra ordenar "buscar profissionais"
CREATE TABLE avaliacoes_profissional (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID NOT NULL REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    empresa_id      UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    vaga_id         UUID REFERENCES vagas_profissionais(id) ON DELETE SET NULL,
    nota            SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario      VARCHAR(500),
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (vaga_id, empresa_id)
);
CREATE INDEX idx_avaliacoes_profissional_profissional ON avaliacoes_profissional(profissional_id);

CREATE TABLE profissional_galeria (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id  UUID NOT NULL REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    tipo             VARCHAR(10) NOT NULL CHECK (tipo IN ('foto','video_link')),
    url              TEXT NOT NULL,          -- video_link = link do YouTube/Instagram, nunca upload bruto
    ordem            INTEGER NOT NULL DEFAULT 0,
    criado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Regra de exibicao (aplicada na camada de aplicacao, nao no banco):
-- se assinaturas.status do profissional != 'ativa' -> mostrar apenas
-- 1 registro tipo='foto' com menor "ordem" como foto de perfil
-- + 1 registro tipo='foto' com segunda menor "ordem" como foto de galeria.

-- vinculo entre profissional e empresa (modelo "LinkedIn")
CREATE TABLE profissional_empresa_vinculo (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID NOT NULL REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    empresa_id      UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    status          status_vinculo NOT NULL DEFAULT 'pendente',
    solicitado_por  tipo_usuario NOT NULL,   -- quem iniciou: profissional ou empresa
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    respondido_em   TIMESTAMPTZ,
    UNIQUE (profissional_id, empresa_id)
);

-- vagas (freelas) que a empresa publica para um tipo de profissional -
-- diferente do vinculo acima (que e uma conexao persistente), aqui e uma
-- oportunidade pontual (evento especifico, data/hora/valor definidos) que
-- qualquer profissional compativel pode ver e se candidatar.
CREATE TABLE vagas_profissionais (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id                  UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    categoria_profissional_id   INTEGER NOT NULL REFERENCES categorias_profissionais(id),
    cidade_id                   INTEGER NOT NULL REFERENCES cidades(id),
    bairro_id                   INTEGER REFERENCES bairros(id),
    data_evento                 DATE NOT NULL,
    hora_inicio                 TIME NOT NULL,
    duracao_horas               NUMERIC(4,1) NOT NULL,
    valor                       NUMERIC(10,2),          -- NULL = a combinar
    descricao                   TEXT NOT NULL,
    status                      status_vaga NOT NULL DEFAULT 'aberta',
    -- preenchido quando a empresa marca "fechei com esse profissional" - é o
    -- jeito de saber se ela fechou (e com quem) depois que a data do evento
    -- passa; se status continuar 'aberta' com data_evento no passado, a
    -- aplicacao trata como "evento realizado, empresa nao informou o fechamento".
    profissional_selecionado_id UUID REFERENCES profissionais(usuario_id),
    criado_em                   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vagas_categoria_cidade_status ON vagas_profissionais(categoria_profissional_id, cidade_id, status);
CREATE INDEX idx_vagas_empresa ON vagas_profissionais(empresa_id);

-- Candidatura do profissional a uma vaga. O botao "Tenho interesse" nao expoe
-- nenhum dado de contato da empresa (mesma logica anti-vazamento do resto da
-- plataforma) - e a empresa quem enxerga os candidatos e decide contatar,
-- ja que profissional sempre e visivel para empresa autenticada (secao 6).
CREATE TABLE vaga_candidaturas (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaga_id          UUID NOT NULL REFERENCES vagas_profissionais(id) ON DELETE CASCADE,
    profissional_id  UUID NOT NULL REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    status           status_candidatura NOT NULL DEFAULT 'candidatado',
    criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (vaga_id, profissional_id)
);
CREATE INDEX idx_vaga_candidaturas_vaga ON vaga_candidaturas(vaga_id);

-- integracao opcional com Google Agenda (free/busy apenas) - NAO USADA
-- ATUALMENTE pela aplicacao. A tentativa de MVP via "endereco iCal secreto"
-- (coluna ical_url) gerava confusao/friccao para profissionais freelancer
-- (achavam que precisavam tornar a agenda publica) e foi substituida pelo
-- calendario proprio (ver profissional_dias_indisponiveis, secao 6-B). As
-- colunas de OAuth abaixo ficam guardadas caso no futuro valha a pena montar
-- a integracao oficial (client_id + consent screen do Google Cloud).
CREATE TABLE profissional_google_agenda (
    profissional_id        UUID PRIMARY KEY REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    conectado                BOOLEAN NOT NULL DEFAULT FALSE,
    access_token_criptografado  TEXT,
    refresh_token_criptografado TEXT,
    token_expira_em          TIMESTAMPTZ,
    ical_url                 TEXT,
    conectado_em             TIMESTAMPTZ,
    ultima_sincronizacao_em  TIMESTAMPTZ,
    status_ultima_chamada    VARCHAR(30)   -- ok / token_expirado / desconectado
);

-- ---------------------------------------------------------------------
-- 6-B. DISPONIBILIDADE (calendario proprio, sem depender de servico externo)
-- ---------------------------------------------------------------------
-- O profissional marca manualmente os dias em que NAO esta disponivel;
-- ausencia de registro para uma data = disponivel. Simples, privado (nada
-- sai da GetFesta) e sem a friccao de conectar uma conta Google.
CREATE TABLE profissional_dias_indisponiveis (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id  UUID NOT NULL REFERENCES profissionais(usuario_id) ON DELETE CASCADE,
    data             DATE NOT NULL,
    criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (profissional_id, data)
);
CREATE INDEX idx_profissional_dias_indisp ON profissional_dias_indisponiveis(profissional_id, data);

-- ---------------------------------------------------------------------
-- 7. PEDIDOS (publicados pelo cliente, sem exigir login)
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id        UUID REFERENCES clientes(usuario_id),  -- NULL ate o cliente confirmar conta
    nome_temp         VARCHAR(180),                          -- usado quando ainda nao logado
    telefone_temp     VARCHAR(20),
    telefone_verificado_temp BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_evento       VARCHAR(80) NOT NULL,
    data_evento       DATE NOT NULL,
    cidade_id         INTEGER NOT NULL REFERENCES cidades(id),
    bairro_id         INTEGER REFERENCES bairros(id),
    descricao         TEXT NOT NULL,
    detalhe_outros_servico TEXT,                       -- preenchido quando a categoria "Outros" é escolhida
    orcamento_min     NUMERIC(10,2),
    orcamento_max     NUMERIC(10,2),
    status            status_pedido NOT NULL DEFAULT 'aberto',
    -- preenchido pelo cliente ao marcar o pedido como concluido: contratou
    -- o fornecedor atraves da GetFesta (true) ou por outro meio (false)?
    encontrado_pelo_site BOOLEAN,
    -- moderacao do admin: oculta da vitrine publica/leads de empresa sem
    -- apagar o registro (ver /admin/pedidos).
    oculto_admin      BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em         TIMESTAMPTZ
);
CREATE INDEX idx_pedidos_cidade_status ON pedidos(cidade_id, status);
CREATE INDEX idx_pedidos_data_evento ON pedidos(data_evento);

CREATE TABLE pedido_categorias (
    pedido_id    UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias(id),
    PRIMARY KEY (pedido_id, categoria_id)
);

-- controla o "vazamento de contato": contato so libera apos empresa manifestar interesse
CREATE TABLE pedido_interesses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id    UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    empresa_id   UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    status       status_interesse NOT NULL DEFAULT 'interesse_manifestado',
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    contato_liberado_em TIMESTAMPTZ,
    cliente_respondeu   BOOLEAN NOT NULL DEFAULT FALSE,   -- usado para calcular o credito de compensacao
    credito_compensacao_concedido BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (pedido_id, empresa_id)
);
-- Regra de aplicacao: se contato_liberado_em nao for nulo e cliente_respondeu continuar
-- FALSE apos N dias (ex.: 5), gerar credito de desconto na proxima mensalidade da empresa
-- (tabela creditos_compensacao, criada na secao 10 apos "pagamentos") e marcar
-- credito_compensacao_concedido = TRUE.

-- ---------------------------------------------------------------------
-- 8. MENSAGENS (cliente-empresa em contexto de pedido, ou empresa-profissional)
-- ---------------------------------------------------------------------
CREATE TABLE conversas (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contexto     contexto_conversa NOT NULL,
    pedido_id    UUID REFERENCES pedidos(id),               -- preenchido se contexto = pedido_cliente_empresa
    cliente_id   UUID REFERENCES clientes(usuario_id),
    empresa_id   UUID REFERENCES empresas(usuario_id),
    profissional_id UUID REFERENCES profissionais(usuario_id),
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mensagens (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id    UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
    remetente_usuario_id UUID NOT NULL REFERENCES usuarios(id),
    conteudo       TEXT NOT NULL,
    lida           BOOLEAN NOT NULL DEFAULT FALSE,
    enviado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id, enviado_em);

-- ---------------------------------------------------------------------
-- 9. AVALIACOES (so quem teve pedido concluido pode avaliar)
-- ---------------------------------------------------------------------
CREATE TABLE avaliacoes (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id              UUID NOT NULL REFERENCES pedidos(id),
    cliente_id             UUID NOT NULL REFERENCES clientes(usuario_id),
    empresa_id             UUID NOT NULL REFERENCES empresas(usuario_id),
    nota                   SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario             TEXT,
    foto_url               TEXT,
    empresa_confirmou_conclusao BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pedido_id, cliente_id, empresa_id)
);

-- empresa tambem pode avaliar o cliente (reduz pedido problematico)
CREATE TABLE avaliacoes_cliente (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id   UUID NOT NULL REFERENCES pedidos(id),
    empresa_id  UUID NOT NULL REFERENCES empresas(usuario_id),
    cliente_id  UUID NOT NULL REFERENCES clientes(usuario_id),
    nota        SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario  TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pedido_id, empresa_id, cliente_id)
);

-- ---------------------------------------------------------------------
-- 10. PLANOS, ASSINATURAS E PAGAMENTOS (integracao Mercado Pago)
-- ---------------------------------------------------------------------
CREATE TABLE planos (
    id                SERIAL PRIMARY KEY,
    tipo              tipo_plano NOT NULL,
    nome              VARCHAR(60) NOT NULL,
    valor_mensal      NUMERIC(10,2) NOT NULL,
    desconto_anual_pct NUMERIC(4,2) NOT NULL DEFAULT 0,
    -- NULL = sem limite. Aplicado sobre quantos pedido_interesses a empresa
    -- cria por mes corrente (ver lib/actions/pedidos.ts:manifestarInteresse).
    limite_orcamentos_mes INTEGER,
    -- quantos meses de elegibilidade para "Destaques da semana" o plano da
    -- de brinde ao assinar (0 = nenhum). Regra de negocio (nao automatizada
    -- no banco): pra manter o destaque no ciclo seguinte, a empresa precisa
    -- contratar o plano trimestral - a aprovacao em si continua manual
    -- (empresas.aprovada_para_destaque), como o resto do destaque pago.
    meses_destaque_incluidos SMALLINT NOT NULL DEFAULT 0,
    -- seed:
    -- ('empresa_gratis',   'Grátis',   0.00,  0, limite 6,    0 meses destaque)
    -- ('empresa_leads',    'Light',   25.90,  5, limite 30,   0 meses destaque)
    -- ('empresa_completo', 'Completo',60.00,  5, sem limite,  3 meses destaque)
    -- ('profissional',     'Profissional', 2.50, 0, sem limite, 0)
    ativo             BOOLEAN NOT NULL DEFAULT TRUE
);

-- Periodicidade com desconto por plano (3/12/24 meses etc, estilo hospedagem) -
-- admin cria/edita em /admin/planos-periodos. Preco efetivo = planos.valor_mensal
-- * (1 - desconto_pct/100); a renovacao volta pro valor_mensal cheio.
CREATE TABLE plano_periodos (
    id           SERIAL PRIMARY KEY,
    plano_id     INTEGER NOT NULL REFERENCES planos(id) ON DELETE CASCADE,
    meses        SMALLINT NOT NULL CHECK (meses > 0),
    desconto_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (desconto_pct BETWEEN 0 AND 100),
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (plano_id, meses)
);

CREATE TABLE assinaturas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID NOT NULL REFERENCES usuarios(id),
    plano_id            INTEGER NOT NULL REFERENCES planos(id),
    status              status_assinatura NOT NULL DEFAULT 'trial',
    ciclo               VARCHAR(10) NOT NULL DEFAULT 'mensal',  -- mensal / anual
    inicio_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
    fim_em               TIMESTAMPTZ,
    mercado_pago_assinatura_id VARCHAR(80),
    criado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assinaturas_usuario ON assinaturas(usuario_id, status);
-- fim_em funciona como "vencimento": renovar (marcar pago) empurra fim_em pra
-- frente; um cron diario (ver app/api/cron/downgrade-inadimplentes) rebaixa
-- pro plano Gratis quem estiver com status IN ('ativa','atrasada') e
-- fim_em < now() - 5 dias. Ate a integracao com Mercado Pago existir de fato,
-- "marcar pago"/"marcar atrasado" e feito manualmente pelo admin (ver
-- /admin/planos).

CREATE TABLE pagamentos (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id         UUID NOT NULL REFERENCES assinaturas(id),
    valor                 NUMERIC(10,2) NOT NULL,
    status                VARCHAR(20) NOT NULL,   -- aprovado / recusado / pendente / estornado
    mercado_pago_transacao_id VARCHAR(80),
    pago_em               TIMESTAMPTZ,
    criado_em             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- credito de compensacao quando um "tenho interesse" nao vira resposta do cliente
CREATE TABLE creditos_compensacao (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id                UUID NOT NULL REFERENCES empresas(usuario_id),
    pedido_interesse_id       UUID NOT NULL REFERENCES pedido_interesses(id),
    valor_credito             NUMERIC(10,2) NOT NULL,
    aplicado_em_pagamento_id  UUID REFERENCES pagamentos(id),  -- preenchido quando usado
    criado_em                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- banners premium de categoria com link direto para WhatsApp (pula o funil de interesse)
-- alimenta a secao "Destaques da semana" da home/area do cliente (ver DestaquesGrid).
CREATE TABLE banners_categoria (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    empresa_id   UUID NOT NULL REFERENCES empresas(usuario_id),
    inicio_em    TIMESTAMPTZ NOT NULL,
    fim_em       TIMESTAMPTZ NOT NULL,
    valor_pago   NUMERIC(10,2) NOT NULL,
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    ordem        INTEGER NOT NULL DEFAULT 0,   -- controla a sequencia em "Destaques da semana" (admin)
    UNIQUE (categoria_id, inicio_em, fim_em)  -- reforcado na aplicacao: 1 empresa ativa por categoria por periodo
);

-- banner principal (hero) do topo da home - 100% administrado pela GetFesta,
-- independente de qualquer empresa (titulo/texto/botao/imagem livres).
CREATE TABLE banners_hero (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo       VARCHAR(160) NOT NULL,
    texto        VARCHAR(300),
    botao_label  VARCHAR(60),
    botao_url    VARCHAR(500),
    imagem_fundo TEXT NOT NULL,          -- data URI, mesmo padrao de logo/galeria (sem storage externo)
    imagem_fundo_mobile TEXT,            -- opcional: NULL = reusa a imagem desktop
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    ordem        INTEGER NOT NULL DEFAULT 0,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_banners_hero_ativo ON banners_hero(ativo);

-- ---------------------------------------------------------------------
-- 11. DESTAQUE PAGO (ranking) — exige nota minima + aprovacao manual
-- ---------------------------------------------------------------------
CREATE TABLE destaques (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id          UUID NOT NULL REFERENCES empresas(usuario_id),
    tipo                VARCHAR(20) NOT NULL,   -- via_assinatura / avulso
    inicio_em            TIMESTAMPTZ NOT NULL,
    fim_em                TIMESTAMPTZ NOT NULL,
    aprovado_por_admin_id UUID REFERENCES usuarios(id),
    ativo                BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 12. MODERACAO / ANTI-FRAUDE
-- ---------------------------------------------------------------------
CREATE TABLE denuncias (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_alvo    tipo_denuncia_alvo NOT NULL,
    alvo_id      UUID NOT NULL,
    denunciado_por_usuario_id UUID REFERENCES usuarios(id),
    motivo       TEXT NOT NULL,
    status       status_moderacao NOT NULL DEFAULT 'pendente',
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolvido_em TIMESTAMPTZ
);

-- registra toda tentativa bloqueada de compartilhar contato disfarçado
-- (pedido, mensagem ou descricao de perfil) — alimenta o monitoramento de padrao suspeito
CREATE TABLE tentativas_contato_bloqueadas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id     UUID NOT NULL REFERENCES usuarios(id),
    origem         VARCHAR(30) NOT NULL,   -- pedido_descricao / mensagem / perfil_empresa / perfil_profissional
    trecho_detectado TEXT,                 -- trecho que disparou a deteccao, para auditoria
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tentativas_contato_usuario ON tentativas_contato_bloqueadas(usuario_id, criado_em);

-- ---------------------------------------------------------------------
-- 13. RSVP / CONFIRMACAO DE PRESENCA (fase futura — estilo voutb.com.br)
-- ---------------------------------------------------------------------
CREATE TABLE eventos_rsvp (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id   UUID NOT NULL REFERENCES clientes(usuario_id),
    pedido_id    UUID REFERENCES pedidos(id),
    titulo       VARCHAR(180) NOT NULL,
    data_evento  DATE NOT NULL,
    slug_publico VARCHAR(80) UNIQUE NOT NULL,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rsvp_convidados (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_rsvp_id    UUID NOT NULL REFERENCES eventos_rsvp(id) ON DELETE CASCADE,
    nome              VARCHAR(180) NOT NULL,
    telefone          VARCHAR(20),
    tipo_convidado    VARCHAR(10) NOT NULL DEFAULT 'adulto' CHECK (tipo_convidado IN ('adulto','crianca')),
    confirmado        BOOLEAN,
    respondido_em     TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- 14. AVALIACOES IMPORTADAS DO GOOGLE — solucao de "cold start" da fase 1
-- ---------------------------------------------------------------------
-- Problema: no lancamento, empresas cadastradas (inclusive via cadastro
-- assistido, com dados publicos de Instagram/Google Maps — ver
-- empresas.perfil_reivindicado) ainda nao tem nenhuma avaliacao nativa
-- na plataforma. Isso passa a impressao de que a empresa e nova ou nao
-- confiavel, mesmo quando ja atua ha anos no mercado.
--
-- Solucao: puxar nota e volume de avaliacoes do perfil do Google Business
-- (via Google Places API) e exibir como selo "Nota no Google", sempre com
-- atribuicao clara e link para o perfil original — os termos de uso da
-- API do Google exigem essa atribuicao e proibem apresentar a nota como
-- se fosse uma avaliacao nativa da plataforma.
CREATE TABLE empresa_avaliacoes_google (
    empresa_id              UUID PRIMARY KEY REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    google_place_id         VARCHAR(120), -- opcional: a propria empresa pode importar manualmente sem saber o Place ID tecnico
    nota_media_google       NUMERIC(2,1) NOT NULL CHECK (nota_media_google BETWEEN 0 AND 5),
    total_avaliacoes_google INTEGER NOT NULL DEFAULT 0 CHECK (total_avaliacoes_google >= 0),
    url_perfil_google       TEXT NOT NULL,          -- link publico do Google Maps, exigido para atribuicao
    importado_em            TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultima_sincronizacao_em TIMESTAMPTZ,
    ativo                   BOOLEAN NOT NULL DEFAULT TRUE   -- FALSE = ja migrou para nota nativa (ver regras abaixo)
);
CREATE INDEX idx_empresa_avaliacoes_google_ativo ON empresa_avaliacoes_google(ativo);

-- Regras de exibicao e ciclo de vida (aplicadas na camada de aplicacao, nao no banco):
-- 1. Se empresas.total_avaliacoes (nativas) >= limiar definido (sugestao: 5) ->
--    exibir empresas.nota_media nativa e marcar
--    empresa_avaliacoes_google.ativo = FALSE (a empresa "formou" nota propria).
-- 2. Se total_avaliacoes nativas < limiar E existir registro ativo em
--    empresa_avaliacoes_google -> exibir nota_media_google com o selo
--    "Nota no Google" (nao e avaliacao verificada pela GetFesta) e link
--    para url_perfil_google.
-- 3. Se nao existir registro do Google e nao houver avaliacao nativa ->
--    exibir "Empresa nova na GetFesta" (sem nota), nunca nota zerada/fake.
-- 4. IMPORTANTE: nota_media_google NUNCA entra no calculo de selo_verificado
--    (secao 5 / regra da secao 10 do plano) — o selo verificado exige nota
--    minima calculada apenas sobre avaliacoes nativas (tabela avaliacoes),
--    para nao permitir que uma nota antiga ou de terceiros infle o selo de
--    confianca da propria plataforma.
-- 5. Sincronizacao: job periodico (ex.: semanal) atualiza nota_media_google
--    e total_avaliacoes_google via Google Places API e grava
--    ultima_sincronizacao_em; se o place_id for invalidado/removido pelo
--    Google, marcar ativo = FALSE e cair na regra 3.
-- 6. Escopo atual e so Google; se no futuro entrar outra fonte (Facebook,
--    TripAdvisor etc.), criar tabela irma (ex.: empresa_avaliacoes_facebook)
--    em vez de generalizar esta — mantem o campo de atribuicao obrigatorio
--    por fonte, que muda de termos de uso conforme o provedor.

-- =====================================================================
-- FIM DO SCHEMA
-- =====================================================================

-- ---------------------------------------------------------------------
-- 15. EVENTOS DE PERFIL (visualizacoes e cliques WhatsApp) - alimenta o
--     painel do fornecedor com numeros reais (nao estava no schema original,
--     mas o proprio plano pede "painel com numeros concretos" - sem uma
--     tabela de eventos essas metricas nao teriam de onde vir).
-- ---------------------------------------------------------------------
CREATE TYPE tipo_evento_empresa AS ENUM ('visualizacao_perfil', 'clique_whatsapp');

CREATE TABLE empresa_eventos (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    tipo       tipo_evento_empresa NOT NULL,
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_empresa_eventos_empresa_tipo ON empresa_eventos(empresa_id, tipo, criado_em);
