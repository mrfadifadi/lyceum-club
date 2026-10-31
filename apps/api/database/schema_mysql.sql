-- Lyceum Club MySQL Schema

CREATE DATABASE IF NOT EXISTS `lyceum` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lyceum`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `created_by` BIGINT UNSIGNED NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'member',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `photo_url` TEXT NULL,
    `major` VARCHAR(200) NULL,
    `confirmation_code_hash` VARCHAR(64) NULL,
    `confirmation_code_expires_at` TIMESTAMP NULL,
    `confirmation_attempts` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `membership_applications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NOT NULL,
    `university` VARCHAR(200) NOT NULL,
    `major` VARCHAR(200) NOT NULL,
    `academic_year` VARCHAR(30) NOT NULL,
    `motivation` TEXT NOT NULL,
    `skills_interests` TEXT NULL,
    `cv_path` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `hr_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `hr_rejection_reason` TEXT NULL,
    `hr_reviewed_by` BIGINT UNSIGNED NULL,
    `hr_reviewed_at` TIMESTAMP NULL,
    `president_status` VARCHAR(20) NULL,
    `president_reviewed_by` BIGINT UNSIGNED NULL,
    `president_reviewed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` TIMESTAMP NULL,
    `reviewed_by` BIGINT UNSIGNED NULL,
    CONSTRAINT `fk_ma_hr_reviewer` FOREIGN KEY (`hr_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ma_pres_reviewer` FOREIGN KEY (`president_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_ma_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `events` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `slug` VARCHAR(200) NOT NULL UNIQUE,
    `title` VARCHAR(250) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `body` JSON NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(1000) NULL,
    `image_alt` VARCHAR(500) NULL,
    `is_sample` TINYINT(1) NOT NULL DEFAULT 0,
    `date` DATE NOT NULL,
    `location` VARCHAR(250) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `news_articles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `slug` VARCHAR(200) NOT NULL UNIQUE,
    `title` VARCHAR(250) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `body` JSON NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(1000) NULL,
    `image_alt` VARCHAR(500) NULL,
    `is_sample` TINYINT(1) NOT NULL DEFAULT 0,
    `date` DATE NOT NULL,
    `author` VARCHAR(200) NULL,
    `featured` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `formations` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `slug` VARCHAR(200) NOT NULL UNIQUE,
    `title` VARCHAR(250) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `body` JSON NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(1000) NULL,
    `image_alt` VARCHAR(500) NULL,
    `is_sample` TINYINT(1) NOT NULL DEFAULT 0,
    `duration` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    `level` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conventions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `slug` VARCHAR(200) NOT NULL UNIQUE,
    `title` VARCHAR(250) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `body` JSON NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(1000) NULL,
    `image_alt` VARCHAR(500) NULL,
    `is_sample` TINYINT(1) NOT NULL DEFAULT 0,
    `date` DATE NOT NULL,
    `location` VARCHAR(250) NOT NULL,
    `partner` VARCHAR(250) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `partner_companies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `logo_url` TEXT NOT NULL,
    `category` VARCHAR(100) NULL,
    `default_discount` VARCHAR(50) NOT NULL DEFAULT '15% OFF',
    `description` TEXT NULL,
    `website` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `member_discounts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `company_id` INT NOT NULL,
    `discount_rate` VARCHAR(50) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `user_company_uniq` (`user_id`, `company_id`),
    CONSTRAINT `fk_md_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_md_company` FOREIGN KEY (`company_id`) REFERENCES `partner_companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

