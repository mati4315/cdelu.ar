-- Script para agregar campo de foto de perfil a la tabla users
-- Ejecutar en MySQL/MariaDB

USE cdelu;

-- Agregar columna profile_picture_url a la tabla users
ALTER TABLE users 
ADD COLUMN profile_picture_url VARCHAR(500) NULL 
COMMENT 'URL de la foto de perfil del usuario'
AFTER password;

-- Opcional: Agregar índice si se planea hacer búsquedas frecuentes
-- CREATE INDEX idx_users_profile_picture ON users(profile_picture_url);

-- Verificar que la columna se agregó correctamente
DESCRIBE users; 