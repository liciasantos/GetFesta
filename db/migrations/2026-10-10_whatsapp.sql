-- Avisos por WhatsApp (WAHA). Opt-in por usuário + fila de envio com
-- intervalo entre mensagens (ver lib/whatsapp/*). Idempotente.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS whatsapp_avisos   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS whatsapp_numero   VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS whatsapp_chat_id  VARCHAR(60);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS whatsapp_optin_em TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS whatsapp_fila (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        VARCHAR(40) NOT NULL,
    chave       VARCHAR(200) UNIQUE,          -- evita aviso repetido do mesmo fato
    texto       TEXT NOT NULL,
    status      VARCHAR(12) NOT NULL DEFAULT 'pendente', -- pendente | enviando | enviado | erro | cancelado
    tentativas  INTEGER NOT NULL DEFAULT 0,
    erro        TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    travado_em  TIMESTAMPTZ,
    enviado_em  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_fila_aberta ON whatsapp_fila(id) WHERE status IN ('pendente', 'enviando');
CREATE INDEX IF NOT EXISTS idx_whatsapp_fila_enviado_em ON whatsapp_fila(enviado_em) WHERE status = 'enviado';
