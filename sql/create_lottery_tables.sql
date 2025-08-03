-- Sistema de Lotería - Tablas de Base de Datos
-- Soporte para loterías gratuitas y de pago

-- Tabla principal de loterías
CREATE TABLE IF NOT EXISTS `lotteries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'Título de la lotería',
  `description` text COMMENT 'Descripción detallada',
  `image_url` varchar(500) DEFAULT NULL COMMENT 'URL de la imagen de la lotería',
  `is_free` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0: Pago, 1: Gratuita',
  `ticket_price` decimal(10,2) DEFAULT 0.00 COMMENT 'Precio por ticket (0 para gratuitas)',
  `min_tickets` int(11) NOT NULL DEFAULT 1 COMMENT 'Número mínimo de tickets para iniciar',
  `max_tickets` int(11) NOT NULL COMMENT 'Número máximo de tickets disponibles',
  `num_winners` int(11) NOT NULL DEFAULT 1 COMMENT 'Número de ganadores',
  `start_date` datetime NOT NULL COMMENT 'Fecha y hora de inicio',
  `end_date` datetime NOT NULL COMMENT 'Fecha y hora de finalización',
  `status` enum('draft','active','closed','finished','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'Estado de la lotería',
  `created_by` int(11) NOT NULL COMMENT 'ID del administrador que creó la lotería',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `winner_selected_at` datetime DEFAULT NULL COMMENT 'Fecha cuando se seleccionaron los ganadores',
  `prize_description` text COMMENT 'Descripción del premio',
  `terms_conditions` text COMMENT 'Términos y condiciones',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_dates` (`start_date`, `end_date`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla principal de loterías';

-- Tabla de tickets de lotería
CREATE TABLE IF NOT EXISTS `lottery_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL COMMENT 'ID de la lotería',
  `user_id` int(11) NOT NULL COMMENT 'ID del usuario',
  `ticket_number` int(11) NOT NULL COMMENT 'Número del ticket',
  `purchase_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de compra',
  `payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending' COMMENT 'Estado del pago',
  `payment_amount` decimal(10,2) DEFAULT 0.00 COMMENT 'Monto pagado',
  `payment_method` varchar(50) DEFAULT NULL COMMENT 'Método de pago',
  `transaction_id` varchar(255) DEFAULT NULL COMMENT 'ID de transacción externa',
  `is_winner` tinyint(1) DEFAULT 0 COMMENT '0: No ganador, 1: Ganador',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_ticket` (`lottery_id`, `ticket_number`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_is_winner` (`is_winner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tickets de lotería';

-- Tabla de números reservados temporalmente
CREATE TABLE IF NOT EXISTS `lottery_reserved_numbers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL COMMENT 'ID de la lotería',
  `ticket_number` int(11) NOT NULL COMMENT 'Número de ticket reservado',
  `user_id` int(11) NOT NULL COMMENT 'ID del usuario que reservó',
  `reserved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de reserva',
  `expires_at` timestamp NOT NULL COMMENT 'Fecha de expiración de la reserva',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_number` (`lottery_id`, `ticket_number`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Números reservados temporalmente';

-- Tabla de ganadores
CREATE TABLE IF NOT EXISTS `lottery_winners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL COMMENT 'ID de la lotería',
  `ticket_id` int(11) NOT NULL COMMENT 'ID del ticket ganador',
  `user_id` int(11) NOT NULL COMMENT 'ID del usuario ganador',
  `ticket_number` int(11) NOT NULL COMMENT 'Número del ticket ganador',
  `prize_description` text COMMENT 'Descripción del premio ganado',
  `notified_at` datetime DEFAULT NULL COMMENT 'Fecha de notificación al ganador',
  `claimed_at` datetime DEFAULT NULL COMMENT 'Fecha de reclamación del premio',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_winner` (`lottery_id`, `ticket_id`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ganadores de loterías';

-- Tabla de configuración de loterías
CREATE TABLE IF NOT EXISTS `lottery_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL COMMENT 'Clave de configuración',
  `setting_value` text COMMENT 'Valor de configuración',
  `description` varchar(255) DEFAULT NULL COMMENT 'Descripción de la configuración',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración del sistema de lotería';

-- Insertar configuraciones por defecto
INSERT INTO `lottery_settings` (`setting_key`, `setting_value`, `description`) VALUES
('reservation_timeout', '300', 'Tiempo de reserva de números en segundos (5 minutos)'),
('max_tickets_per_user', '10', 'Máximo número de tickets por usuario por lotería'),
('auto_close_enabled', '1', 'Habilitar cierre automático de loterías'),
('notification_email', 'admin@cdelu.ar', 'Email para notificaciones de lotería'),
('default_currency', 'ARS', 'Moneda por defecto para loterías de pago');

-- Índices adicionales para optimización
CREATE INDEX `idx_lottery_tickets_lottery_user` ON `lottery_tickets` (`lottery_id`, `user_id`);
CREATE INDEX `idx_lottery_tickets_status_winner` ON `lottery_tickets` (`payment_status`, `is_winner`);
CREATE INDEX `idx_lotteries_status_dates` ON `lotteries` (`status`, `start_date`, `end_date`); 