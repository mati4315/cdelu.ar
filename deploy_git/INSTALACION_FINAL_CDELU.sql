-- ========================================================
-- INSTALACIÓN FINAL CDELU - SISTEMA SINCRONIZADO
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. LIMPIEZA TOTAL
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
DROP TABLE IF EXISTS content_feed;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 2. ROLES Y USUARIOS
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  profile_picture_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (id, nombre) VALUES (1, 'administrador'), (2, 'editor'), (3, 'usuario');

-- Tu usuario Matias (Contraseña: @35115415)
INSERT INTO users (nombre, email, password, role_id) VALUES 
('Matias Moreira', 'matias4315@gmail.com', '$2a$10$wJk7PEyn0i6QErAnm.h8TiGH2K/fJhSz89TZsvZUxV.iAEEJdh', 1);

-- 3. NOTICIAS Y FEED
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
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. OTROS MÓDULOS
CREATE TABLE ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  image_url VARCHAR(500),
  enlace_destino VARCHAR(500) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE system_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO system_modules (name, is_enabled) VALUES 
('ads', 1), ('lotteries', 1), ('surveys', 1), ('facebook', 1), ('community', 1);

-- 5. TRIGGERS NEWS -> FEED
DELIMITER //
CREATE TRIGGER after_news_insert_final
AFTER INSERT ON news
FOR EACH ROW
BEGIN
    INSERT INTO content_feed (titulo, descripcion, image_url, type, original_id, user_id, user_name, published_at, resumen, original_url, is_oficial)
    VALUES (NEW.titulo, NEW.descripcion, NEW.image_url, 1, NEW.id, NEW.created_by, (SELECT nombre FROM users WHERE id = NEW.created_by LIMIT 1), COALESCE(NEW.published_at, NEW.created_at), NEW.resumen, NEW.original_url, NEW.is_oficial);
END //
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
