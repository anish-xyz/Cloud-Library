-- =========================================================
-- Circulation Service: Initial Seed Data (MySQL)
-- Invoked automatically during container creation
-- =========================================================

USE circulation_db;

-- 1. Seed Registered Members
INSERT INTO members (id, user_id, email, full_name, membership_number, status, joined_date) VALUES
(1, 3, 'patron@library.com', 'Alex Morgan', 'LIB-MEM-1001', 'ACTIVE', NOW() - INTERVAL 60 DAY),
(2, 4, 'alice@library.com', 'Alice Wonder', 'LIB-MEM-1002', 'ACTIVE', NOW() - INTERVAL 45 DAY),
(3, 5, 'bob@library.com', 'Bob Builder', 'LIB-MEM-1003', 'ACTIVE', NOW() - INTERVAL 30 DAY),
(4, 6, 'clara@library.com', 'Clara Oswald', 'LIB-MEM-1004', 'ACTIVE', NOW() - INTERVAL 15 DAY)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), status=VALUES(status);

-- 2. Seed Borrowing Transactions
INSERT INTO borrowings (id, member_id, member_email, member_name, book_id, book_title, borrowed_at, due_date, returned_at, status, notes) VALUES
(1, 1, 'patron@library.com', 'Alex Morgan', 1, 'The Cloud Architect Handbook', NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 9 DAY, NULL, 'BORROWED', 'Regular 14-day checkout'),
(2, 1, 'patron@library.com', 'Alex Morgan', 2, 'Chronicles of the Starfarer', NOW() - INTERVAL 12 DAY, NOW() + INTERVAL 2 DAY, NULL, 'BORROWED', 'Due soon'),
(3, 2, 'alice@library.com', 'Alice Wonder', 4, 'The Echo of Empires', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 5 DAY, 'RETURNED', 'Returned on time in pristine condition'),
(4, 3, 'bob@library.com', 'Bob Builder', 5, 'Mind over Algorithms', NOW() - INTERVAL 3 DAY, NOW() + INTERVAL 11 DAY, NULL, 'BORROWED', 'Self-service digital borrow'),
(5, 4, 'clara@library.com', 'Clara Oswald', 6, 'Neo Tokyo Chronicles: Vol. 1', NOW() - INTERVAL 8 DAY, NOW() + INTERVAL 6 DAY, NULL, 'BORROWED', 'Graphic novel collection'),
(6, 2, 'alice@library.com', 'Alice Wonder', 7, 'The Whispering Forest', NOW() - INTERVAL 35 DAY, NOW() - INTERVAL 21 DAY, NOW() - INTERVAL 20 DAY, 'RETURNED', 'Returned via drop box')
ON DUPLICATE KEY UPDATE status=VALUES(status);
