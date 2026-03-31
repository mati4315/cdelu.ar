-- ============================================
-- Migration: Create system_modules table
-- Run this once in your MySQL database
-- ============================================

CREATE TABLE IF NOT EXISTS system_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default modules (all enabled by default)
INSERT IGNORE INTO system_modules (module_name, display_name, description, enabled) VALUES
  ('ads',        'Publicidad',     'Banners y anuncios publicitarios en el sitio', TRUE),
  ('lotteries',  'Sorteos',        'Sistema de sorteos y venta de tickets',        TRUE),
  ('surveys',    'Encuestas',      'Modulo de encuestas y votaciones',             TRUE),
  ('facebook',   'Facebook',       'Widget y login con Facebook',                  TRUE),
  ('community',  'Comunidad',      'Feed y publicaciones de la comunidad',         TRUE);
