-- Script para agregar estado de votación a las encuestas
-- Sistema de Estado Binario: 0 (No votado) / 1 (Votado)

-- Agregar campo has_voted a la tabla survey_votes
ALTER TABLE survey_votes ADD COLUMN has_voted BOOLEAN DEFAULT FALSE;

-- Actualizar registros existentes para marcar como votados
UPDATE survey_votes SET has_voted = TRUE WHERE id > 0;

-- Crear índice para optimizar consultas
CREATE INDEX idx_survey_votes_user_survey ON survey_votes(user_id, survey_id, has_voted);

-- Verificar la estructura actualizada
DESCRIBE survey_votes;

-- Mostrar algunos registros de ejemplo
SELECT 
    sv.id,
    sv.survey_id,
    sv.user_id,
    sv.has_voted,
    sv.voted_at,
    s.question
FROM survey_votes sv
JOIN surveys s ON sv.survey_id = s.id
LIMIT 10; 