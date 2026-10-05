-- =====================================================================
-- VAGAS — título opcional (idempotente)
-- =====================================================================
-- Nome livre que a empresa dá à vaga ("Mascote Bluey — aniversário da Maria")
-- pra ela e o profissional identificarem o evento sem abrir os detalhes.
-- Sem título, a interface continua mostrando a função (categoria).
ALTER TABLE vagas_profissionais ADD COLUMN IF NOT EXISTS titulo VARCHAR(80);
