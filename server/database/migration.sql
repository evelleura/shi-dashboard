-- Migration: Add new tables and columns for SHI Dashboard rewrite
-- Run AFTER initial schema (schema.sql)
-- All operations are idempotent (safe to run multiple times)

BEGIN;

-- ============================================================
-- 1. Create clients table
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
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

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- ============================================================
-- 2. Alter projects table (add new columns)
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id INT REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase VARCHAR(50) NOT NULL DEFAULT 'execution';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS survey_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS survey_approved_by INT REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS survey_approved_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update status constraint to include 'cancelled'
ALTER TABLE projects DROP CONSTRAINT IF EXISTS status_check;
ALTER TABLE projects ADD CONSTRAINT status_check CHECK (status IN ('active', 'completed', 'on-hold', 'cancelled'));

-- Add phase constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS phase_check;
ALTER TABLE projects ADD CONSTRAINT phase_check CHECK (phase IN ('survey', 'execution'));

-- Add date order constraint (only if not exists -- wrapped in DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'date_order'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT date_order CHECK (end_date > start_date);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(phase);

-- ============================================================
-- 3. Create tasks table
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
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
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT task_status_check CHECK (status IN ('to_do', 'working_on_it', 'done', 'stuck'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_order ON tasks(project_id, sort_order);

-- ============================================================
-- 4. Create task_evidence table
-- ============================================================
CREATE TABLE IF NOT EXISTS task_evidence (
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

CREATE INDEX IF NOT EXISTS idx_evidence_task ON task_evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON task_evidence(uploaded_by);

-- ============================================================
-- 5. Create materials table
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
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

CREATE INDEX IF NOT EXISTS idx_materials_project ON materials(project_id);

-- ============================================================
-- 6. Create budget_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS budget_items (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_actual BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budget_project ON budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_category ON budget_items(category);

-- ============================================================
-- 7. Alter daily_reports (add task_id)
-- ============================================================
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS task_id INT REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_daily_reports_task ON daily_reports(task_id);

-- ============================================================
-- 8. Alter project_health (add task counter columns)
-- ============================================================
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS total_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS completed_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS working_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS stuck_tasks INT DEFAULT 0;
ALTER TABLE project_health ADD COLUMN IF NOT EXISTS overdue_tasks INT DEFAULT 0;

-- ============================================================
-- 9. Set existing projects to execution phase with survey approved
-- ============================================================
UPDATE projects SET phase = 'execution', survey_approved = TRUE WHERE phase IS NULL OR phase = 'survey';

-- ============================================================
-- 10. Add project_code column (random string ID for display)
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_code VARCHAR(12);

-- Backfill existing projects with random codes
UPDATE projects SET project_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8))
  WHERE project_code IS NULL;

-- Now make it NOT NULL and UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'projects_project_code_key' AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects ALTER COLUMN project_code SET NOT NULL;
    ALTER TABLE projects ADD CONSTRAINT projects_project_code_key UNIQUE (project_code);
  END IF;
END
$$;

COMMIT;
