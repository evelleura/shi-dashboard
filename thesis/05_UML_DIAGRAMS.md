# UML Diagrams dan Model Proses

## Use Case Diagram

### Aktor & Use Cases

**Aktor:**
1. **Teknisi Lapangan** - Field technician, melakukan pekerjaan instalasi
2. **Manajer Proyek** - Project manager, memantau dan mengambil keputusan
3. **Admin** - System administrator

**Use Cases:**

### Teknisi Lapangan
- **UC-01: Login ke Sistem** - Authentikasi dengan email/password
- **UC-02: Input Daily Report** - Mengisi laporan progres harian dengan percentage
- **UC-03: Upload Evidence** - Upload foto/dokumen sebagai bukti kerja
- **UC-04: Lihat Task Kanban** - Melihat tasks dalam Kanban board
- **UC-05: Update Task Status** - Mark task dari to_do ke working_on_it (TIDAK bisa done)
- **UC-06: Lihat Self-Performance Dashboard** - View personal SPI dan performance metrics

### Manajer Proyek
- **UC-07: Login ke Sistem** - Authentikasi
- **UC-08: Lihat Dashboard Proyek** - View overall project health dengan RAG indicators
- **UC-09: Lihat Metrics Proyek** - Detailed SPI, EV, PV, deviation per project
- **UC-10: Monitor EWS** - Lihat peringatan dini untuk proyek kritis (Red status)
- **UC-11: Approve Task Completion** - Mark task working_on_it → done
- **UC-12: Kelola Proyek** - CRUD projects (create, edit, delete)
- **UC-13: Kelola Klien** - CRUD clients
- **UC-14: Kelola Tasks** - CRUD tasks, assign to technician
- **UC-15: Kelola Budget** - CRUD budget items per project
- **UC-16: Kelola Materials** - CRUD materials per project
- **UC-17: View Reports** - Lihat analytics dan reports

### Admin
- **UC-18: Manage Users** - CRUD users, assign roles
- **UC-19: Manage System Settings** - System configuration

### Include/Extend Relationships
```
UC-02 <<include>> UC-03          (Input report includes evidence upload)
UC-04 <<include>> UC-05          (View tasks includes update status)
UC-04 <<extend>> UC-11           (Manager can approve from Kanban)
UC-08 <<include>> UC-09          (Dashboard display includes SPI details)
UC-09 <<include>> UC-10          (Metrics view shows EWS alerts)
```

### Diagram Structure
```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐         ┌──────────────────────┐  │
│  │  Teknisi        │         │  Manajer Proyek      │  │
│  │  Lapangan       │         │                      │  │
│  └────────┬────────┘         └──────────┬───────────┘  │
│           │                             │               │
│           │        ┌────────────────────┴────────────┐  │
│           │        │                                 │  │
│      ┌────▼───┐ ┌──▼──┐  ┌────────────┐  ┌────────┐ │  │
│      │ Login  │ │Daily│  │ Dashboard  │  │ Kelola │ │  │
│      │ System │ │Report│  │  Proyek    │  │ Proyek │ │  │
│      └────────┘ └──┬──┘  └────────────┘  └────────┘ │  │
│                    │                                  │  │
│                    └──────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

*Note: Full UML Use Case Diagram details akan di-generate dalam drawio format*

---

## Activity Diagram

### AD-01: Login dan Logout

```
START
  │
  ├─→ [User Input Email & Password]
  │
  ├─→ [Validate Credentials]
  │
  ├─ YES ─→ [Check Role]
  │          │
  │          ├─ Technician ─→ [Load Kanban Dashboard]
  │          │
  │          ├─ Manager ─→ [Load Project Health Dashboard]
  │          │
  │          └─ Admin ─→ [Load Admin Panel]
  │
  ├─ NO ─→ [Show Error Message]
           │
           └─→ [Return to Login]
  │
  └─→ END (Session Active)

LOGOUT:
  │
  ├─→ [User Click Logout]
  │
  ├─→ [Clear JWT Token]
  │
  └─→ [Redirect to Login Page]
```

### AD-02: Daily Report dan Penilaian Otomatis (Key Process)

```
START
  │
  ├─→ [Teknisi Access Daily Report Form]
  │
  ├─→ [Fill Form]
  │    ├─ Select Project
  │    ├─ Select Task (optional)
  │    ├─ Input Progress % (0-100)
  │    ├─ Input Constraints/Notes
  │    └─ (Optional) Upload Evidence
  │
  ├─→ [Submit Daily Report]
  │
  ├─→ [Backend: Store in daily_reports]
  │
  ├─→ [AUTOMATIC: Calculate SPI]
  │    ├─ Get Latest Daily Report (EV)
  │    ├─ Calculate PV from Baseline
  │    ├─ SPI = EV / PV
  │    └─ Store in project_health
  │
  ├─→ [AUTOMATIC: Categorize Status]
  │    ├─ IF SPI >= 0.95 THEN Status = GREEN
  │    ├─ IF 0.85 <= SPI < 0.95 THEN Status = AMBER
  │    └─ IF SPI < 0.85 THEN Status = RED
  │
  ├─→ [Update Dashboard]
  │    ├─ TanStack Query triggers refetch
  │    ├─ Dashboard re-renders with new SPI
  │    └─ RAG indicator updates
  │
  ├─→ [Manajer Sees Alert (if RED)]
  │    └─ Proyek otomatis naik ke urutan teratas
  │
  └─→ END
```

### AD-03: View Project Health Dashboard (Manajer)

```
START
  │
  ├─→ [Manajer Access Dashboard]
  │
  ├─→ [Backend API: GET /api/dashboard/projects]
  │    └─ Query project_health table
  │
  ├─→ [API Response with RAG Status]
  │    └─ Sort by: RED → AMBER → GREEN
  │
  ├─→ [Recharts Visualization]
  │    ├─ Display RAG Pie Chart (% projects per status)
  │    ├─ Display Project List with Indicators
  │    └─ Display 8 Chart Types (metrics)
  │
  ├─→ [Manajer Click Project for Details]
  │    ├─ Show SPI Value
  │    ├─ Show EV vs PV Comparison
  │    ├─ Show Deviation %
  │    └─ Show Latest Constraints/Notes
  │
  ├─→ [Decision Making]
  │    ├─ IF RED Status → Take Action (escalate, reallocate resources)
  │    ├─ IF AMBER Status → Monitor closely
  │    └─ IF GREEN Status → Continue monitoring
  │
  └─→ END
```

### AD-04: Task Kanban Management

```
START
  │
  ├─→ [Technician View Task List / Kanban Board]
  │
  ├─→ [Display 5 Visual Columns]
  │    ├─ TO DO (from status.to_do)
  │    ├─ WORKING ON IT (from status.working_on_it)
  │    ├─ OVERTIME (computed: working_on_it AND due_date < TODAY)
  │    ├─ OVER DEADLINE (computed: to_do AND due_date < TODAY)
  │    └─ DONE (from status.done - manager view only)
  │
  ├─→ [Technician Click Task Card]
  │    ├─ View Task Details
  │    ├─ View Evidence Gallery
  │    └─ View Comments/Notes
  │
  ├─→ [Technician Update Task Status]
  │    ├─ from TO DO → Click "Start Work"
  │    └─ to WORKING ON IT
  │
  ├─→ [CANNOT Update to DONE]
  │    └─ "Done" button disabled (grayed out)
  │
  ├─→ [Manager View: Full Kanban with Done Column]
  │    └─ Can Mark WORKING ON IT → DONE (review gate)
  │
  └─→ END
```

---

## Sequence Diagram

### SD-01: Daily Report Submission Flow

```
Technician      UI         Backend        Database      Frontend
    │            │            │               │            │
    ├─ Click ────→│            │               │            │
    │  Submit     │            │               │            │
    │  Report     │            │               │            │
    │            │            │               │            │
    │            │──POST ─────→│               │            │
    │            │/daily-      │               │            │
    │            │report       │               │            │
    │            │            │               │            │
    │            │            ├─ Validate    │            │
    │            │            │  Input       │            │
    │            │            │               │            │
    │            │            ├─ INSERT ─────→│            │
    │            │            │  to daily_    │            │
    │            │            │  reports      │            │
    │            │            │               │            │
    │            │            ├─ Calculate ──→│  UPDATE    │
    │            │            │  SPI & Store  │  project_  │
    │            │            │  in project_  │  health    │
    │            │            │  health       │            │
    │            │            │               │            │
    │            │←─ JSON ────│               │            │
    │            │  200 OK    │               │            │
    │            │            │               │            │
    │            ├─ Refetch ──→│               │            │
    │            │  (TanStack) │               │            │
    │            │            │               │            │
    │            │←─ Dashboard│               │            │
    │            │   Data ────│               │            │
    │            │            │               │            │
    │            ├──────────────────────────────────────→│
    │            │     Update UI with New SPI            │
    │            │                                        │
    │←─ Success ─│                                        │
      Message
```

### SD-02: Manager Dashboard Real-Time Update

```
Database       Backend       TanStack Query   Dashboard UI    Browser
    │            │                │                │            │
    │◄─ Poll ────│◄─ GET /api/    │                │            │
    │ (5min)     │  dashboard     │                │            │
    │            │                │                │            │
    │ New Data ──→│                │                │            │
    │            │───────────────→│                │            │
    │            │   SPI Updated  │                │            │
    │            │                │                │            │
    │            │                ├─ Detect ──────→│            │
    │            │                │  Change        │            │
    │            │                │                ├──→ Re-render
    │            │                │                │   Charts
    │            │                │                │            │
    │            │                │                │            │
    ├─ Reorder ──→│                │                │            │
    │  RAG by    │                │                │            │
    │  Status    │                │                │            │
    │            │───────────────→│                │            │
    │            │ Updated List   │                │            │
    │            │                │───────────────→│            │
    │            │                │  Red Project   │            │
    │            │                │  Moved to Top  │            │
    │            │                │                ├──→ Show Alert
    │            │                │                │   on Manager
    │            │                │                │   Screen
```

---

## Class Diagram

### Entities (Simplified)

```
Project
├─ id: int
├─ name: String
├─ start_date: Date
├─ end_date: Date
├─ client_id: int (FK)
├─ status: Enum(active|completed|on_hold)
├─ phase: Enum(survey|execution)
├─ created_at: Timestamp
└─ Methods:
   ├─ calculateSPI(): decimal
   ├─ getHealthStatus(): Enum(green|amber|red)
   ├─ getTasks(): Task[]
   └─ getDailyReports(): DailyReport[]

DailyReport
├─ id: int
├─ project_id: int (FK)
├─ report_date: Date
├─ progress_percentage: decimal (EV)
├─ constraints: String
├─ created_by: int (FK → User)
├─ created_at: Timestamp
└─ Methods:
   ├─ validate(): boolean
   └─ trigger_spi_calculation(): void

ProjectHealth (Denormalized)
├─ project_id: int (PK, FK)
├─ spi_value: decimal
├─ status: Enum
├─ deviation_percent: decimal
├─ actual_progress: decimal
├─ planned_progress: decimal
├─ last_updated: Timestamp
└─ Methods:
   ├─ updateFromDailyReport(): void
   └─ getRAGIndicator(): Enum

Task
├─ id: int
├─ project_id: int (FK)
├─ title: String
├─ assigned_to: int (FK → User)
├─ status: Enum(to_do|working_on_it|done)
├─ due_date: Date
├─ Methods:
   ├─ isOvertime(): boolean
   ├─ isOverDeadline(): boolean
   ├─ canMarkDone(): boolean (false for Technician)
   └─ getEvidence(): TaskEvidence[]

User
├─ id: int
├─ email: String
├─ name: String
├─ role: Enum(technician|manager|admin)
├─ password_hash: String
└─ Methods:
   ├─ authenticate(): boolean
   ├─ hasPermission(action): boolean
   └─ getAssignedProjects(): Project[]

Client
├─ id: int
├─ name: String
├─ address: String
├─ phone: String
├─ email: String
└─ Methods:
   └─ getProjects(): Project[]
```

### Relationships Diagram

```
         ┌──────────────┐
         │   Client     │
         │   (1 side)   │
         └──────┬───────┘
                │ 1:N
                │
         ┌──────▼───────┐
         │   Project    │───1:1──→ ProjectHealth
         │   (N side)   │
         └──────┬───────┘
                │ 1:N
     ┌──────────┼──────────────┐
     │          │              │
 1:N │      1:N │          1:N │
     │          │              │
  ┌──▼──┐  ┌───▼───┐  ┌──────▼──┐
  │Task │  │Daily  │  │Materials│
  │(N)  │  │Report │  │(N)      │
  └──┬──┘  │(N)    │  └─────────┘
     │     └───────┘
  1:N│
     │
  ┌──▼──────────┐
  │Task         │
  │Evidence(N)  │
  └─────────────┘
```

---

## Statechart Diagram - Task Lifecycle

```
                    ┌────────────┐
                    │  TO_DO     │
                    │ (Initial)  │
                    └─────┬──────┘
                          │
                    Start Work
                  (Technician)
                          │
                          ▼
                    ┌─────────────┐
                    │ WORKING_ON  │
                    │ _IT         │
                    └─────┬───────┘
                          │
                 Review & Approve
                   (Manager)
                          │
                          ▼
                    ┌─────────────┐
                    │  DONE       │
                    │ (Terminal)  │
                    └─────────────┘

[Computed States - NOT DB STATUS]
┌──────────────────────────────────┐
│ FROM: status=WORKING_ON_IT       │
│ AND: due_date < TODAY            │
│ RENDER AS: OVERTIME              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ FROM: status=TO_DO               │
│ AND: due_date < TODAY            │
│ RENDER AS: OVER_DEADLINE         │
└──────────────────────────────────┘
```

---

## Reference: UML Symbols Used

### Use Case Elements
- **Actor:** Stick figure (User/Technician/Manager)
- **Use Case:** Ellipse (UC-01, UC-02, etc.)
- **Association:** Solid line with arrow
- **Include:** Dashed line with `<<include>>`
- **Extend:** Dashed line with `<<extend>>`

### Sequence Elements
- **Actor:** Stick figure at top
- **Lifeline:** Dashed vertical line
- **Message:** Solid arrow (sync), dashed arrow (async)
- **Activation:** Thin rectangle on lifeline

### Class Elements
- **Class Box:** Divided into 3 sections (name | attributes | methods)
- **Relationship:** Solid line with various arrow types
- **Cardinality:** 1, N, 1..N at line ends
- **Visibility:** +public, -private, #protected, ~package

### Activity Elements
- **Start Node:** Filled circle
- **End Node:** Filled circle in circle
- **Activity:** Rounded rectangle
- **Decision:** Diamond
- **Fork/Join:** Thick horizontal line
- **Flow:** Solid arrow

---

## Note: Diagram Files

**Location:** `/thesis/DIAGRAMS/`

The following .drawio files are referenced:
- `USE_CASE.drawio` - Use Case Diagram (all actors and use cases)
- `ACTIVITY_DIAGRAM.drawio` - All 6 activity diagrams
- `SEQUENCE_DIAGRAM.drawio` - All 6 sequence diagrams
- `CLASS_DIAGRAM.drawio` - Entity class relationships
- `STATECHART_TASK.drawio` - Task status lifecycle
- `DATABASE_ERD.drawio` - Entity Relationship Diagram
- `DEPLOYMENT_DIAGRAM.drawio` - System deployment architecture

Each file can be opened with draw.io, exported to PNG/SVG for reports.

