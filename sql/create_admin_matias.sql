-- Script para crear el usuario administrador Matias
-- Ejecutar este script en MySQL para crear el usuario

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS cdelu_diario;

-- Usar la base de datos
USE cdelu_diario;

-- Crear la tabla de roles si no existe
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar roles si no existen
INSERT IGNORE INTO roles (nombre) VALUES 
('administrador'),
('colaborador'),
('usuario');

-- Crear la tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Insertar o actualizar el usuario administrador Matias
-- La contraseña 'w35115415' debe ser hasheada con bcrypt
-- Este es el hash generado para 'w35115415'
INSERT INTO users (nombre, email, password, role_id)
VALUES (
  'Matias Moreira',
  'matias4315@gmail.com',
  '$2b$10$YourHashedPasswordHere', -- Reemplazar con el hash real
  (SELECT id FROM roles WHERE nombre = 'administrador')
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role_id = VALUES(role_id);

-- Mostrar el usuario creado
SELECT 
  u.id,
  u.nombre,
  u.email,
  r.nombre as rol,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'matias4315@gmail.com'; 