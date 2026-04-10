-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: queuesys
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `adminactions`
--

DROP TABLE IF EXISTS `adminactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adminactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` bigint unsigned DEFAULT NULL,
  `user_id_target` bigint unsigned DEFAULT NULL,
  `action_taken` enum('ban','unban','modify','delete') DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `user_id_target` (`user_id_target`),
  CONSTRAINT `adminactions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`),
  CONSTRAINT `adminactions_ibfk_2` FOREIGN KEY (`user_id_target`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adminactions`
--

LOCK TABLES `adminactions` WRITE;
/*!40000 ALTER TABLE `adminactions` DISABLE KEYS */;
INSERT INTO `adminactions` (id, admin_id, user_id_target, action_taken, created) VALUES
(1, 1, 4, 'delete', '2024-01-01 10:00:00'),
(2, 1, 5, 'modify', '2024-01-02 11:00:00');
/*!40000 ALTER TABLE `adminactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `history`
--

DROP TABLE IF EXISTS `history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `service_id` bigint unsigned NOT NULL,
  `Outcome` enum('served','left') NOT NULL,
  `Date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `history_user_id_index` (`user_id`),
  KEY `history_service_id_index` (`service_id`),
  CONSTRAINT `history_user_fk`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `history_service_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history`
--

LOCK TABLES `history` WRITE;
/*!40000 ALTER TABLE `history` DISABLE KEYS */;
  INSERT INTO `history` (id, user_id, service_id, outcome, date) VALUES
  (1, 3, 2, 'served', '2026-02-10 10:30:00'),
  (2, 4, 1, 'served', '2026-02-12 11:15:00'),
  (3, 2, 2, 'left',   '2026-03-01 14:00:00'),
  (4, 5, 4, 'served', '2026-03-15 09:10:00');
/*!40000 ALTER TABLE `history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `queue_entry_id` bigint unsigned NULL,
  `Message` varchar(255) NOT NULL,
  `Type` enum('joined','almost_ready','served','left','system') NOT NULL,
  `Is Read` tinyint(1) NOT NULL DEFAULT 0,
  `Created/Sent` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_index` (`user_id`),
  KEY `notifications_queue_entry_id_index` (`queue_entry_id`),
  CONSTRAINT `notifications_user_fk`  FOREIGN KEY (`user_id`)        REFERENCES `users`(`id`)        ON DELETE CASCADE,
  CONSTRAINT `notifications_queue_fk` FOREIGN KEY (`queue_entry_id`) REFERENCES `queueentries`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
  INSERT INTO `notifications` (id, user_id, queue_entry_id, `Message`, `Type`, `Is Read`, `Created/Sent`) VALUES
  (1,  2, 1,  'You joined the Tech Support queue. Position: 1. Estimated wait: 15 min.',  'joined',       0, '2026-04-10 09:00:00'),
  (2,  3, 2,  'You joined the Tech Support queue. Position: 2. Estimated wait: 30 min.',  'joined',       0, '2026-04-10 09:05:00'),
  (3,  4, 3,  'You joined the Tech Support queue. Position: 3. Estimated wait: 45 min.',  'joined',       0, '2026-04-10 09:10:00'),
  (4,  5, 4,  'You joined the Financial Aid queue. Position: 1. Estimated wait: 20 min.', 'joined',       0, '2026-04-10 09:15:00'),
  (5,  6, 5,  'You joined the Financial Aid queue. Position: 2. Estimated wait: 40 min.', 'joined',       0, '2026-04-10 09:20:00'),
  (6,  2, 6,  'You joined the Registration queue. Position: 1. Estimated wait: 10 min.',  'joined',       0, '2026-04-10 09:25:00'),
  (7,  2, 1,  'You are almost ready to be served at Tech Support!',                       'almost_ready', 0, '2026-04-10 09:10:00'),
  (8,  3, 7,  'You have been served. Thank you for using QueueSmart!',                    'served',       1, '2026-02-10 10:30:00'),
  (9,  4, 8,  'You have been served. Thank you for using QueueSmart!',                    'served',       1, '2026-02-12 11:15:00'),
  (10, 5, 10, 'You have been served. Thank you for using QueueSmart!',                    'served',       1, '2026-03-15 09:10:00'),
  (11, 2, 9,  'You left the Advising queue.',                                             'left',         1, '2026-03-01 14:00:00');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queueentries`
--

DROP TABLE IF EXISTS `queueentries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queueentries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `service_id` bigint unsigned DEFAULT NULL,
  `position` int DEFAULT NULL,
  `estimated_wait` int DEFAULT NULL,
  `status` enum('waiting','served','canceled') DEFAULT NULL,
  `time_joined` datetime DEFAULT NULL,
  `time_served` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `queueentries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `queueentries_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queueentries`
--

LOCK TABLES `queueentries` WRITE;
/*!40000 ALTER TABLE `queueentries` DISABLE KEYS */;
INSERT INTO `queueentries` (id, user_id, service_id, position, estimated_wait, status, time_joined, time_served) VALUES
  (1,  2, 1, 1, 15, 'waiting',  '2026-04-10 09:00:00', NULL),
  (2,  3, 1, 2, 30, 'waiting',  '2026-04-10 09:05:00', NULL),
  (3,  4, 1, 3, 45, 'waiting',  '2026-04-10 09:10:00', NULL),
  (4,  5, 3, 1, 20, 'waiting',  '2026-04-10 09:15:00', NULL),
  (5,  6, 3, 2, 40, 'waiting',  '2026-04-10 09:20:00', NULL),
  (6,  2, 4, 1, 10, 'waiting',  '2026-04-10 09:25:00', NULL),
  (7,  3, 2, 1, 30, 'served',   '2026-02-10 10:00:00', '2026-02-10 10:30:00'),
  (8,  4, 1, 1, 15, 'served',   '2026-02-12 11:00:00', '2026-02-12 11:15:00'),
  (9,  2, 2, 1, 30, 'canceled', '2026-03-01 14:00:00', NULL),
  (10, 5, 4, 1, 10, 'served',   '2026-03-15 09:00:00', '2026-03-15 09:10:00');
/*!40000 ALTER TABLE `queueentries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) NOT NULL,
  `expected_duration` int NOT NULL CHECK (expected_duration > 0),
  `priority` ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  `is_open` tinyint(1) NOT NULL DEFAULT 1,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `services_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
  INSERT INTO `services` (id, name, description, expected_duration, priority, is_open, created) VALUES
  (1, 'Tech Support',  'Fix device and software issues',          15, 'high',   1, '2026-01-01 08:00:00'),
  (2, 'Advising',      'Academic advising and student help',      30, 'medium', 0, '2026-01-01 08:00:00'),
  (3, 'Financial Aid', 'Scholarships and account questions',      20, 'low',    1, '2026-01-01 08:00:00'),
  (4, 'Registration',  'Course registration and enrollment help', 10, 'high',   1, '2026-01-01 08:00:00');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
 `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (id, name, email, password, role, created) VALUES
  (1, 'Admin User',    'admin@queuesmart.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '2026-01-01 08:00:00'),
  (2, 'Test User',     'testuser@gmail.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LjOAt5Hwk7S', 'user',  '2026-01-02 09:00:00'),
  (3, 'Alice Johnson', 'alice@gmail.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LjOAt5Hwk7S', 'user',  '2026-01-03 10:00:00'),
  (4, 'Bob Smith',     'bob@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LjOAt5Hwk7S', 'user',  '2026-01-04 11:00:00'),
  (5, 'Charlie Brown', 'charlie@gmail.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LjOAt5Hwk7S', 'user',  '2026-01-05 12:00:00'),
  (6, 'Diana Prince',  'diana@gmail.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LjOAt5Hwk7S', 'user',  '2026-01-06 13:00:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-09 15:08:27
