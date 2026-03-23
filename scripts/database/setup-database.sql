-- Script para crear la base de datos trigamer_diario
-- Ejecutar en MySQL/MariaDB

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS trigamer_diario
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE trigamer_diario;

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'colaborador', 'usuario') DEFAULT 'usuario',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE ROLES (para compatibilidad)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles básicos
INSERT IGNORE INTO roles (name, description) VALUES
('admin', 'Administrador completo del sistema'),
('editor', 'Editor de contenido'),
('colaborador', 'Colaborador con permisos limitados'),
('usuario', 'Usuario básico');

-- ============================================
-- TABLA DE NOTICIAS
-- ============================================
CREATE TABLE IF NOT EXISTS news (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    resumen TEXT,
    image_url VARCHAR(500),
    url VARCHAR(500),
    is_oficial BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_oficial (is_oficial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE COMUNICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS com (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    video_url VARCHAR(500),
    user_id INT(11),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE LIKES PARA NOTICIAS
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    id INT(11) NOT NULL AUTO_INCREMENT,
    news_id INT(11) NOT NULL,
    user_id INT(11) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_news (user_id, news_id),
    INDEX idx_news_id (news_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE LIKES PARA COMUNICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS com_likes (
    id INT(11) NOT NULL AUTO_INCREMENT,
    com_id INT(11) NOT NULL,
    user_id INT(11) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_com (user_id, com_id),
    INDEX idx_com_id (com_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE COMENTARIOS PARA NOTICIAS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id INT(11) NOT NULL AUTO_INCREMENT,
    news_id INT(11) NOT NULL,
    user_id INT(11) NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_news_id (news_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE COMENTARIOS PARA COMUNICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS com_comments (
    id INT(11) NOT NULL AUTO_INCREMENT,
    com_id INT(11) NOT NULL,
    user_id INT(11) NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_com_id (com_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (com_id) REFERENCES com(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE FEED UNIFICADO
-- ============================================
CREATE TABLE IF NOT EXISTS content_feed (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    resumen TEXT NULL,
    image_url VARCHAR(500) NULL,
    type TINYINT(1) NOT NULL COMMENT '1=noticia, 2=comunidad',
    original_id INT(11) NOT NULL COMMENT 'ID en tabla original (news/com)',
    user_id INT(11) NULL,
    user_name VARCHAR(100) NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Campos específicos de noticias
    original_url VARCHAR(500) NULL,
    is_oficial BOOLEAN DEFAULT FALSE,
    -- Campos específicos de comunidad
    video_url VARCHAR(500) NULL,
    -- Contadores (se actualizan automáticamente)
    likes_count INT(11) DEFAULT 0,
    comments_count INT(11) DEFAULT 0,
    PRIMARY KEY (id),
    -- Índices para optimización
    INDEX idx_type (type),
    INDEX idx_original_id (original_id),
    INDEX idx_type_original (type, original_id),
    INDEX idx_published_at (published_at),
    INDEX idx_user_id (user_id),
    -- Índice único para evitar duplicados
    UNIQUE KEY unique_type_original (type, original_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE LIKES UNIFICADOS
-- ============================================
CREATE TABLE IF NOT EXISTS content_likes (
    id INT(11) NOT NULL AUTO_INCREMENT,
    content_id INT(11) NOT NULL COMMENT 'ID del contenido en content_feed',
    user_id INT(11) NOT NULL COMMENT 'ID del usuario que dio like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Índices para optimizar consultas
    INDEX idx_content_id (content_id),
    INDEX idx_user_id (user_id),
    INDEX idx_content_user (content_id, user_id),
    -- Restricción única para evitar likes duplicados
    UNIQUE KEY unique_user_content (user_id, content_id),
    -- Claves foráneas
    FOREIGN KEY (content_id) REFERENCES content_feed(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE COMENTARIOS UNIFICADOS
-- ============================================
CREATE TABLE IF NOT EXISTS content_comments (
    id INT(11) NOT NULL AUTO_INCREMENT,
    content_id INT(11) NOT NULL COMMENT 'ID del contenido en content_feed',
    user_id INT(11) NOT NULL COMMENT 'ID del usuario que comentó',
    contenido TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Índices
    INDEX idx_content_id (content_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    -- Claves foráneas
    FOREIGN KEY (content_id) REFERENCES content_feed(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar usuario administrador por defecto
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Administrador', 'admin@cdelu.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Editor', 'editor@cdelu.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'editor'),
('Test User', 'test@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario');

-- Insertar algunas noticias de ejemplo
INSERT IGNORE INTO news (titulo, descripcion, resumen, image_url, url, is_oficial) VALUES
('Pymes entrerrianas convocadas para exposición rural 2025', 'El Ministerio de Desarrollo Económico de Entre Ríos convoca a pymes de la provincia para participar en la exposición rural 2025. Esta iniciativa busca promover el desarrollo económico local y fortalecer la presencia de empresas entrerrianas en eventos de relevancia nacional.', 'Convocatoria para pymes entrerrianas en exposición rural 2025', 'https://example.com/image1.jpg', 'https://forms.comunicacionentrerios.com', TRUE),
('Nueva tecnología para el campo entrerriano', 'Se presentó una nueva tecnología que revolucionará la agricultura en Entre Ríos. Esta innovación permitirá aumentar la productividad y reducir costos para los productores locales.', 'Innovación tecnológica para agricultura entrerriana', 'https://example.com/image2.jpg', 'https://example.com/noticia2', FALSE),
('Evento cultural en Paraná', 'Gran evento cultural se realizará en la capital entrerriana. Música, arte y gastronomía local se darán cita en un festival que promete ser inolvidable.', 'Festival cultural en Paraná', 'https://example.com/image3.jpg', 'https://example.com/noticia3', FALSE);

-- Insertar algunas comunicaciones de ejemplo
INSERT IGNORE INTO com (titulo, descripcion, video_url, user_id) VALUES
('Comunicado importante sobre el sistema', 'Este es un comunicado importante sobre las nuevas funcionalidades del sistema de noticias.', 'https://example.com/video1.mp4', 1),
('Actualización de servicios', 'Informamos sobre las próximas actualizaciones en nuestros servicios digitales.', 'https://example.com/video2.mp4', 2);

-- Migrar datos existentes al feed unificado
INSERT IGNORE INTO content_feed (titulo, descripcion, resumen, image_url, type, original_id, published_at, original_url, is_oficial)
SELECT titulo, descripcion, resumen, image_url, 1 as type, id as original_id, created_at as published_at, url as original_url, is_oficial
FROM news;

INSERT IGNORE INTO content_feed (titulo, descripcion, type, original_id, published_at, video_url, user_id, user_name)
SELECT titulo, descripcion, 2 as type, id as original_id, created_at as published_at, video_url, user_id, 
       (SELECT name FROM users WHERE users.id = com.user_id) as user_name
FROM com;

-- Mostrar estadísticas
SELECT 'Base de datos creada exitosamente' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_news FROM news;
SELECT COUNT(*) as total_com FROM com;
SELECT COUNT(*) as total_feed_items FROM content_feed; 