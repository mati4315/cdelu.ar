-- =====================================================
-- MIGRACIÓN: Sistema de Perfiles Públicos y Seguimiento
-- Fecha: 24 de Septiembre 2025
-- Descripción: Agregar campos de perfil y sistema de seguimiento
-- =====================================================

USE cdelu;

-- 1. Agregar campos de perfil a la tabla users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE AFTER email,
  ADD COLUMN IF NOT EXISTS bio TEXT AFTER username,
  ADD COLUMN IF NOT EXISTS location VARCHAR(255) AFTER bio,
  ADD COLUMN IF NOT EXISTS website VARCHAR(255) AFTER location,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE AFTER website,
  ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500) AFTER is_verified;

-- 2. Crear tabla para el sistema de seguimiento
CREATE TABLE IF NOT EXISTS user_follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  follower_id INT NOT NULL COMMENT 'Usuario que sigue',
  following_id INT NOT NULL COMMENT 'Usuario seguido', 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
);

-- 3. Crear tabla para likes de comunidad (si no existe)
CREATE TABLE IF NOT EXISTS com_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  com_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
  UNIQUE KEY unique_com_like (user_id, com_id),
  INDEX idx_user_com_likes (user_id),
  INDEX idx_com_likes (com_id)
);

-- 4. Crear índices adicionales para optimizar consultas
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_username (username);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_email (email);
ALTER TABLE com ADD INDEX IF NOT EXISTS idx_user_created (user_id, created_at);

-- 5. Actualizar usuarios existentes con usernames únicos basados en su nombre
-- Generar usernames seguros para usuarios existentes que no tengan
UPDATE users 
SET username = CONCAT(
  LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    TRIM(nombre), ' ', '.'), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o')), 'ú', 'u'
  ),
  '.', 
  id
)
WHERE username IS NULL OR username = '';

-- 6. Crear tabla de content_feed si no existe (para unificar feed)
CREATE TABLE IF NOT EXISTS content_feed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type TINYINT NOT NULL COMMENT '1=news, 2=com',
  original_id INT NOT NULL COMMENT 'ID del contenido original',
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  resumen TEXT,
  image_url VARCHAR(500),
  video_url VARCHAR(500),
  user_id INT,
  user_name VARCHAR(100),
  user_profile_picture VARCHAR(500),
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  original_url VARCHAR(500),
  is_oficial BOOLEAN DEFAULT FALSE,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  INDEX idx_type_original (type, original_id),
  INDEX idx_user_content (user_id),
  INDEX idx_published_at (published_at),
  INDEX idx_created_at (created_at)
);

-- 7. Función para sincronizar content_feed (será llamada por la API)
-- Esta será implementada en el servicio, no como stored procedure

-- 8. Insertar algunos usuarios de prueba si no existen
INSERT IGNORE INTO users (nombre, email, username, password, role_id, bio, location, is_verified) VALUES 
('Juan Pérez', 'juan@test.com', 'juan.perez', '$2b$10$XKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQv', 
 (SELECT id FROM roles WHERE nombre='usuario'), 'Desarrollador Frontend en Vue.js', 'Concepción del Uruguay', FALSE),
('María García', 'maria@test.com', 'maria.garcia', '$2b$10$XKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQv', 
 (SELECT id FROM roles WHERE nombre='usuario'), 'Diseñadora UX/UI', 'Buenos Aires', FALSE),
('Carlos López', 'carlos@test.com', 'carlos.lopez', '$2b$10$XKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQv', 
 (SELECT id FROM roles WHERE nombre='colaborador'), 'Periodista local', 'Gualeguaychú', FALSE);

-- 9. Insertar algunas relaciones de seguimiento de prueba
INSERT IGNORE INTO user_follows (follower_id, following_id) VALUES
((SELECT id FROM users WHERE email='juan@test.com'), (SELECT id FROM users WHERE email='maria@test.com')),
((SELECT id FROM users WHERE email='juan@test.com'), (SELECT id FROM users WHERE email='carlos@test.com')),
((SELECT id FROM users WHERE email='maria@test.com'), (SELECT id FROM users WHERE email='juan@test.com'));

-- 10. Verificar que todo está en orden
SELECT 'Migración completada exitosamente' as status;
