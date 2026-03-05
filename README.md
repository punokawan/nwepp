# NWEPP — Nutrition Workforce Education & Placement Platform

Platform nasional untuk edukasi, sertifikasi, dan manajemen tenaga kerja gizi mendukung program **Makan Bergizi Gratis (MBG)**.

## Quick Start

### Prerequisites
- Go 1.22+
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL)

### 1. Start Database
```bash
docker-compose up -d postgres
```

### 2. Run Backend
```bash
cd backend
go run ./cmd/server
```
API runs at `http://localhost:8081`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:3000`

## Project Structure

```
nwepp/
├── backend/              # Go API (Golang 1.22+)
│   ├── cmd/server/       # Entrypoint
│   ├── internal/
│   │   ├── config/       # Environment-based config
│   │   ├── middleware/    # JWT auth, CORS, logging
│   │   ├── models/       # Data structures
│   │   ├── handlers/     # HTTP handlers (auth, lms, cert, talent, placement)
│   │   └── utils/        # API response helpers
│   └── migrations/       # PostgreSQL schema + seed data
├── frontend/             # Next.js 16 (App Router)
│   └── src/
│       ├── app/          # Pages (9 routes)
│       ├── components/   # Navbar
│       └── lib/          # API client, Auth context
└── docker-compose.yml    # PostgreSQL + Backend services
```

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /register`, `POST /login`, `POST /refresh`, `GET /me` |
| LMS | `GET /tracks`, `GET /tracks/:id`, `GET /courses/:id`, `GET /lessons/:id`, `POST /progress` |
| Certification | `GET /certifications`, `GET/POST /exams/:id`, `PUT /exams/:id/submit`, `GET /certificates/me` |
| Talent | `GET/PUT /talent/profile/me`, `GET /talent/ranking`, `GET /talent/search` |
| Placement | `GET/POST /kitchens`, `GET/POST /positions`, `POST /placements`, `PUT /placements/:id` |

All endpoints prefixed with `/api/v1/`.

## Tech Stack
- **Backend**: Go 1.22, net/http, JWT, bcrypt, PostgreSQL
- **Frontend**: Next.js 16, React, Vanilla CSS
- **Database**: PostgreSQL 16
- **Infra**: Docker Compose
