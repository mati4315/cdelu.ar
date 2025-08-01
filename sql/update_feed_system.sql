-- Script para actualizar el sistema de feed existente
-- Agregar soporte para likes y comentarios en contenido de comunidad
-- Ejecutar solo si ya tienes la tabla content_feed

-- Crear tablas para likes y comentarios de contenido de comunidad (si no existen)
CREATE TABLE IF NOT EXISTS com_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  com_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_com (user_id, com_id)
);

CREATE TABLE IF NOT EXISTS com_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  com_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE
);

-- Agregar índices para las nuevas tablas
CREATE INDEX IF NOT EXISTS idx_com_likes_user ON com_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_com_likes_com ON com_likes(com_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_user ON com_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_com ON com_comments(com_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_created ON com_comments(created_at);

-- Eliminar triggers que vamos a recrear
DROP TRIGGER IF EXISTS after_likes_insert;
DROP TRIGGER IF EXISTS after_likes_delete;
DROP TRIGGER IF EXISTS after_comments_insert;
DROP TRIGGER IF EXISTS after_comments_delete;
DROP TRIGGER IF EXISTS after_com_likes_insert;
DROP TRIGGER IF EXISTS after_com_likes_delete;
DROP TRIGGER IF EXISTS after_com_comments_insert;
DROP TRIGGER IF EXISTS after_com_comments_delete;

-- Crear triggers para mantener sincronizados los conteos
DELIMITER //

-- === TRIGGERS PARA LIKES EN NEWS ===

CREATE TRIGGER after_likes_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM likes WHERE news_id = NEW.news_id)
  WHERE type = 1 AND original_id = NEW.news_id;
END//

CREATE TRIGGER after_likes_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM likes WHERE news_id = OLD.news_id)
  WHERE type = 1 AND original_id = OLD.news_id;
END//

-- === TRIGGERS PARA COMMENTS EN NEWS ===

CREATE TRIGGER after_comments_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM comments WHERE news_id = NEW.news_id)
  WHERE type = 1 AND original_id = NEW.news_id;
END//

CREATE TRIGGER after_comments_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM comments WHERE news_id = OLD.news_id)
  WHERE type = 1 AND original_id = OLD.news_id;
END//

-- === TRIGGERS PARA LIKES EN COM ===

CREATE TRIGGER after_com_likes_insert
AFTER INSERT ON com_likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM com_likes WHERE com_id = NEW.com_id)
  WHERE type = 2 AND original_id = NEW.com_id;
END//

CREATE TRIGGER after_com_likes_delete
AFTER DELETE ON com_likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM com_likes WHERE com_id = OLD.com_id)
  WHERE type = 2 AND original_id = OLD.com_id;
END//

-- === TRIGGERS PARA COMMENTS EN COM ===

CREATE TRIGGER after_com_comments_insert
AFTER INSERT ON com_comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM com_comments WHERE com_id = NEW.com_id)
  WHERE type = 2 AND original_id = NEW.com_id;
END//

CREATE TRIGGER after_com_comments_delete
AFTER DELETE ON com_comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM com_comments WHERE com_id = OLD.com_id)
  WHERE type = 2 AND original_id = OLD.com_id;
END//

DELIMITER ;

-- Actualizar conteos existentes en content_feed
UPDATE content_feed SET
  likes_count = (
    CASE 
      WHEN type = 1 THEN (SELECT COUNT(*) FROM likes WHERE news_id = original_id)
      WHEN type = 2 THEN (SELECT COUNT(*) FROM com_likes WHERE com_id = original_id)
      ELSE 0
    END
  ),
  comments_count = (
    CASE 
      WHEN type = 1 THEN (SELECT COUNT(*) FROM comments WHERE news_id = original_id)
      WHEN type = 2 THEN (SELECT COUNT(*) FROM com_comments WHERE com_id = original_id)
      ELSE 0
    END
  );

-- Verificar resultados
SELECT 
  'Actualización completada' as resultado,
  (SELECT COUNT(*) FROM com_likes) as total_com_likes,
  (SELECT COUNT(*) FROM com_comments) as total_com_comments,
  (SELECT COUNT(*) FROM content_feed WHERE type = 2 AND likes_count > 0) as com_con_likes,
  (SELECT COUNT(*) FROM content_feed WHERE type = 2 AND comments_count > 0) as com_con_comentarios;

-- Mostrar estadísticas finales
SELECT 
  type,
  CASE type 
    WHEN 1 THEN 'Noticias'
    WHEN 2 THEN 'Comunidad'
    ELSE 'Otro'
  END as tipo_contenido,
  COUNT(*) as total_elementos,
  SUM(likes_count) as total_likes,
  SUM(comments_count) as total_comentarios,
  AVG(likes_count) as promedio_likes,
  AVG(comments_count) as promedio_comentarios
FROM content_feed
GROUP BY type; 