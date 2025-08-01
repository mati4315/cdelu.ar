-- =========================================
-- SISTEMA DE PUBLICIDAD - CdelU (Versión Simplificada)
-- Tabla de anuncios y triggers de sincronización
-- =========================================

USE trigamer_diario;

-- =========================================
-- TABLA DE ANUNCIOS
-- =========================================

CREATE TABLE IF NOT EXISTS ads (
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
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activo (activo),
  INDEX idx_categoria (categoria),
  INDEX idx_prioridad (prioridad)
);

-- =========================================
-- DATOS DE PRUEBA
-- =========================================

INSERT INTO ads (titulo, descripcion, image_url, enlace_destino, texto_opcional, categoria, prioridad, activo, created_by) VALUES
('Patrocinado por Trigamer', 'Descubre los mejores juegos y noticias gaming', 'https://via.placeholder.com/400x200/6366f1/ffffff?text=Trigamer+Ad', 'https://trigamer.xyz', '¡Juega y gana!', 'gaming', 1, TRUE, 1),
('Oferta Especial', 'Productos tecnológicos con descuento', 'https://via.placeholder.com/400x200/10b981/ffffff?text=Tech+Ad', 'https://techstore.com', 'Hasta 50% de descuento', 'tecnologia', 2, TRUE, 1),
('Evento Gaming', 'Torneo de videojuegos este fin de semana', 'https://via.placeholder.com/400x200/f59e0b/ffffff?text=Event+Ad', 'https://eventos.com', '¡Inscríbete gratis!', 'eventos', 1, TRUE, 1);

-- =========================================
-- VERIFICACIÓN
-- =========================================

SELECT 'SISTEMA DE PUBLICIDAD CREADO EXITOSAMENTE' as status;
SELECT COUNT(*) as total_ads FROM ads WHERE activo = TRUE; 