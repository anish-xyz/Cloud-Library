-- =========================================================
-- Auth Service: Initial Seed Data (PostgreSQL)
-- Invoked automatically during container creation
-- =========================================================

-- Seed Staff and Member Accounts with native bcrypt password hashes
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
(1, 'staff@library.com', crypt('staff123', gen_salt('bf', 12)), 'Head Librarian Elena', 'staff'),
(2, 'admin@library.com', crypt('admin123', gen_salt('bf', 12)), 'Senior Archivist Marcus', 'staff'),
(3, 'patron@library.com', crypt('patron123', gen_salt('bf', 12)), 'Alex Morgan', 'member'),
(4, 'alice@library.com', crypt('alice123', gen_salt('bf', 12)), 'Alice Wonder', 'member'),
(5, 'bob@library.com', crypt('bob123', gen_salt('bf', 12)), 'Bob Builder', 'member'),
(6, 'clara@library.com', crypt('clara123', gen_salt('bf', 12)), 'Clara Oswald', 'member')
ON CONFLICT (email) DO NOTHING;

-- Reset sequence to continue after highest id
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
