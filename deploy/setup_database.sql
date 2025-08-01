-- Script para configurar la base de datos en producción
-- Ejecutar en phpMyAdmin o en la consola MySQL del hosting

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS trigamer_diario;

-- Usar la base de datos
USE trigamer_diario;

-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar roles básicos
INSERT IGNORE INTO roles (nombre) VALUES 
('administrador'),
('colaborador'),
('usuario');

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Agregar columna is_active si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Insertar usuario administrador (cambiar la contraseña)
INSERT IGNORE INTO users (nombre, email, password, role_id, is_active)
VALUES (
  'Matias Moreira',
  'matias4315@gmail.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Contraseña: w35115415
  (SELECT id FROM roles WHERE nombre = 'administrador'),
  TRUE
);

-- Insertar usuario de prueba
INSERT IGNORE INTO users (nombre, email, password, role_id, is_active)
VALUES (
  'Usuario Test',
  'test@test.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Contraseña: 123456
  (SELECT id FROM roles WHERE nombre = 'usuario'),
  TRUE
);

-- Verificar usuarios creados
SELECT u.id, u.nombre, u.email, r.nombre as role, u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id;
