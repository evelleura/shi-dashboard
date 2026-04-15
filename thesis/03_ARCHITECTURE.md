# Arsitektur Sistem dan Teori Pendukung

## Gambaran Umum Arsitektur

Sistem dashboard project management berbasis daily report dirancang dengan arsitektur berlapis:

```
[Pengguna Frontend]
     |
     v
[Next.js Frontend Layer]
  (React 19, TanStack Query, Recharts)
     |
     v
[REST API Backend]
  (Node.js + Express + TypeScript)
     |
     v
[PostgreSQL Database]
  (Raw SQL queries, parameterized)
     |
     v
[File Storage]
  (Local disk: server/uploads/)
```

---

## Tech Stack

### Frontend
- **Framework:** Vite + React 19
- **Data Fetching:** TanStack Query 5 (near real-time with 5-min stale time)
- **Visualization:** Recharts 3 (charts and graphs)
- **Styling:** Tailwind CSS v4
- **Purpose:** Interactive dashboard with responsive UI

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** PostgreSQL (raw SQL with parameterized queries)
- **Authentication:** JWT-based (role-based access control)

### Database
- **Type:** PostgreSQL (relational)
- **Connection:** `pg` library (Node.js)
- **Pattern:** Parameterized queries to prevent SQL injection
- **Scale:** Enterprise (100+ projects efficiently)

### File Storage
- **Type:** Local disk
- **Location:** `server/uploads/`
- **Purpose:** Store evidence files (photos, documents, screenshots) per task
- **Note:** NOT cloud-based (as per scope)

---

## Pengguna dan Peran

### 1. Field Technician (Teknisi Lapangan)
**Responsibilities:**
- Melakukan instalasi dan integrasi sistem Smart Home di lapangan
- Menginput daily report dengan progres harian dan kendala

**Permissions:**
- ✓ View assigned projects/clients
- ✓ Manage tasks: mark as to_do OR working_on_it (CANNOT mark done)
- ✓ Upload evidence per task
- ✓ View Kanban + table with computed Overtime/Over Deadline columns
- ✗ Cannot mark tasks "done" (only manager can after review)
- ✗ Cannot access admin/system-wide features

**Data Inputs:**
- Daily report dengan persentase progres (Earned Value)
- Kendala/catatan operasional
- Evidence (photos, documents)

### 2. Project Manager (Manajer Proyek)
**Responsibilities:**
- Memantau kesehatan portofolio proyek via dashboard
- Membuat keputusan penanganan proyek berdasarkan indikator SPI
- Mengatur alokasi sumber daya

**Permissions:**
- ✓ Full CRUD: clients, projects, tasks, budget, materials
- ✓ Approve/mark tasks as "done" (review gate)
- ✓ View analytics dashboard
- ✓ Approve project surveys
- ✓ Assign tasks to technicians

**Primary Dashboard View:**
- Project health status (RAG indicators)
- SPI metrics per project
- Early warning system alerts
- Technician workload overview

### 3. Admin
**Responsibilities:**
- User management and system-wide access
- System configuration

**Permissions:**
- ✓ User CRUD
- ✓ System-wide access
- ✓ All manager functions + more

---

## Key Business Logic: Schedule Performance Index (SPI)

### Definition
SPI adalah rasio yang membandingkan **pekerjaan aktual yang selesai (Earned Value)** dengan **pekerjaan yang seharusnya selesai menurut rencana (Planned Value)**.

### Formula
```
SPI = EV / PV

Where:
- EV (Earned Value): Persentase pekerjaan aktual yang telah diselesaikan
                     diinputkan oleh teknisi melalui daily report
- PV (Planned Value): (Hari Terlewat / Total Durasi Proyek) × 100%
                      Persentase target yang seharusnya selesai pada hari ini
```

### Interpretasi Nilai SPI

| SPI Value | Status | Visual | Meaning |
|-----------|--------|--------|---------|
| SPI = 1.0 | On Schedule | 🟢 Green | Proyek berjalan sesuai rencana |
| SPI > 1.0 | Ahead of Schedule | 🟢 Green | Proyek lebih cepat dari rencana (BAIK) |
| 0.95 ≤ SPI < 1.0 | At Risk / Warning | 🟡 Amber | Sedikit tertinggal, perlu dimonitor |
| SPI < 0.85 | Critical / Behind | 🔴 Red | Keterlambatan signifikan, tindakan urgent |

### Health Status Thresholds (RAG Indicator)

| Status | Condition | SPI Range | Color | Action |
|--------|-----------|-----------|-------|--------|
| Green | On Track | SPI ≥ 0.95 | 🟢 | Lanjutkan monitoring |
| Amber | Warning | 0.85 ≤ SPI < 0.95 | 🟡 | Monitor ketat, persiapkan escalation |
| Red | Critical | SPI < 0.85 | 🔴 | Tindakan URGENT, escalation |

### Auto-Recalculation Triggers
SPI otomatis direcalculate ketika:
1. Teknisi submit daily report dengan progress percentage baru
2. Task status berubah
3. Task dibuat atau dihapus
4. Project baseline (durasi) diubah

---

## Sistem Peringatan Dini (EWS - Early Warning System)

### Mekanisme
EWS adalah **otomasi sistem** yang mendeteksi keterlambatan proyek secara real-time tanpa perlu intervensi manual.

### Trigger Kondisi
```
IF (SPI < 1.0) THEN
  - Ubah indikator dashboard menjadi Amber atau Red
  - Urutkan proyek dengan status kritical di teratas
  - Notifikasi manager (optional)
END IF
```

### Implementasi
- **Tidak menggunakan machine learning** (per batasan scope)
- **Berbasis komparasi faktual** dari data yang sudah ada
- **Real-time:** Dashboard update otomatis setelah daily report disubmit
- **Proaktif:** Manager dapat mengidentifikasi masalah sebelum terlambat

### Manfaat EWS
1. **Information Lag Berkurang:** Deteksi langsung, bukan tunggu laporan
2. **Early Detection:** Proyek kritis muncul otomatis di urutan teratas
3. **Objektif:** Berdasarkan metrik, bukan intuisi
4. **Scalable:** Dapat menangani 100+ proyek tanpa overload manager

---

## Data Flow: Dari Input hingga Visualization

```
1. FIELD DATA INPUT
   Teknisi Input Daily Report
   └─ Persentase Progress (EV)
   └─ Catatan Kendala
   └─ Evidence (foto, dokumen)

2. DATABASE STORAGE
   Data masuk ke PostgreSQL
   └─ daily_reports table
   └─ task_evidence table

3. BACKEND CALCULATION (AUTOMATIC)
   Backend Calculate SPI & Health Status
   └─ PV = (Days Elapsed / Total Duration) × 100
   └─ SPI = EV / PV
   └─ Status = Categorize(SPI) → Red/Amber/Green

4. API RESPONSE
   REST API menyajikan hasil kalkulasi
   └─ /api/dashboard/summary
   └─ /api/projects/{id}/health
   └─ /api/projects/chart-data

5. FRONTEND RENDERING
   Next.js menerima data asinkronus via TanStack Query
   └─ RAG indicators rendered
   └─ Charts re-rendered
   └─ Dashboard updated (NO page refresh)

6. MANAGER VISUALIZATION
   Manajer melihat dashboard update secara real-time
   └─ Status proyek secara sekilas
   └─ Detail dengan klik
   └─ Early warning sudah terlihat
```

---

## Task Management & Workflow

### Task Status Flow
```
[to_do] --mark_working--> [working_on_it] --manager_approves--> [done]
```

**Important Notes:**
- Technician dapat mark: `to_do` → `working_on_it` SAJA
- Manager dapat mark: `working_on_it` → `done` (review gate)
- Technician TIDAK bisa mark `done` (untuk quality control)

### Computed States (Non-DB)
Sistem otomatis hitung berdasarkan date comparison:

| Computed Field | Condition | Purpose |
|---|---|---|
| **Overtime** | `status = working_on_it` AND `due_date < TODAY` | Task sedang dikerjakan tapi sudah lewat deadline |
| **Over Deadline** | `status = to_do` AND `due_date < TODAY` | Task belum mulai tapi sudah lewat deadline |
| **On Track** | Normal task progression | Status OK |

**Design Rationale:** Computed states lebih objektif daripada manual status (tidak perlu user self-report "stuck")

---

## Dashboard Charts (8 Jenis Visualisasi)

| Chart Type | Data Source | Purpose | User |
|---|---|---|---|
| Project Health Pie | SPI per project | Ringkas % proyek per status (RAG) | Manager |
| Tasks by Status | Task count per status | Breakdown to_do/working/done | Both |
| Tasks by Owner | Task count per technician | Workload distribution | Manager |
| Tasks by Due Date | Task due date distribution | Upcoming vs overdue | Both |
| Overdue Tasks | Overdue task count | Alert view | Manager |
| Budget Status | Budget vs actual spend | Financial tracking | Manager |
| Earned Value | Cumulative progress trend | Project trajectory | Manager |
| Technician Workload | Tasks per technician | Resource utilization | Manager |

---

## Integration Points

### Daily Report → SPI Calculation
- Teknisi submit daily report
- Backend otomatis calculate PV (baseline-based)
- Backend otomatis calculate SPI = EV / PV
- `project_health` table auto-update
- Frontend refresh via TanStack Query polling

### Task Management → Daily Report
- Task status change tidak langsung = daily report submit
- Daily report adalah explicit input dari teknisi
- SPI dihitung dari daily report's `progress_percentage`
- Task status digunakan untuk Kanban view + task breakdown chart

### Evidence Upload → Task Link
- Teknisi upload foto/dokumen per task
- Evidence stored dalam `task_evidence` table
- Manager dapat lihat evidence history per task

---

## Performance Considerations

### For Real-Time Updates
- **TanStack Query:** 5-minute stale time untuk near-realtime
- **Server-Side Rendering (SSR):** Next.js untuk initial load cepat
- **Async Calculations:** Backend calculation non-blocking
- **API Response Time:** Optimize query dengan proper indexing

### For Scalability
- **100+ Projects:** Database query optimization (indexes on project_id, created_at)
- **Multi-User Access:** PostgreSQL MVCC (multi-version concurrency control)
- **File Storage:** Local disk scalable hingga ukuran tertentu (recommend cloud later)

---

## Security & Access Control

### Authentication
- JWT-based authentication
- Secure password hashing (bcrypt or similar)

### Authorization (Role-Based Access Control)
- **Technician:** View own tasks + submit daily report
- **Manager:** Full project visibility + dashboard + task approval
- **Admin:** System-wide access

### Data Protection
- Parameterized SQL queries (prevent SQL injection)
- Input validation on all endpoints
- HTTPS for all communications (in production)

---

## Framework Justification

### Why Next.js?
- **Server-Side Rendering (SSR):** Dashboard components render on server → fast initial load
- **Component-Based:** Modular dashboard (charts, indicators, tables)
- **Real-Time Integration:** Async data fetching with TanStack Query
- **Enterprise Scale:** Proven untuk aplikasi besar dengan ratusan users

### Why PostgreSQL?
- **Relational Model:** Daily reports, projects, tasks, users → natural fit
- **ACID Compliance:** Data integrity critical untuk financial/project data
- **Scalability:** Dapat handle 100+ concurrent users
- **SQL Flexibility:** Complex aggregation queries untuk SPI calculation

### Why React 19?
- **Component Reusability:** Dashboard widgets, charts, forms
- **Unidirectional Data Flow:** Easier to debug
- **Ecosystem:** Richarts, TanStack Query, Tailwind matang

---

## Reference: Related Research

Efektivitas pendekatan ini telah divalidasi oleh:

1. **Ernawan (2024):** Dashboard manajemen meningkatkan akurasi data dan mempercepat identifikasi masalah
2. **Azkia dkk. (2024):** Dashboard EVM mencapai UAT skor 86% (sangat baik)
3. **Auliansyah dkk. (2023):** Sistem monitoring dengan deviasi calculation berhasil detect keterlambatan akurat
4. **Gledson dkk. (2024):** Web-based dashboard meningkatkan efisiensi dan produktivitas dengan visualisasi real-time

