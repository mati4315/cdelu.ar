-- Sistema de Feed Unificado
-- Tabla para contenido unificado (noticias + comunicaciones)

-- Crear tabla principal del feed
CREATE TABLE IF NOT EXISTS content_feed (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  resumen TEXT NULL,                        -- Solo para noticias
  image_url VARCHAR(500) NULL,
  type TINYINT NOT NULL,                    -- 1=news, 2=com
  original_id INT NOT NULL,                 -- ID en la tabla original
  user_id INT NULL,                         -- ID del usuario creador
  user_name VARCHAR(100) NULL,              -- Nombre del usuario (desnormalizado)
  published_at DATETIME NULL,               -- Fecha de publicación
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Campos específicos de noticias (type=1)
  original_url VARCHAR(500) NULL,           -- URL original de la noticia
  is_oficial BOOLEAN NULL,                  -- Si es contenido oficial
  
  -- Campos específicos de comunicaciones (type=2)
  video_url VARCHAR(500) NULL,              -- URL del video
  
  -- Estadísticas precalculadas
  likes_count INT DEFAULT 0,                -- Número de likes
  comments_count INT DEFAULT 0,             -- Número de comentarios
  
  -- Índices para rendimiento
  INDEX idx_type (type),
  INDEX idx_published_at (published_at),
  INDEX idx_created_at (created_at),
  INDEX idx_likes (likes_count),
  INDEX idx_comments (comments_count),
  INDEX idx_type_published (type, published_at),
  INDEX idx_original (type, original_id)
);

-- Crear tablas para likes y comentarios de contenido de comunidad
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

-- TRIGGERS PARA SINCRONIZACIÓN AUTOMÁTICA

-- === TRIGGERS PARA NEWS ===

DELIMITER //

-- Trigger para insertar en content_feed cuando se crea una news
CREATE TRIGGER IF NOT EXISTS after_news_insert
AFTER INSERT ON news
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario si existe
  IF NEW.created_by IS NOT NULL THEN
    SELECT nombre INTO user_name_val FROM users WHERE id = NEW.created_by LIMIT 1;
  END IF;
  
  INSERT INTO content_feed (
    titulo, descripcion, resumen, image_url, type, original_id,
    user_id, user_name, published_at, created_at, updated_at,
    original_url, is_oficial, video_url, likes_count, comments_count
  ) VALUES (
    NEW.titulo, NEW.descripcion, NEW.resumen, NEW.image_url, 1, NEW.id,
    NEW.created_by, user_name_val, NEW.published_at, NEW.created_at, NEW.updated_at,
    NEW.original_url, NEW.is_oficial, NULL,
    (SELECT COUNT(*) FROM likes WHERE news_id = NEW.id),
    (SELECT COUNT(*) FROM comments WHERE news_id = NEW.id)
  );
END//

-- Trigger para actualizar content_feed cuando se actualiza una news
CREATE TRIGGER IF NOT EXISTS after_news_update
AFTER UPDATE ON news
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario si existe
  IF NEW.created_by IS NOT NULL THEN
    SELECT nombre INTO user_name_val FROM users WHERE id = NEW.created_by LIMIT 1;
  END IF;
  
  UPDATE content_feed SET
    titulo = NEW.titulo,
    descripcion = NEW.descripcion,
    resumen = NEW.resumen,
    image_url = NEW.image_url,
    user_id = NEW.created_by,
    user_name = user_name_val,
    published_at = NEW.published_at,
    updated_at = NEW.updated_at,
    original_url = NEW.original_url,
    is_oficial = NEW.is_oficial,
    likes_count = (SELECT COUNT(*) FROM likes WHERE news_id = NEW.id),
    comments_count = (SELECT COUNT(*) FROM comments WHERE news_id = NEW.id)
  WHERE type = 1 AND original_id = NEW.id;
END//

-- Trigger para eliminar de content_feed cuando se elimina una news
CREATE TRIGGER IF NOT EXISTS after_news_delete
AFTER DELETE ON news
FOR EACH ROW
BEGIN
  DELETE FROM content_feed WHERE type = 1 AND original_id = OLD.id;
END//

-- === TRIGGERS PARA COM ===

-- Trigger para insertar en content_feed cuando se crea un com
CREATE TRIGGER IF NOT EXISTS after_com_insert
AFTER INSERT ON com
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario
  SELECT nombre INTO user_name_val FROM users WHERE id = NEW.user_id LIMIT 1;
  
  INSERT INTO content_feed (
    titulo, descripcion, resumen, image_url, type, original_id,
    user_id, user_name, published_at, created_at, updated_at,
    original_url, is_oficial, video_url, likes_count, comments_count
  ) VALUES (
    NEW.titulo, NEW.descripcion, NULL, NEW.image_url, 2, NEW.id,
    NEW.user_id, user_name_val, NEW.created_at, NEW.created_at, NEW.updated_at,
    NULL, NULL, NEW.video_url,
    (SELECT COUNT(*) FROM com_likes WHERE com_id = NEW.id),
    (SELECT COUNT(*) FROM com_comments WHERE com_id = NEW.id)
  );
END//

-- Trigger para actualizar content_feed cuando se actualiza un com
CREATE TRIGGER IF NOT EXISTS after_com_update
AFTER UPDATE ON com
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario
  SELECT nombre INTO user_name_val FROM users WHERE id = NEW.user_id LIMIT 1;
  
  UPDATE content_feed SET
    titulo = NEW.titulo,
    descripcion = NEW.descripcion,
    image_url = NEW.image_url,
    user_id = NEW.user_id,
    user_name = user_name_val,
    published_at = NEW.created_at,
    updated_at = NEW.updated_at,
    video_url = NEW.video_url,
    likes_count = (SELECT COUNT(*) FROM com_likes WHERE com_id = NEW.id),
    comments_count = (SELECT COUNT(*) FROM com_comments WHERE com_id = NEW.id)
  WHERE type = 2 AND original_id = NEW.id;
END//

-- Trigger para eliminar de content_feed cuando se elimina un com
CREATE TRIGGER IF NOT EXISTS after_com_delete
AFTER DELETE ON com
FOR EACH ROW
BEGIN
  DELETE FROM content_feed WHERE type = 2 AND original_id = OLD.id;
END//

-- === TRIGGERS PARA LIKES EN NEWS ===

-- Trigger para actualizar likes_count cuando se agrega un like a una noticia
CREATE TRIGGER IF NOT EXISTS after_likes_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM likes WHERE news_id = NEW.news_id)
  WHERE type = 1 AND original_id = NEW.news_id;
END//

-- Trigger para actualizar likes_count cuando se elimina un like de una noticia
CREATE TRIGGER IF NOT EXISTS after_likes_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM likes WHERE news_id = OLD.news_id)
  WHERE type = 1 AND original_id = OLD.news_id;
END//

-- === TRIGGERS PARA COMMENTS EN NEWS ===

-- Trigger para actualizar comments_count cuando se agrega un comentario a una noticia
CREATE TRIGGER IF NOT EXISTS after_comments_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM comments WHERE news_id = NEW.news_id)
  WHERE type = 1 AND original_id = NEW.news_id;
END//

-- Trigger para actualizar comments_count cuando se elimina un comentario de una noticia
CREATE TRIGGER IF NOT EXISTS after_comments_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM comments WHERE news_id = OLD.news_id)
  WHERE type = 1 AND original_id = OLD.news_id;
END//

-- === TRIGGERS PARA LIKES EN COM ===

-- Trigger para actualizar likes_count cuando se agrega un like a contenido de comunidad
CREATE TRIGGER IF NOT EXISTS after_com_likes_insert
AFTER INSERT ON com_likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM com_likes WHERE com_id = NEW.com_id)
  WHERE type = 2 AND original_id = NEW.com_id;
END//

-- Trigger para actualizar likes_count cuando se elimina un like de contenido de comunidad
CREATE TRIGGER IF NOT EXISTS after_com_likes_delete
AFTER DELETE ON com_likes
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    likes_count = (SELECT COUNT(*) FROM com_likes WHERE com_id = OLD.com_id)
  WHERE type = 2 AND original_id = OLD.com_id;
END//

-- === TRIGGERS PARA COMMENTS EN COM ===

-- Trigger para actualizar comments_count cuando se agrega un comentario a contenido de comunidad
CREATE TRIGGER IF NOT EXISTS after_com_comments_insert
AFTER INSERT ON com_comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM com_comments WHERE com_id = NEW.com_id)
  WHERE type = 2 AND original_id = NEW.com_id;
END//

-- Trigger para actualizar comments_count cuando se elimina un comentario de contenido de comunidad
CREATE TRIGGER IF NOT EXISTS after_com_comments_delete
AFTER DELETE ON com_comments
FOR EACH ROW
BEGIN
  UPDATE content_feed SET
    comments_count = (SELECT COUNT(*) FROM com_comments WHERE com_id = OLD.com_id)
  WHERE type = 2 AND original_id = OLD.com_id;
END//

-- === TRIGGER PARA USUARIOS ===

-- Trigger para actualizar user_name cuando se actualiza el nombre de un usuario
CREATE TRIGGER IF NOT EXISTS after_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  -- Actualizar nombres en content_feed
  UPDATE content_feed SET
    user_name = NEW.nombre
  WHERE user_id = NEW.id;
END//

DELIMITER ;

-- Índices adicionales para las nuevas tablas
CREATE INDEX IF NOT EXISTS idx_com_likes_user ON com_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_com_likes_com ON com_likes(com_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_user ON com_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_com ON com_comments(com_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_created ON com_comments(created_at); 