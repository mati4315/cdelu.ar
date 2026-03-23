-- =====================================================
-- OPTIMIZACIÓN DE TRIGGERS PARA CONTENT_FEED
-- Fecha: 29 de Septiembre 2025
-- Descripción: Optimizar triggers para mantener contadores actualizados
-- =====================================================

USE cdelu;

-- Eliminar triggers existentes para recrearlos optimizados
DROP TRIGGER IF EXISTS after_likes_insert;
DROP TRIGGER IF EXISTS after_likes_delete;
DROP TRIGGER IF EXISTS after_com_likes_insert;
DROP TRIGGER IF EXISTS after_com_likes_delete;
DROP TRIGGER IF EXISTS after_comments_insert;
DROP TRIGGER IF EXISTS after_comments_delete;
DROP TRIGGER IF EXISTS after_com_comments_insert;
DROP TRIGGER IF EXISTS after_com_comments_delete;

DELIMITER $$

-- === TRIGGERS PARA LIKES EN NOTICIAS ===

CREATE TRIGGER after_likes_insert
AFTER INSERT ON likes FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET likes_count = likes_count + 1,
      updated_at = NOW()
  WHERE type = 1 AND original_id = NEW.news_id;
END$$

CREATE TRIGGER after_likes_delete
AFTER DELETE ON likes FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET likes_count = GREATEST(0, likes_count - 1),
      updated_at = NOW()
  WHERE type = 1 AND original_id = OLD.news_id;
END$$

-- === TRIGGERS PARA LIKES EN COMUNIDAD ===

CREATE TRIGGER after_com_likes_insert
AFTER INSERT ON com_likes FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET likes_count = likes_count + 1,
      updated_at = NOW()
  WHERE type = 2 AND original_id = NEW.com_id;
END$$

CREATE TRIGGER after_com_likes_delete
AFTER DELETE ON com_likes FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET likes_count = GREATEST(0, likes_count - 1),
      updated_at = NOW()
  WHERE type = 2 AND original_id = OLD.com_id;
END$$

-- === TRIGGERS PARA COMENTARIOS EN NOTICIAS ===

CREATE TRIGGER after_comments_insert
AFTER INSERT ON comments FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET comments_count = comments_count + 1,
      updated_at = NOW()
  WHERE type = 1 AND original_id = NEW.news_id;
END$$

CREATE TRIGGER after_comments_delete
AFTER DELETE ON comments FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET comments_count = GREATEST(0, comments_count - 1),
      updated_at = NOW()
  WHERE type = 1 AND original_id = OLD.news_id;
END$$

-- === TRIGGERS PARA COMENTARIOS EN COMUNIDAD ===

CREATE TRIGGER after_com_comments_insert
AFTER INSERT ON com_comments FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET comments_count = comments_count + 1,
      updated_at = NOW()
  WHERE type = 2 AND original_id = NEW.com_id;
END$$

CREATE TRIGGER after_com_comments_delete
AFTER DELETE ON com_comments FOR EACH ROW
BEGIN
  UPDATE content_feed 
  SET comments_count = GREATEST(0, comments_count - 1),
      updated_at = NOW()
  WHERE type = 2 AND original_id = OLD.com_id;
END$$

DELIMITER ;

-- === RECALCULAR CONTADORES EXISTENTES ===

-- Actualizar likes_count para noticias
UPDATE content_feed cf
SET likes_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM likes l 
  WHERE l.news_id = cf.original_id
)
WHERE cf.type = 1;

-- Actualizar likes_count para comunidad
UPDATE content_feed cf
SET likes_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM com_likes cl 
  WHERE cl.com_id = cf.original_id
)
WHERE cf.type = 2;

-- Actualizar comments_count para noticias
UPDATE content_feed cf
SET comments_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM comments c 
  WHERE c.news_id = cf.original_id
)
WHERE cf.type = 1;

-- Actualizar comments_count para comunidad
UPDATE content_feed cf
SET comments_count = (
  SELECT COALESCE(COUNT(*), 0) 
  FROM com_comments cc 
  WHERE cc.com_id = cf.original_id
)
WHERE cf.type = 2;

-- === VERIFICACIÓN DE OPTIMIZACIÓN ===

-- Mostrar estadísticas de optimización
SELECT 
  'Noticias' as tipo,
  COUNT(*) as total_posts,
  SUM(likes_count) as total_likes,
  SUM(comments_count) as total_comments,
  AVG(likes_count) as avg_likes_per_post,
  AVG(comments_count) as avg_comments_per_post
FROM content_feed 
WHERE type = 1

UNION ALL

SELECT 
  'Comunidad' as tipo,
  COUNT(*) as total_posts,
  SUM(likes_count) as total_likes,
  SUM(comments_count) as total_comments,
  AVG(likes_count) as avg_likes_per_post,
  AVG(comments_count) as avg_comments_per_post
FROM content_feed 
WHERE type = 2;

-- Mostrar triggers creados
SHOW TRIGGERS LIKE '%likes%';
SHOW TRIGGERS LIKE '%comments%';

SELECT 'Optimización de content_feed completada exitosamente' as resultado;
