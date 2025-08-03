-- Sistema de Encuestas para CdelU - Script Simplificado
-- Crear tablas para el sistema de encuestas

-- Tabla principal de encuestas
CREATE TABLE IF NOT EXISTS surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Título de la encuesta',
    description TEXT COMMENT 'Descripción de la encuesta',
    question TEXT NOT NULL COMMENT 'Pregunta principal',
    status ENUM('active', 'inactive', 'completed') DEFAULT 'active' COMMENT 'Estado de la encuesta',
    is_multiple_choice BOOLEAN DEFAULT FALSE COMMENT 'Permite selección múltiple',
    max_votes_per_user INT DEFAULT 1 COMMENT 'Máximo de votos por usuario',
    created_by INT COMMENT 'ID del administrador que creó la encuesta',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración de la encuesta',
    total_votes INT DEFAULT 0 COMMENT 'Total de votos recibidos',
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla principal de encuestas';

-- Tabla de opciones de respuesta
CREATE TABLE IF NOT EXISTS survey_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    option_text VARCHAR(500) NOT NULL COMMENT 'Texto de la opción',
    votes_count INT DEFAULT 0 COMMENT 'Número de votos para esta opción',
    display_order INT DEFAULT 0 COMMENT 'Orden de visualización',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    INDEX idx_survey_id (survey_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Opciones de respuesta para las encuestas';

-- Tabla de votos de usuarios
CREATE TABLE IF NOT EXISTS survey_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    option_id INT NOT NULL,
    user_id INT NULL COMMENT 'ID del usuario (NULL para votos anónimos)',
    user_ip VARCHAR(45) NULL COMMENT 'IP del usuario para evitar votos duplicados',
    user_agent TEXT NULL COMMENT 'User agent para tracking',
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES survey_options(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_vote (survey_id, user_id, option_id),
    UNIQUE KEY unique_ip_vote (survey_id, user_ip, option_id),
    INDEX idx_survey_id (survey_id),
    INDEX idx_option_id (option_id),
    INDEX idx_user_id (user_id),
    INDEX idx_voted_at (voted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de votos de usuarios';

-- Tabla de estadísticas de encuestas (para cache/optimización)
CREATE TABLE IF NOT EXISTS survey_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    total_votes INT DEFAULT 0,
    unique_voters INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    UNIQUE KEY unique_survey_stats (survey_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Estadísticas cacheadas de encuestas';

-- Insertar encuesta de ejemplo
INSERT INTO surveys (title, description, question, status, is_multiple_choice, max_votes_per_user, created_by) 
VALUES (
    'Encuesta de Ejemplo',
    'Esta es una encuesta de ejemplo para probar el sistema',
    '¿Cuál es tu color favorito?',
    'active',
    FALSE,
    1,
    1
);

-- Insertar opciones de ejemplo
INSERT INTO survey_options (survey_id, option_text, display_order) VALUES
(1, 'Rojo', 1),
(1, 'Azul', 2),
(1, 'Verde', 3),
(1, 'Amarillo', 4);

-- Insertar algunos votos de ejemplo
INSERT INTO survey_votes (survey_id, option_id, user_ip) VALUES
(1, 1, '127.0.0.1'),
(1, 2, '127.0.0.2'),
(1, 1, '127.0.0.3'),
(1, 3, '127.0.0.4'); 