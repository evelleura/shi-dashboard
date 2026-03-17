-- PT Smart Home Inovasi Dashboard - PostgreSQL Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT role_check CHECK (role IN ('technician', 'manager', 'admin'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INT GENERATED ALWAYS AS (end_date - start_date) STORED,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT status_check CHECK (status IN ('active', 'completed', 'on-hold'))
);

-- Project technician assignments
CREATE TABLE IF NOT EXISTS project_assignments (
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily reports table
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  report_date DATE NOT NULL,
  progress_percentage DECIMAL(5,2) NOT NULL,
  constraints TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE (project_id, report_date, created_by)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date
  ON daily_reports(project_id, report_date);

-- Project health status table (denormalized for dashboard performance)
CREATE TABLE IF NOT EXISTS project_health (
  project_id INT PRIMARY KEY,
  spi_value DECIMAL(6,4),
  status VARCHAR(50),
  deviation_percent DECIMAL(6,2),
  actual_progress DECIMAL(5,2),
  planned_progress DECIMAL(5,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT health_status_check CHECK (status IN ('green', 'amber', 'red'))
);

-- Seed admin user (password: admin123)
-- password: admin123
INSERT INTO users (name, email, role, password_hash)
VALUES (
  'Administrator',
  'admin@shi.co.id',
  'admin',
  '$2b$10$UGFOrEkQHpQbv5SWlbFs3O8ydQGozEQR1JN/WYTSqAj7wE7x0Jr8O'
) ON CONFLICT (email) DO NOTHING;
