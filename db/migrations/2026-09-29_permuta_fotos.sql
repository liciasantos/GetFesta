-- =====================================================================
-- PERMUTA B2B — fotos da entrega indo para o portfólio (idempotente)
-- =====================================================================
-- Depois de confirmar uma entrega, quem RECEBEU o serviço pode enviar fotos
-- do evento e autorizar o uso no portfólio de quem prestou. Quem prestou
-- escolhe quais fotos entram na própria galeria (empresa_galeria) - os dois
-- lados consentem. empresa_galeria.origem_entrega_id marca a foto como
-- "evento real" vinda de uma permuta.

CREATE TABLE IF NOT EXISTS permuta_entrega_fotos (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id             UUID NOT NULL REFERENCES permuta_entregas(id) ON DELETE CASCADE,
    enviada_por            UUID NOT NULL REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    url                    TEXT NOT NULL,                  -- data URI, mesmo padrão da galeria
    autorizada_portfolio   BOOLEAN NOT NULL DEFAULT FALSE,
    galeria_foto_id        UUID REFERENCES empresa_galeria(id) ON DELETE SET NULL,  -- preenchido quando entra na galeria
    criado_em              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_permuta_entrega_fotos_entrega ON permuta_entrega_fotos(entrega_id);

ALTER TABLE empresa_galeria ADD COLUMN IF NOT EXISTS origem_entrega_id UUID REFERENCES permuta_entregas(id) ON DELETE SET NULL;
