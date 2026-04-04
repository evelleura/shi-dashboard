-- ============================================================
-- SHI Dashboard - Comprehensive Seed Data
-- All passwords: 'password123' (bcrypt hash)
-- Covers: all roles, all project phases/statuses, all task statuses,
--         materials, budgets, daily reports, overdue scenarios,
--         SPI ranges (green/amber/red), multi-technician assignments
-- ============================================================

-- ============================================================
-- 1. USERS (1 admin, 2 managers, 5 technicians)
-- ============================================================
INSERT INTO users (name, email, role, password_hash) VALUES
  ('Admin SHI',       'admin@shi.co.id',    'admin',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Budi Santoso',    'budi@shi.co.id',     'manager',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Diana Kusuma',    'diana@shi.co.id',    'manager',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Siti Rahma',      'siti@shi.co.id',     'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Andi Wijaya',     'andi@shi.co.id',     'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Reza Pratama',    'reza@shi.co.id',     'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Fajar Nugroho',   'fajar@shi.co.id',    'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Putri Handayani', 'putri@shi.co.id',    'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 2. CLIENTS (8 clients -- residential, corporate, government, hospitality)
-- ============================================================
INSERT INTO clients (name, address, phone, email, notes, created_by) VALUES
  ('PT Citra Raya Development',
   'Jl. Magelang Km 12, Sleman, Yogyakarta', '0274-123456', 'info@citraraya.co.id',
   'Developer perumahan premium di kawasan Sleman. Kontrak 3 tahun.',
   (SELECT id FROM users WHERE email = 'budi@shi.co.id')),

  ('Bank BPD DIY',
   'Jl. Tentara Pelajar No. 7, Yogyakarta', '0274-562811', 'humas@bpddiy.co.id',
   'Kantor pusat BPD DIY. Proyek keamanan gedung 4 lantai.',
   (SELECT id FROM users WHERE email = 'budi@shi.co.id')),

  ('Bp. Haryanto',
   'Villa Kaliurang Blok C-15, Sleman', '081234567890', 'haryanto@gmail.com',
   'Pemilik villa di kawasan Kaliurang. Ingin automasi lengkap.',
   (SELECT id FROM users WHERE email = 'budi@shi.co.id')),

  ('PT Logistik Nusantara',
   'Jl. Ring Road Utara No. 88, Yogyakarta', '0274-789012', 'ops@logistiknusantara.co.id',
   'Perusahaan logistik nasional. Butuh monitoring gudang 24/7.',
   (SELECT id FROM users WHERE email = 'budi@shi.co.id')),

  ('Hotel Melia Yogyakarta',
   'Jl. Adisucipto No. 2, Yogyakarta', '0274-566353', 'engineering@meliayogya.com',
   'Hotel bintang 5. Proyek smart lighting 120 kamar + area publik.',
   (SELECT id FROM users WHERE email = 'diana@shi.co.id')),

  ('RS PKU Muhammadiyah',
   'Jl. KH. Ahmad Dahlan No. 20, Yogyakarta', '0274-512653', 'teknik@pkumuh.co.id',
   'Rumah sakit tipe A. Proyek monitoring suhu ruang operasi dan farmasi.',
   (SELECT id FROM users WHERE email = 'diana@shi.co.id')),

  ('Pemkot Yogyakarta - Dinas Perhubungan',
   'Jl. Kenari No. 56, Yogyakarta', '0274-515865', 'dishub@jogjakota.go.id',
   'Pemerintah Kota Yogyakarta. Proyek smart traffic monitoring.',
   (SELECT id FROM users WHERE email = 'budi@shi.co.id')),

  ('Ibu Ratna Dewi',
   'Perum Grand Ambarukmo B-7, Depok, Sleman', '087812345678', 'ratnadewi@yahoo.com',
   'Klien residensial. Proyek kecil smart home 1 unit.',
   (SELECT id FROM users WHERE email = 'diana@shi.co.id'))
ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. PROJECTS (10 total -- covering all statuses, phases, health levels)
-- ============================================================
-- Legend:
--   P1: Active/Execution, RED health (behind schedule)
--   P2: Active/Execution, GREEN health (on track)
--   P3: Active/Execution, RED health (critical, deadline near)
--   P4: Active/Execution, AMBER health (warning)
--   P5: Active/Survey, no SPI yet (survey not approved)
--   P6: Active/Survey, no SPI yet (survey approved, waiting execution)
--   P7: Completed project (all tasks done, archived data)
--   P8: On-hold project (paused midway)
--   P9: Active/Execution, GREEN health (large project, many tasks)
--   P10: Active/Execution, AMBER health (small project, near deadline)

INSERT INTO projects (name, description, client_id, start_date, end_date, status, phase, project_value, survey_approved, survey_approved_by, survey_approved_at, target_description, created_by) VALUES
-- P1: RED - Behind schedule, 60-day window, stuck tasks
(
  'Smart Home IoT - Perumahan Citra Raya',
  'Instalasi sistem smart home lengkap di 10 unit rumah kawasan Citra Raya',
  (SELECT id FROM clients WHERE name = 'PT Citra Raya Development'),
  CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '30 days',
  'active', 'execution', 150000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  CURRENT_DATE - INTERVAL '58 days',
  'Smart lock, lighting control, CCTV terintegrasi untuk 10 unit rumah',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
-- P2: GREEN - On track, good progress
(
  'CCTV & Security System - Kantor BPD DIY',
  'Pemasangan 32 kamera CCTV dan access control di kantor BPD DIY',
  (SELECT id FROM clients WHERE name = 'Bank BPD DIY'),
  CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days',
  'active', 'execution', 85000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  CURRENT_DATE - INTERVAL '28 days',
  'Pemasangan 32 kamera CCTV, NVR, dan access control di 4 lantai kantor',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
-- P3: RED - Critical, deadline very close, many stuck
(
  'Smart Home Automation - Villa Kaliurang',
  'Home automation system lengkap di villa premium Kaliurang',
  (SELECT id FROM clients WHERE name = 'Bp. Haryanto'),
  CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '15 days',
  'active', 'execution', 45000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  CURRENT_DATE - INTERVAL '43 days',
  'Automasi villa: lighting, curtain, AC, security dengan kontrol mobile',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
-- P4: AMBER - Warning zone, slightly behind
(
  'IoT Sensor Network - Gudang Logistik',
  'Jaringan sensor IoT untuk monitoring 3 gudang logistik',
  (SELECT id FROM clients WHERE name = 'PT Logistik Nusantara'),
  CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '40 days',
  'active', 'execution', 65000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  CURRENT_DATE - INTERVAL '18 days',
  'Sensor suhu, kelembaban, keamanan di 3 gudang + dashboard terpusat',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
-- P5: SURVEY phase - not approved yet
(
  'Smart Lighting - Hotel Melia',
  'Sistem smart lighting untuk Hotel Melia Yogyakarta (120 kamar + publik)',
  (SELECT id FROM clients WHERE name = 'Hotel Melia Yogyakarta'),
  CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days',
  'active', 'survey', 200000000.00, FALSE, NULL, NULL,
  'Smart lighting lobby, ballroom, koridor, 120 kamar hotel',
  (SELECT id FROM users WHERE email = 'diana@shi.co.id')
),
-- P6: SURVEY approved, waiting to move to execution
(
  'Monitoring Suhu Ruang RS PKU',
  'Monitoring suhu real-time ruang operasi dan farmasi RS PKU',
  (SELECT id FROM clients WHERE name = 'RS PKU Muhammadiyah'),
  CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '55 days',
  'active', 'survey', 35000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'diana@shi.co.id'),
  CURRENT_DATE - INTERVAL '1 day',
  'Sensor suhu + alarm di 4 ruang operasi, 2 ruang farmasi, 1 blood bank',
  (SELECT id FROM users WHERE email = 'diana@shi.co.id')
),
-- P7: COMPLETED project (historical data)
(
  'Smart Traffic Light - Simpang Tiga Janti',
  'Instalasi smart traffic monitoring di persimpangan Janti',
  (SELECT id FROM clients WHERE name = 'Pemkot Yogyakarta - Dinas Perhubungan'),
  CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '20 days',
  'completed', 'execution', 95000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  CURRENT_DATE - INTERVAL '115 days',
  'CCTV monitoring lalu lintas + sensor counting kendaraan + dashboard',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
-- P8: ON-HOLD (paused midway)
(
  'Smart Home - Rumah Ibu Ratna',
  'Instalasi smart home sederhana di rumah tinggal',
  (SELECT id FROM clients WHERE name = 'Ibu Ratna Dewi'),
  CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE + INTERVAL '20 days',
  'on-hold', 'execution', 18000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'diana@shi.co.id'),
  CURRENT_DATE - INTERVAL '38 days',
  'Smart lock + 4 smart switch + 2 CCTV + 1 gateway',
  (SELECT id FROM users WHERE email = 'diana@shi.co.id')
),
-- P9: GREEN - Large project, many tasks, very on track
(
  'Smart Building - Kantor Dishub Yogyakarta',
  'Sistem smart building terintegrasi untuk kantor Dinas Perhubungan',
  (SELECT id FROM clients WHERE name = 'Pemkot Yogyakarta - Dinas Perhubungan'),
  CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE + INTERVAL '50 days',
  'active', 'execution', 120000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  CURRENT_DATE - INTERVAL '38 days',
  'Lighting automation, AC control, occupancy sensor, energy monitoring',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
-- P10: AMBER - Small project, near deadline
(
  'CCTV Gudang Farmasi RS PKU',
  'Pemasangan CCTV di area farmasi dan gudang obat RS PKU',
  (SELECT id FROM clients WHERE name = 'RS PKU Muhammadiyah'),
  CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '5 days',
  'active', 'execution', 22000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'diana@shi.co.id'),
  CURRENT_DATE - INTERVAL '24 days',
  '8 kamera CCTV + NVR untuk monitoring gudang obat 24/7',
  (SELECT id FROM users WHERE email = 'diana@shi.co.id')
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. PROJECT ASSIGNMENTS (technicians to projects)
-- ============================================================
-- P1: Siti + Reza
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'siti@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'reza@shi.co.id' ON CONFLICT DO NOTHING;

-- P2: Andi
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'CCTV & Security System - Kantor BPD DIY' AND u.email = 'andi@shi.co.id' ON CONFLICT DO NOTHING;

-- P3: Siti
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Home Automation - Villa Kaliurang' AND u.email = 'siti@shi.co.id' ON CONFLICT DO NOTHING;

-- P4: Reza
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'IoT Sensor Network - Gudang Logistik' AND u.email = 'reza@shi.co.id' ON CONFLICT DO NOTHING;

-- P5: Andi + Fajar (survey team)
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Lighting - Hotel Melia' AND u.email = 'andi@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Lighting - Hotel Melia' AND u.email = 'fajar@shi.co.id' ON CONFLICT DO NOTHING;

-- P6: Putri
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Monitoring Suhu Ruang RS PKU' AND u.email = 'putri@shi.co.id' ON CONFLICT DO NOTHING;

-- P7: Fajar + Andi (completed project)
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Traffic Light - Simpang Tiga Janti' AND u.email = 'fajar@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Traffic Light - Simpang Tiga Janti' AND u.email = 'andi@shi.co.id' ON CONFLICT DO NOTHING;

-- P8: Putri (on-hold project)
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Home - Rumah Ibu Ratna' AND u.email = 'putri@shi.co.id' ON CONFLICT DO NOTHING;

-- P9: Fajar + Reza + Putri (large team)
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Building - Kantor Dishub Yogyakarta' AND u.email = 'fajar@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Building - Kantor Dishub Yogyakarta' AND u.email = 'reza@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Building - Kantor Dishub Yogyakarta' AND u.email = 'putri@shi.co.id' ON CONFLICT DO NOTHING;

-- P10: Fajar
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'CCTV Gudang Farmasi RS PKU' AND u.email = 'fajar@shi.co.id' ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. TASKS
-- ============================================================

-- P1: Smart Home Citra Raya (RED) -- 10 tasks: 3 done, 4 working, 1 stuck, 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Survey lokasi & pengukuran', 'Survey awal dan pengukuran seluruh unit rumah', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '50 days', 5000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Penarikan kabel jaringan', 'Penarikan kabel UTP dan power untuk controller', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '35 days', 15000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Instalasi smart lock', 'Pemasangan smart lock di pintu utama 10 unit', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '20 days', 20000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Instalasi lighting control', 'Smart switch dan dimmer di setiap unit', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '5 days', 18000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Instalasi CCTV per unit', 'Pemasangan 2 kamera CCTV per unit', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '5 days', 25000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Setup gateway IoT', 'Konfigurasi gateway IoT dan koneksi cloud', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'stuck', CURRENT_DATE - INTERVAL '10 days', 12000000, 6, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Konfigurasi mobile app', 'Setup dan testing mobile app kontrol smart home', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '10 days', 8000000, 7, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Integrasi sistem keamanan', 'Integrasi CCTV, smart lock, alarm ke satu dashboard', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '15 days', 15000000, 8, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Testing & QC', 'Testing menyeluruh semua sistem setiap unit', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '22 days', 5000000, 9, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Serah terima & training', 'Serah terima ke penghuni dan training penggunaan', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '28 days', 2000000, 10, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P2: CCTV BPD DIY (GREEN) -- 8 tasks: 4 done, 2 working, 0 stuck, 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Survey gedung & titik kamera', 'Survey 4 lantai, posisi kamera optimal', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '22 days', 3000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Penarikan kabel lantai 1-2', 'Kabel coaxial + UTP untuk 16 kamera', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '15 days', 10000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Penarikan kabel lantai 3-4', 'Kabel coaxial + UTP untuk 16 kamera', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '8 days', 10000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Instalasi kamera lantai 1-2', 'Pemasangan 16 kamera CCTV', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '2 days', 15000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Instalasi kamera lantai 3-4', 'Pemasangan 16 kamera CCTV', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '15 days', 15000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Setup NVR & storage', 'NVR dengan storage 8TB', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '25 days', 12000000, 6, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Instalasi access control', 'Card reader di pintu utama setiap lantai', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '40 days', 12000000, 7, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Testing & commissioning', 'Testing seluruh sistem, uji recording 24 jam', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '55 days', 3000000, 8, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P3: Villa Kaliurang (RED Critical) -- 6 tasks: 1 done, 2 working, 2 stuck, 1 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Survey villa & desain sistem', 'Survey layout villa dan desain automasi', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '38 days', 2000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi panel kontrol utama', 'Panel kontrol automasi di ruang utility', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '15 days', 8000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi smart curtain & AC', 'Motor curtain dan kontrol AC seluruh ruangan', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'stuck', CURRENT_DATE - INTERVAL '5 days', 12000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi lighting automation', 'Smart switch, dimmer, motion sensor', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'stuck', CURRENT_DATE - INTERVAL '2 days', 8000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi security system', 'CCTV, alarm, smart lock villa', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '5 days', 10000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Integrasi & testing', 'Integrasi seluruh sistem, testing end-to-end', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '12 days', 3000000, 6, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P4: IoT Gudang (AMBER) -- 5 tasks: 1 done, 2 working, 0 stuck, 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'Survey gudang & titik sensor', 'Survey 3 gudang, titik sensor optimal', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '12 days', 3000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'Instalasi sensor gudang 1', '8 sensor suhu/kelembaban + 4 sensor keamanan', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '5 days', 12000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'Instalasi sensor gudang 2 & 3', 'Sensor di gudang 2 dan 3', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '15 days', 20000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'Setup gateway & dashboard', 'IoT gateway dan dashboard monitoring', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '28 days', 15000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'Testing & kalibrasi sensor', 'Akurasi sensor dan threshold alarm', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '35 days', 5000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P5: Hotel Melia (SURVEY, not approved) -- 3 survey tasks
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Lighting - Hotel Melia'), 'Survey lobby & ballroom', 'Survey area lobby dan ballroom', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '10 days', 2000000, 1, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Lighting - Hotel Melia'), 'Survey koridor & area publik', 'Survey koridor setiap lantai', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '15 days', 2000000, 2, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Lighting - Hotel Melia'), 'Survey sample kamar hotel', '3 tipe kamar untuk desain lighting', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '20 days', 1000000, 3, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P6: RS PKU Monitoring (SURVEY, approved, pre-execution) -- 4 survey tasks
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Monitoring Suhu Ruang RS PKU'), 'Survey ruang operasi', 'Identifikasi titik sensor di 4 ruang OK', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '2 days', 1500000, 1, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Monitoring Suhu Ruang RS PKU'), 'Survey ruang farmasi', 'Identifikasi titik sensor di ruang farmasi', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '1 day', 1500000, 2, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Monitoring Suhu Ruang RS PKU'), 'Buat dokumen RAB', 'Rencana anggaran biaya detail', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '5 days', 500000, 3, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Monitoring Suhu Ruang RS PKU'), 'Presentasi hasil survey ke manajemen RS', 'Presentasi ke direksi RS PKU', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '10 days', 500000, 4, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P7: Smart Traffic (COMPLETED) -- 6 tasks, all done
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Survey persimpangan', 'Survey arus lalu lintas dan titik kamera', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '110 days', 3000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Pemasangan tiang kamera', 'Instalasi 4 tiang kamera di tiap sisi', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '90 days', 20000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Instalasi kamera ANPR', 'Kamera pengenalan plat nomor 4 unit', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '70 days', 30000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Setup server & software', 'Server NVR dan software counting', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '50 days', 25000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Integrasi dashboard Dishub', 'Integrasi ke dashboard monitoring Dishub', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '35 days', 10000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'UAT & serah terima', 'User acceptance test dan serah terima', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '22 days', 2000000, 6, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P8: Rumah Ibu Ratna (ON-HOLD) -- 4 tasks: 1 done, 1 working, 0 stuck, 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Survey rumah', 'Survey layout rumah untuk instalasi', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '35 days', 500000, 1, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Instalasi smart lock & switch', 'Smart lock pintu + 4 smart switch', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '10 days', 6000000, 2, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Instalasi CCTV', '2 kamera outdoor', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '5 days', 4000000, 3, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Testing & serah terima', 'Testing dan training klien', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '15 days', 500000, 4, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P9: Smart Building Dishub (GREEN) -- 12 tasks: 7 done, 3 working, 0 stuck, 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Survey gedung & kebutuhan', 'Survey 3 lantai gedung kantor Dishub', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '35 days', 2000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Desain sistem terintegrasi', 'Desain arsitektur lighting + AC + sensor', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '28 days', 3000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Penarikan kabel data', 'Kabel UTP dan power untuk seluruh sensor', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '22 days', 8000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Instalasi lighting controller Lt 1', 'Smart switch dan dimmer lantai 1', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '15 days', 10000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Instalasi lighting controller Lt 2', 'Smart switch dan dimmer lantai 2', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '10 days', 10000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Instalasi lighting controller Lt 3', 'Smart switch dan dimmer lantai 3', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '5 days', 10000000, 6, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Instalasi occupancy sensor', 'PIR sensor di setiap ruangan', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '3 days', 8000000, 7, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Instalasi AC controller', 'Smart AC controller untuk 24 unit AC', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '10 days', 15000000, 8, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Setup energy monitoring', 'Power meter dan dashboard energi', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '20 days', 12000000, 9, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Konfigurasi BMS gateway', 'Building Management System gateway', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '30 days', 15000000, 10, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Integrasi dashboard BMS', 'Dashboard terpusat building management', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '40 days', 10000000, 11, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'UAT & training operator', 'Testing dan training operator gedung', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '48 days', 2000000, 12, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P10: CCTV Gudang RS PKU (AMBER) -- 4 tasks: 1 done, 2 working, 0 stuck, 1 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'Survey gudang & titik kamera', 'Survey area farmasi dan gudang obat', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '20 days', 1000000, 1, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'Instalasi kamera & kabel', 'Pemasangan 8 kamera + penarikan kabel', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '3 days', 12000000, 2, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'Setup NVR & konfigurasi', 'NVR + HDD + konfigurasi recording', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '2 days', 6000000, 3, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'Testing & serah terima', 'Testing recording 24 jam + serah terima', (SELECT id FROM users WHERE email = 'fajar@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '4 days', 1000000, 4, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id'))
ON CONFLICT DO NOTHING;


-- ============================================================
-- 6. MATERIALS
-- ============================================================

-- P1 materials
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Smart Lock Yale YDM4109', 10, 'unit', 3500000, 'Digital door lock fingerprint & PIN'),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Kabel UTP Cat6', 500, 'meter', 5000, 'Kabel jaringan utama'),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Smart Switch Sonoff', 40, 'unit', 250000, 'Smart switch WiFi'),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'IP Camera Hikvision 4MP', 20, 'unit', 1200000, 'Kamera outdoor'),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'IoT Gateway Tuya', 10, 'unit', 800000, 'Gateway per unit');

-- P2 materials
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'IP Camera Dahua 4MP', 32, 'unit', 1500000, 'Indoor/outdoor'),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'NVR Dahua 32ch', 2, 'unit', 8500000, '32 channel 4K'),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'HDD WD Purple 4TB', 4, 'unit', 1800000, 'Surveillance grade'),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Access Control ZKTeco', 8, 'unit', 2200000, 'Fingerprint + card'),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Kabel Coaxial RG6', 400, 'meter', 4500, 'Kabel CCTV'),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Connector BNC', 64, 'pcs', 15000, 'Konektor kamera');

-- P4 materials
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'Sensor Suhu DHT22', 24, 'unit', 85000, 'Sensor suhu + kelembaban'),
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'ESP32 DevKit', 12, 'unit', 120000, 'Microcontroller WiFi'),
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'Sensor PIR HC-SR501', 12, 'unit', 35000, 'Motion sensor'),
((SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'), 'LoRa Gateway RAK7268', 3, 'unit', 4500000, 'Gateway per gudang');

-- P9 materials
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Smart Switch Schneider', 60, 'unit', 350000, 'Industrial grade'),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Dimmer LED Schneider', 30, 'unit', 450000, 'LED dimmer module'),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'PIR Occupancy Sensor', 45, 'unit', 180000, 'Ceiling mount'),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Smart AC Controller Cielo', 24, 'unit', 650000, 'WiFi AC controller'),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Power Meter Eastron SDM630', 6, 'unit', 2200000, '3 phase energy meter'),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'BMS Gateway Siemens', 1, 'unit', 15000000, 'Building management gateway');

-- P10 materials
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'IP Camera Hikvision 2MP', 8, 'unit', 850000, 'Indoor dome'),
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'NVR Hikvision 8ch', 1, 'unit', 3500000, '8 channel'),
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'HDD WD Purple 2TB', 1, 'unit', 1200000, 'Surveillance'),
((SELECT id FROM projects WHERE name = 'CCTV Gudang Farmasi RS PKU'), 'Switch PoE 8 port', 1, 'unit', 1500000, 'Power over Ethernet');


-- ============================================================
-- 7. BUDGET ITEMS (planned vs actual for multiple projects)
-- ============================================================

-- P1 budget
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Material', 'Material smart home (lock, switch, kamera, gateway, kabel)', 100000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Jasa Instalasi', 'Tenaga kerja instalasi 10 unit', 30000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Transport', 'Transportasi dan akomodasi tim', 5000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Lain-lain', 'Biaya tidak terduga', 5000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Material', 'Pembelian batch 1 (smart lock, kabel)', 45000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Material', 'Pembelian batch 2 (switch, kamera)', 38000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Jasa Instalasi', 'Pembayaran tenaga kerja bulan 1', 12000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Transport', 'Transport bulan 1-2', 3500000, TRUE);

-- P2 budget
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Material', 'Kamera, NVR, HDD, access control', 60000000, FALSE),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Jasa Instalasi', 'Penarikan kabel dan instalasi', 15000000, FALSE),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Lain-lain', 'Biaya tidak terduga', 3000000, FALSE),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Material', 'Pembelian kamera dan NVR batch 1', 35000000, TRUE),
((SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'), 'Jasa Instalasi', 'Pembayaran kabel lantai 1-2', 8000000, TRUE);

-- P7 budget (completed - full actual spend)
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Material', 'Kamera ANPR, tiang, server', 55000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Jasa Instalasi', 'Tenaga kerja + sewa alat berat', 25000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Software', 'Lisensi software counting + NVR', 10000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Material', 'Realisasi pembelian material', 52000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Jasa Instalasi', 'Realisasi tenaga kerja', 28000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Traffic Light - Simpang Tiga Janti'), 'Software', 'Realisasi lisensi software', 10000000, TRUE);

-- P9 budget
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Material', 'Switch, dimmer, sensor, AC controller', 55000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Jasa Instalasi', 'Tenaga kerja 3 bulan', 35000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Hardware', 'BMS gateway + power meter', 28000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Material', 'Pembelian batch 1', 30000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Material', 'Pembelian batch 2', 22000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Jasa Instalasi', 'Pembayaran bulan 1', 15000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta'), 'Hardware', 'BMS gateway purchased', 15000000, TRUE);


-- ============================================================
-- 8. DAILY REPORTS (progress history across multiple projects)
-- ============================================================

-- P1 reports (behind schedule trajectory)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '50 days', 8.0,  NULL),
  (CURRENT_DATE - INTERVAL '40 days', 15.0, 'Keterlambatan pengiriman material gateway IoT'),
  (CURRENT_DATE - INTERVAL '30 days', 20.0, 'Masih tunggu gateway, instalasi kabel selesai'),
  (CURRENT_DATE - INTERVAL '20 days', 28.0, 'Material datang sebagian, mulai instalasi lock'),
  (CURRENT_DATE - INTERVAL '15 days', 33.0, 'Masalah koneksi jaringan di cluster B'),
  (CURRENT_DATE - INTERVAL '10 days', 36.0, 'Gateway IoT stuck - firmware incompatible'),
  (CURRENT_DATE - INTERVAL '5 days',  40.0, 'Progres lambat, perlu tambahan tenaga'),
  (CURRENT_DATE - INTERVAL '1 day',   42.0, 'Butuh keputusan soal penggantian gateway model')
) AS d(report_date, pct, note)
WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

-- P2 reports (on track trajectory)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '25 days', 12.0, NULL),
  (CURRENT_DATE - INTERVAL '20 days', 18.0, NULL),
  (CURRENT_DATE - INTERVAL '15 days', 25.0, NULL),
  (CURRENT_DATE - INTERVAL '10 days', 32.0, 'Instalasi kabel lantai 3 selesai lebih cepat'),
  (CURRENT_DATE - INTERVAL '5 days',  40.0, NULL),
  (CURRENT_DATE - INTERVAL '2 days',  48.0, 'Mulai instalasi kamera lantai 1-2'),
  (CURRENT_DATE - INTERVAL '1 day',   50.0, 'Kamera lantai 1-2 terpasang semua')
) AS d(report_date, pct, note)
WHERE p.name = 'CCTV & Security System - Kantor BPD DIY' AND u.email = 'andi@shi.co.id'
ON CONFLICT DO NOTHING;

-- P3 reports (critical trajectory)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '40 days', 5.0,  'Akses lokasi terbatas oleh pemilik villa'),
  (CURRENT_DATE - INTERVAL '30 days', 12.0, 'Material panel controller belum datang'),
  (CURRENT_DATE - INTERVAL '20 days', 18.0, 'Modul controller datang tapi salah spek'),
  (CURRENT_DATE - INTERVAL '15 days', 22.0, 'Return modul controller, tunggu replacement'),
  (CURRENT_DATE - INTERVAL '10 days', 28.0, 'Replacement datang, mulai instalasi'),
  (CURRENT_DATE - INTERVAL '5 days',  33.0, 'Smart curtain motor stuck - butuh adapter custom'),
  (CURRENT_DATE - INTERVAL '1 day',   38.0, 'Deadline mendekat, risiko tinggi gagal target')
) AS d(report_date, pct, note)
WHERE p.name = 'Smart Home Automation - Villa Kaliurang' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

-- P4 reports (amber trajectory)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '15 days', 10.0, NULL),
  (CURRENT_DATE - INTERVAL '10 days', 18.0, 'Cuaca hujan menghambat survei gudang 2'),
  (CURRENT_DATE - INTERVAL '5 days',  23.0, 'Sensor batch 1 terpasang di gudang 1'),
  (CURRENT_DATE - INTERVAL '2 days',  28.0, NULL)
) AS d(report_date, pct, note)
WHERE p.name = 'IoT Sensor Network - Gudang Logistik' AND u.email = 'reza@shi.co.id'
ON CONFLICT DO NOTHING;

-- P7 reports (completed, full history)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '100 days', 15.0, NULL),
  (CURRENT_DATE - INTERVAL '85 days',  30.0, NULL),
  (CURRENT_DATE - INTERVAL '70 days',  45.0, 'Izin pemasangan tiang dari Dishub terlambat'),
  (CURRENT_DATE - INTERVAL '55 days',  60.0, NULL),
  (CURRENT_DATE - INTERVAL '40 days',  78.0, NULL),
  (CURRENT_DATE - INTERVAL '30 days',  90.0, 'Software counting perlu kalibrasi ulang'),
  (CURRENT_DATE - INTERVAL '22 days', 100.0, 'Proyek selesai, serah terima complete')
) AS d(report_date, pct, note)
WHERE p.name = 'Smart Traffic Light - Simpang Tiga Janti' AND u.email = 'fajar@shi.co.id'
ON CONFLICT DO NOTHING;

-- P9 reports (green trajectory, large project)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '35 days', 5.0,  NULL),
  (CURRENT_DATE - INTERVAL '28 days', 12.0, NULL),
  (CURRENT_DATE - INTERVAL '22 days', 22.0, NULL),
  (CURRENT_DATE - INTERVAL '15 days', 35.0, 'Instalasi lighting lantai 1 selesai'),
  (CURRENT_DATE - INTERVAL '10 days', 45.0, 'Lantai 2 selesai, mulai lantai 3'),
  (CURRENT_DATE - INTERVAL '5 days',  55.0, 'Sensor occupancy terpasang semua'),
  (CURRENT_DATE - INTERVAL '2 days',  60.0, 'Mulai instalasi AC controller'),
  (CURRENT_DATE - INTERVAL '1 day',   62.0, NULL)
) AS d(report_date, pct, note)
WHERE p.name = 'Smart Building - Kantor Dishub Yogyakarta' AND u.email = 'fajar@shi.co.id'
ON CONFLICT DO NOTHING;

-- P10 reports (amber, near deadline)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '18 days', 10.0, NULL),
  (CURRENT_DATE - INTERVAL '12 days', 22.0, 'Akses ke gudang obat hanya jam tertentu'),
  (CURRENT_DATE - INTERVAL '7 days',  38.0, NULL),
  (CURRENT_DATE - INTERVAL '3 days',  50.0, 'Kamera 6/8 terpasang'),
  (CURRENT_DATE - INTERVAL '1 day',   60.0, 'NVR konfigurasi sedang berjalan')
) AS d(report_date, pct, note)
WHERE p.name = 'CCTV Gudang Farmasi RS PKU' AND u.email = 'fajar@shi.co.id'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 9. PROJECT HEALTH (pre-calculated for dashboard)
-- ============================================================
INSERT INTO project_health (project_id, spi_value, status, deviation_percent, actual_progress, planned_progress, total_tasks, completed_tasks, working_tasks, stuck_tasks, overdue_tasks)
SELECT p.id, d.spi, d.st, d.dev, d.ap, d.pp, d.tt, d.ct, d.wt, d.stt, d.ot
FROM projects p,
(VALUES
  ('Smart Home IoT - Perumahan Citra Raya',       0.4500, 'red',   -37.67, 30.00, 66.67, 10, 3, 4, 1, 3),
  ('CCTV & Security System - Kantor BPD DIY',     1.5000, 'green',  16.67, 50.00, 33.33,  8, 4, 2, 0, 0),
  ('Smart Home Automation - Villa Kaliurang',      0.2222, 'red',   -58.33, 16.67, 75.00,  6, 1, 2, 2, 4),
  ('IoT Sensor Network - Gudang Logistik',         0.6000, 'red',   -13.33, 20.00, 33.33,  5, 1, 2, 0, 0),
  ('Smart Building - Kantor Dishub Yogyakarta',    1.3125, 'green',  13.89, 58.33, 44.44, 12, 7, 3, 0, 0),
  ('CCTV Gudang Farmasi RS PKU',                   0.3000, 'red',   -58.33, 25.00, 83.33,  4, 1, 2, 0, 1)
) AS d(pname, spi, st, dev, ap, pp, tt, ct, wt, stt, ot)
WHERE p.name = d.pname
ON CONFLICT (project_id) DO UPDATE SET
  spi_value = EXCLUDED.spi_value,
  status = EXCLUDED.status,
  deviation_percent = EXCLUDED.deviation_percent,
  actual_progress = EXCLUDED.actual_progress,
  planned_progress = EXCLUDED.planned_progress,
  total_tasks = EXCLUDED.total_tasks,
  completed_tasks = EXCLUDED.completed_tasks,
  working_tasks = EXCLUDED.working_tasks,
  stuck_tasks = EXCLUDED.stuck_tasks,
  overdue_tasks = EXCLUDED.overdue_tasks,
  last_updated = CURRENT_TIMESTAMP;
