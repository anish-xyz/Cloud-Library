#!/usr/bin/env bash
set -e

echo "========================================================="
echo " Seeding / Re-seeding Initial Dummy Data into all 3 DBs"
echo "========================================================="

# 1. Catalog DB (MySQL)
echo -e "\n[1/3] Seeding Catalog MySQL Database (Books & Categories)..."
docker compose exec -T catalog-db mysql -u catalog_user -pcatalog_pass catalog_db < ./services/catalog/db/02-seed.sql
echo "✅ Catalog DB seeded successfully (12 books, 6 categories)!"

# 2. Auth DB (PostgreSQL)
echo -e "\n[2/3] Seeding Auth PostgreSQL Database (Staff & Members with bcrypt hashes)..."
docker compose exec -T auth-db psql -U auth_user -d auth_db < ./services/auth/db/02-seed.sql
echo "✅ Auth DB seeded successfully (2 staff, 4 member accounts)!"

# 3. Circulation DB (MySQL)
echo -e "\n[3/3] Seeding Circulation MySQL Database (Members & Borrow Records)..."
docker compose exec -T circulation-db mysql -u circulation_user -pcirculation_pass circulation_db < ./services/circulation/db/02-seed.sql
echo "✅ Circulation DB seeded successfully (4 members, 6 active/returned loans)!"

echo -e "\n🎉 All databases have been successfully seeded with initial dummy data!"
