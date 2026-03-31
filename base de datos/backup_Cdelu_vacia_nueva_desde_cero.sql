-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: trigamer_diario
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_settings`
--

DROP TABLE IF EXISTS `admin_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_settings` (
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_settings`
--

LOCK TABLES `admin_settings` WRITE;
/*!40000 ALTER TABLE `admin_settings` DISABLE KEYS */;
INSERT INTO `admin_settings` VALUES ('auto_backup_enabled','true','2026-03-30 12:35:28'),('last_backup_time','2026-03-30T14:04:20.717Z','2026-03-30 14:04:20'),('video_settings','{\"isVideoEnabled\":false,\"modifiedBy\":\"Matias Moreiraa\",\"lastModified\":\"2026-03-23T01:43:31.065Z\"}','2026-03-23 11:43:31');
/*!40000 ALTER TABLE `admin_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ads`
--

DROP TABLE IF EXISTS `ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `enlace_destino` varchar(500) NOT NULL,
  `texto_opcional` varchar(255) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT 'general',
  `prioridad` int(11) DEFAULT 1,
  `activo` tinyint(1) DEFAULT 1,
  `impresiones_maximas` int(11) DEFAULT 0,
  `impresiones_actuales` int(11) DEFAULT 0,
  `clics_count` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `ads_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ads`
--

LOCK TABLES `ads` WRITE;
/*!40000 ALTER TABLE `ads` DISABLE KEYS */;
/*!40000 ALTER TABLE `ads` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_ads_insert
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `com`
--

DROP TABLE IF EXISTS `com`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `com` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `com_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `com`
--

LOCK TABLES `com` WRITE;
/*!40000 ALTER TABLE `com` DISABLE KEYS */;
/*!40000 ALTER TABLE `com` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_com_insert
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `content_comments`
--

DROP TABLE IF EXISTS `content_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_id` int(11) NOT NULL COMMENT 'ID del contenido en content_feed',
  `user_id` int(11) NOT NULL COMMENT 'ID del usuario que comentó',
  `contenido` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_content_id` (`content_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_comments`
--

LOCK TABLES `content_comments` WRITE;
/*!40000 ALTER TABLE `content_comments` DISABLE KEYS */;
INSERT INTO `content_comments` VALUES (1,74,5,'G g r cfv ddd   ','2025-05-30 23:59:45','2026-03-20 11:38:53'),(2,90,5,'Ejebe eeeber','2025-06-01 02:56:45','2026-03-20 11:38:53'),(3,1180,6,'sdasdsad','2025-07-24 11:16:52','2026-03-20 11:38:53'),(4,74,5,'G g r cfv ddd   ','2025-05-30 23:59:45','2026-03-20 11:39:37'),(5,90,5,'Ejebe eeeber','2025-06-01 02:56:45','2026-03-20 11:39:37'),(6,1180,6,'sdasdsad','2025-07-24 11:16:52','2026-03-20 11:39:37');
/*!40000 ALTER TABLE `content_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_feed`
--

DROP TABLE IF EXISTS `content_feed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_feed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `type` tinyint(4) NOT NULL COMMENT '1: News, 2: Community, 3: Ads',
  `original_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `resumen` text DEFAULT NULL,
  `original_url` varchar(500) DEFAULT NULL,
  `is_oficial` tinyint(1) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_published_at` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_feed`
--

LOCK TABLES `content_feed` WRITE;
/*!40000 ALTER TABLE `content_feed` DISABLE KEYS */;
/*!40000 ALTER TABLE `content_feed` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_likes`
--

DROP TABLE IF EXISTS `content_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_id` int(11) NOT NULL COMMENT 'ID del contenido en content_feed',
  `user_id` int(11) NOT NULL COMMENT 'ID del usuario que dio like',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_content` (`user_id`,`content_id`),
  KEY `idx_content_id` (`content_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_content_user` (`content_id`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_likes`
--

LOCK TABLES `content_likes` WRITE;
/*!40000 ALTER TABLE `content_likes` DISABLE KEYS */;
INSERT INTO `content_likes` VALUES (1,1,5,'2025-05-31 00:15:07','2026-03-20 11:38:53'),(2,2,1,'2025-05-28 15:19:54','2026-03-20 11:38:53'),(3,2,5,'2025-05-31 00:15:05','2026-03-20 11:38:53'),(4,6,5,'2025-05-31 00:15:12','2026-03-20 11:38:53'),(5,8,5,'2025-05-31 00:15:17','2026-03-20 11:38:53'),(6,12,1,'2025-05-28 21:22:32','2026-03-20 11:38:53'),(7,13,1,'2025-05-28 21:22:39','2026-03-20 11:38:53'),(8,21,5,'2025-05-31 03:13:22','2026-03-20 11:38:53'),(9,27,5,'2025-05-31 00:15:21','2026-03-20 11:38:53'),(10,37,5,'2025-05-30 23:54:23','2026-03-20 11:38:53'),(11,39,5,'2025-05-31 00:15:28','2026-03-20 11:38:53'),(12,44,5,'2025-05-31 00:15:44','2026-03-20 11:38:53'),(13,46,5,'2025-05-31 00:15:40','2026-03-20 11:38:53'),(14,48,5,'2025-05-30 18:41:04','2026-03-20 11:38:53'),(15,53,5,'2025-05-30 18:38:20','2026-03-20 11:38:53'),(16,54,5,'2025-05-30 18:38:12','2026-03-20 11:38:53'),(17,55,5,'2025-05-31 03:24:36','2026-03-20 11:38:53'),(18,56,5,'2025-05-30 18:37:35','2026-03-20 11:38:53'),(19,58,5,'2025-05-30 18:39:26','2026-03-20 11:38:53'),(20,63,5,'2025-05-30 18:37:26','2026-03-20 11:38:53'),(21,64,5,'2025-05-31 03:12:28','2026-03-20 11:38:53'),(22,71,5,'2025-05-30 23:56:18','2026-03-20 11:38:53'),(23,73,5,'2025-05-31 06:20:03','2026-03-20 11:38:53'),(24,74,5,'2025-05-31 00:00:07','2026-03-20 11:38:53'),(25,76,5,'2025-05-31 03:21:25','2026-03-20 11:38:53'),(26,77,5,'2025-06-01 03:01:34','2026-03-20 11:38:53'),(27,79,5,'2025-06-01 10:39:36','2026-03-20 11:38:53'),(28,81,5,'2025-06-01 03:01:18','2026-03-20 11:38:53'),(29,95,5,'2025-06-01 22:19:36','2026-03-20 11:38:53'),(30,96,5,'2025-06-01 22:19:33','2026-03-20 11:38:53'),(31,97,5,'2025-06-01 22:19:32','2026-03-20 11:38:53'),(32,98,5,'2025-06-01 22:19:29','2026-03-20 11:38:53'),(33,99,5,'2025-06-01 22:19:28','2026-03-20 11:38:53'),(34,851,1,'2025-07-09 09:23:05','2026-03-20 11:38:53'),(35,879,1,'2025-07-09 09:23:31','2026-03-20 11:38:53'),(36,1180,6,'2025-07-24 11:16:37','2026-03-20 11:38:53'),(37,1180,1,'2025-07-27 01:50:52','2026-03-20 11:38:53'),(38,1189,1,'2025-07-27 10:59:38','2026-03-20 11:38:53'),(64,66,5,'2025-05-30 23:50:59','2026-03-20 11:38:53'),(65,75,5,'2025-05-31 06:19:57','2026-03-20 11:38:53'),(66,91,5,'2025-06-01 17:00:56','2026-03-20 11:38:53'),(67,100,5,'2025-06-01 22:19:24','2026-03-20 11:38:53');
/*!40000 ALTER TABLE `content_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotteries`
--

DROP TABLE IF EXISTS `lotteries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lotteries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_free` tinyint(1) DEFAULT 0,
  `ticket_price` decimal(10,2) DEFAULT 0.00,
  `max_tickets` int(11) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` enum('active','closed','finished','cancelled') DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `lotteries_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotteries`
--

LOCK TABLES `lotteries` WRITE;
/*!40000 ALTER TABLE `lotteries` DISABLE KEYS */;
/*!40000 ALTER TABLE `lotteries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lottery_settings`
--

DROP TABLE IF EXISTS `lottery_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lottery_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL COMMENT 'Clave de configuración',
  `setting_value` text DEFAULT NULL COMMENT 'Valor de configuración',
  `description` varchar(255) DEFAULT NULL COMMENT 'Descripción de la configuración',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración del sistema de lotería';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lottery_settings`
--

LOCK TABLES `lottery_settings` WRITE;
/*!40000 ALTER TABLE `lottery_settings` DISABLE KEYS */;
INSERT INTO `lottery_settings` VALUES (1,'reservation_timeout','300','Tiempo de reserva de números en segundos (5 minutos)','2026-03-20 22:51:41','2026-03-20 22:51:41'),(2,'max_tickets_per_user','10','Máximo número de tickets por usuario por lotería','2026-03-20 22:51:41','2026-03-20 22:51:41'),(3,'auto_close_enabled','1','Habilitar cierre automático de loterías','2026-03-20 22:51:41','2026-03-20 22:51:41'),(4,'notification_email','admin@cdelu.ar','Email para notificaciones de lotería','2026-03-20 22:51:41','2026-03-20 22:51:41'),(5,'default_currency','ARS','Moneda por defecto para loterías de pago','2026-03-20 22:51:41','2026-03-20 22:51:41');
/*!40000 ALTER TABLE `lottery_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lottery_tickets`
--

DROP TABLE IF EXISTS `lottery_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lottery_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL COMMENT 'ID de la lotería',
  `user_id` int(11) NOT NULL COMMENT 'ID del usuario',
  `ticket_number` int(11) NOT NULL COMMENT 'Número del ticket',
  `purchase_date` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de compra',
  `payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending' COMMENT 'Estado del pago',
  `payment_amount` decimal(10,2) DEFAULT 0.00 COMMENT 'Monto pagado',
  `payment_method` varchar(50) DEFAULT NULL COMMENT 'Método de pago',
  `transaction_id` varchar(255) DEFAULT NULL COMMENT 'ID de transacción externa',
  `is_winner` tinyint(1) DEFAULT 0 COMMENT '0: No ganador, 1: Ganador',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_ticket` (`lottery_id`,`ticket_number`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_is_winner` (`is_winner`),
  KEY `idx_lottery_tickets_lottery_user` (`lottery_id`,`user_id`),
  KEY `idx_lottery_tickets_status_winner` (`payment_status`,`is_winner`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tickets de lotería';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lottery_tickets`
--

LOCK TABLES `lottery_tickets` WRITE;
/*!40000 ALTER TABLE `lottery_tickets` DISABLE KEYS */;
INSERT INTO `lottery_tickets` VALUES (1,7,1,33,'2026-03-24 04:42:29','paid',0.00,'free',NULL,1,'2026-03-24 04:42:29'),(2,6,1,61,'2026-03-24 10:01:24','paid',0.00,'free',NULL,0,'2026-03-24 10:01:24'),(3,6,1,6,'2026-03-24 10:01:24','paid',0.00,'free',NULL,0,'2026-03-24 10:01:24');
/*!40000 ALTER TABLE `lottery_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lottery_winners`
--

DROP TABLE IF EXISTS `lottery_winners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lottery_winners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lottery_id` int(11) NOT NULL COMMENT 'ID de la lotería',
  `ticket_id` int(11) NOT NULL COMMENT 'ID del ticket ganador',
  `user_id` int(11) NOT NULL COMMENT 'ID del usuario ganador',
  `ticket_number` int(11) NOT NULL COMMENT 'Número del ticket ganador',
  `prize_description` text DEFAULT NULL COMMENT 'Descripción del premio ganado',
  `notified_at` datetime DEFAULT NULL COMMENT 'Fecha de notificación al ganador',
  `claimed_at` datetime DEFAULT NULL COMMENT 'Fecha de reclamación del premio',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lottery_winner` (`lottery_id`,`ticket_id`),
  KEY `idx_lottery_id` (`lottery_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ganadores de loterías';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lottery_winners`
--

LOCK TABLES `lottery_winners` WRITE;
/*!40000 ALTER TABLE `lottery_winners` DISABLE KEYS */;
INSERT INTO `lottery_winners` VALUES (1,7,1,1,33,'te ganas la 8',NULL,NULL,'2026-03-24 05:08:36');
/*!40000 ALTER TABLE `lottery_winners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `resumen` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `image_thumbnail_url` varchar(500) DEFAULT NULL,
  `original_url` varchar(500) DEFAULT NULL,
  `diario` varchar(100) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `is_oficial` tinyint(1) DEFAULT 1,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `news_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER after_news_insert
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'administrador','2026-03-31 01:14:19','2026-03-31 01:14:19'),(2,'editor','2026-03-31 01:14:19','2026-03-31 01:14:19'),(3,'usuario','2026-03-31 01:14:19','2026-03-31 01:14:19');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_options`
--

DROP TABLE IF EXISTS `survey_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_id` int(11) NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `votes_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `survey_id` (`survey_id`),
  CONSTRAINT `survey_options_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_options`
--

LOCK TABLES `survey_options` WRITE;
/*!40000 ALTER TABLE `survey_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `surveys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `question` text NOT NULL,
  `status` enum('active','inactive','completed') DEFAULT 'active',
  `total_votes` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveys`
--

LOCK TABLES `surveys` WRITE;
/*!40000 ALTER TABLE `surveys` DISABLE KEYS */;
/*!40000 ALTER TABLE `surveys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_follows`
--

DROP TABLE IF EXISTS `user_follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_follows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `follower_id` int(11) NOT NULL COMMENT 'Usuario que sigue',
  `following_id` int(11) NOT NULL COMMENT 'Usuario seguido',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  KEY `idx_follower` (`follower_id`),
  KEY `idx_following` (`following_id`),
  CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_follows`
--

LOCK TABLES `user_follows` WRITE;
/*!40000 ALTER TABLE `user_follows` DISABLE KEYS */;
INSERT INTO `user_follows` VALUES (1,1,11,'2026-03-24 11:45:53');
/*!40000 ALTER TABLE `user_follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Matias','matias4315@gmail.com','$2a$10$M6L5SILQiJ5wMQWL3gdjnOSPE5g0DCpxLIySYeliDK50kfQxRCJOi',1,'2026-03-31 01:14:19','2026-03-31 01:14:19');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'trigamer_diario'
--

--
-- Dumping routines for database 'trigamer_diario'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-31  2:16:00
