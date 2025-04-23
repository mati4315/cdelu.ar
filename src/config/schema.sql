-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS cdelu;

-- Usar la base de datos
USE cdelu;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Usuarios
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

-- Noticias
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  resumen TEXT,
  image_url VARCHAR(500),
  original_url VARCHAR(500),
  published_at DATETIME,
  is_oficial BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  news_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (news_id) REFERENCES news(id)
);

-- Comentarios
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  news_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (news_id) REFERENCES news(id)
);

-- Insertar roles iniciales
INSERT IGNORE INTO roles (nombre) VALUES ('administrador'), ('colaborador'), ('usuario');

-- Insertar usuario administrador
INSERT IGNORE INTO users (nombre, email, password, role_id)
VALUES (
  'Matias Moreira',
  'matias4315@gmail.com',
  '$2b$10$XKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQvXKQv', -- Contraseña: 35115415
  (SELECT id FROM roles WHERE nombre='administrador')
); 