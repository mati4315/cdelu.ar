-- Script de migración para crear el sistema de feed unificado
-- Este script debe ejecutarse después de tener datos en las tablas news y com

-- Paso 1: Crear la tabla content_feed si no existe
CREATE TABLE IF NOT EXISTS content_feed (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Campos comunes
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  resumen TEXT,
  image_url VARCHAR(500),
  -- Tipo de contenido: 1=news, 2=com, 3=futuras extensiones
  type TINYINT NOT NULL,
  -- ID del contenido original
  original_id INT NOT NULL,
  -- Usuario relacionado (autor de news o creador de com)
  user_id INT,
  user_name VARCHAR(100),
  -- Fechas
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Campos específicos de news
  original_url VARCHAR(500),
  is_oficial BOOLEAN DEFAULT NULL,
  -- Campos específicos de com
  video_url VARCHAR(500),
  -- Estadísticas (se pueden actualizar con triggers adicionales)
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  -- Índices
  INDEX idx_type (type),
  INDEX idx_published_at (published_at),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id),
  INDEX idx_type_published (type, published_at),
  INDEX idx_original_id_type (original_id, type)
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

-- Índices adicionales para las nuevas tablas
CREATE INDEX IF NOT EXISTS idx_com_likes_user ON com_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_com_likes_com ON com_likes(com_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_user ON com_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_com ON com_comments(com_id);
CREATE INDEX IF NOT EXISTS idx_com_comments_created ON com_comments(created_at);

-- Paso 2: Eliminar triggers existentes si existen (para evitar errores)
DROP TRIGGER IF EXISTS after_news_insert;
DROP TRIGGER IF EXISTS after_news_update;
DROP TRIGGER IF EXISTS after_news_delete;
DROP TRIGGER IF EXISTS after_com_insert;
DROP TRIGGER IF EXISTS after_com_update;
DROP TRIGGER IF EXISTS after_com_delete;
DROP TRIGGER IF EXISTS after_user_update;
DROP TRIGGER IF EXISTS after_likes_insert;
DROP TRIGGER IF EXISTS after_likes_delete;
DROP TRIGGER IF EXISTS after_comments_insert;
DROP TRIGGER IF EXISTS after_comments_delete;
DROP TRIGGER IF EXISTS after_com_likes_insert;
DROP TRIGGER IF EXISTS after_com_likes_delete;
DROP TRIGGER IF EXISTS after_com_comments_insert;
DROP TRIGGER IF EXISTS after_com_comments_delete;

-- Paso 3: Crear los triggers
DELIMITER //

CREATE TRIGGER after_news_insert
AFTER INSERT ON news
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario si existe
  IF NEW.created_by IS NOT NULL THEN
    SELECT nombre INTO user_name_val 
    FROM users 
    WHERE id = NEW.created_by;
  END IF;
  
  INSERT INTO content_feed (
    titulo, 
    descripcion, 
    resumen, 
    image_url, 
    type, 
    original_id, 
    user_id, 
    user_name,
    published_at,
    created_at,
    updated_at,
    original_url,
    is_oficial,
    video_url,
    likes_count,
    comments_count
  ) VALUES (
    NEW.titulo,
    NEW.descripcion,
    NEW.resumen,
    NEW.image_url,
    1, -- type = 1 para news
    NEW.id,
    NEW.created_by,
    user_name_val,
    NEW.published_at,
    NEW.created_at,
    NEW.updated_at,
    NEW.original_url,
    NEW.is_oficial,
    NULL, -- video_url es NULL para news
    (SELECT COUNT(*) FROM likes WHERE news_id = NEW.id),
    (SELECT COUNT(*) FROM comments WHERE news_id = NEW.id)
  );
END//

CREATE TRIGGER after_news_update
AFTER UPDATE ON news
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario si existe
  IF NEW.created_by IS NOT NULL THEN
    SELECT nombre INTO user_name_val 
    FROM users 
    WHERE id = NEW.created_by;
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

CREATE TRIGGER after_news_delete
AFTER DELETE ON news
FOR EACH ROW
BEGIN
  DELETE FROM content_feed 
  WHERE type = 1 AND original_id = OLD.id;
END//

CREATE TRIGGER after_com_insert
AFTER INSERT ON com
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario
  SELECT nombre INTO user_name_val 
  FROM users 
  WHERE id = NEW.user_id;
  
  INSERT INTO content_feed (
    titulo, 
    descripcion, 
    resumen, 
    image_url, 
    type, 
    original_id, 
    user_id, 
    user_name,
    published_at,
    created_at,
    updated_at,
    original_url,
    is_oficial,
    video_url,
    likes_count,
    comments_count
  ) VALUES (
    NEW.titulo,
    NEW.descripcion,
    NULL, -- resumen es NULL para com
    NEW.image_url,
    2, -- type = 2 para com
    NEW.id,
    NEW.user_id,
    user_name_val,
    NEW.created_at, -- usar created_at como published_at para com
    NEW.created_at,
    NEW.updated_at,
    NULL, -- original_url es NULL para com
    NULL, -- is_oficial es NULL para com
    NEW.video_url,
    (SELECT COUNT(*) FROM com_likes WHERE com_id = NEW.id),
    (SELECT COUNT(*) FROM com_comments WHERE com_id = NEW.id)
  );
END//

CREATE TRIGGER after_com_update
AFTER UPDATE ON com
FOR EACH ROW
BEGIN
  DECLARE user_name_val VARCHAR(100) DEFAULT NULL;
  
  -- Obtener el nombre del usuario
  SELECT nombre INTO user_name_val 
  FROM users 
  WHERE id = NEW.user_id;
  
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

CREATE TRIGGER after_com_delete
AFTER DELETE ON com
FOR EACH ROW
BEGIN
  DELETE FROM content_feed 
  WHERE type = 2 AND original_id = OLD.id;
END//

CREATE TRIGGER after_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF OLD.nombre != NEW.nombre THEN
    UPDATE content_feed 
    SET user_name = NEW.nombre
    WHERE user_id = NEW.id;
  END IF;
END//

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

-- Paso 4: Poblar la tabla content_feed con datos existentes
-- Insertar todas las noticias existentes
INSERT INTO content_feed (
  titulo, 
  descripcion, 
  resumen, 
  image_url, 
  type, 
  original_id, 
  user_id, 
  user_name,
  published_at,
  created_at,
  updated_at,
  original_url,
  is_oficial,
  video_url,
  likes_count,
  comments_count
)
SELECT 
  n.titulo,
  n.descripcion,
  n.resumen,
  n.image_url,
  1 as type, -- type = 1 para news
  n.id as original_id,
  n.created_by as user_id,
  u.nombre as user_name,
  n.published_at,
  n.created_at,
  n.updated_at,
  n.original_url,
  n.is_oficial,
  NULL as video_url,
  IFNULL((SELECT COUNT(*) FROM likes WHERE news_id = n.id), 0) as likes_count,
  IFNULL((SELECT COUNT(*) FROM comments WHERE news_id = n.id), 0) as comments_count
FROM news n
LEFT JOIN users u ON n.created_by = u.id;

-- Insertar todas las comunicaciones existentes
INSERT INTO content_feed (
  titulo, 
  descripcion, 
  resumen, 
  image_url, 
  type, 
  original_id, 
  user_id, 
  user_name,
  published_at,
  created_at,
  updated_at,
  original_url,
  is_oficial,
  video_url,
  likes_count,
  comments_count
)
SELECT 
  c.titulo,
  c.descripcion,
  NULL as resumen, -- resumen es NULL para com
  c.image_url,
  2 as type, -- type = 2 para com
  c.id as original_id,
  c.user_id,
  u.nombre as user_name,
  c.created_at as published_at, -- usar created_at como published_at para com
  c.created_at,
  c.updated_at,
  NULL as original_url, -- original_url es NULL para com
  NULL as is_oficial, -- is_oficial es NULL para com
  c.video_url,
  IFNULL((SELECT COUNT(*) FROM com_likes WHERE com_id = c.id), 0) as likes_count,
  IFNULL((SELECT COUNT(*) FROM com_comments WHERE com_id = c.id), 0) as comments_count
FROM com c
LEFT JOIN users u ON c.user_id = u.id;

-- Paso 5: Verificar la migración
SELECT 
  'Resumen de migración' as descripcion,
  COUNT(*) as total_items,
  SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) as noticias,
  SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) as comunicaciones
FROM content_feed;

-- Mostrar algunos ejemplos
SELECT 
  'Ejemplos de contenido migrado' as descripcion,
  type,
  titulo,
  user_name,
  published_at
FROM content_feed 
ORDER BY published_at DESC 
LIMIT 10; 