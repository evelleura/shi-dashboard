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
  ('Admin SHI',       'admin@shi.co.id',    'admin',      '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Budi Santoso',    'budi@shi.co.id',     'manager',    '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Diana Kusuma',    'diana@shi.co.id',    'manager',    '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Siti Rahma',      'siti@shi.co.id',     'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Andi Wijaya',     'andi@shi.co.id',     'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Reza Pratama',    'reza@shi.co.id',     'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Fajar Nugroho',   'fajar@shi.co.id',    'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Putri Handayani', 'putri@shi.co.id',    'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6')
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
-- P1: RED - Behind schedule, 60-day window, overtime tasks
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
-- P3: RED - Critical, deadline very close, many overtime
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

-- P1: Smart Home Citra Raya (RED) -- 10 tasks: 3 done, 5 working (1 overtime), 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Survey lokasi & pengukuran', 'Survey awal dan pengukuran seluruh unit rumah', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '50 days', 5000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Penarikan kabel jaringan', 'Penarikan kabel UTP dan power untuk controller', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '35 days', 15000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Instalasi smart lock', 'Pemasangan smart lock di pintu utama 10 unit', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '20 days', 20000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Instalasi lighting control', 'Smart switch dan dimmer di setiap unit', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '5 days', 18000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Instalasi CCTV per unit', 'Pemasangan 2 kamera CCTV per unit', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '5 days', 25000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Setup gateway IoT', 'Konfigurasi gateway IoT dan koneksi cloud', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '10 days', 12000000, 6, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Konfigurasi mobile app', 'Setup dan testing mobile app kontrol smart home', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '10 days', 8000000, 7, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Integrasi sistem keamanan', 'Integrasi CCTV, smart lock, alarm ke satu dashboard', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '15 days', 15000000, 8, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Testing & QC', 'Testing menyeluruh semua sistem setiap unit', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '22 days', 5000000, 9, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'), 'Serah terima & training', 'Serah terima ke penghuni dan training penggunaan', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '28 days', 2000000, 10, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P2: CCTV BPD DIY (GREEN) -- 8 tasks: 4 done, 2 working, 2 to_do
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

-- P3: Villa Kaliurang (RED Critical) -- 6 tasks: 1 done, 4 working (3 overtime), 1 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Survey villa & desain sistem', 'Survey layout villa dan desain automasi', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '38 days', 2000000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi panel kontrol utama', 'Panel kontrol automasi di ruang utility', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '15 days', 8000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi smart curtain & AC', 'Motor curtain dan kontrol AC seluruh ruangan', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '5 days', 12000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi lighting automation', 'Smart switch, dimmer, motion sensor', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '2 days', 8000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Instalasi security system', 'CCTV, alarm, smart lock villa', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '5 days', 10000000, 5, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'), 'Integrasi & testing', 'Integrasi seluruh sistem, testing end-to-end', (SELECT id FROM users WHERE email = 'siti@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '12 days', 3000000, 6, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P4: IoT Gudang (AMBER) -- 5 tasks: 1 done, 2 working, 2 to_do
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

-- P8: Rumah Ibu Ratna (ON-HOLD) -- 4 tasks: 1 done, 1 working, 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Survey rumah', 'Survey layout rumah untuk instalasi', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '35 days', 500000, 1, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Instalasi smart lock & switch', 'Smart lock pintu + 4 smart switch', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '10 days', 6000000, 2, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Instalasi CCTV', '2 kamera outdoor', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '5 days', 4000000, 3, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Home - Rumah Ibu Ratna'), 'Testing & serah terima', 'Testing dan training klien', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '15 days', 500000, 4, FALSE, (SELECT id FROM users WHERE email = 'diana@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P9: Smart Building Dishub (GREEN) -- 12 tasks: 7 done, 3 working, 2 to_do
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

-- P10: CCTV Gudang RS PKU (AMBER) -- 4 tasks: 1 done, 2 working (1 overtime), 1 to_do
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
INSERT INTO project_health (project_id, spi_value, status, deviation_percent, actual_progress, planned_progress, total_tasks, completed_tasks, working_tasks, overtime_tasks, overdue_tasks)
SELECT p.id, d.spi, d.st, d.dev, d.ap, d.pp, d.tt, d.ct, d.wt, d.ott, d.ot
FROM projects p,
(VALUES
  ('Smart Home IoT - Perumahan Citra Raya',       0.4500, 'red',   -37.67, 30.00, 66.67, 10, 3, 5, 2, 3),
  ('CCTV & Security System - Kantor BPD DIY',     1.5000, 'green',  16.67, 50.00, 33.33,  8, 4, 2, 0, 0),
  ('Smart Home Automation - Villa Kaliurang',      0.2222, 'red',   -58.33, 16.67, 75.00,  6, 1, 4, 3, 4),
  ('IoT Sensor Network - Gudang Logistik',         0.6000, 'red',   -13.33, 20.00, 33.33,  5, 1, 2, 0, 0),
  ('Smart Building - Kantor Dishub Yogyakarta',    1.3125, 'green',  13.89, 58.33, 44.44, 12, 7, 3, 0, 0),
  ('CCTV Gudang Farmasi RS PKU',                   0.3000, 'red',   -58.33, 25.00, 83.33,  4, 1, 2, 1, 1)
) AS d(pname, spi, st, dev, ap, pp, tt, ct, wt, ott, ot)
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
  overtime_tasks = EXCLUDED.overtime_tasks,
  overdue_tasks = EXCLUDED.overdue_tasks,
  last_updated = CURRENT_TIMESTAMP;


-- ============================================================
-- 10. ADDITIONAL USERS (4 new: 1 manager, 3 technicians)
-- ============================================================
INSERT INTO users (name, email, role, password_hash) VALUES
  ('Hendro Wibowo',  'hendro@shi.co.id', 'manager',    '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Yoga Aditya',    'yoga@shi.co.id',   'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Dimas Prasetyo', 'dimas@shi.co.id',  'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6'),
  ('Lina Marlina',   'lina@shi.co.id',   'technician', '$2b$10$zHDwO0pjo7VXN3wS4ADDMOjPBcLdw45k.nmrvoc8udB2whndJIRi6')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 11. ADDITIONAL CLIENTS (4 new)
-- ============================================================
INSERT INTO clients (name, address, phone, email, notes, created_by) VALUES
  ('Universitas Teknologi Yogyakarta',
   'Jl. Ringroad Utara, Jombor, Sleman', '0274-623310', 'teknik@uty.ac.id',
   'Kampus swasta, proyek fire alarm 3 gedung.',
   (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),

  ('PT Matahari Retail Yogyakarta',
   'Jl. Malioboro No. 123, Yogyakarta', '0274-565656', 'facility@matahari.co.id',
   'Mall 3 lantai, smart parking + CCTV.',
   (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),

  ('Bp. Suryo Prabowo',
   'Jl. Kaliurang Km 8.5, Ngaglik, Sleman', '081298765432', 'suryo.prabowo@gmail.com',
   'Villa mewah 2 lantai, full smart home automation.',
   (SELECT id FROM users WHERE email = 'diana@shi.co.id')),

  ('PT Sinar Mas Agro',
   'Jl. Wates Km 10, Sedayu, Bantul', '0274-615500', 'engineering@sinarmasagro.co.id',
   'Pabrik pengolahan kelapa sawit, monitoring solar panel.',
   (SELECT id FROM users WHERE email = 'hendro@shi.co.id'))
ON CONFLICT DO NOTHING;


-- ============================================================
-- 12. ADDITIONAL PROJECTS (P11-P15)
-- ============================================================
-- Legend:
--   P11: Active/Execution, AMBER health (fire alarm UTY)
--   P12: Active/Execution, GREEN health (smart parking Matahari)
--   P13: Active/Execution, AMBER health (solar panel Sinar Mas)
--   P14: Active/Survey, no SPI (smart villa Suryo)
--   P15: Cancelled project (intercom Citra Raya)

INSERT INTO projects (name, description, client_id, start_date, end_date, status, phase, project_value, survey_approved, survey_approved_by, survey_approved_at, target_description, created_by) VALUES
-- P11: AMBER - Fire Alarm UTY, slightly behind
(
  'Fire Alarm System - Kampus UTY',
  'Instalasi fire alarm system di 3 gedung kampus (Gedung A, B, C)',
  (SELECT id FROM clients WHERE name = 'Universitas Teknologi Yogyakarta'),
  CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE + INTERVAL '25 days',
  'active', 'execution', 75000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'hendro@shi.co.id'),
  CURRENT_DATE - INTERVAL '33 days',
  'Instalasi fire alarm system di 3 gedung kampus (Gedung A, B, C) termasuk panel, smoke detector, manual call point, dan bell alarm',
  (SELECT id FROM users WHERE email = 'hendro@shi.co.id')
),
-- P12: GREEN - Smart Parking Matahari, well on track
(
  'Smart Parking System - Mall Matahari',
  'Smart parking system 3 lantai mall Matahari Yogyakarta',
  (SELECT id FROM clients WHERE name = 'PT Matahari Retail Yogyakarta'),
  CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '65 days',
  'active', 'execution', 110000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'hendro@shi.co.id'),
  CURRENT_DATE - INTERVAL '23 days',
  'Smart parking system 3 lantai: barrier gate otomatis, sensor slot, kamera ANPR, payment terminal, dashboard occupancy',
  (SELECT id FROM users WHERE email = 'hendro@shi.co.id')
),
-- P13: AMBER - Solar Panel Sinar Mas, behind due to weather
(
  'Solar Panel Monitoring - Sinar Mas',
  'Monitoring 48 panel surya di atap pabrik PT Sinar Mas Agro',
  (SELECT id FROM clients WHERE name = 'PT Sinar Mas Agro'),
  CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days',
  'active', 'execution', 55000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'hendro@shi.co.id'),
  CURRENT_DATE - INTERVAL '28 days',
  'Monitoring 48 panel surya di atap pabrik: sensor energi, inverter monitoring, dashboard produksi listrik real-time',
  (SELECT id FROM users WHERE email = 'hendro@shi.co.id')
),
-- P14: SURVEY - Smart Villa Suryo, not approved
(
  'Smart Villa Premium - Bp. Suryo',
  'Full automation villa 2 lantai Bp. Suryo Prabowo',
  (SELECT id FROM clients WHERE name = 'Bp. Suryo Prabowo'),
  CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '82 days',
  'active', 'survey', 180000000.00, FALSE, NULL, NULL,
  'Full automation villa 2 lantai: smart lighting, motorized curtain, multi-zone AC, home theater, outdoor CCTV, smart gate, pool automation',
  (SELECT id FROM users WHERE email = 'diana@shi.co.id')
),
-- P15: CANCELLED - Intercom Citra Raya
(
  'Intercom System - Perumahan Citra Raya',
  'Sistem intercom IP 20 unit rumah di cluster baru Citra Raya',
  (SELECT id FROM clients WHERE name = 'PT Citra Raya Development'),
  CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE + INTERVAL '10 days',
  'cancelled', 'execution', 28000000.00, TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  CURRENT_DATE - INTERVAL '48 days',
  'Sistem intercom IP 20 unit rumah di cluster baru Citra Raya',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 13. PROJECT ASSIGNMENTS for P11-P15
-- ============================================================
-- P11: Yoga + Dimas
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Fire Alarm System - Kampus UTY' AND u.email = 'yoga@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Fire Alarm System - Kampus UTY' AND u.email = 'dimas@shi.co.id' ON CONFLICT DO NOTHING;

-- P12: Lina + Andi
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Parking System - Mall Matahari' AND u.email = 'lina@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Parking System - Mall Matahari' AND u.email = 'andi@shi.co.id' ON CONFLICT DO NOTHING;

-- P13: Yoga + Reza
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Solar Panel Monitoring - Sinar Mas' AND u.email = 'yoga@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Solar Panel Monitoring - Sinar Mas' AND u.email = 'reza@shi.co.id' ON CONFLICT DO NOTHING;

-- P14: Dimas + Lina
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Villa Premium - Bp. Suryo' AND u.email = 'dimas@shi.co.id' ON CONFLICT DO NOTHING;
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Smart Villa Premium - Bp. Suryo' AND u.email = 'lina@shi.co.id' ON CONFLICT DO NOTHING;

-- P15: Putri
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u WHERE p.name = 'Intercom System - Perumahan Citra Raya' AND u.email = 'putri@shi.co.id' ON CONFLICT DO NOTHING;


-- ============================================================
-- 14. TASKS for P11-P15
-- ============================================================

-- P11: Fire Alarm UTY (AMBER) -- 8 tasks: 4 done, 2 working (1 overtime), 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Survey gedung A, B, C & titik pemasangan', 'Survey lokasi pemasangan fire alarm di 3 gedung kampus', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '30 days', 3000000, 1, TRUE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Penarikan kabel fire alarm gedung A', 'Penarikan kabel NYYHY dari panel ke setiap titik detector gedung A', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '20 days', 8000000, 2, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Penarikan kabel fire alarm gedung B', 'Penarikan kabel NYYHY dari panel ke setiap titik detector gedung B', (SELECT id FROM users WHERE email = 'dimas@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '15 days', 8000000, 3, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Penarikan kabel fire alarm gedung C', 'Penarikan kabel NYYHY dari panel ke setiap titik detector gedung C', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '10 days', 8000000, 4, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Instalasi panel & detector gedung A', 'Pemasangan panel alarm, smoke detector, MCP, dan bell di gedung A', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '3 days', 12000000, 5, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Instalasi panel & detector gedung B', 'Pemasangan panel alarm, smoke detector, MCP, dan bell di gedung B', (SELECT id FROM users WHERE email = 'dimas@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '5 days', 12000000, 6, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Instalasi panel & detector gedung C', 'Pemasangan panel alarm, smoke detector, MCP, dan bell di gedung C', (SELECT id FROM users WHERE email = 'dimas@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '15 days', 12000000, 7, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Testing & commissioning seluruh gedung', 'Testing alarm, smoke detector, bell, dan commissioning panel di 3 gedung', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '22 days', 5000000, 8, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P12: Smart Parking Matahari (GREEN) -- 6 tasks: 3 done, 2 working, 1 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Survey area parking & desain layout', 'Survey 3 lantai parking area dan desain penempatan sensor + barrier', (SELECT id FROM users WHERE email = 'lina@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '18 days', 2000000, 1, TRUE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Instalasi barrier gate & sensor Lt 1', 'Barrier gate CAME + sensor ultrasonic lantai 1', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '10 days', 20000000, 2, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Instalasi barrier gate & sensor Lt 2', 'Barrier gate CAME + sensor ultrasonic lantai 2', (SELECT id FROM users WHERE email = 'lina@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '5 days', 20000000, 3, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Instalasi kamera ANPR & payment', 'Kamera ANPR Hikvision + payment terminal QRIS di setiap lantai', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '10 days', 25000000, 4, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Instalasi barrier gate & sensor Lt 3', 'Barrier gate CAME + sensor ultrasonic lantai 3', (SELECT id FROM users WHERE email = 'lina@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '20 days', 20000000, 5, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Setup server & dashboard occupancy', 'Server parking management + dashboard real-time occupancy', (SELECT id FROM users WHERE email = 'andi@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '40 days', 15000000, 6, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P13: Solar Panel Sinar Mas (AMBER) -- 7 tasks: 3 done, 2 working (1 overtime), 2 to_do
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Survey atap pabrik & layout panel', 'Survey posisi 48 panel surya dan layout penarikan kabel sensor', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '25 days', 2000000, 1, TRUE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Instalasi sensor energi batch 1 (24 panel)', 'Pemasangan current sensor + voltage sensor di 24 panel pertama', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '15 days', 10000000, 2, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Instalasi sensor energi batch 2 (24 panel)', 'Pemasangan current sensor + voltage sensor di 24 panel berikutnya', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '2 days', 10000000, 3, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Instalasi inverter monitoring', 'Pemasangan monitoring modul di setiap inverter', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '8 days', 8000000, 4, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Penarikan kabel data ke server room', 'Penarikan kabel data dari rooftop ke server room pabrik', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'working_on_it', CURRENT_DATE - INTERVAL '2 days', 5000000, 5, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Setup server & dashboard produksi', 'Server monitoring + dashboard produksi listrik real-time', (SELECT id FROM users WHERE email = 'reza@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '22 days', 12000000, 6, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Kalibrasi & testing akurasi', 'Kalibrasi sensor dan verifikasi akurasi pembacaan daya', (SELECT id FROM users WHERE email = 'yoga@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '28 days', 3000000, 7, FALSE, (SELECT id FROM users WHERE email = 'hendro@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P14: Smart Villa Suryo (SURVEY) -- 4 survey tasks
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Smart Villa Premium - Bp. Suryo'), 'Survey lantai 1 & kebutuhan automation', 'Survey seluruh ruangan lantai 1 dan identifikasi kebutuhan automasi', (SELECT id FROM users WHERE email = 'dimas@shi.co.id'), 'working_on_it', CURRENT_DATE + INTERVAL '10 days', 2000000, 1, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Villa Premium - Bp. Suryo'), 'Survey lantai 2 & outdoor area', 'Survey lantai 2, taman, kolam renang, dan area outdoor', (SELECT id FROM users WHERE email = 'lina@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '15 days', 2000000, 2, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Villa Premium - Bp. Suryo'), 'Desain sistem & RAB', 'Desain arsitektur sistem automasi dan rencana anggaran biaya', (SELECT id FROM users WHERE email = 'dimas@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '25 days', 1500000, 3, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Smart Villa Premium - Bp. Suryo'), 'Presentasi ke klien', 'Presentasi desain dan RAB ke Bp. Suryo Prabowo', (SELECT id FROM users WHERE email = 'lina@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '30 days', 500000, 4, TRUE, (SELECT id FROM users WHERE email = 'diana@shi.co.id'))
ON CONFLICT DO NOTHING;

-- P15: Intercom Citra Raya (CANCELLED) -- 4 tasks: 2 done, 2 to_do (abandoned)
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
((SELECT id FROM projects WHERE name = 'Intercom System - Perumahan Citra Raya'), 'Survey unit & desain jaringan', 'Survey 20 unit rumah dan desain jaringan intercom IP', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '42 days', 1500000, 1, TRUE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Intercom System - Perumahan Citra Raya'), 'Penarikan kabel intercom 10 unit', 'Penarikan kabel UTP untuk intercom 10 unit pertama', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'done', CURRENT_DATE - INTERVAL '30 days', 5000000, 2, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Intercom System - Perumahan Citra Raya'), 'Penarikan kabel intercom 10 unit berikutnya', 'Penarikan kabel UTP untuk intercom 10 unit berikutnya', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE - INTERVAL '5 days', 5000000, 3, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id')),
((SELECT id FROM projects WHERE name = 'Intercom System - Perumahan Citra Raya'), 'Instalasi handset & testing', 'Instalasi handset intercom di 20 unit dan testing koneksi', (SELECT id FROM users WHERE email = 'putri@shi.co.id'), 'to_do', CURRENT_DATE + INTERVAL '5 days', 8000000, 4, FALSE, (SELECT id FROM users WHERE email = 'budi@shi.co.id'))
ON CONFLICT DO NOTHING;


-- ============================================================
-- 15. MATERIALS for P11-P13
-- ============================================================

-- P11 materials (Fire Alarm UTY)
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Fire Alarm Panel Notifier NFS2-3030', 3, 'unit', 15000000, 'Panel konvensional 8 zone'),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Smoke Detector Notifier SD-651', 120, 'unit', 185000, 'Photoelectric'),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Manual Call Point', 24, 'unit', 250000, 'Break glass type'),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Fire Alarm Bell', 30, 'unit', 350000, '6 inch bell'),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Kabel NYYHY 2x1.5mm', 1500, 'meter', 8500, 'Kabel fire alarm');

-- P12 materials (Smart Parking Matahari)
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Barrier Gate CAME G3250', 6, 'unit', 12000000, 'Boom 3m'),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Sensor Parkir Ultrasonic', 300, 'unit', 150000, 'LED indicator merah/hijau'),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Kamera ANPR Hikvision', 6, 'unit', 8500000, '2MP ANPR'),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Payment Terminal', 3, 'unit', 15000000, 'Cashless + QRIS'),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Server Parking Management', 1, 'unit', 25000000, 'i7 + 32GB RAM');

-- P13 materials (Solar Panel Sinar Mas)
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Current Sensor SCT-013', 48, 'unit', 85000, 'Clamp sensor 100A'),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Voltage Sensor ZMPT101B', 12, 'unit', 45000, 'AC voltage'),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'ESP32 LoRa Node', 24, 'unit', 180000, 'Solar powered'),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Gateway LoRa RAK7249', 2, 'unit', 8500000, 'Outdoor gateway'),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Server Monitoring', 1, 'unit', 18000000, 'Mini PC industrial');


-- ============================================================
-- 16. BUDGET ITEMS for P11-P13
-- ============================================================

-- P11 budget (Fire Alarm UTY)
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Material', 'Panel, detector, kabel fire alarm', 40000000, FALSE),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Jasa Instalasi', 'Tenaga kerja 2 bulan', 20000000, FALSE),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Transport', 'Transport ke kampus', 3000000, FALSE),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Material', 'Pembelian panel + detector batch 1', 22000000, TRUE),
((SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY'), 'Jasa Instalasi', 'Pembayaran bulan 1', 10000000, TRUE);

-- P12 budget (Smart Parking Matahari)
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Material', 'Barrier gate, sensor, kamera, payment', 75000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Jasa Instalasi', 'Tenaga kerja 3 bulan', 25000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Hardware', 'Server + networking', 30000000, FALSE),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Material', 'Barrier gate + sensor Lt 1-2', 45000000, TRUE),
((SELECT id FROM projects WHERE name = 'Smart Parking System - Mall Matahari'), 'Hardware', 'Server purchased', 25000000, TRUE);

-- P13 budget (Solar Panel Sinar Mas)
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Material', 'Sensor, gateway, kabel', 25000000, FALSE),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Jasa Instalasi', 'Tenaga kerja', 15000000, FALSE),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Hardware', 'Server monitoring', 18000000, FALSE),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Material', 'Sensor batch 1', 12000000, TRUE),
((SELECT id FROM projects WHERE name = 'Solar Panel Monitoring - Sinar Mas'), 'Jasa Instalasi', 'Pembayaran bulan 1', 8000000, TRUE);


-- ============================================================
-- 17. DAILY REPORTS for P11-P13
-- ============================================================

-- P11 reports (amber trajectory, by yoga)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '28 days', 10.0, NULL::TEXT),
  (CURRENT_DATE - INTERVAL '20 days', 22.0, NULL::TEXT),
  (CURRENT_DATE - INTERVAL '15 days', 30.0, 'Kabel gedung A selesai, mulai gedung B'),
  (CURRENT_DATE - INTERVAL '10 days', 38.0, NULL::TEXT),
  (CURRENT_DATE - INTERVAL '5 days',  42.0, 'Detector gedung A terpasang, gedung B mulai'),
  (CURRENT_DATE - INTERVAL '2 days',  45.0, 'Kendala akses gedung C saat jam kuliah')
) AS d(report_date, pct, note)
WHERE p.name = 'Fire Alarm System - Kampus UTY' AND u.email = 'yoga@shi.co.id'
ON CONFLICT DO NOTHING;

-- P12 reports (green trajectory, by lina)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '20 days', 8.0,  NULL::TEXT),
  (CURRENT_DATE - INTERVAL '15 days', 18.0, NULL::TEXT),
  (CURRENT_DATE - INTERVAL '10 days', 30.0, 'Barrier gate Lt 1 operasional'),
  (CURRENT_DATE - INTERVAL '5 days',  42.0, 'Lt 2 selesai, sensor parkir berfungsi'),
  (CURRENT_DATE - INTERVAL '2 days',  50.0, 'Mulai instalasi kamera ANPR')
) AS d(report_date, pct, note)
WHERE p.name = 'Smart Parking System - Mall Matahari' AND u.email = 'lina@shi.co.id'
ON CONFLICT DO NOTHING;

-- P13 reports (amber trajectory, by yoga)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, d.report_date, d.pct, d.note, u.id
FROM projects p, users u,
(VALUES
  (CURRENT_DATE - INTERVAL '22 days', 8.0,  NULL::TEXT),
  (CURRENT_DATE - INTERVAL '15 days', 18.0, 'Hujan deras 3 hari menghambat kerja di atap'),
  (CURRENT_DATE - INTERVAL '10 days', 25.0, 'Sensor batch 1 terpasang'),
  (CURRENT_DATE - INTERVAL '5 days',  30.0, 'Batch 2 terhambat cuaca'),
  (CURRENT_DATE - INTERVAL '2 days',  33.0, 'Cuaca membaik, mulai batch 2')
) AS d(report_date, pct, note)
WHERE p.name = 'Solar Panel Monitoring - Sinar Mas' AND u.email = 'yoga@shi.co.id'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 18. UPDATE + ADD PROJECT HEALTH for new projects
-- ============================================================

-- Update existing IoT Gudang from RED to AMBER
INSERT INTO project_health (project_id, spi_value, status, deviation_percent, actual_progress, planned_progress, total_tasks, completed_tasks, working_tasks, overtime_tasks, overdue_tasks)
SELECT p.id, d.spi, d.st, d.dev, d.ap, d.pp, d.tt, d.ct, d.wt, d.ott, d.ot
FROM projects p,
(VALUES
  ('IoT Sensor Network - Gudang Logistik',       0.9000, 'amber',  -3.33, 20.00, 33.33,  5, 1, 2, 0, 0),
  ('Fire Alarm System - Kampus UTY',              0.8571, 'amber',  -8.33, 50.00, 58.33,  8, 4, 2, 1, 1),
  ('Smart Parking System - Mall Matahari',        1.4286, 'green',  22.22, 50.00, 27.78,  6, 3, 2, 0, 0),
  ('Solar Panel Monitoring - Sinar Mas',          0.8571, 'amber',  -7.14, 42.86, 50.00,  7, 3, 2, 1, 1)
) AS d(pname, spi, st, dev, ap, pp, tt, ct, wt, ott, ot)
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
  overtime_tasks = EXCLUDED.overtime_tasks,
  overdue_tasks = EXCLUDED.overdue_tasks,
  last_updated = CURRENT_TIMESTAMP;


-- ============================================================
-- 19. TASK TIME TRACKING (time_spent_seconds + estimated_hours on completed/active tasks)
-- ============================================================

-- P1: Survey lokasi (done) - 4 hours
UPDATE tasks SET time_spent_seconds = 14400, estimated_hours = 4.0
WHERE name = 'Survey lokasi & pengukuran'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya');

-- P1: Penarikan kabel jaringan (done) - 16 hours
UPDATE tasks SET time_spent_seconds = 57600, estimated_hours = 16.0
WHERE name = 'Penarikan kabel jaringan'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya');

-- P1: Instalasi smart lock (done) - 12 hours
UPDATE tasks SET time_spent_seconds = 43200, estimated_hours = 12.0
WHERE name = 'Instalasi smart lock'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya');

-- P1: Instalasi lighting control (working, overtime) - 8 hours so far, estimated 20
UPDATE tasks SET time_spent_seconds = 28800, estimated_hours = 20.0
WHERE name = 'Instalasi lighting control'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya');

-- P3: Instalasi panel kontrol (working, overtime) - 6 hours so far, estimated 10
UPDATE tasks SET time_spent_seconds = 21600, estimated_hours = 10.0
WHERE name = 'Instalasi panel kontrol utama'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang');

-- P9: Instalasi lighting Lt 1 (done) - 10 hours
UPDATE tasks SET time_spent_seconds = 36000, estimated_hours = 10.0
WHERE name = 'Instalasi lighting controller Lt 1'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta');

-- P9: Instalasi lighting Lt 2 (done) - 9 hours
UPDATE tasks SET time_spent_seconds = 32400, estimated_hours = 10.0
WHERE name = 'Instalasi lighting controller Lt 2'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta');

-- P9: Instalasi lighting Lt 3 (done) - 11 hours
UPDATE tasks SET time_spent_seconds = 39600, estimated_hours = 10.0
WHERE name = 'Instalasi lighting controller Lt 3'
  AND project_id = (SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta');

-- P11: Penarikan kabel gedung A (done) - 14 hours
UPDATE tasks SET time_spent_seconds = 50400, estimated_hours = 16.0
WHERE name = 'Penarikan kabel fire alarm gedung A'
  AND project_id = (SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY');

-- P11: Instalasi panel gedung A (working) - 5 hours so far
UPDATE tasks SET time_spent_seconds = 18000, estimated_hours = 12.0
WHERE name = 'Instalasi panel & detector gedung A'
  AND project_id = (SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY');


-- ============================================================
-- 20. TASK ACTIVITIES (field journal entries)
-- ============================================================

-- P1: Survey lokasi & pengukuran (done, siti)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di lokasi Perumahan Citra Raya', 'arrival',    CURRENT_TIMESTAMP - INTERVAL '55 days' + INTERVAL '8 hours'),
  ('Mulai survey unit 1-5',              'start_work', CURRENT_TIMESTAMP - INTERVAL '55 days' + INTERVAL '8 hours 15 minutes'),
  ('Unit 1-5 selesai diukur, lanjut unit 6-10', 'note', CURRENT_TIMESTAMP - INTERVAL '55 days' + INTERVAL '10 hours 30 minutes'),
  ('Survey selesai, semua unit terukur', 'complete',   CURRENT_TIMESTAMP - INTERVAL '55 days' + INTERVAL '12 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Survey lokasi & pengukuran'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya')
  AND u.email = 'siti@shi.co.id';

-- P1: Instalasi smart lock (done, reza)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di lokasi, bawa 10 unit smart lock', 'arrival',    CURRENT_TIMESTAMP - INTERVAL '25 days' + INTERVAL '7 hours 30 minutes'),
  ('Mulai instalasi unit 1-3',                'start_work', CURRENT_TIMESTAMP - INTERVAL '25 days' + INTERVAL '8 hours'),
  ('Unit 1-3 done, baut mounting perlu diganti untuk tipe pintu cluster B', 'note', CURRENT_TIMESTAMP - INTERVAL '25 days' + INTERVAL '11 hours'),
  ('Foto hasil pemasangan unit 1-3',          'photo',      CURRENT_TIMESTAMP - INTERVAL '25 days' + INTERVAL '11 hours 30 minutes'),
  ('Lanjut unit 4-7 hari ini',                'note',       CURRENT_TIMESTAMP - INTERVAL '24 days' + INTERVAL '8 hours 15 minutes'),
  ('Semua smart lock terpasang dan tested',   'complete',   CURRENT_TIMESTAMP - INTERVAL '22 days' + INTERVAL '15 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Instalasi smart lock'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya')
  AND u.email = 'reza@shi.co.id';

-- P1: Instalasi lighting control (working_on_it, overtime, siti)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di lokasi, mulai dari unit 1',              'arrival',    CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '8 hours'),
  ('Mulai pasang smart switch unit 1-2',             'start_work', CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '8 hours 30 minutes'),
  ('Switch unit 1 ok, unit 2 ada masalah wiring lama', 'note',    CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '12 hours'),
  ('Wiring lama di unit 3-5 juga bermasalah, perlu re-wire dulu sebelum pasang switch', 'note', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '10 hours'),
  ('Unit 1-4 selesai, sisa 6 unit lagi',            'note',       CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '14 hours'),
  ('Kendala: stok dimmer habis, tunggu pengiriman',  'note',       CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '9 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Instalasi lighting control'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya')
  AND u.email = 'siti@shi.co.id';

-- P3: Instalasi panel kontrol utama (working_on_it, overtime, siti)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di villa Kaliurang',                        'arrival',    CURRENT_TIMESTAMP - INTERVAL '20 days' + INTERVAL '8 hours'),
  ('Mulai instalasi panel di ruang utility',         'start_work', CURRENT_TIMESTAMP - INTERVAL '20 days' + INTERVAL '8 hours 30 minutes'),
  ('Panel terpasang tapi modul controller belum datang', 'note',   CURRENT_TIMESTAMP - INTERVAL '18 days' + INTERVAL '10 hours'),
  ('Modul controller datang tapi salah spek, perlu return', 'note', CURRENT_TIMESTAMP - INTERVAL '15 days' + INTERVAL '9 hours'),
  ('Replacement sudah datang, mulai konfigurasi ulang', 'note',    CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '8 hours 30 minutes'),
  ('Konfigurasi panel 60% - masih troubleshoot komunikasi RS485', 'note', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '14 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Instalasi panel kontrol utama'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang')
  AND u.email = 'siti@shi.co.id';

-- P9: Instalasi lighting controller Lt 1 (done, fajar)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di kantor Dishub, lantai 1',                 'arrival',    CURRENT_TIMESTAMP - INTERVAL '18 days' + INTERVAL '7 hours 45 minutes'),
  ('Mulai pasang smart switch ruang utama',            'start_work', CURRENT_TIMESTAMP - INTERVAL '18 days' + INTERVAL '8 hours'),
  ('Ruang utama + ruang rapat selesai, lanjut koridor', 'note',     CURRENT_TIMESTAMP - INTERVAL '18 days' + INTERVAL '12 hours'),
  ('Semua switch lantai 1 terpasang dan tested',       'complete',  CURRENT_TIMESTAMP - INTERVAL '16 days' + INTERVAL '16 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Instalasi lighting controller Lt 1'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta')
  AND u.email = 'fajar@shi.co.id';

-- P11: Penarikan kabel fire alarm gedung A (done, yoga)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di kampus UTY gedung A',                      'arrival',    CURRENT_TIMESTAMP - INTERVAL '23 days' + INTERVAL '7 hours 30 minutes'),
  ('Mulai tarik kabel dari panel ke lantai 1',         'start_work', CURRENT_TIMESTAMP - INTERVAL '23 days' + INTERVAL '8 hours'),
  ('Lantai 1 selesai, lanjut ke lantai 2',             'note',       CURRENT_TIMESTAMP - INTERVAL '23 days' + INTERVAL '12 hours 30 minutes'),
  ('Kabel gedung A seluruh lantai selesai ditarik',    'complete',   CURRENT_TIMESTAMP - INTERVAL '21 days' + INTERVAL '15 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Penarikan kabel fire alarm gedung A'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY')
  AND u.email = 'yoga@shi.co.id';

-- P11: Instalasi panel & detector gedung A (working_on_it, yoga)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di gedung A, bawa panel + detector',          'arrival',    CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '7 hours 45 minutes'),
  ('Mulai pasang panel alarm di ruang security',       'start_work', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '8 hours'),
  ('Panel terpasang, mulai pasang detector lantai 1',  'note',       CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '11 hours'),
  ('Smoke detector lantai 1 selesai (15 unit), besok lanjut lantai 2', 'note', CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '15 hours'),
  ('Lantai 2 smoke detector terpasang, MCP lantai 1-2 done', 'note', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '14 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Instalasi panel & detector gedung A'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Fire Alarm System - Kampus UTY')
  AND u.email = 'yoga@shi.co.id';

-- P3: Instalasi smart curtain & AC (working_on_it, siti)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di villa, bawa motor curtain',                'arrival',    CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '8 hours'),
  ('Mulai instalasi motor curtain kamar utama',        'start_work', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '8 hours 30 minutes'),
  ('Motor curtain kamar utama ok, kamar tamu stuck - perlu adapter custom', 'note', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '13 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Instalasi smart curtain & AC'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang')
  AND u.email = 'siti@shi.co.id';

-- P9: Penarikan kabel data (done, reza)
INSERT INTO task_activities (task_id, user_id, message, activity_type, created_at)
SELECT t.id, u.id, d.msg, d.atype, d.ts
FROM tasks t, users u,
(VALUES
  ('Tiba di Dishub, mulai dari basement',              'arrival',    CURRENT_TIMESTAMP - INTERVAL '25 days' + INTERVAL '7 hours 30 minutes'),
  ('Tarik kabel UTP dari server room ke lantai 1',     'start_work', CURRENT_TIMESTAMP - INTERVAL '25 days' + INTERVAL '8 hours'),
  ('Kabel ke semua lantai selesai, testing koneksi ok', 'complete',  CURRENT_TIMESTAMP - INTERVAL '23 days' + INTERVAL '16 hours')
) AS d(msg, atype, ts)
WHERE t.name = 'Penarikan kabel data'
  AND t.project_id = (SELECT id FROM projects WHERE name = 'Smart Building - Kantor Dishub Yogyakarta')
  AND u.email = 'reza@shi.co.id';

-- ============================================================
-- Escalation entries
-- ============================================================

-- P1: gateway IoT firmware issue (resolved)
INSERT INTO escalations (task_id, project_id, reported_by, title, description, status, priority, created_at)
SELECT
  (SELECT id FROM tasks WHERE name = 'Setup gateway IoT' AND project_id = p.id),
  p.id,
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'Gateway IoT firmware tidak kompatibel',
  'Firmware gateway Tuya versi terbaru tidak kompatibel dengan smart switch yang sudah terpasang. Perlu downgrade firmware atau ganti model gateway.',
  'resolved', 'high',
  CURRENT_TIMESTAMP - INTERVAL '8 days'
FROM projects p WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya';

-- P3: material belum datang (open, critical)
INSERT INTO escalations (task_id, project_id, reported_by, title, description, status, priority, created_at)
SELECT
  (SELECT id FROM tasks WHERE name = 'Instalasi smart curtain & AC' AND project_id = p.id),
  p.id,
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'Motor curtain tidak sesuai spek',
  'Motor curtain yang dikirim supplier tidak cocok dengan rel yang sudah terpasang. Butuh adapter custom atau ganti model motor. Deadline mendekat.',
  'open', 'critical',
  CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM projects p WHERE p.name = 'Smart Home Automation - Villa Kaliurang';

-- P3: lighting issue (in_review)
INSERT INTO escalations (task_id, project_id, reported_by, title, description, status, priority, created_at)
SELECT
  (SELECT id FROM tasks WHERE name = 'Instalasi lighting automation' AND project_id = p.id),
  p.id,
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'Dimmer tidak support lampu LED klien',
  'Dimmer yang kita pasang tidak kompatibel dengan lampu LED merk Philips yang sudah ada di villa. Flickering saat di-dim. Perlu ganti dimmer atau minta klien ganti lampu.',
  'in_review', 'medium',
  CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM projects p WHERE p.name = 'Smart Home Automation - Villa Kaliurang';

-- P11: fire alarm panel issue (open)
INSERT INTO escalations (task_id, project_id, reported_by, title, description, status, priority, created_at)
SELECT
  (SELECT id FROM tasks WHERE name = 'Instalasi panel & detector gedung A' AND project_id = p.id),
  p.id,
  (SELECT id FROM users WHERE email = 'yoga@shi.co.id'),
  'Panel fire alarm zone 3 error',
  'Panel Notifier di gedung A zone 3 menunjukkan ground fault. Sudah dicek kabel, kemungkinan smoke detector rusak. Butuh penggantian detector.',
  'open', 'high',
  CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM projects p WHERE p.name = 'Fire Alarm System - Kampus UTY';

-- P13: weather delay (resolved)
INSERT INTO escalations (task_id, project_id, reported_by, title, description, status, priority, created_at)
SELECT
  (SELECT id FROM tasks WHERE name = 'Instalasi sensor energi batch 2 (24 panel)' AND project_id = p.id),
  p.id,
  (SELECT id FROM users WHERE email = 'yoga@shi.co.id'),
  'Hujan deras 3 hari berturut-turut',
  'Tidak bisa kerja di atap pabrik karena hujan deras selama 3 hari. Sensor batch 2 tertunda. Mohon perpanjangan deadline.',
  'resolved', 'medium',
  CURRENT_TIMESTAMP - INTERVAL '10 days'
FROM projects p WHERE p.name = 'Solar Panel Monitoring - Sinar Mas';

-- Update resolved escalations with resolution details
UPDATE escalations SET
  resolved_by = (SELECT id FROM users WHERE email = 'budi@shi.co.id'),
  resolved_at = CURRENT_TIMESTAMP - INTERVAL '5 days',
  resolution_notes = 'Sudah koordinasi dengan supplier, firmware downgrade berhasil. Gateway berfungsi normal.'
WHERE title = 'Gateway IoT firmware tidak kompatibel';

UPDATE escalations SET
  resolved_by = (SELECT id FROM users WHERE email = 'hendro@shi.co.id'),
  resolved_at = CURRENT_TIMESTAMP - INTERVAL '7 days',
  resolution_notes = 'Deadline diperpanjang 5 hari. Cuaca sudah membaik, lanjutkan instalasi.'
WHERE title = 'Hujan deras 3 hari berturut-turut';
