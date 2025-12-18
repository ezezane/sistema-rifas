-- Schema for rifas database
-- Database: u809573533_todo

CREATE TABLE IF NOT EXISTS `rifas_rifas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `prize` VARCHAR(255) NOT NULL,
  `ticket_price` DECIMAL(10,2) NOT NULL,
  `total_tickets` INT NOT NULL
);

CREATE TABLE IF NOT EXISTS `rifas_boletos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rifa_id` INT NOT NULL,
  `number` INT NOT NULL,
  `status` ENUM('available', 'reserved', 'sold') DEFAULT 'available',
  `owner` VARCHAR(255) NULL,
  FOREIGN KEY (`rifa_id`) REFERENCES `rifas_rifas`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `rifas_winners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rifa_id` INT NOT NULL,
  `ticket_number` INT NOT NULL,
  `winner_name` VARCHAR(255) NOT NULL,
  `draw_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rifa_id`) REFERENCES `rifas_rifas`(`id`) ON DELETE CASCADE
);