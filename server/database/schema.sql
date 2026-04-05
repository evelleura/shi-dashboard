-- PT Smart Home Inovasi Dashboard - Complete PostgreSQL Schema
-- For fresh installations. Run this once to set up all tables.

-- ============================================================
-- Users table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT role_check CHECK (role IN ('technician', 'manager', 'admin'))
);

-- ============================================================
-- Clients table
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
-- Projects table
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(phase);

-- ============================================================
-- Project technician assignments (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_assignments (
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Tasks table (core work item)
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
  CONSTRAINT task_status_check CHECK (status IN ('to_do', 'working_on_it', 'done'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_order ON tasks(project_id, sort_order);

-- ============================================================
-- Task evidence (file uploads per task)
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
-- Materials table (project material tracking)
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
-- Budget items table (planned vs actual costs)
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
-- Daily reports table
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  task_id INT,
  report_date DATE NOT NULL,
  progress_percentage DECIMAL(5,2) NOT NULL,
  constraints TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE (project_id, report_date, created_by)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date
  ON daily_reports(project_id, report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_task
  ON daily_reports(task_id);

-- ============================================================
-- Project health status (denormalized for dashboard performance)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_health (
  project_id INT PRIMARY KEY,
  spi_value DECIMAL(6,4),
  status VARCHAR(50),
  deviation_percent DECIMAL(6,2),
  actual_progress DECIMAL(5,2),
  planned_progress DECIMAL(5,2),
  total_tasks INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  working_tasks INT DEFAULT 0,
  overtime_tasks INT DEFAULT 0,
  overdue_tasks INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT health_status_check CHECK (status IN ('green', 'amber', 'red'))
);

-- ============================================================
-- Task activities (field journal entries)
-- ============================================================
CREATE TABLE IF NOT EXISTS task_activities (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  activity_type VARCHAR(50) NOT NULL DEFAULT 'note',
  file_path VARCHAR(1000),
  file_name VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT activity_type_check CHECK (activity_type IN (
    'arrival', 'start_work', 'pause', 'resume', 'note', 'photo', 'complete'
  ))
);
CREATE INDEX IF NOT EXISTS idx_activities_task ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON task_activities(user_id);

-- ============================================================
-- Escalations table (field problem reports)
-- ============================================================
CREATE TABLE IF NOT EXISTS escalations (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  project_id INT NOT NULL,
  reported_by INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  file_path VARCHAR(1000),
  file_name VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT DEFAULT 0,
  resolved_by INT,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id),
  CONSTRAINT escalation_status_check CHECK (status IN ('open', 'in_review', 'resolved')),
  CONSTRAINT escalation_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_escalations_task ON escalations(task_id);
CREATE INDEX IF NOT EXISTS idx_escalations_project ON escalations(project_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_reported_by ON escalations(reported_by);

-- ============================================================
-- Seed admin user (password: password123)
-- ============================================================
INSERT INTO users (name, email, role, password_hash)
VALUES (
  'Administrator',
  'admin@shi.co.id',
  'admin',
  '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'
) ON CONFLICT (email) DO NOTHING;
