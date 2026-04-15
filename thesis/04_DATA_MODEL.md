# Model Data dan Desain Basis Data

## Entity Relationship Diagram (ERD) - Logical View

### Core Entities

```
users
├── id (PK)
├── name
├── email (UNIQUE)
├── role (technician | manager | admin)
├── password_hash
└── created_at

clients
├── id (PK)
├── name
├── address
├── phone
├── email
├── notes
└── created_at

projects
├── id (PK)
├── name
├── description
├── client_id (FK → clients)
├── start_date
├── end_date
├── status (active | completed | on_hold)
├── project_value (rupiah)
├── phase (survey | execution)
├── survey_approved (boolean)
├── created_by (FK → users)
├── created_at
└── updated_at

project_assignments
├── id (PK)
├── project_id (FK → projects)
├── user_id (FK → users)
├── role (technician | manager)
└── assigned_at

tasks
├── id (PK)
├── project_id (FK → projects)
├── title
├── description
├── assigned_to (FK → users)
├── status (to_do | working_on_it | done)
├── due_date
├── sort_order
├── created_at
└── updated_at

task_evidence
├── id (PK)
├── task_id (FK → tasks)
├── file_path
├── file_name
├── file_type (image | document | etc)
├── file_size
├── uploaded_by (FK → users)
└── created_at

materials
├── id (PK)
├── project_id (FK → projects)
├── name
├── quantity
├── unit
├── unit_price
├── notes
└── created_at

budget_items
├── id (PK)
├── project_id (FK → projects)
├── description
├── category
├── amount
├── notes
└── created_at

daily_reports
├── id (PK)
├── project_id (FK → projects)
├── task_id (FK → tasks, nullable)
├── report_date
├── progress_percentage (Earned Value)
├── constraints (kendala)
├── notes
├── created_by (FK → users)
└── created_at

project_health (DENORMALIZED)
├── project_id (PK, FK → projects)
├── spi_value
├── status (green | amber | red)
├── deviation_percent
├── actual_progress (EV)
├── planned_progress (PV)
├── total_tasks
├── completed_tasks
└── last_updated
```

---

## Tabel Definisi Detail

### 1. users

**Purpose:** User authentication dan role-based access control

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | User ID |
| name | VARCHAR(255) | NOT NULL | User full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email (login identifier) |
| role | ENUM | NOT NULL | technician\|manager\|admin |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |

**Relationships:**
- 1 user → N daily_reports (created_by)
- 1 user → N project_assignments
- 1 user → N tasks (assigned_to)
- 1 user → N task_evidence (uploaded_by)
- 1 user → N projects (created_by)

---

### 2. clients

**Purpose:** Master data klien/customer yang memesan proyek

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Client ID |
| name | VARCHAR(255) | NOT NULL | Client name |
| address | TEXT | - | Physical address |
| phone | VARCHAR(20) | - | Contact phone |
| email | VARCHAR(255) | - | Contact email |
| notes | TEXT | - | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Relationships:**
- 1 client → N projects

---

### 3. projects

**Purpose:** Master data proyek yang dikerjakan untuk klien

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Project ID |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | - | Detailed description |
| client_id | INTEGER | FK → clients | Which client ordered |
| start_date | DATE | NOT NULL | Project start date (baseline) |
| end_date | DATE | NOT NULL | Project target end date (baseline) |
| status | ENUM | DEFAULT 'active' | active\|completed\|on_hold |
| project_value | BIGINT | - | Project value in Rupiah |
| phase | ENUM | DEFAULT 'survey' | survey\|execution |
| survey_approved | BOOLEAN | DEFAULT FALSE | Is survey phase approved? |
| created_by | INTEGER | FK → users | Who created project |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP | DEFAULT NOW() ON UPDATE | Last update |

**Key Indexes:**
- INDEX(status, created_at) - For filtering active projects
- INDEX(client_id) - For finding projects by client

**Relationships:**
- 1 project → N tasks
- 1 project → N daily_reports
- 1 project → N project_assignments
- 1 project → 1 project_health
- 1 project → N materials
- 1 project → N budget_items

---

### 4. project_assignments

**Purpose:** Link teknisi/manager ke proyek dengan role tertentu

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Assignment ID |
| project_id | INTEGER | FK → projects, NOT NULL | Project reference |
| user_id | INTEGER | FK → users, NOT NULL | User reference |
| role | ENUM | NOT NULL | technician\|manager |
| assigned_at | TIMESTAMP | DEFAULT NOW() | Assignment date |

**Unique Constraint:** (project_id, user_id) - One role per user per project

**Relationships:**
- 1 project ← N project_assignments → N users

---

### 5. tasks

**Purpose:** Granular work items dalam proyek (untuk Kanban board)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Task ID |
| project_id | INTEGER | FK → projects, NOT NULL | Which project |
| title | VARCHAR(255) | NOT NULL | Task name |
| description | TEXT | - | Task details |
| assigned_to | INTEGER | FK → users, NOT NULL | Assigned technician |
| status | ENUM | DEFAULT 'to_do' | to_do\|working_on_it\|done |
| due_date | DATE | NOT NULL | Task deadline |
| sort_order | INTEGER | - | Order in Kanban board |
| created_at | TIMESTAMP | DEFAULT NOW() | Created date |
| updated_at | TIMESTAMP | DEFAULT NOW() ON UPDATE | Last modified |

**Key Indexes:**
- INDEX(project_id) - For finding tasks by project
- INDEX(assigned_to) - For finding tasks by technician
- INDEX(status) - For Kanban board filtering
- INDEX(due_date) - For finding overdue tasks

**Relationships:**
- 1 task → N task_evidence
- 1 task → N daily_reports (optional, nullable)

---

### 6. task_evidence

**Purpose:** File uploads (photos, documents, screenshots) sebagai bukti kerja

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Evidence ID |
| task_id | INTEGER | FK → tasks, NOT NULL | Which task |
| file_path | VARCHAR(512) | NOT NULL | Relative path on disk |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_type | VARCHAR(50) | - | MIME type (image/png, etc) |
| file_size | INTEGER | - | Size in bytes |
| uploaded_by | INTEGER | FK → users, NOT NULL | Who uploaded |
| created_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

**Storage Location:** `server/uploads/` directory

**Relationships:**
- N task_evidence ← 1 task

---

### 7. materials

**Purpose:** Tracking material/component yang digunakan per project

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Material ID |
| project_id | INTEGER | FK → projects, NOT NULL | Which project |
| name | VARCHAR(255) | NOT NULL | Material/component name |
| quantity | DECIMAL(10,2) | NOT NULL | Quantity needed |
| unit | VARCHAR(50) | NOT NULL | Unit (pcs, meter, kg, etc) |
| unit_price | BIGINT | - | Price per unit (Rupiah) |
| notes | TEXT | - | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Relationships:**
- N materials ← 1 project

---

### 8. budget_items

**Purpose:** Budget tracking per project

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Budget Item ID |
| project_id | INTEGER | FK → projects, NOT NULL | Which project |
| description | VARCHAR(255) | NOT NULL | Item description |
| category | VARCHAR(100) | - | Category (labor, material, etc) |
| amount | BIGINT | NOT NULL | Amount in Rupiah |
| notes | TEXT | - | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation date |

**Relationships:**
- N budget_items ← 1 project

---

### 9. daily_reports

**Purpose:** Core input dari teknisi - daily progress tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Report ID |
| project_id | INTEGER | FK → projects, NOT NULL | Which project |
| task_id | INTEGER | FK → tasks, NULLABLE | Optional task reference |
| report_date | DATE | NOT NULL | Date of report |
| progress_percentage | DECIMAL(5,2) | NOT NULL | Earned Value (0-100) |
| constraints | TEXT | - | Kendala/obstacles encountered |
| notes | TEXT | - | Additional comments |
| created_by | INTEGER | FK → users, NOT NULL | Reporting technician |
| created_at | TIMESTAMP | DEFAULT NOW() | Submission timestamp |

**Key Indexes:**
- INDEX(project_id, report_date) - For SPI calculation
- INDEX(created_by) - For technician's reports

**Relationships:**
- N daily_reports ← 1 project
- N daily_reports ← 1 task (optional)
- N daily_reports ← 1 user

**Important Note:**
Daily report adalah **explicit input dari teknisi** - tidak auto-generated dari task status. Ini memungkinkan granular tracking per report, bukan per task.

---

### 10. project_health (DENORMALIZED)

**Purpose:** Pre-calculated metrics untuk dashboard display (performance optimization)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| project_id | BIGINT | PK, FK → projects | Project reference |
| spi_value | DECIMAL(5,2) | NOT NULL | Calculated SPI value |
| status | ENUM | NOT NULL | green\|amber\|red (RAG) |
| deviation_percent | DECIMAL(5,2) | - | (EV - PV) / PV × 100 |
| actual_progress | DECIMAL(5,2) | - | Latest EV % |
| planned_progress | DECIMAL(5,2) | - | Latest PV % |
| total_tasks | INTEGER | - | Total tasks in project |
| completed_tasks | INTEGER | - | Count of done tasks |
| last_updated | TIMESTAMP | DEFAULT NOW() ON UPDATE | Recalc timestamp |

**Update Trigger:**
- AUTO-UPDATE whenever daily_report is created/updated
- Backend logic calculate SPI and set status
- Query dashboard dari tabel ini (faster than aggregate query)

**Relationships:**
- 1 project_health ← 1 project

---

## Database Relationships Summary

### One-to-Many (1:N)
- 1 Client → N Projects
- 1 Project → N Tasks
- 1 Project → N Daily Reports
- 1 Project → N Project Assignments
- 1 Project → N Materials
- 1 Project → N Budget Items
- 1 Task → N Task Evidence
- 1 User → N Tasks (assigned_to)
- 1 User → N Daily Reports (created_by)

### One-to-One (1:1)
- 1 Project → 1 Project Health (denormalized cache)

### Many-to-Many (N:N)
- Projects ←[Project Assignments]→ Users

---

## SQL Queries for Key Operations

### Calculate SPI for Dashboard

```sql
SELECT 
  p.id,
  p.name,
  -- Planned Value: (Days Elapsed / Total Duration) * 100
  LEAST(
    ((CURRENT_DATE - p.start_date)::numeric / 
     (p.end_date - p.start_date)::numeric * 100),
    100
  ) AS planned_value,
  
  -- Earned Value: Latest progress from daily_reports
  COALESCE(
    (SELECT progress_percentage 
     FROM daily_reports 
     WHERE project_id = p.id 
     ORDER BY report_date DESC 
     LIMIT 1),
    0
  ) AS earned_value,
  
  -- SPI Calculation
  CASE 
    WHEN COALESCE(
      (SELECT progress_percentage 
       FROM daily_reports 
       WHERE project_id = p.id 
       ORDER BY report_date DESC 
       LIMIT 1),
      0
    ) = 0 THEN 0
    ELSE ROUND(
      COALESCE(
        (SELECT progress_percentage 
         FROM daily_reports 
         WHERE project_id = p.id 
         ORDER BY report_date DESC 
         LIMIT 1),
        0
      ) / 
      LEAST(
        ((CURRENT_DATE - p.start_date)::numeric / 
         (p.end_date - p.start_date)::numeric * 100),
        100
      ),
      2
    )
  END AS spi_value,
  
  -- Health Status Categorization
  CASE 
    WHEN ROUND(
      COALESCE(
        (SELECT progress_percentage 
         FROM daily_reports 
         WHERE project_id = p.id 
         ORDER BY report_date DESC 
         LIMIT 1),
        0
      ) / 
      LEAST(
        ((CURRENT_DATE - p.start_date)::numeric / 
         (p.end_date - p.start_date)::numeric * 100),
        100
      ),
      2
    ) >= 0.95 THEN 'green'
    WHEN ROUND(
      COALESCE(
        (SELECT progress_percentage 
         FROM daily_reports 
         WHERE project_id = p.id 
         ORDER BY report_date DESC 
         LIMIT 1),
        0
      ) / 
      LEAST(
        ((CURRENT_DATE - p.start_date)::numeric / 
         (p.end_date - p.start_date)::numeric * 100),
        100
      ),
      2
    ) >= 0.85 THEN 'amber'
    ELSE 'red'
  END AS health_status

FROM projects p
WHERE p.status = 'active'
ORDER BY 
  CASE health_status
    WHEN 'red' THEN 1
    WHEN 'amber' THEN 2
    WHEN 'green' THEN 3
  END,
  p.name ASC;
```

### Get Tasks for Kanban Board

```sql
SELECT 
  t.id,
  t.project_id,
  t.title,
  t.status,
  t.assigned_to,
  u.name AS assigned_user,
  t.due_date,
  -- Computed: Is this task overdue and still in progress?
  CASE 
    WHEN t.status = 'working_on_it' AND t.due_date < CURRENT_DATE THEN 'overtime'
    WHEN t.status = 'to_do' AND t.due_date < CURRENT_DATE THEN 'over_deadline'
    ELSE 'normal'
  END AS computed_status,
  COUNT(te.id) AS evidence_count
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN task_evidence te ON t.id = te.task_id
WHERE t.project_id = $1
GROUP BY t.id, t.assigned_to, u.name
ORDER BY t.sort_order ASC;
```

---

## Data Integrity Constraints

### Primary Keys
- Semua tabel memiliki PK (surrogate key dengan SERIAL)

### Foreign Keys
- Semua FK dengan ON DELETE CASCADE atau ON DELETE SET NULL (sesuai context)

### Unique Constraints
- users.email - Email unik per user
- project_assignments - (project_id, user_id) unik

### Check Constraints
- projects.start_date < projects.end_date
- daily_reports.progress_percentage BETWEEN 0 AND 100
- materials.quantity > 0
- budget_items.amount >= 0

### NOT NULL Constraints
- Semua foreign keys NOT NULL (kecuali task_id di daily_reports)
- Identitas data (name, email) NOT NULL

---

## Indexing Strategy

### High-Frequency Queries
```sql
CREATE INDEX idx_projects_status_date ON projects(status, created_at DESC);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_daily_reports_project_date ON daily_reports(project_id, report_date DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### Rationale
- projects(status): Filter active projects untuk dashboard
- tasks(project_id, status): Kanban board filtering
- daily_reports(project_id, report_date): SPI calculation
- users(email): Authentication lookups
- tasks(due_date): Find overdue tasks

---

## Normalization Level

**Normal Form:** BCNF (Boyce-Codd Normal Form) dengan exception untuk denormalization

### Exceptions:
1. **project_health** tabel - DENORMALIZED untuk performance
   - Cache pre-calculated metrics
   - UPDATE trigger saat daily_report disubmit
   - Rationale: Dashboard queries harus sangat cepat (100+ projects)

### Benefits of This Design:
- Eliminate redundancy (3NF base design)
- Maintain data consistency (FK constraints)
- Optimize dashboard queries (denormalized cache)
- Flexible reporting (task-level tracking)

