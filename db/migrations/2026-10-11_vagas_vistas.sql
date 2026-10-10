-- Quando o profissional abriu a aba Vagas pela última vez: vagas compatíveis
-- publicadas depois disso contam no selo do menu e ganham a etiqueta "Nova".
-- Contas existentes começam com "agora" (nada fica marcado como novo de uma vez).
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS vagas_vistas_em TIMESTAMPTZ NOT NULL DEFAULT now();
