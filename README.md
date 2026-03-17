# SHI Dashboard - PT Smart Home Inovasi

Tugas Akhir - Dian Putri Iswandi (5220311118)
Universitas Teknologi Yogyakarta, 2026

## Overview

Dashboard fitur pada sistem project management berbasis data daily report. Sistem ini memungkinkan:
- **Teknisi Lapangan**: Input laporan harian (persentase progres aktual)
- **Manajer Proyek**: Monitoring dashboard dengan status kesehatan proyek (RAG - Red/Amber/Green)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TanStack Query |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |

## Project Structure

```
project_ta_dian_putri_iswandi/
├── server/              # Backend API
│   ├── src/
│   │   ├── app.ts       # Express entry point
│   │   ├── routes/      # API routes
│   │   ├── services/    # SPI calculator, business logic
│   │   ├── middleware/  # Auth, authorization
│   │   └── types/       # TypeScript types
│   └── database/
│       ├── schema.sql   # PostgreSQL DDL
│       └── seed.sql     # Sample data
└── frontend/            # React dashboard
    └── src/
        ├── pages/       # Route pages
        ├── components/  # UI components
        ├── hooks/       # TanStack Query hooks
        ├── services/    # API client
        └── types/       # TypeScript types
```

## Setup

### 1. PostgreSQL Database

```bash
# Create database
createdb shi_dashboard

# Run schema + seed
cd server
cp .env.example .env
# Edit .env with your DB credentials

npm run db:seed
```

### 2. Backend

```bash
cd server
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Default Login Credentials (seed data)

| Role | Email | Password |
|------|-------|----------|
| Manager | budi@shi.co.id | password |
| Technician | siti@shi.co.id | password |
| Technician | andi@shi.co.id | password |
| Admin | admin@shi.co.id | admin123 |

## Core Business Logic

### SPI Calculation
```
Planned Value (PV) = (days elapsed / total duration) × 100%
Earned Value (EV) = actual progress % from daily report

SPI = EV / PV

Health Status:
  Green:  SPI ≥ 0.95 (on track)
  Amber:  0.85 ≤ SPI < 0.95 (warning)
  Red:    SPI < 0.85 (critical)
```

### Dashboard Auto-Sorting
Projects are sorted by urgency: **Red → Amber → Green**

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | - | Login |
| POST | /api/auth/register | - | Register |
| GET | /api/dashboard | manager/admin | Dashboard data |
| GET | /api/projects | all | List projects |
| POST | /api/projects | manager/admin | Create project |
| GET | /api/projects/:id | all | Project detail |
| POST | /api/daily-reports | technician | Submit report |
| GET | /api/daily-reports | all | List reports |
| GET | /api/users/me/projects | technician | My assigned projects |
