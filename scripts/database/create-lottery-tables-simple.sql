-- Crear tabla principal de loterías
CREATE TABLE IF NOT EXISTS `lotteries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(500) DEFAULT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `ticket_price` decimal(10,2) DEFAULT 0.00,
  `min_tickets` int(11) NOT NULL DEFAULT 1,
  `max_tickets` int(11) NOT NULL,
  `num_winners` int(11) NOT NULL DEFAULT 1,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` enum('draft','active','closed','finished','cancelled') NOT NULL DEFAULT 'draft',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `winner_selected_at` datetime DEFAULT NULL,
  `prize_description` text,
  `terms_conditions` text,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_dates` (`start_date`, `end_date`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de tickets
CREATE TABLE IF NOT EXISTS `lottery_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ticket_number` int(11) NOT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `payment_amount` decimal(10,2) DEFAULT 0.00,
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `is_winner` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_ticket` (`lottery_id`, `ticket_number`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_is_winner` (`is_winner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de números reservados
CREATE TABLE IF NOT EXISTS `lottery_reserved_numbers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL,
  `ticket_number` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reserved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_number` (`lottery_id`, `ticket_number`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de ganadores
CREATE TABLE IF NOT EXISTS `lottery_winners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ticket_number` int(11) NOT NULL,
  `prize_description` text,
  `notified_at` datetime DEFAULT NULL,
  `claimed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_winner` (`lottery_id`, `ticket_id`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de configuración
CREATE TABLE IF NOT EXISTS `lottery_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones por defecto
INSERT INTO `lottery_settings` (`setting_key`, `setting_value`, `description`) VALUES
('reservation_timeout', '300', 'Tiempo de reserva de números en segundos (5 minutos)'),
('max_tickets_per_user', '10', 'Máximo número de tickets por usuario por lotería'),
('auto_close_enabled', '1', 'Habilitar cierre automático de loterías'),
('notification_email', 'admin@cdelu.ar', 'Email para notificaciones de lotería'),
('default_currency', 'ARS', 'Moneda por defecto para loterías de pago');

-- Crear índices adicionales
CREATE INDEX `idx_lottery_tickets_lottery_user` ON `lottery_tickets` (`lottery_id`, `user_id`);
CREATE INDEX `idx_lottery_tickets_status_winner` ON `lottery_tickets` (`payment_status`, `is_winner`);
CREATE INDEX `idx_lotteries_status_dates` ON `lotteries` (`status`, `start_date`, `end_date`); 