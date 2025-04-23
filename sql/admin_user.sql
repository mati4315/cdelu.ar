-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS cdelu;

-- Usar la base de datos
USE cdelu;

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

-- Insertar o actualizar el usuario administrador
INSERT INTO users (nombre, email, password, role_id)
VALUES (
  'Matias Moreira',
  'matias4315@gmail.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Contraseña: 35115415
  (SELECT id FROM roles WHERE nombre = 'administrador')
)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role_id = VALUES(role_id); 