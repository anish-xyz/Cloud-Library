-- =========================================================
-- Catalog Service: Initial Seed Data (MySQL)
-- Invoked automatically during container creation
-- =========================================================

USE catalog_db;

-- 1. Seed Categories (using clean icon identifiers instead of emojis)
INSERT INTO categories (id, name, slug, icon, description) VALUES
(1, 'Fiction & Literature', 'fiction', 'book', 'Captivating novels, contemporary fiction, and timeless literary masterworks.'),
(2, 'Science & Technology', 'science-tech', 'cpu', 'Deep dives into computing, AI, cloud engineering, physics, and distributed systems.'),
(3, 'History & Biography', 'history', 'landmark', 'Historical milestones, world civilizations, and inspiring biographies of change-makers.'),
(4, 'Philosophy & Psychology', 'philosophy', 'lightbulb', 'Inquiries into consciousness, cognitive science, ethics, and ancient philosophical wisdom.'),
(5, 'Comics & Graphic Novels', 'comics', 'palette', 'Visual storytelling, cyberpunk epics, and dynamic illustrated adventures.'),
(6, 'Children & Fantasy', 'fantasy', 'sparkles', 'Magical journeys, young adult adventures, and enchanting folklore.')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon);

-- 2. Seed Books with real cover photos from Unsplash
INSERT INTO books (id, title, author, isbn, category_id, description, cover_color, cover_image, total_copies, available_copies, published_year) VALUES
(1, 'The Cloud Architect Handbook', 'Sophia Lin', '978-0134685991', 2, 'A comprehensive guide to designing multi-region cloud architectures, resilient microservices, and Kubernetes clusters.', '#2563EB', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 6, 4, 2024),
(2, 'Chronicles of the Starfarer', 'Marcus Vance', '978-0385537858', 1, 'An interstellar odyssey following an intrepid captain charting the anomalies of deep space galaxies.', '#0284C7', 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80', 4, 3, 2023),
(3, 'Thinking in Distributed Systems', 'Dr. Elena Rostova', '978-0596517748', 2, 'Unlocking consensus algorithms, Raft, eventual consistency, and fault-tolerant network topologies.', '#0D9488', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 5, 5, 2024),
(4, 'The Echo of Empires', 'Arthur Sterling', '978-0143127741', 3, 'How ancient maritime trade routes and commercial ports established modern globalization.', '#D97706', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80', 3, 2, 2021),
(5, 'Mind over Algorithms', 'Tariq Al-Mansoor', '978-1449373320', 4, 'Exploring consciousness, cognitive heuristics, and human intuition in an age of generative AI.', '#7C3AED', 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80', 7, 6, 2023),
(6, 'Neo Tokyo Chronicles: Vol. 1', 'Kenji Sato', '978-1974700523', 5, 'A thrilling cyberpunk manga following underground hackers uncovering corporate conspiracies.', '#DB2777', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80', 8, 7, 2022),
(7, 'The Whispering Forest', 'Clara Higgins', '978-0062315007', 6, 'A heartwarming fairy tale about a child who uncovers the forgotten guardians of the ancient woods.', '#059669', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', 5, 4, 2023),
(8, 'Kubernetes & Beyond', 'Alex Chen & Liam Frost', '978-1491956250', 2, 'Production patterns for orchestrating polyglot containers across hybrid and multi-cloud clusters.', '#1E40AF', 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80', 4, 4, 2024),
(9, 'The Art of Clean Concurrency', 'Devon Bailey', '978-0132350884', 2, 'Mastering asynchronous programming, goroutines, channels, and event loops with zero race conditions.', '#0284C7', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80', 5, 5, 2023),
(10, 'Socrates in the Digital Age', 'Miriam K. Vance', '978-0199535569', 4, 'Applying classical dialectic reasoning to modern cyber-ethics, privacy, and digital identity.', '#6366F1', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80', 3, 3, 2022),
(11, 'Shadows over Dunhaven', 'Gwendolyn Thorne', '978-0345538376', 1, 'A gothic mystery set in a coastal Victorian town where an unsolved disappearance echoes through generations.', '#475569', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', 4, 4, 2021),
(12, 'The Quest for Dragon Peak', 'Oliver Pendelton', '978-0439023528', 6, 'An illustrated fantasy quest featuring brave adventurers, enchanted spells, and friendly mythical beasts.', '#EA580C', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', 6, 6, 2024)
ON DUPLICATE KEY UPDATE title=VALUES(title), cover_image=VALUES(cover_image), available_copies=VALUES(available_copies);
