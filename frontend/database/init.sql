-- =============================================================
-- PT Smart Home Inovasi (SHI) — Skema Basis Data
-- Sesuai Naskah TA Final 4 (Dian Putri Iswandi, 5220311118)
-- Tabel 4.9–4.15 + tabel pendukung pada BAB V Implementasi
-- =============================================================

-- -------------------------------------------------------------
-- Tabel 4.9  tb_user
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_user (
  id_user       BIGSERIAL PRIMARY KEY,
  nama          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('technician','manager')),
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Tabel 4.10  tb_klien
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_klien (
  id_klien      BIGSERIAL PRIMARY KEY,
  nama_klien    VARCHAR(255) NOT NULL,
  alamat        VARCHAR(255),
  no_telp       VARCHAR(20),
  email         VARCHAR(255) UNIQUE,
  id_user       BIGINT NOT NULL REFERENCES tb_user(id_user),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Tabel 4.11  tb_proyek
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_proyek (
  id_proyek       BIGSERIAL PRIMARY KEY,
  nama_proyek     VARCHAR(255) NOT NULL,
  id_klien        BIGINT REFERENCES tb_klien(id_klien) ON DELETE SET NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','completed','on-hold')),
  phase           VARCHAR(20) NOT NULL DEFAULT 'survey'
                  CHECK (phase IN ('survey','execution')),
  id_user         BIGINT NOT NULL REFERENCES tb_user(id_user),
  -- Kolom tambahan untuk implementasi BAB V (Gambar 5.13)
  project_code    VARCHAR(32) UNIQUE,
  description     TEXT,
  category        VARCHAR(50),
  project_value   NUMERIC(15,2) DEFAULT 0,
  survey_approved BOOLEAN DEFAULT FALSE,
  created_by      BIGINT REFERENCES tb_user(id_user),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_proyek_status ON tb_proyek(status);
CREATE INDEX IF NOT EXISTS idx_proyek_klien  ON tb_proyek(id_klien);

-- -------------------------------------------------------------
-- Tabel 4.12  tb_penugasan_proyek
-- (PDF: PK=id_tugas, FK id_proyek, FK assigned_to → di sini disesuaikan
--  menjadi junction proyek↔user dengan PK kompak id_penugasan)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_penugasan_proyek (
  id_penugasan  BIGSERIAL PRIMARY KEY,
  id_proyek     BIGINT NOT NULL REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  id_user       BIGINT NOT NULL REFERENCES tb_user(id_user)     ON DELETE CASCADE,
  assigned_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_proyek, id_user)
);

-- -------------------------------------------------------------
-- Tabel 4.13  tb_tugas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_tugas (
  id_tugas      BIGSERIAL PRIMARY KEY,
  id_proyek     BIGINT NOT NULL REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  id_user       BIGINT REFERENCES tb_user(id_user) ON DELETE SET NULL,
  nama_tugas    VARCHAR(255) NOT NULL,
  due_date      DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'to_do'
                CHECK (status IN ('to_do','working_on','done')),
  sort_order    INT NOT NULL DEFAULT 0,
  created_by    BIGINT REFERENCES tb_user(id_user),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tugas_proyek ON tb_tugas(id_proyek);
CREATE INDEX IF NOT EXISTS idx_tugas_user   ON tb_tugas(id_user);
CREATE INDEX IF NOT EXISTS idx_tugas_status ON tb_tugas(status);

-- -------------------------------------------------------------
-- Tabel 4.14  tb_bukti
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_bukti (
  id_bukti      BIGSERIAL PRIMARY KEY,
  id_tugas      BIGINT NOT NULL REFERENCES tb_tugas(id_tugas) ON DELETE CASCADE,
  file_path     VARCHAR(500) NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  file_type     VARCHAR(50)  NOT NULL,
  file_size     BIGINT NOT NULL DEFAULT 0,
  uploaded_by   BIGINT REFERENCES tb_user(id_user),
  uploaded_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bukti_tugas ON tb_bukti(id_tugas);

-- -------------------------------------------------------------
-- Tabel 4.15  tb_eskalasi
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_eskalasi (
  id_eskalasi   BIGSERIAL PRIMARY KEY,
  id_tugas      BIGINT NOT NULL REFERENCES tb_tugas(id_tugas) ON DELETE CASCADE,
  id_user       BIGINT NOT NULL REFERENCES tb_user(id_user),
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  priority      VARCHAR(10) NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high')),
  status        VARCHAR(15) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','ditangani','closed')),
  instruksi     TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eskalasi_tugas  ON tb_eskalasi(id_tugas);
CREATE INDEX IF NOT EXISTS idx_eskalasi_status ON tb_eskalasi(status);

-- -------------------------------------------------------------
-- project_health (Tabel 4.6 + Gambar 5.17 UPSERT)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_health (
  project_id        BIGINT PRIMARY KEY REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  spi_value         NUMERIC(6,4),
  status            VARCHAR(10) CHECK (status IN ('green','amber','red')),
  actual_progress   NUMERIC(5,2) DEFAULT 0,
  planned_progress  NUMERIC(5,2) DEFAULT 0,
  total_tasks       INT DEFAULT 0,
  completed_tasks   INT DEFAULT 0,
  working_tasks     INT DEFAULT 0,
  overtime_tasks    INT DEFAULT 0,
  overdue_tasks     INT DEFAULT 0,
  last_updated      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- daily_reports  (Gambar 5.11 — LATERAL pada dashboard EWS)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_reports (
  id                    BIGSERIAL PRIMARY KEY,
  project_id            BIGINT NOT NULL REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  task_id               BIGINT REFERENCES tb_tugas(id_tugas) ON DELETE SET NULL,
  report_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_percentage   NUMERIC(5,2) NOT NULL
                        CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  constraints           TEXT,
  created_by            BIGINT NOT NULL REFERENCES tb_user(id_user),
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, report_date, created_by)
);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON daily_reports(project_id, report_date DESC);

-- -------------------------------------------------------------
-- task_activities (Gambar 5.15 — linimasa aktivitas teknisi)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_activities (
  id              BIGSERIAL PRIMARY KEY,
  task_id         BIGINT NOT NULL REFERENCES tb_tugas(id_tugas) ON DELETE CASCADE,
  user_id         BIGINT NOT NULL REFERENCES tb_user(id_user),
  message         TEXT NOT NULL,
  activity_type   VARCHAR(20) NOT NULL DEFAULT 'note'
                  CHECK (activity_type IN ('arrival','start_work','note','photo','complete','pause','resume')),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activities_task ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON task_activities(user_id);

-- =============================================================
-- Seed data demo
-- Password default semua user: "password123"
-- Hash bcrypt: $2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6
-- =============================================================
INSERT INTO tb_user (nama, email, password, role) VALUES
  ('Budi Santoso',  'manajer@shi.co.id', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'manager'),
  ('Roni Pratama',  'roni@shi.co.id',    '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'technician'),
  ('Andi Wijaya',   'andi@shi.co.id',    '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'technician')
ON CONFLICT (email) DO NOTHING;

INSERT INTO tb_klien (nama_klien, alamat, no_telp, email, id_user) VALUES
  ('PT Citra Raya Development', 'Jl. Cendrawasih 12, Sleman', '0274111111', 'pic@citraraya.co.id', 1),
  ('Bp. Suryo Prabowo',         'Jl. Kaliurang KM 7, Sleman', '081234567', 'suryo@example.com',    1),
  ('PT Sinar Mas Agro',         'Jl. Magelang KM 5, Sleman',  '0274222222', 'office@sinarmas.id',  1)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tb_proyek (nama_proyek, id_klien, start_date, end_date, status, phase, id_user, project_code, description, category, project_value, created_by)
VALUES
  ('Smart Home IoT - Perumahan Citra Raya', 1, CURRENT_DATE - 30, CURRENT_DATE + 60, 'active',    'execution', 1, 'PRJ-0001', 'Instalasi sensor IoT 30 unit', 'instalasi',  35000000, 1),
  ('Smart Villa Premium - Bp. Suryo',       2, CURRENT_DATE - 10, CURRENT_DATE + 80, 'active',    'survey',    1, 'PRJ-0002', 'Survey instalasi villa premium', 'instalasi', 75000000, 1),
  ('Solar Panel Monitoring - Sinar Mas',    3, CURRENT_DATE - 20, CURRENT_DATE + 40, 'active',    'execution', 1, 'PRJ-0003', 'Monitoring 48 panel surya',     'monitoring', 50000000, 1)
ON CONFLICT (project_code) DO NOTHING;

INSERT INTO tb_penugasan_proyek (id_proyek, id_user) VALUES
  (1, 2), (1, 3), (2, 2), (3, 3)
ON CONFLICT DO NOTHING;

INSERT INTO tb_tugas (id_proyek, id_user, nama_tugas, due_date, status, created_by) VALUES
  (1, 2, 'Instalasi smart lock unit 1',  CURRENT_DATE + 2,  'done',         1),
  (1, 2, 'Instalasi sensor pintu unit 1',CURRENT_DATE + 4,  'working_on',   1),
  (1, 3, 'Konfigurasi hub IoT',          CURRENT_DATE + 7,  'to_do',        1),
  (2, 2, 'Survey lokasi villa',          CURRENT_DATE - 1,  'working_on',   1),
  (3, 3, 'Pemasangan panel 1-12',        CURRENT_DATE + 10, 'done',         1);

INSERT INTO project_health (project_id, spi_value, status, actual_progress, planned_progress, total_tasks, completed_tasks, working_tasks, overdue_tasks)
VALUES
  (1, 0.4500, 'red',    30.00, 66.67, 3, 1, 1, 0),
  (2, 0.8571, 'amber',  60.00, 70.00, 1, 0, 1, 1),
  (3, 1.0500, 'green',  50.00, 47.62, 1, 1, 0, 0)
ON CONFLICT (project_id) DO NOTHING;
