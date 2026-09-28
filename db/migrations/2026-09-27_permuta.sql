-- =====================================================================
-- PERMUTA B2B — troca de servicos entre empresas (idempotente)
-- =====================================================================
-- Rede fechada: so empresas veem. Cada acordo tem exatamente DUAS entregas
-- (permuta_entregas, ordem 1 e 2): a de cada empresa para a outra, cada uma
-- com data, confirmacao (check-in) e avaliacao proprias - e isso que permite
-- saber a qualquer momento quem ja fez o evento de quem.
-- Regras configuraveis pelo admin ficam em configuracoes_site, chave
-- 'permuta_config' (JSON - ver lib/permuta/config.ts).
-- Rodar com: npm run permuta:setup (aplica este arquivo; --demo cria dados de exemplo)

DO $$ BEGIN
  CREATE TYPE status_acordo_permuta AS ENUM ('proposta', 'em_execucao', 'concluido', 'recusado', 'cancelado', 'em_disputa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_entrega_permuta AS ENUM ('agendada', 'confirmada', 'nao_realizada', 'em_disputa', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- o que a empresa oferece como "moeda" (servico + valor de mercado de referencia)
CREATE TABLE IF NOT EXISTS permuta_ofertas (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id        UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    categoria_id      INTEGER REFERENCES categorias(id),
    titulo            VARCHAR(120) NOT NULL,              -- ex: "Buffet infantil para 60 pessoas"
    descricao         TEXT,
    valor_referencia  NUMERIC(10,2) NOT NULL CHECK (valor_referencia >= 0),
    ativa             BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_permuta_ofertas_empresa ON permuta_ofertas(empresa_id) WHERE ativa;

-- categorias que a empresa busca em troca (alimenta o match)
CREATE TABLE IF NOT EXISTS permuta_buscas (
    empresa_id    UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    categoria_id  INTEGER NOT NULL REFERENCES categorias(id),
    PRIMARY KEY (empresa_id, categoria_id)
);

CREATE TABLE IF NOT EXISTS permuta_acordos (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proponente_id             UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    destinatario_id           UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    status                    status_acordo_permuta NOT NULL DEFAULT 'proposta',
    versao                    INTEGER NOT NULL DEFAULT 1,     -- sobe a cada contraproposta
    ultima_edicao_por         UUID REFERENCES empresas(usuario_id) ON DELETE SET NULL,
    assinado_proponente_em    TIMESTAMPTZ,
    assinado_destinatario_em  TIMESTAMPTZ,                     -- as duas preenchidas = em_execucao
    compensacao               TEXT,                            -- como a diferenca de valor foi compensada
    encerrado_por             UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_encerramento       TEXT,
    cancelado_fora_janela     BOOLEAN NOT NULL DEFAULT FALSE,  -- penaliza o nivel de quem cancelou
    disputa_aberta_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    disputa_motivo            TEXT,
    disputa_resolucao         TEXT,
    criado_em                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (proponente_id <> destinatario_id)
);
CREATE INDEX IF NOT EXISTS idx_permuta_acordos_proponente ON permuta_acordos(proponente_id, status);
CREATE INDEX IF NOT EXISTS idx_permuta_acordos_destinatario ON permuta_acordos(destinatario_id, status);

CREATE TABLE IF NOT EXISTS permuta_entregas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acordo_id               UUID NOT NULL REFERENCES permuta_acordos(id) ON DELETE CASCADE,
    ordem                   SMALLINT NOT NULL CHECK (ordem IN (1, 2)),   -- 1 = entrega primeiro
    prestador_id            UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    beneficiario_id         UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    oferta_id               UUID REFERENCES permuta_ofertas(id) ON DELETE SET NULL,
    titulo                  VARCHAR(120) NOT NULL,        -- copia da oferta no momento do acordo
    escopo                  TEXT,
    valor_referencia        NUMERIC(10,2) NOT NULL DEFAULT 0,
    data_evento             DATE NOT NULL,
    local_evento            VARCHAR(160),
    status                  status_entrega_permuta NOT NULL DEFAULT 'agendada',
    confirmada_em           TIMESTAMPTZ,
    confirmacao_automatica  BOOLEAN NOT NULL DEFAULT FALSE,  -- beneficiario nao respondeu no prazo
    UNIQUE (acordo_id, ordem)
);
CREATE INDEX IF NOT EXISTS idx_permuta_entregas_prestador ON permuta_entregas(prestador_id);
CREATE INDEX IF NOT EXISTS idx_permuta_entregas_beneficiario ON permuta_entregas(beneficiario_id);

-- avaliacao de cada entrega, feita por quem recebeu o servico
CREATE TABLE IF NOT EXISTS permuta_avaliacoes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id    UUID NOT NULL REFERENCES permuta_entregas(id) ON DELETE CASCADE,
    avaliador_id  UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    avaliado_id   UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    nota          SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    pontual       BOOLEAN NOT NULL DEFAULT TRUE,
    comentario    TEXT,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (entrega_id, avaliador_id)
);
CREATE INDEX IF NOT EXISTS idx_permuta_avaliacoes_avaliado ON permuta_avaliacoes(avaliado_id);

-- chat do acordo; remetente NULL = mensagem do sistema (contraproposta, assinatura...)
CREATE TABLE IF NOT EXISTS permuta_mensagens (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acordo_id     UUID NOT NULL REFERENCES permuta_acordos(id) ON DELETE CASCADE,
    remetente_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    conteudo      TEXT NOT NULL,
    enviado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_permuta_mensagens_acordo ON permuta_mensagens(acordo_id, enviado_em);

-- controle manual do admin sobre a participacao de cada empresa
CREATE TABLE IF NOT EXISTS permuta_empresa_admin (
    empresa_id     UUID PRIMARY KEY REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    nivel_manual   VARCHAR(5) CHECK (nivel_manual IN ('novo', 'c', 'b', 'a')),  -- NULL = calculado
    suspensa_ate   TIMESTAMPTZ,
    banida         BOOLEAN NOT NULL DEFAULT FALSE,
    observacao     TEXT,
    atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);
