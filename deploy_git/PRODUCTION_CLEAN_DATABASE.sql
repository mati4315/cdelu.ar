-- ========================================================
-- SCRIPT DE LIMPIEZA Y CONFIGURACIÓN INICIAL - CdelU API
-- ========================================================

-- Desactivar temporalmente las claves foráneas para permitir el borrado
SET FOREIGN_KEY_CHECKS = 0;

-- 1. LIMPIEZA DE TABLAS EXISTENTES (Si existen)
DROP TABLE IF EXISTS system_modules;
DROP TABLE IF EXISTS survey_votes;
DROP TABLE IF EXISTS survey_options;
DROP TABLE IF EXISTS survey_stats;
DROP TABLE IF EXISTS surveys;
DROP TABLE IF EXISTS lottery_reserved_numbers;
DROP TABLE IF EXISTS lotteries;
DROP TABLE IF EXISTS ads;
DROP TABLE IF EXISTS com_comments;
DROP TABLE IF EXISTS com_likes;
DROP TABLE IF EXISTS com;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS content_feed;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 2. CREACIÓN DE ESTRUCTURA BÁSICA
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  resumen TEXT,
  image_url VARCHAR(500),
  image_thumbnail_url VARCHAR(500),
  original_url VARCHAR(500),
  diario VARCHAR(100),
  categoria VARCHAR(100),
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  is_oficial BOOLEAN DEFAULT 1,
  published_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE com (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  image_url VARCHAR(500),
  video_url VARCHAR(500),
  user_id INT NOT NULL,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE content_feed (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  type TINYINT NOT NULL COMMENT '1: News, 2: Community, 3: Ads',
  original_id INT NOT NULL,
  user_id INT NULL,
  user_name VARCHAR(100) NULL,
  published_at TIMESTAMP NULL,
  resumen TEXT NULL,
  original_url VARCHAR(500) NULL,
  is_oficial BOOLEAN NULL,
  video_url VARCHAR(500) NULL,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. MÓDULOS DE VALOR AGREGADO
CREATE TABLE ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  image_url VARCHAR(500),
  enlace_destino VARCHAR(500) NOT NULL,
  texto_opcional VARCHAR(255),
  categoria VARCHAR(100) DEFAULT 'general',
  prioridad INT DEFAULT 1,
  activo BOOLEAN DEFAULT TRUE,
  impresiones_maximas INT DEFAULT 0,
  impresiones_actuales INT DEFAULT 0,
  clics_count INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lotteries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_free TINYINT(1) DEFAULT 0,
  ticket_price DECIMAL(10,2) DEFAULT 0.00,
  max_tickets INT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('active', 'closed', 'finished', 'cancelled') DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
  total_votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE survey_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_id INT NOT NULL,
  option_text VARCHAR(500) NOT NULL,
  votes_count INT DEFAULT 0,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DATOS INICIALES (TU ACCESO)
INSERT INTO roles (id, nombre) VALUES (1, 'administrador'), (2, 'editor'), (3, 'usuario');

-- Tu usuario Matias (con el hash que ya tenías funcionando)
INSERT INTO users (nombre, email, password, role_id) VALUES 
('Matias', 'matias4315@gmail.com', '$2a$10$M6L5SILQiJ5wMQWL3gdjnOSPE5g0DCpxLIySYeliDK50kfQxRCJOi', 1);

-- 5. TRIGGER DE SINCRONIZACIÓN NEWS -> FEED
DELIMITER //
CREATE TRIGGER after_news_insert
AFTER INSERT ON news
FOR EACH ROW
BEGIN
    INSERT INTO content_feed (
        titulo, descripcion, image_url, type, original_id, user_id, 
        user_name, published_at, resumen, original_url, is_oficial
    ) VALUES (
        NEW.titulo, NEW.descripcion, NEW.image_url, 1, NEW.id, NEW.created_by,
        (SELECT nombre FROM users WHERE id = NEW.created_by LIMIT 1),
        COALESCE(NEW.published_at, NEW.created_at), NEW.resumen, NEW.original_url, 
        NEW.is_oficial
    );
END //

CREATE TRIGGER after_com_insert
AFTER INSERT ON com
FOR EACH ROW
BEGIN
    INSERT INTO content_feed (
        titulo, descripcion, image_url, type, original_id, user_id, 
        user_name, published_at, video_url
    ) VALUES (
        NEW.titulo, NEW.descripcion, NEW.image_url, 2, NEW.id, NEW.user_id,
        (SELECT nombre FROM users WHERE id = NEW.user_id LIMIT 1),
        NEW.created_at, NEW.video_url
    );
END //

CREATE TRIGGER after_ads_insert
AFTER INSERT ON ads
FOR EACH ROW
BEGIN
    IF NEW.activo = 1 THEN
        INSERT INTO content_feed (
            titulo, descripcion, image_url, type, original_id, published_at
        ) VALUES (
            NEW.titulo, NEW.descripcion, NEW.image_url, 3, NEW.id, NEW.created_at
        );
    END IF;
END //
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
