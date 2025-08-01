-- 🎯 Completar Sistema de Feed Unificado
-- Solo las tablas faltantes, sin triggers complicados

USE trigamer_diario;

-- ============================================
-- 1. TABLA CONTENT_LIKES (la que falta)
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
    UNIQUE KEY unique_user_content (user_id, content_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. TABLA CONTENT_COMMENTS (la que falta)
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
    INDEX idx_created_at (created_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. MIGRAR LIKES EXISTENTES
-- ============================================

-- Migrar likes de noticias a content_likes
INSERT IGNORE INTO content_likes (content_id, user_id, created_at)
SELECT cf.id, l.user_id, l.created_at
FROM likes l
JOIN content_feed cf ON cf.type = 1 AND cf.original_id = l.news_id;

-- Migrar likes de comunidad a content_likes
INSERT IGNORE INTO content_likes (content_id, user_id, created_at)
SELECT cf.id, cl.user_id, cl.created_at
FROM com_likes cl
JOIN content_feed cf ON cf.type = 2 AND cf.original_id = cl.com_id;

-- ============================================
-- 4. MIGRAR COMENTARIOS EXISTENTES
-- ============================================

-- Migrar comentarios de noticias a content_comments
INSERT IGNORE INTO content_comments (content_id, user_id, contenido, created_at)
SELECT cf.id, c.user_id, c.content, c.created_at
FROM comments c
JOIN content_feed cf ON cf.type = 1 AND cf.original_id = c.news_id;

-- Migrar comentarios de comunidad a content_comments
INSERT IGNORE INTO content_comments (content_id, user_id, contenido, created_at)
SELECT cf.id, cc.user_id, cc.content, cc.created_at
FROM com_comments cc
JOIN content_feed cf ON cf.type = 2 AND cf.original_id = cc.com_id;

-- ============================================
-- 5. ACTUALIZAR CONTADORES EN CONTENT_FEED
-- ============================================

-- Actualizar likes_count
UPDATE content_feed cf SET likes_count = (
    SELECT COUNT(*) FROM content_likes cl WHERE cl.content_id = cf.id
);

-- Actualizar comments_count
UPDATE content_feed cf SET comments_count = (
    SELECT COUNT(*) FROM content_comments cc WHERE cc.content_id = cf.id
);

-- ============================================
-- 6. VERIFICACIÓN FINAL
-- ============================================

-- Ver estadísticas finales
SELECT 
    'content_feed' as tabla,
    COUNT(*) as registros,
    COUNT(CASE WHEN type = 1 THEN 1 END) as noticias,
    COUNT(CASE WHEN type = 2 THEN 1 END) as comunidad,
    SUM(likes_count) as total_likes,
    SUM(comments_count) as total_comments
FROM content_feed

UNION ALL

SELECT 
    'content_likes' as tabla,
    COUNT(*) as registros,
    NULL as noticias,
    NULL as comunidad,
    COUNT(*) as total_likes,
    NULL as total_comments
FROM content_likes

UNION ALL

SELECT 
    'content_comments' as tabla,
    COUNT(*) as registros,
    NULL as noticias,
    NULL as comunidad,
    NULL as total_likes,
    COUNT(*) as total_comments
FROM content_comments; 