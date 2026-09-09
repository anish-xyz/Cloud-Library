-- =========================================================
-- Catalog Service: Database Schema (MySQL)
-- Invoked automatically during container creation
-- =========================================================

CREATE DATABASE IF NOT EXISTS catalog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE catalog_db;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT 'book',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    cover_color VARCHAR(20) DEFAULT '#2563EB',
    cover_image VARCHAR(512) NOT NULL,
    total_copies INT DEFAULT 5,
    available_copies INT DEFAULT 5,
    published_year INT DEFAULT 2024,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_books_category (category_id),
    INDEX idx_books_title (title),
    INDEX idx_books_isbn (isbn)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
