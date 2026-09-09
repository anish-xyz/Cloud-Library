-- =========================================================
-- Circulation Service: Database Schema (MySQL)
-- Invoked automatically during container creation
-- =========================================================

CREATE DATABASE IF NOT EXISTS circulation_db;
USE circulation_db;

CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    membership_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_members_email (email),
    INDEX idx_members_card (membership_number)
);

CREATE TABLE IF NOT EXISTS borrowings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    member_email VARCHAR(255) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    book_id INT NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    returned_at TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'BORROWED', -- 'BORROWED', 'RETURNED', 'OVERDUE'
    notes TEXT,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_borrowings_member (member_id),
    INDEX idx_borrowings_email (member_email),
    INDEX idx_borrowings_status (status)
);
