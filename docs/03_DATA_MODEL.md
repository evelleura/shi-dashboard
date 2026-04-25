# 3. Data Model & Database Schema

## Entity Relationship Diagram

```
┌──────────────┐
│    users     │◄─────────────────────────────────────────┐
├──────────────┤                                          │
│ id (PK)      │                                          │
│ name         │                    ┌──────────────────┐  │
│ email        │◄─────────┬─────────┤  task_evidence   │  │
│ role         │          │         ├──────────────────┤  │
│ password_hash│          │         │ id (PK)          │  │
│ created_at   │          │         │ task_id (FK)     │  │
└──────────────┘          │         │ file_path        │  │
       ▲                   │         │ file_name        │  │
       │                   │         │ file_type        │  │
       │                   │         │ file_size        │  │
       │                   │         │ uploaded_by (FK)─┼──┘
       │                   │         │ uploaded_at      │
       │                   │         └──────────────────┘
       │                   │
       │        ┌──────────▼──────────┐
       │        │      tasks          │
       │        ├─────────────────────┤
       │        │ id (PK)             │
       │        │ project_id (FK)─────┼────────┐
       │        │ name                │        │
       │        │ assigned_to (FK)────┼────────┼──────┐
       │        │ status              │        │      │
       │        │ due_date            │        │      │
       │        │ budget              │        │      │
       │        │ is_tracking         │        │      │
       │        │ time_spent_seconds  │        │      │
       │        │ created_by (FK)─────┼────────┼──────┼────┐
       │        │ created_at          │        │      │    │
       │        └─────────────────────┘        │      │    │
       │                                       │      │    │
       │        ┌──────────────────────┐      │      │    │
       │        │   project_health     │      │      │    │
       │        ├──────────────────────┤      │      │    │
       │        │ project_id (PK/FK)───┼──────┼─┐    │    │
       │        │ spi_value            │      │ │    │    │
       │        │ status (g/a/r)       │      │ │    │    │
       │        │ deviation_percent    │      │ │    │    │
       │        │ total_tasks          │      │ │    │    │
       │        │ completed_tasks      │      │ │    │    │
       │        │ last_updated         │      │ │    │    │
       │        └──────────────────────┘      │ │    │    │
       │                                       │ │    │    │
       │        ┌──────────────────────┐      │ │    │    │
       │        │    projects          │      │ │    │    │
       │        ├──────────────────────┤      │ │    │    │
       │        │ id (PK)──────────────┼──────┘ │    │    │
       │        │ project_code         │        │    │    │
       │        │ name                 │        │    │    │
       │        │ client_id (FK)───────┼────┐   │    │    │
       │        │ start_date           │    │   │    │    │
       │        │ end_date             │    │   │    │    │
       │        │ status               │    │   │    │    │
       │        │ phase                │    │   │    │    │
       │        │ project_value        │    │   │    │    │
       │        │ created_by (FK)──────┼────┼───┼────┼────┘
       │        │ created_at           │    │   │    │
       │        └──────────────────────┘    │   │    │
       │                                    │   │    │
       │        ┌──────────────────┐        │   │    │
       │        │     clients      │        │   │    │
       │        ├──────────────────┤        │   │    │
       │        │ id (PK)◄─────────┼────────┘   │    │
       │        │ name             │            │    │
       │        │ address          │            │    │
       │        │ phone            │            │    │
       │        │ email            │            │    │
       │        │ created_by (FK)──┼────────────┼────┘
       │        │ created_at       │            │
       │        └──────────────────┘            │
       │                                        │
       │        ┌─────────────────────┐        │
       └────────┤   project_assignments│        │
               ├─────────────────────┤        │
               │ project_id (FK)─────┼────────┘
               │ user_id (FK)────────┘
               │ assigned_at
               └─────────────────────┘

Additional Tables:
├─ materials: project_id (FK), name, quantity, unit, unit_price, total_price (computed)
├─ budget_items: project_id (FK), category, amount, is_actual
├─ daily_reports: project_id (FK), task_id (FK), report_date, progress_percentage
├─ audit_log: entity_type, entity_id, field_name, old_value, new_value, changed_by, created_at
└─ task_activity: task_id (FK), user_id (FK), activity_type, message, created_at
```

---

## Table Definitions

### 1. users

**Purpose:** Stores system users (technicians, managers, admins)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT role_check CHECK (role IN ('technician', 'manager', 'admin'))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | SERIAL | PRIMARY KEY | Unique user identifier |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| role | VARCHAR(50) | CHECK, DEFAULT 'technician' | technician\|manager\|admin |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| created_at | TIMESTAMP | DEFAULT NOW | Account creation time |

---

### 2. clients

**Purpose:** Stores client/customer information

```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_created_by ON clients(created_by);
```

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | SERIAL | PRIMARY KEY | Unique client identifier |
| name | VARCHAR(255) | NOT NULL | Client name |
| address | TEXT | | Full address |
| phone | VARCHAR(50) | | Contact phone |
| email | VARCHAR(255) | | Contact email |
| notes | TEXT | | Additional notes |
| created_by | INT | FK → users | Creator user ID |
| created_at | TIMESTAMP | DEFAULT NOW | Creation timestamp |
| updated_at | TIMESTAMP | | Last modification time |

---

### 3. projects

**Purpose:** Core entity for projects with lifecycle tracking

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  project_code VARCHAR(12) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id INT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INT GENERATED ALWAYS AS (end_date - start_date) STORED,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  phase VARCHAR(50) NOT NULL DEFAULT 'survey',
  project_value DECIMAL(15,2) DEFAULT 0,
  survey_approved BOOLEAN DEFAULT FALSE,
  survey_approved_by INT,
  survey_approved_at TIMESTAMP,
  target_description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (survey_approved_by) REFERENCES users(id),
  CONSTRAINT status_check CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled')),
  CONSTRAINT phase_check CHECK (phase IN ('survey', 'execution')),
  CONSTRAINT date_order CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_phase ON projects(phase);
```

| Column | Type | Purpose | Format |
|---|---|---|---|
| id | SERIAL | Unique project ID | Auto-increment |
| project_code | VARCHAR(12) | Unique code | SHI-YYMMXXX (e.g., SHI-2604001) |
| name | VARCHAR(255) | Project name | User input |
| description | TEXT | Detailed description | User input |
| client_id | INT (FK) | Associated client | Reference to clients.id |
| start_date | DATE | Project start | YYYY-MM-DD |
| end_date | DATE | Project end | YYYY-MM-DD, must be > start_date |
| duration | INT (COMPUTED) | Days from start to end | Auto-calculated |
| status | VARCHAR(50) | Project status | active\|completed\|on-hold\|cancelled |
| phase | VARCHAR(50) | Project phase | survey\|execution |
| project_value | DECIMAL(15,2) | Project budget/value | Rupiah amount |
| survey_approved | BOOLEAN | Survey completion status | true\|false |
| survey_approved_by | INT (FK) | Manager who approved | users.id |
| survey_approved_at | TIMESTAMP | Approval time | Auto-set when approved |
| target_description | TEXT | Survey target | User input |
| created_by | INT (FK) | Creator | users.id |
| created_at | TIMESTAMP | Creation time | Auto-set |
| updated_at | TIMESTAMP | Last update | Auto-set |

**Project Code Generation Algorithm:**
```typescript
// Format: SHI-YYMMXXX
// YY = last 2 digits of year
// MM = month (01-12)
// XXX = sequential number (001-999) per month

// Example: SHI-2604001 = 2026, April, 1st project that month
```

---

### 4. project_assignments

**Purpose:** Many-to-many relationship between projects and technicians

```sql
CREATE TABLE project_assignments (
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Column | Type | Purpose |
|---|---|---|
| project_id | INT (FK, PK) | Project being assigned |
| user_id | INT (FK, PK) | Technician assigned |
| assigned_at | TIMESTAMP | Assignment time |

---

### 5. tasks

**Purpose:** Individual work items within projects

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  assigned_to INT,
  status VARCHAR(50) NOT NULL DEFAULT 'to_do',
  due_date DATE,
  timeline_start DATE,
  timeline_end DATE,
  notes TEXT,
  budget DECIMAL(15,2) DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_survey_task BOOLEAN NOT NULL DEFAULT FALSE,
  timer_started_at TIMESTAMP,
  time_spent_seconds INT DEFAULT 0,
  is_tracking BOOLEAN DEFAULT FALSE,
  estimated_hours DECIMAL(5,1),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT task_status_check CHECK (status IN ('to_do', 'in_progress', 'working_on_it', 'review', 'done'))
);

-- Indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project_order ON tasks(project_id, sort_order);
```

| Column | Type | Purpose | Values |
|---|---|---|---|
| id | SERIAL | Unique task ID | Auto-increment |
| project_id | INT (FK) | Parent project | Reference |
| name | VARCHAR(500) | Task title | User input |
| description | TEXT | Task details | User input |
| assigned_to | INT (FK) | Assigned technician | users.id or NULL |
| status | VARCHAR(50) | Task progress | to_do\|in_progress\|working_on_it\|review\|done |
| due_date | DATE | Deadline | YYYY-MM-DD |
| timeline_start | DATE | Planned start | YYYY-MM-DD |
| timeline_end | DATE | Planned end | YYYY-MM-DD |
| notes | TEXT | Task notes | User input |
| budget | DECIMAL(15,2) | Task budget | Rupiah |
| sort_order | INT | Display order in Kanban | 0+ |
| is_survey_task | BOOLEAN | Is part of survey phase | true\|false |
| timer_started_at | TIMESTAMP | When technician started tracking | Auto-set |
| time_spent_seconds | INT | Total tracked time | Seconds |
| is_tracking | BOOLEAN | Currently being tracked | true\|false |
| estimated_hours | DECIMAL(5,1) | Estimate for planning | Hours |
| created_by | INT (FK) | Creator | users.id |
| created_at | TIMESTAMP | Creation time | Auto-set |
| updated_at | TIMESTAMP | Last update | Auto-set |

**Task Status Workflow:**
```
to_do ──→ in_progress ──→ working_on_it ──→ review ──→ done
         (technician)      (timer enabled)   (manager)  (final)
```

---

### 6. task_evidence

**Purpose:** File uploads as evidence of task completion

```sql
CREATE TABLE task_evidence (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  description TEXT,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  CONSTRAINT evidence_type_check CHECK (file_type IN ('photo', 'document', 'form', 'screenshot', 'other'))
);

-- Indexes
CREATE INDEX idx_evidence_task ON task_evidence(task_id);
CREATE INDEX idx_evidence_uploaded_by ON task_evidence(uploaded_by);
```

| Column | Type | Purpose |
|---|---|---|
| id | SERIAL | Unique evidence ID |
| task_id | INT (FK) | Parent task |
| file_path | VARCHAR(1000) | Server storage path |
| file_name | VARCHAR(500) | Original filename |
| file_type | VARCHAR(50) | photo\|document\|form\|screenshot\|other |
| file_size | INT | Bytes |
| description | TEXT | Optional caption |
| uploaded_by | INT (FK) | Uploader user ID |
| uploaded_at | TIMESTAMP | Upload time |

---

### 7. materials

**Purpose:** Material/equipment tracking per project

```sql
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'pcs',
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_materials_project ON materials(project_id);
```

| Column | Type | Purpose |
|---|---|---|
| id | SERIAL | Material ID |
| project_id | INT (FK) | Parent project |
| name | VARCHAR(500) | Material description |
| quantity | DECIMAL(10,2) | Amount needed |
| unit | VARCHAR(50) | pcs\|meter\|kg\|liter\|etc |
| unit_price | DECIMAL(15,2) | Price per unit (Rupiah) |
| total_price | DECIMAL(15,2) | Computed: quantity × unit_price |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Creation time |

---

### 8. budget_items

**Purpose:** Budget tracking (planned vs actual)

```sql
CREATE TABLE budget_items (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  is_actual BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_budget_project ON budget_items(project_id);
CREATE INDEX idx_budget_is_actual ON budget_items(is_actual);
```

| Column | Type | Purpose |
|---|---|---|
| id | SERIAL | Budget item ID |
| project_id | INT (FK) | Parent project |
| category | VARCHAR(100) | Material\|Labor\|Equipment\|etc |
| description | TEXT | Item description |
| amount | DECIMAL(15,2) | Rupiah amount |
| is_actual | BOOLEAN | Planned (false)\|Actual (true) |
| created_at | TIMESTAMP | Creation time |

---

### 9. project_health

**Purpose:** Denormalized SPI and health status (updated on task changes)

```sql
CREATE TABLE project_health (
  project_id INT PRIMARY KEY,
  spi_value DECIMAL(5,3),
  status VARCHAR(20),
  deviation_percent DECIMAL(5,2),
  actual_progress DECIMAL(5,2),
  planned_progress DECIMAL(5,2),
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  working_tasks INT DEFAULT 0,
  overtime_tasks INT DEFAULT 0,
  overdue_tasks INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_health_status ON project_health(status);
```

| Column | Type | Purpose |
|---|---|---|
| project_id | INT (FK, PK) | Project reference |
| spi_value | DECIMAL(5,3) | Schedule Performance Index (0.000-5.000) |
| status | VARCHAR(20) | green\|amber\|red (computed from SPI) |
| deviation_percent | DECIMAL(5,2) | Variance from planned (-100% to 100%) |
| actual_progress | DECIMAL(5,2) | Percentage complete (0-100) |
| planned_progress | DECIMAL(5,2) | Should be complete by today (0-100) |
| total_tasks | INT | Count of all tasks |
| completed_tasks | INT | Count of done tasks |
| working_tasks | INT | Count of working_on_it tasks |
| overtime_tasks | INT | Count of working_on_it past due |
| overdue_tasks | INT | Count of to_do past due |
| last_updated | TIMESTAMP | When SPI was recalculated |

---

### 10. daily_reports

**Purpose:** Historical progress reports (optional, for audit trail)

```sql
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  task_id INT,
  report_date DATE NOT NULL,
  progress_percentage DECIMAL(5,2),
  constraints TEXT,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_reports_project_date ON daily_reports(project_id, report_date);
```

---

### 11. audit_log

**Purpose:** Track all data changes for accountability

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT NOT NULL,
  entity_name VARCHAR(500),
  action VARCHAR(50) NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by INT NOT NULL,
  changed_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_changed_by ON audit_log(changed_by);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);
```

| Column | Type | Purpose |
|---|---|---|
| id | SERIAL | Log entry ID |
| entity_type | VARCHAR(100) | project\|task\|user\|client\|material |
| entity_id | INT | ID of changed entity |
| entity_name | VARCHAR(500) | Name of entity (denormalized) |
| action | VARCHAR(50) | create\|update\|delete |
| field_name | VARCHAR(100) | Which field changed (null for create/delete) |
| old_value | TEXT | Previous value (JSON if complex) |
| new_value | TEXT | New value (JSON if complex) |
| changed_by | INT (FK) | User who made change |
| changed_by_name | VARCHAR(255) | User name (denormalized) |
| created_at | TIMESTAMP | When change occurred |

---

## Type System (TypeScript)

See `frontend/src/types/index.ts` for complete type definitions. Key types include:

```typescript
type UserRole = 'technician' | 'manager' | 'admin';
type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled';
type ProjectPhase = 'survey' | 'execution';
type HealthStatus = 'green' | 'amber' | 'red';
type TaskStatus = 'to_do' | 'in_progress' | 'working_on_it' | 'review' | 'done';
type EvidenceType = 'photo' | 'document' | 'form' | 'screenshot' | 'other';
```

---

## Data Integrity Constraints

### Foreign Keys
- ✅ All FK relationships have ON DELETE CASCADE or ON DELETE SET NULL
- ✅ Referential integrity enforced at DB level

### Check Constraints
- ✅ role IN ('technician', 'manager', 'admin')
- ✅ status IN ('active', 'completed', 'on-hold', 'cancelled')
- ✅ phase IN ('survey', 'execution')
- ✅ end_date > start_date (projects)
- ✅ task_status IN ('to_do', 'in_progress', 'working_on_it', 'review', 'done')

### Unique Constraints
- ✅ users.email UNIQUE
- ✅ projects.project_code UNIQUE

### Not Null Constraints
- ✅ projects.project_code
- ✅ projects.name, start_date, end_date
- ✅ tasks.project_id, name, status
- ✅ users.name, email, password_hash

---

## Indexing Strategy

### Primary Indexes (for foreign keys)
```sql
idx_users_email           -- Login performance
idx_projects_client       -- Client detail page
idx_projects_status       -- Dashboard filtering
idx_projects_phase        -- Phase-based queries
idx_tasks_project         -- List tasks per project
idx_tasks_assigned        -- Technician workload
idx_tasks_status          -- Status distribution charts
idx_tasks_due_date        -- Overdue detection
idx_tasks_project_order   -- Kanban ordering
```

### Secondary Indexes (for queries)
```sql
idx_clients_name          -- Client search
idx_evidence_task         -- Gallery load
idx_materials_project     -- Material list
idx_budget_project        -- Budget sum
idx_health_status         -- Dashboard sort
idx_audit_entity          -- Audit log filter
```

---

## Performance Optimization Notes

1. **Denormalization:** project_health table updated on task changes for fast dashboard loads
2. **Computed Columns:** duration, total_price auto-calculated, no manual updates
3. **Selective SELECTs:** Dashboard queries only fetch needed columns
4. **Pagination:** Large result sets paginated (audit log, task lists)
5. **Caching:** Frontend caches query results for 5 minutes (TanStack Query)

