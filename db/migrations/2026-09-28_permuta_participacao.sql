-- =====================================================================
-- PERMUTA B2B — adesão opcional (idempotente)
-- =====================================================================
-- Nem toda empresa quer trocar serviços: a participação na rede é opt-in.
-- Sem registro aqui (ou com ativa = FALSE) a empresa não aparece na vitrine,
-- não recebe nem envia propostas - mas continua vendo a seção Permutas com
-- a explicação e o botão para participar. Acordos já existentes continuam
-- quando a empresa pausa a participação.

CREATE TABLE IF NOT EXISTS permuta_participantes (
    empresa_id         UUID PRIMARY KEY REFERENCES empresas(usuario_id) ON DELETE CASCADE,
    ativa              BOOLEAN NOT NULL DEFAULT TRUE,
    aceitou_regras_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    pausada_em         TIMESTAMPTZ
);

-- empresas que já cadastraram ofertas antes da adesão existir entram como participantes
INSERT INTO permuta_participantes (empresa_id)
SELECT DISTINCT empresa_id FROM permuta_ofertas
ON CONFLICT (empresa_id) DO NOTHING;
