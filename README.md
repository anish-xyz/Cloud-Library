# Cloud Library — Polyglot Microservices LMS

A modular, multi-language Library Management System built with a light-blue cartoonish aesthetic, isolated databases, and an API Gateway reverse proxy.

---

## Architecture Overview

The system is split into **3 decoupled backend microservices**, **1 frontend web app**, and **1 API Gateway**:

| Service | Language & Framework | Database & Volume | Purpose | Internal Port |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog Service** | **Go (Golang 1.22)** | MySQL (`catalog_mydata`) | Book catalog, categories, search, live stock counter | `8081` |
| **Auth Service** | **Python (FastAPI)** | PostgreSQL (`auth_pgdata`) | Patron & Staff registration, JWT token issuing | `8000` |
| **Circulation Service**| **Node.js / TypeScript** | MySQL (`circulation_mydata`) | Loan checkout, due date tracking, returns, member records | `8082` |
| **Frontend** | **Next.js 14** | — | Light-blue cartoonish UI with separated pages | `3000` |
| **API Gateway** | **Nginx** | — | Reverse proxy & single ingress point (No CORS) | `8080` |

---

## Page Breakdown

- **`/` — Catalog Homepage**:
  - Browse books with category filters (Fiction, Science & Tech, History, Philosophy, Comics, Fantasy).
  - Search by keyword, author, or ISBN.
  - Live availability badges ("In Stock" vs "Out of Stock").
  - "Borrow Book" button triggers login redirect if unauthenticated, or confirm checkout modal if logged in as a member.

- **`/login` — Authentication Portal**:
  - Switchable tabs for **Patron Sign In / Register** and **Staff Portal Login**.
  - One-click demo credentials autofill.

- **`/patron/dashboard` — Patron Dashboard**:
  - View member credentials and active book loans.
  - Due dates and real-time return actions.
  - Borrowing history table.

- **`/staff/dashboard` — Staff Administration**:
  - Live metrics: Total members, Active loans, Returned books.
  - Circulation management: View all loans and process returns.
  - Member directory: Inspect all patrons, membership numbers, and active loan counts.

---

## Demo Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Staff** | `staff@library.com` | `staff123` | Staff Portal, Member Management & Loan Logs |
| **Patron** | `patron@library.com` | `patron123` | Book checkout, Patron Dashboard |
| **Patron (Alt)** | `alice@library.com` | `alice123` | Book checkout, Patron Dashboard |

*(You can also register any new patron account directly on `/login`).*

---

## Running Locally with Docker Compose

### 1. Start all containers:
```bash
docker compose up -d --build
```

### 2. Access the Application:
- **Main Website / Gateway**: [http://localhost:8080](http://localhost:8080)
- **Direct Service APIs (if needed for debugging)**:
  - Catalog Service: `http://localhost:8081/api/catalog/books`
  - Auth Service: `http://localhost:8000/docs` (FastAPI Swagger UI)
  - Circulation Service: `http://localhost:8082/health`

### 3. Run Automated Tests:
```bash
./test-system.sh
```

### 4. Database Seeding & Reset:
All 3 databases are automatically initialized and seeded during container creation via their mounted `./services/<service>/db` directories (`01-schema.sql` and `02-seed.sql`).

If you ever want to re-seed or reload initial dummy data into running containers without deleting your Docker volumes, run:
```bash
./seed-dbs.sh
```

### 5. Stop and remove containers:
```bash
docker compose down
# To also wipe database volumes:
docker compose down -v
```