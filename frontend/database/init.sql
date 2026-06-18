-- =====================================================================
-- PT Smart Home Inovasi (SHI) - Skema Basis Data
-- Sesuai Naskah TA Final 4 (Dian Putri Iswandi, 5220311118)
-- Tabel 4.9-4.15 (7 tabel inti, penamaan Bahasa Indonesia) + tabel/kolom
-- pendukung implementasi (fungsional, di luar rincian 7 tabel naskah).
--
-- KONTRAK ALIAS (penting):
--   Tabel inti pakai nama Indonesia (tb_user, tb_proyek, ...). PK/FK induk/
--   kolom deskriptif pakai nama naskah (id_proyek, nama_proyek, id_klien).
--   Handler meng-alias balik ke nama JS (id_proyek AS id, nama AS name) supaya
--   lapisan UI/tipe TS TIDAK berubah. Tabel pendukung (daily_reports,
--   project_health, dst) tetap nama Inggris karena bukan bagian 7 tabel naskah.
--
--   Enum sesuai naskah (persis): role(technician,manager) - Tabel 4.9;
--   tb_tugas.status(to_do,working_on_it,done) - Tabel 4.13;
--   tb_proyek.status(active,completed,on-hold) - Tabel 4.11;
--   tb_eskalasi.status(open,handled,closed) priority(low,medium,high) - Tabel 4.15.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS untuk DDL; seed dibungkus guard
-- "IF NOT EXISTS (SELECT 1 FROM tb_user)" sehingga aman dimuat ulang run.py.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabel 4.9  tb_user  (autentikasi + otorisasi; 2 peran sesuai use case)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_user (
  id_user      SERIAL PRIMARY KEY,
  nama         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(20)  NOT NULL DEFAULT 'teknisi',
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT role_check CHECK (role IN ('teknisi', 'manajer'))
);

-- ---------------------------------------------------------------------
-- Tabel 4.10  tb_klien
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_klien (
  id_klien     SERIAL PRIMARY KEY,
  nama_klien   VARCHAR(255) NOT NULL,
  alamat       TEXT,
  no_telp      VARCHAR(50),
  email        VARCHAR(255),
  notes        TEXT,
  latitude     DECIMAL(10,7),
  longitude    DECIMAL(10,7),
  photo_path   VARCHAR(1000),
  photo_name   VARCHAR(500),
  created_by   INT NOT NULL REFERENCES tb_user(id_user),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_klien_nama ON tb_klien(nama_klien);
CREATE INDEX IF NOT EXISTS idx_klien_created_by ON tb_klien(created_by);

-- ---------------------------------------------------------------------
-- Tabel 4.11  tb_proyek
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_proyek (
  id_proyek          SERIAL PRIMARY KEY,
  project_code       VARCHAR(20) UNIQUE,
  nama_proyek        VARCHAR(255) NOT NULL,
  description        TEXT,
  id_klien           INT REFERENCES tb_klien(id_klien) ON DELETE SET NULL,
  start_date         DATE NOT NULL,
  end_date           DATE NOT NULL,
  duration           INT GENERATED ALWAYS AS (end_date - start_date) STORED,
  status             VARCHAR(20) NOT NULL DEFAULT 'active',
  phase              VARCHAR(20) NOT NULL DEFAULT 'survey',
  category           VARCHAR(50) NOT NULL DEFAULT 'instalasi',
  project_value      DECIMAL(15,2) DEFAULT 0,
  survey_approved    BOOLEAN DEFAULT FALSE,
  survey_approved_by INT REFERENCES tb_user(id_user),
  survey_approved_at TIMESTAMP,
  target_description TEXT,
  created_by         INT NOT NULL REFERENCES tb_user(id_user),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT status_check CHECK (status IN ('active', 'completed', 'on-hold')),
  CONSTRAINT phase_check CHECK (phase IN ('survey', 'execution')),
  CONSTRAINT category_check CHECK (category IN ('instalasi','maintenance','perbaikan','upgrade','monitoring','security','networking','lainnya')),
  CONSTRAINT date_order CHECK (end_date > start_date)
);
CREATE INDEX IF NOT EXISTS idx_proyek_klien ON tb_proyek(id_klien);
CREATE INDEX IF NOT EXISTS idx_proyek_status ON tb_proyek(status);
CREATE INDEX IF NOT EXISTS idx_proyek_phase ON tb_proyek(phase);
CREATE INDEX IF NOT EXISTS idx_proyek_category ON tb_proyek(category);

-- ---------------------------------------------------------------------
-- Tabel 4.12  tb_penugasan_proyek  (M:N user<->proyek)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_penugasan_proyek (
  id_proyek    INT NOT NULL REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  id_user      INT NOT NULL REFERENCES tb_user(id_user) ON DELETE CASCADE,
  assigned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_proyek, id_user)
);

-- ---------------------------------------------------------------------
-- Tabel 4.13  tb_tugas  (status 3 sesuai naskah; in_progress/review tidak dipakai)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_tugas (
  id_tugas           SERIAL PRIMARY KEY,
  id_proyek          INT NOT NULL REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  nama_tugas         VARCHAR(500) NOT NULL,
  description        TEXT,
  assigned_to        INT REFERENCES tb_user(id_user) ON DELETE SET NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'to_do',
  due_date           DATE,
  timeline_start     DATE,
  timeline_end       DATE,
  notes              TEXT,
  sort_order         INT NOT NULL DEFAULT 0,
  is_survey_task     BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent_seconds INT DEFAULT 0,
  estimated_hours    DECIMAL(5,1),
  depends_on         INT REFERENCES tb_tugas(id_tugas) ON DELETE SET NULL,
  status_changed_at  TIMESTAMP DEFAULT NOW(),
  created_by         INT NOT NULL REFERENCES tb_user(id_user),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT task_status_check CHECK (status IN ('to_do', 'working_on_it', 'done'))
);
CREATE INDEX IF NOT EXISTS idx_tugas_proyek ON tb_tugas(id_proyek);
CREATE INDEX IF NOT EXISTS idx_tugas_assigned ON tb_tugas(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tugas_status ON tb_tugas(status);
CREATE INDEX IF NOT EXISTS idx_tugas_due_date ON tb_tugas(due_date);
CREATE INDEX IF NOT EXISTS idx_tugas_proyek_order ON tb_tugas(id_proyek, sort_order);

-- ---------------------------------------------------------------------
-- Tabel 4.14  tb_bukti  (evidence per tugas)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_bukti (
  id_bukti     SERIAL PRIMARY KEY,
  id_tugas     INT NOT NULL REFERENCES tb_tugas(id_tugas) ON DELETE CASCADE,
  file_path    VARCHAR(1000) NOT NULL,
  file_name    VARCHAR(500) NOT NULL,
  file_type    VARCHAR(50) NOT NULL,
  file_size    INT NOT NULL DEFAULT 0,
  description  TEXT,
  uploaded_by  INT NOT NULL REFERENCES tb_user(id_user),
  uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT evidence_type_check CHECK (file_type IN ('photo','document','form','screenshot','other'))
);
CREATE INDEX IF NOT EXISTS idx_bukti_tugas ON tb_bukti(id_tugas);
CREATE INDEX IF NOT EXISTS idx_bukti_uploaded_by ON tb_bukti(uploaded_by);

-- ---------------------------------------------------------------------
-- Tabel 4.15  tb_eskalasi  (status open/handled/closed, priority low/medium/high)
-- action_request_* + file_* = kolom fungsional pendukung (di luar rincian naskah)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_eskalasi (
  id_eskalasi           SERIAL PRIMARY KEY,
  id_tugas              INT NOT NULL REFERENCES tb_tugas(id_tugas) ON DELETE CASCADE,
  id_proyek             INT NOT NULL REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  reported_by           INT NOT NULL REFERENCES tb_user(id_user),
  title                 VARCHAR(500) NOT NULL,
  description           TEXT NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'open',
  priority              VARCHAR(20) NOT NULL DEFAULT 'medium',
  file_path             VARCHAR(1000),
  file_name             VARCHAR(500),
  file_type             VARCHAR(50),
  file_size             INT DEFAULT 0,
  resolved_by           INT REFERENCES tb_user(id_user),
  resolved_at           TIMESTAMP,
  resolution_notes      TEXT,
  action_request        VARCHAR(30),
  action_request_note   TEXT,
  action_request_status VARCHAR(15),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT escalation_status_check CHECK (status IN ('open','handled','closed')),
  CONSTRAINT escalation_priority_check CHECK (priority IN ('low','medium','high'))
);
CREATE INDEX IF NOT EXISTS idx_eskalasi_tugas ON tb_eskalasi(id_tugas);
CREATE INDEX IF NOT EXISTS idx_eskalasi_proyek ON tb_eskalasi(id_proyek);
CREATE INDEX IF NOT EXISTS idx_eskalasi_status ON tb_eskalasi(status);
CREATE INDEX IF NOT EXISTS idx_eskalasi_reported_by ON tb_eskalasi(reported_by);

-- ---------------------------------------------------------------------
-- escalation_updates  (utas komunikasi eskalasi - pendukung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escalation_updates (
  id            SERIAL PRIMARY KEY,
  escalation_id INT NOT NULL REFERENCES tb_eskalasi(id_eskalasi) ON DELETE CASCADE,
  author_id     INT NOT NULL REFERENCES tb_user(id_user),
  message       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_esc_updates_esc ON escalation_updates(escalation_id);

-- ---------------------------------------------------------------------
-- daily_reports  (sumber EV cadangan saat proyek 0 tugas - pendukung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_reports (
  id                  SERIAL PRIMARY KEY,
  project_id          INT NOT NULL REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  task_id             INT REFERENCES tb_tugas(id_tugas) ON DELETE SET NULL,
  report_date         DATE NOT NULL,
  progress_percentage DECIMAL(5,2) NOT NULL,
  constraints         TEXT,
  created_by          INT NOT NULL REFERENCES tb_user(id_user),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT progress_range CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE (project_id, report_date, created_by)
);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date ON daily_reports(project_id, report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_task ON daily_reports(task_id);
-- Catatan kendala harian boleh TANPA persentase (keputusan proyek: EV diturunkan
-- dari status tugas, bukan input manual). progress_percentage jadi nullable;
-- CHECK progress_range tetap lolos saat NULL. Idempotent: DROP NOT NULL aman diulang.
ALTER TABLE daily_reports ALTER COLUMN progress_percentage DROP NOT NULL;

-- ---------------------------------------------------------------------
-- project_health  (denormalisasi EWS untuk performa dashboard - pendukung;
-- kelas KesehatanProyek Tabel 4.5, tanpa tabel fisik di rincian 7 tabel naskah)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_health (
  project_id        INT PRIMARY KEY REFERENCES tb_proyek(id_proyek) ON DELETE CASCADE,
  spi_value         DECIMAL(6,4),
  status            VARCHAR(20),
  actual_progress   DECIMAL(5,2),
  planned_progress  DECIMAL(5,2),
  total_tasks       INT DEFAULT 0,
  completed_tasks   INT DEFAULT 0,
  working_tasks     INT DEFAULT 0,
  overtime_tasks    INT DEFAULT 0,
  overdue_tasks     INT DEFAULT 0,
  last_updated      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT health_status_check CHECK (status IN ('green','amber','red'))
);

-- ---------------------------------------------------------------------
-- task_activities  (linimasa aktivitas teknisi - pendukung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_activities (
  id            SERIAL PRIMARY KEY,
  task_id       INT NOT NULL REFERENCES tb_tugas(id_tugas) ON DELETE CASCADE,
  user_id       INT NOT NULL REFERENCES tb_user(id_user),
  message       TEXT NOT NULL,
  activity_type VARCHAR(50) NOT NULL DEFAULT 'note',
  file_path     VARCHAR(1000),
  file_name     VARCHAR(500),
  file_type     VARCHAR(50),
  file_size     INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT activity_type_check CHECK (activity_type IN ('arrival','start_work','pause','resume','note','photo','complete'))
);
CREATE INDEX IF NOT EXISTS idx_activities_task ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON task_activities(user_id);

-- ---------------------------------------------------------------------
-- audit_log  (jejak perubahan oleh manajer - pendukung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       INT NOT NULL,
  entity_name     VARCHAR(255),
  action          VARCHAR(50) NOT NULL,
  field_name      VARCHAR(100),
  old_value       TEXT,
  new_value       TEXT,
  changed_by      INT NOT NULL REFERENCES tb_user(id_user),
  changed_by_name VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(changed_by);

-- ---------------------------------------------------------------------
-- notifications  (notifikasi real-time teknisi - pendukung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES tb_user(id_user) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  entity_type VARCHAR(50),
  entity_id   INT,
  project_id  INT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =====================================================================
-- SEED DATA (demo sidang). Guard: hanya jalan saat tb_user kosong supaya
-- run.py aman memuat ulang skema ini berkali-kali (idempotent).
-- Semua password: 'password123'
-- =====================================================================
DO $seed$
BEGIN
IF NOT EXISTS (SELECT 1 FROM tb_user) THEN

  -- 1. USERS (3 manajer, 5 teknisi). 'admin@shi.co.id' kini berperan manager.
  INSERT INTO tb_user (nama, email, password, role) VALUES
    ('Administrator SHI', 'admin@shi.co.id',  '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'manajer'),
    ('Budi Santoso',      'budi@shi.co.id',   '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'manajer'),
    ('Diana Kusuma',      'diana@shi.co.id',  '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'manajer'),
    ('Rizky Ramadhan',    'rizky@shi.co.id',  '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'teknisi'),
    ('Andi Wijaya',       'andi@shi.co.id',   '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'teknisi'),
    ('Reza Pratama',      'reza@shi.co.id',   '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'teknisi'),
    ('Fajar Nugroho',     'fajar@shi.co.id',  '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'teknisi'),
    ('Hendra Saputra',    'hendra@shi.co.id', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6', 'teknisi');

  -- Data operasional (klien/proyek/tugas/laporan/eskalasi/aktivitas) DIPINDAH ke
  -- seed.sql (digenerate frontend/database/generate_seed.py, dimuat run.py setelah
  -- skema). init.sql kini = SKEMA + 8 staf dasar saja (admin/budi/diana + 5 teknisi).

END IF;
END
$seed$;
