-- Script para arreglar los triggers de encuestas
-- Ejecutar este script directamente en MySQL

-- Eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS update_option_votes_count;
DROP TRIGGER IF EXISTS update_option_votes_count_delete;
DROP TRIGGER IF EXISTS create_survey_stats;

-- Crear trigger para actualizar contador de votos al insertar
DELIMITER //
CREATE TRIGGER update_option_votes_count
AFTER INSERT ON survey_votes
FOR EACH ROW
BEGIN
    UPDATE survey_options 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.option_id;
    
    UPDATE surveys 
    SET total_votes = total_votes + 1 
    WHERE id = NEW.survey_id;
END//

-- Crear trigger para actualizar contador al eliminar votos
CREATE TRIGGER update_option_votes_count_delete
AFTER DELETE ON survey_votes
FOR EACH ROW
BEGIN
    UPDATE survey_options 
    SET votes_count = votes_count - 1 
    WHERE id = OLD.option_id;
    
    UPDATE surveys 
    SET total_votes = total_votes - 1 
    WHERE id = OLD.survey_id;
END//

-- Crear trigger para crear estadísticas al crear encuesta
CREATE TRIGGER create_survey_stats
AFTER INSERT ON surveys
FOR EACH ROW
BEGIN
    INSERT INTO survey_stats (survey_id, total_votes, unique_voters)
    VALUES (NEW.id, 0, 0);
END//

DELIMITER ;

-- Actualizar contadores existentes para sincronizar
UPDATE survey_options so 
SET votes_count = (
    SELECT COUNT(*) 
    FROM survey_votes sv 
    WHERE sv.option_id = so.id
);

UPDATE surveys s 
SET total_votes = (
    SELECT COUNT(*) 
    FROM survey_votes sv 
    WHERE sv.survey_id = s.id
);

-- Verificar que los triggers se crearon correctamente
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE() 
AND TRIGGER_NAME IN ('update_option_votes_count', 'update_option_votes_count_delete', 'create_survey_stats'); 