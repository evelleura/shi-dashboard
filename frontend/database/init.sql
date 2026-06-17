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

  -- 2. CLIENTS
  INSERT INTO tb_klien (nama_klien, alamat, no_telp, email, notes, created_by) VALUES
    ('PT Citra Raya Development', 'Jl. Magelang Km 12, Sleman, Yogyakarta', '0274-123456', 'info@citraraya.co.id', 'Developer perumahan premium di kawasan Sleman. Kontrak 3 tahun.', 2),
    ('Bank BPD DIY', 'Jl. Tentara Pelajar No. 7, Yogyakarta', '0274-562811', 'humas@bpddiy.co.id', 'Kantor pusat BPD DIY. Proyek keamanan gedung 4 lantai.', 2),
    ('Bp. Haryanto', 'Villa Kaliurang Blok C-15, Sleman', '081234567890', 'haryanto@gmail.com', 'Pemilik villa di kawasan Kaliurang. Ingin automasi lengkap.', 2),
    ('PT Logistik Nusantara', 'Jl. Ring Road Utara No. 88, Yogyakarta', '0274-789012', 'ops@logistiknusantara.co.id', 'Perusahaan logistik nasional. Butuh monitoring gudang 24/7.', 2),
    ('Hotel Melia Yogyakarta', 'Jl. Adisucipto No. 2, Yogyakarta', '0274-566353', 'engineering@meliayogya.com', 'Hotel bintang 5. Proyek smart lighting 120 kamar + area publik.', 3),
    ('RS PKU Muhammadiyah', 'Jl. KH. Ahmad Dahlan No. 20, Yogyakarta', '0274-512653', 'teknik@pkumuh.co.id', 'Rumah sakit tipe A. Monitoring suhu ruang operasi dan farmasi.', 3),
    ('Pemkot Yogyakarta - Dishub', 'Jl. Kenari No. 56, Yogyakarta', '0274-515865', 'dishub@jogjakota.go.id', 'Pemerintah Kota Yogyakarta. Proyek smart traffic monitoring.', 2),
    ('Ibu Ratna Dewi', 'Perum Grand Ambarukmo B-7, Depok, Sleman', '087812345678', 'ratnadewi@yahoo.com', 'Klien residensial. Proyek kecil smart home 1 unit.', 3);

  -- 3. PROJECTS (P1..P10 - cakup semua status/fase/health)
  INSERT INTO tb_proyek (project_code, nama_proyek, description, id_klien, start_date, end_date, status, phase, category, project_value, survey_approved, survey_approved_by, survey_approved_at, target_description, created_by) VALUES
    ('SHI-2601001','Smart Home IoT - Perumahan Citra Raya','Instalasi sistem smart home lengkap di 10 unit rumah kawasan Citra Raya',1, CURRENT_DATE - 60, CURRENT_DATE + 30,'active','execution','instalasi',150000000,TRUE,2,CURRENT_DATE - 58,'Smart lock, lighting control, CCTV terintegrasi untuk 10 unit rumah',2),
    ('SHI-2601002','CCTV & Security System - Kantor BPD DIY','Pemasangan 32 kamera CCTV dan access control di kantor BPD DIY',2, CURRENT_DATE - 30, CURRENT_DATE + 60,'active','execution','security',85000000,TRUE,2,CURRENT_DATE - 28,'Pemasangan 32 kamera CCTV, NVR, dan access control di 4 lantai kantor',2),
    ('SHI-2601003','Smart Home Automation - Villa Kaliurang','Home automation system lengkap di villa premium Kaliurang',3, CURRENT_DATE - 45, CURRENT_DATE + 15,'active','execution','instalasi',45000000,TRUE,2,CURRENT_DATE - 43,'Automasi villa: lighting, curtain, AC, security dengan kontrol mobile',2),
    ('SHI-2602001','IoT Sensor Network - Gudang Logistik','Jaringan sensor IoT untuk monitoring 3 gudang logistik',4, CURRENT_DATE - 20, CURRENT_DATE + 40,'active','execution','monitoring',65000000,TRUE,2,CURRENT_DATE - 18,'Sensor suhu, kelembaban, keamanan di 3 gudang + dashboard terpusat',2),
    ('SHI-2602002','Smart Lighting - Hotel Melia','Sistem smart lighting untuk Hotel Melia Yogyakarta (120 kamar + publik)',5, CURRENT_DATE - 10, CURRENT_DATE + 80,'active','survey','instalasi',200000000,FALSE,NULL,NULL,'Smart lighting lobby, ballroom, koridor, 120 kamar hotel',3),
    ('SHI-2602003','Monitoring Suhu Ruang RS PKU','Monitoring suhu real-time ruang operasi dan farmasi RS PKU',6, CURRENT_DATE - 5, CURRENT_DATE + 55,'active','survey','monitoring',35000000,TRUE,3,CURRENT_DATE - 1,'Sensor suhu + alarm di 4 ruang operasi, 2 ruang farmasi, 1 blood bank',3),
    ('SHI-2601004','Smart Traffic Light - Simpang Tiga Janti','Instalasi smart traffic monitoring di persimpangan Janti',7, CURRENT_DATE - 120, CURRENT_DATE - 20,'completed','execution','monitoring',95000000,TRUE,2,CURRENT_DATE - 115,'CCTV monitoring lalu lintas + sensor counting kendaraan + dashboard',2),
    ('SHI-2601005','Smart Home - Rumah Ibu Ratna','Instalasi smart home sederhana di rumah tinggal',8, CURRENT_DATE - 40, CURRENT_DATE + 20,'on-hold','execution','instalasi',18000000,TRUE,3,CURRENT_DATE - 38,'Smart lock + 4 smart switch + 2 CCTV + 1 gateway',3),
    ('SHI-2603001','Smart Building - Kantor Dishub Yogyakarta','Sistem smart building terintegrasi untuk kantor Dinas Perhubungan',7, CURRENT_DATE - 40, CURRENT_DATE + 50,'active','execution','instalasi',120000000,TRUE,2,CURRENT_DATE - 38,'Lighting automation, AC control, occupancy sensor, energy monitoring',2),
    ('SHI-2603002','CCTV Gudang Farmasi RS PKU','Pemasangan CCTV di area farmasi dan gudang obat RS PKU',6, CURRENT_DATE - 25, CURRENT_DATE + 5,'active','execution','security',22000000,TRUE,3,CURRENT_DATE - 24,'8 kamera CCTV + NVR untuk monitoring gudang obat 24/7',3);

  -- 4. PROJECT ASSIGNMENTS (id_proyek by code, id_user by email)
  INSERT INTO tb_penugasan_proyek (id_proyek, id_user)
  SELECT p.id_proyek, u.id_user FROM tb_proyek p, tb_user u, (VALUES
    ('SHI-2601001','rizky@shi.co.id'),('SHI-2601001','reza@shi.co.id'),
    ('SHI-2601002','andi@shi.co.id'),
    ('SHI-2601003','rizky@shi.co.id'),
    ('SHI-2602001','reza@shi.co.id'),
    ('SHI-2602002','andi@shi.co.id'),('SHI-2602002','fajar@shi.co.id'),
    ('SHI-2602003','hendra@shi.co.id'),
    ('SHI-2601004','fajar@shi.co.id'),('SHI-2601004','andi@shi.co.id'),
    ('SHI-2601005','hendra@shi.co.id'),
    ('SHI-2603001','fajar@shi.co.id'),('SHI-2603001','reza@shi.co.id'),('SHI-2603001','hendra@shi.co.id'),
    ('SHI-2603002','fajar@shi.co.id')
  ) AS a(code, email) WHERE p.project_code = a.code AND u.email = a.email;

  -- 5. TASKS  (status in_progress lama -> working_on_it sesuai naskah 3-status)
  -- P1 Citra Raya (RED)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 2
  FROM tb_proyek p, (VALUES
    ('Survey lokasi & pengukuran','Survey awal seluruh unit rumah','rizky@shi.co.id','done',-50,1,TRUE),
    ('Penarikan kabel jaringan','Kabel UTP dan power untuk controller','rizky@shi.co.id','done',-35,2,FALSE),
    ('Instalasi smart lock','Pemasangan smart lock 10 unit','reza@shi.co.id','done',-20,3,FALSE),
    ('Instalasi lighting control','Smart switch dan dimmer','rizky@shi.co.id','working_on_it',-5,4,FALSE),
    ('Instalasi CCTV per unit','2 kamera CCTV per unit','reza@shi.co.id','working_on_it',5,5,FALSE),
    ('Setup gateway IoT','Konfigurasi gateway + cloud','rizky@shi.co.id','working_on_it',-10,6,FALSE),
    ('Konfigurasi mobile app','Setup dan testing mobile app','reza@shi.co.id','working_on_it',10,7,FALSE),
    ('Testing & QC','Testing menyeluruh tiap unit','reza@shi.co.id','to_do',22,8,FALSE),
    ('Serah terima & training','Serah terima ke penghuni','rizky@shi.co.id','to_do',28,9,FALSE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2601001';

  -- P2 BPD DIY (GREEN)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 2
  FROM tb_proyek p, (VALUES
    ('Survey gedung & titik kamera','Survey 4 lantai','andi@shi.co.id','done',-22,1,TRUE),
    ('Penarikan kabel lantai 1-2','Kabel 16 kamera','andi@shi.co.id','done',-15,2,FALSE),
    ('Penarikan kabel lantai 3-4','Kabel 16 kamera','andi@shi.co.id','done',-8,3,FALSE),
    ('Instalasi kamera lantai 1-2','16 kamera CCTV','andi@shi.co.id','done',-2,4,FALSE),
    ('Instalasi kamera lantai 3-4','16 kamera CCTV','andi@shi.co.id','working_on_it',15,5,FALSE),
    ('Setup NVR & storage','NVR 8TB','andi@shi.co.id','working_on_it',25,6,FALSE),
    ('Instalasi access control','Card reader tiap lantai','andi@shi.co.id','to_do',40,7,FALSE),
    ('Testing & commissioning','Uji recording 24 jam','andi@shi.co.id','to_do',55,8,FALSE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2601002';

  -- P3 Villa Kaliurang (RED kritis)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 2
  FROM tb_proyek p, (VALUES
    ('Survey villa & desain sistem','Survey layout villa','rizky@shi.co.id','done',-38,1,TRUE),
    ('Instalasi panel kontrol utama','Panel automasi','rizky@shi.co.id','working_on_it',-15,2,FALSE),
    ('Instalasi smart curtain & AC','Motor curtain + AC','rizky@shi.co.id','working_on_it',-5,3,FALSE),
    ('Instalasi lighting automation','Smart switch, motion sensor','rizky@shi.co.id','working_on_it',-2,4,FALSE),
    ('Instalasi security system','CCTV, alarm, smart lock','rizky@shi.co.id','working_on_it',5,5,FALSE),
    ('Integrasi & testing','Testing end-to-end','rizky@shi.co.id','to_do',12,6,FALSE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2601003';

  -- P4 Gudang Logistik (AMBER)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 2
  FROM tb_proyek p, (VALUES
    ('Survey gudang & titik sensor','Survey 3 gudang','reza@shi.co.id','done',-12,1,TRUE),
    ('Instalasi sensor gudang 1','8 sensor suhu + 4 keamanan','reza@shi.co.id','working_on_it',5,2,FALSE),
    ('Instalasi sensor gudang 2 & 3','Sensor gudang 2 dan 3','reza@shi.co.id','working_on_it',15,3,FALSE),
    ('Setup gateway & dashboard','Gateway + dashboard','reza@shi.co.id','to_do',28,4,FALSE),
    ('Testing & kalibrasi sensor','Akurasi + threshold alarm','reza@shi.co.id','to_do',35,5,FALSE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2602001';

  -- P5 Hotel Melia (SURVEY belum disetujui)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 3
  FROM tb_proyek p, (VALUES
    ('Survey lobby & ballroom','Survey area lobby','andi@shi.co.id','working_on_it',10,1,TRUE),
    ('Survey koridor & area publik','Survey koridor','fajar@shi.co.id','to_do',15,2,TRUE),
    ('Survey sample kamar hotel','3 tipe kamar','andi@shi.co.id','to_do',20,3,TRUE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2602002';

  -- P6 RS PKU Monitoring (SURVEY disetujui)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 3
  FROM tb_proyek p, (VALUES
    ('Survey ruang operasi','Titik sensor 4 ruang OK','hendra@shi.co.id','done',-2,1,TRUE),
    ('Survey ruang farmasi','Titik sensor ruang farmasi','hendra@shi.co.id','done',-1,2,TRUE),
    ('Buat dokumen RAB','Rencana anggaran biaya','hendra@shi.co.id','working_on_it',5,3,TRUE),
    ('Presentasi hasil survey','Presentasi ke direksi RS','hendra@shi.co.id','to_do',10,4,TRUE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2602003';

  -- P7 Smart Traffic (COMPLETED - semua done)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), 'done', CURRENT_DATE + t.dd, t.so, t.sv, 2
  FROM tb_proyek p, (VALUES
    ('Survey persimpangan','Survey arus lalu lintas','fajar@shi.co.id',-110,1,TRUE),
    ('Pemasangan tiang kamera','4 tiang kamera','andi@shi.co.id',-90,2,FALSE),
    ('Instalasi kamera ANPR','Kamera plat nomor 4 unit','fajar@shi.co.id',-70,3,FALSE),
    ('Setup server & software','Server NVR + counting','fajar@shi.co.id',-50,4,FALSE),
    ('Integrasi dashboard Dishub','Integrasi dashboard','andi@shi.co.id',-35,5,FALSE),
    ('UAT & serah terima','UAT + serah terima','fajar@shi.co.id',-22,6,FALSE)
  ) AS t(nm,ds,em,dd,so,sv) WHERE p.project_code='SHI-2601004';

  -- P8 Rumah Ibu Ratna (ON-HOLD)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 3
  FROM tb_proyek p, (VALUES
    ('Survey rumah','Survey layout rumah','hendra@shi.co.id','done',-35,1,TRUE),
    ('Instalasi smart lock & switch','Smart lock + 4 switch','hendra@shi.co.id','working_on_it',-10,2,FALSE),
    ('Instalasi CCTV','2 kamera outdoor','hendra@shi.co.id','to_do',5,3,FALSE),
    ('Testing & serah terima','Testing + training klien','hendra@shi.co.id','to_do',15,4,FALSE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2601005';

  -- P9 Smart Building Dishub (GREEN besar)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 2
  FROM tb_proyek p, (VALUES
    ('Survey gedung & kebutuhan','Survey 3 lantai','fajar@shi.co.id','done',-35,1,TRUE),
    ('Desain sistem terintegrasi','Desain lighting + AC + sensor','fajar@shi.co.id','done',-28,2,FALSE),
    ('Penarikan kabel data','Kabel seluruh sensor','reza@shi.co.id','done',-22,3,FALSE),
    ('Lighting controller Lt 1','Smart switch lantai 1','fajar@shi.co.id','done',-15,4,FALSE),
    ('Lighting controller Lt 2','Smart switch lantai 2','reza@shi.co.id','done',-10,5,FALSE),
    ('Lighting controller Lt 3','Smart switch lantai 3','hendra@shi.co.id','done',-5,6,FALSE),
    ('Instalasi occupancy sensor','PIR sensor tiap ruang','fajar@shi.co.id','done',-3,7,FALSE),
    ('Instalasi AC controller','24 unit AC','reza@shi.co.id','working_on_it',10,8,FALSE),
    ('Setup energy monitoring','Power meter + dashboard','hendra@shi.co.id','working_on_it',20,9,FALSE),
    ('Konfigurasi BMS gateway','BMS gateway','fajar@shi.co.id','working_on_it',30,10,FALSE),
    ('Integrasi dashboard BMS','Dashboard terpusat','reza@shi.co.id','to_do',40,11,FALSE),
    ('UAT & training operator','Testing + training','hendra@shi.co.id','to_do',48,12,FALSE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2603001';

  -- P10 CCTV Gudang RS PKU (AMBER dekat deadline)
  INSERT INTO tb_tugas (id_proyek, nama_tugas, description, assigned_to, status, due_date, sort_order, is_survey_task, created_by)
  SELECT p.id_proyek, t.nm, t.ds, (SELECT id_user FROM tb_user WHERE email=t.em), t.st, CURRENT_DATE + t.dd, t.so, t.sv, 3
  FROM tb_proyek p, (VALUES
    ('Survey gudang & titik kamera','Survey area farmasi','fajar@shi.co.id','done',-20,1,TRUE),
    ('Instalasi kamera & kabel','8 kamera + kabel','fajar@shi.co.id','working_on_it',-3,2,FALSE),
    ('Setup NVR & konfigurasi','NVR + recording','fajar@shi.co.id','working_on_it',2,3,FALSE),
    ('Testing & serah terima','Testing 24 jam + serah terima','fajar@shi.co.id','to_do',4,4,FALSE)
  ) AS t(nm,ds,em,st,dd,so,sv) WHERE p.project_code='SHI-2603002';

  -- 6. DAILY REPORTS (riwayat progres - cadangan EV)
  INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
  SELECT p.id_proyek, CURRENT_DATE + d.dd, d.pct, d.note, (SELECT id_user FROM tb_user WHERE email=d.em)
  FROM tb_proyek p, (VALUES
    ('SHI-2601001',-40,15.0,'Keterlambatan pengiriman gateway IoT','rizky@shi.co.id'),
    ('SHI-2601001',-20,28.0,'Perangkat datang sebagian','rizky@shi.co.id'),
    ('SHI-2601001',-5,40.0,'Progres lambat, perlu tambahan tenaga','rizky@shi.co.id'),
    ('SHI-2601002',-15,25.0,NULL,'andi@shi.co.id'),
    ('SHI-2601002',-2,48.0,'Mulai instalasi kamera lantai 1-2','andi@shi.co.id'),
    ('SHI-2601003',-20,18.0,'Modul controller salah spek','rizky@shi.co.id'),
    ('SHI-2601003',-1,38.0,'Deadline mendekat, risiko tinggi','rizky@shi.co.id'),
    ('SHI-2603001',-10,45.0,'Lantai 2 selesai, mulai lantai 3','fajar@shi.co.id'),
    ('SHI-2603001',-1,62.0,NULL,'fajar@shi.co.id')
  ) AS d(code,dd,pct,note,em) WHERE p.project_code = d.code;

  -- 7. PROJECT HEALTH (pra-hitung untuk dashboard; recalculateSPI menimpa saat status tugas berubah)
  INSERT INTO project_health (project_id, spi_value, status, actual_progress, planned_progress, total_tasks, completed_tasks, working_tasks, overtime_tasks, overdue_tasks)
  SELECT p.id_proyek, d.spi, d.st, d.ap, d.pp, d.tt, d.ct, d.wt, d.ott, d.ot
  FROM tb_proyek p, (VALUES
    ('SHI-2601001',0.4500,'red',  30.00,66.67, 9,3,4,2,3),
    ('SHI-2601002',1.5000,'green',50.00,33.33, 8,4,2,0,0),
    ('SHI-2601003',0.2222,'red',  16.67,75.00, 6,1,4,3,4),
    ('SHI-2602001',0.6000,'red',  20.00,33.33, 5,1,2,0,0),
    ('SHI-2603001',1.3125,'green',58.33,44.44,12,7,3,0,0),
    ('SHI-2603002',0.3000,'red',  25.00,83.33, 4,1,2,1,1)
  ) AS d(code,spi,st,ap,pp,tt,ct,wt,ott,ot) WHERE p.project_code = d.code;

  -- 8. ESKALASI demo (status open/handled sesuai naskah)
  INSERT INTO tb_eskalasi (id_tugas, id_proyek, reported_by, title, description, status, priority)
  SELECT t.id_tugas, t.id_proyek, t.assigned_to,
    'Gateway IoT firmware tidak kompatibel',
    'Gateway IoT yang dikirim memiliki firmware lama dan tidak bisa konek ke cloud. Butuh penggantian unit.',
    'open','high'
  FROM tb_tugas t JOIN tb_proyek p ON p.id_proyek=t.id_proyek
  WHERE p.project_code='SHI-2601001' AND t.nama_tugas='Setup gateway IoT' LIMIT 1;

  INSERT INTO tb_eskalasi (id_tugas, id_proyek, reported_by, title, description, status, priority)
  SELECT t.id_tugas, t.id_proyek, t.assigned_to,
    'Motor smart curtain butuh adapter custom',
    'Motor curtain tidak cocok dengan rel existing villa. Perlu adapter custom yang harus dipesan.',
    'handled','medium'
  FROM tb_tugas t JOIN tb_proyek p ON p.id_proyek=t.id_proyek
  WHERE p.project_code='SHI-2601003' AND t.nama_tugas='Instalasi smart curtain & AC' LIMIT 1;

  -- 9. TASK ACTIVITIES demo (agar laporan harian/mingguan/bulanan punya data nyata).
  -- Hanya menambah baris task_activities (tak mengubah status tugas) -> SPI aman.
  -- Tanggal relatif ke saat seed: hari ini, awal minggu, awal bulan.
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Tiba di lokasi proyek', 'arrival',
         CURRENT_DATE + TIME '08:05' + (INTERVAL '11 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas LIMIT 5;
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Mulai pengerjaan instalasi', 'start_work',
         CURRENT_DATE + TIME '09:30' + (INTERVAL '13 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas LIMIT 5;
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Dokumentasi foto progres', 'photo',
         CURRENT_DATE + TIME '13:15' + (INTERVAL '17 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas LIMIT 3;
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Tugas selesai dikerjakan', 'complete',
         CURRENT_DATE + TIME '15:40' + (INTERVAL '19 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas LIMIT 2;
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Pengerjaan kabel & perangkat', 'start_work',
         date_trunc('week', CURRENT_DATE) + TIME '10:00' + (INTERVAL '20 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas OFFSET 5 LIMIT 6;
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Catatan kendala material', 'note',
         date_trunc('week', CURRENT_DATE) + INTERVAL '1 day' + TIME '14:00' + (INTERVAL '15 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas OFFSET 9 LIMIT 5;
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Survei & persiapan lokasi', 'note',
         date_trunc('month', CURRENT_DATE) + INTERVAL '3 days' + TIME '09:00' + (INTERVAL '25 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas OFFSET 14 LIMIT 8;
  INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
  SELECT id_tugas, assigned_to, '[seed] Pemasangan perangkat utama', 'complete',
         date_trunc('month', CURRENT_DATE) + INTERVAL '6 days' + TIME '11:00' + (INTERVAL '22 minutes' * row_number() OVER (ORDER BY id_tugas))
  FROM tb_tugas WHERE assigned_to IS NOT NULL ORDER BY id_tugas OFFSET 22 LIMIT 6;

END IF;
END
$seed$;
