-- Seed data for development/testing
-- Passwords are: 'password123' (bcrypt hash)

-- ============================================================
-- Users
-- ============================================================
INSERT INTO users (name, email, role, password_hash) VALUES
('Admin SHI', 'admin@shi.co.id', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Budi Santoso', 'budi@shi.co.id', 'manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Siti Rahma', 'siti@shi.co.id', 'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Andi Wijaya', 'andi@shi.co.id', 'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Reza Pratama', 'reza@shi.co.id', 'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- Clients
-- ============================================================
INSERT INTO clients (name, address, phone, email, notes, created_by) VALUES
(
  'PT Citra Raya Development',
  'Jl. Magelang Km 12, Sleman, Yogyakarta',
  '0274-123456',
  'info@citraraya.co.id',
  'Developer perumahan premium di kawasan Sleman',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'Bank BPD DIY',
  'Jl. Tentara Pelajar No. 7, Yogyakarta',
  '0274-562811',
  'humas@bpddiy.co.id',
  'Kantor pusat BPD DIY, proyek keamanan gedung',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'Bp. Haryanto',
  'Villa Kaliurang Blok C-15, Sleman',
  '081234567890',
  'haryanto@gmail.com',
  'Pemilik villa di kawasan Kaliurang, ingin automasi lengkap',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'PT Logistik Nusantara',
  'Jl. Ring Road Utara No. 88, Yogyakarta',
  '0274-789012',
  'ops@logistiknusantara.co.id',
  'Perusahaan logistik, butuh monitoring gudang',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'Hotel Melia Yogyakarta',
  'Jl. Adisucipto No. 2, Yogyakarta',
  '0274-566353',
  'engineering@meliayogya.com',
  'Hotel bintang 5, proyek smart lighting',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Projects (with client references, phases, and project values)
-- ============================================================
INSERT INTO projects (name, description, client_id, start_date, end_date, status, phase, project_value, survey_approved, target_description, created_by) VALUES
(
  'Smart Home IoT - Perumahan Citra Raya',
  'Instalasi sistem smart home lengkap di kawasan Perumahan Citra Raya Yogyakarta',
  (SELECT id FROM clients WHERE name = 'PT Citra Raya Development'),
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE + INTERVAL '30 days',
  'active',
  'execution',
  150000000.00,
  TRUE,
  'Instalasi lengkap smart home untuk 10 unit rumah termasuk smart lock, lighting control, dan CCTV terintegrasi',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'CCTV & Security System - Kantor BPD DIY',
  'Pemasangan CCTV dan sistem keamanan terintegrasi di kantor BPD DIY Yogyakarta',
  (SELECT id FROM clients WHERE name = 'Bank BPD DIY'),
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '60 days',
  'active',
  'execution',
  85000000.00,
  TRUE,
  'Pemasangan 32 kamera CCTV, NVR, dan access control di 4 lantai kantor',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'Smart Home Automation - Villa Kaliurang',
  'Implementasi home automation system di Villa Kaliurang Sleman',
  (SELECT id FROM clients WHERE name = 'Bp. Haryanto'),
  CURRENT_DATE - INTERVAL '45 days',
  CURRENT_DATE + INTERVAL '15 days',
  'active',
  'execution',
  45000000.00,
  TRUE,
  'Automasi lengkap villa: lighting, curtain, AC, dan security system dengan kontrol mobile',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'IoT Sensor Network - Gudang Logistik',
  'Pemasangan jaringan sensor IoT untuk monitoring gudang logistik',
  (SELECT id FROM clients WHERE name = 'PT Logistik Nusantara'),
  CURRENT_DATE - INTERVAL '20 days',
  CURRENT_DATE + INTERVAL '40 days',
  'active',
  'execution',
  65000000.00,
  TRUE,
  'Instalasi sensor suhu, kelembaban, dan keamanan di 3 gudang, dashboard monitoring terpusat',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'Smart Lighting - Hotel Melia',
  'Instalasi sistem smart lighting di Hotel Melia Yogyakarta',
  (SELECT id FROM clients WHERE name = 'Hotel Melia Yogyakarta'),
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '80 days',
  'active',
  'survey',
  200000000.00,
  FALSE,
  'Sistem smart lighting untuk lobby, ballroom, koridor, dan 120 kamar hotel',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Project assignments
-- ============================================================
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u
WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u
WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'reza@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u
WHERE p.name = 'CCTV & Security System - Kantor BPD DIY' AND u.email = 'andi@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u
WHERE p.name = 'Smart Home Automation - Villa Kaliurang' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u
WHERE p.name = 'IoT Sensor Network - Gudang Logistik' AND u.email = 'reza@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u
WHERE p.name = 'Smart Lighting - Hotel Melia' AND u.email = 'andi@shi.co.id'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Tasks for Project 1: Smart Home IoT - Citra Raya (BEHIND SCHEDULE - Red)
-- 10 tasks, 3 done, 4 working, 1 stuck, 2 to_do
-- ============================================================
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Survey lokasi & pengukuran',
  'Survey awal dan pengukuran seluruh unit rumah yang akan dipasang smart home',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '50 days',
  5000000,
  1,
  TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Penarikan kabel jaringan',
  'Penarikan kabel UTP dan kabel power untuk smart home controller di setiap unit',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '35 days',
  15000000,
  2,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Instalasi smart lock',
  'Pemasangan smart lock di pintu utama setiap unit',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '20 days',
  20000000,
  3,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Instalasi lighting control',
  'Pemasangan smart switch dan dimmer untuk kontrol pencahayaan',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'working_on_it',
  CURRENT_DATE - INTERVAL '5 days',
  18000000,
  4,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Instalasi CCTV per unit',
  'Pemasangan 2 kamera CCTV per unit rumah',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '5 days',
  25000000,
  5,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Setup gateway IoT',
  'Konfigurasi gateway IoT dan koneksi ke cloud',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'stuck',
  CURRENT_DATE - INTERVAL '10 days',
  12000000,
  6,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Konfigurasi mobile app',
  'Setup dan testing mobile app untuk kontrol smart home',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '10 days',
  8000000,
  7,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Integrasi sistem keamanan',
  'Integrasi CCTV, smart lock, dan alarm ke satu dashboard',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '15 days',
  15000000,
  8,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Testing & QC',
  'Testing menyeluruh semua sistem di setiap unit',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '22 days',
  5000000,
  9,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Serah terima & training',
  'Serah terima ke penghuni dan training penggunaan smart home',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '28 days',
  2000000,
  10,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Tasks for Project 2: CCTV BPD DIY (ON TRACK - Green)
-- 8 tasks, 3 done, 3 working, 0 stuck, 2 to_do
-- ============================================================
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Survey gedung & perencanaan titik kamera',
  'Survey 4 lantai kantor, tentukan posisi kamera optimal',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '22 days',
  3000000,
  1,
  TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Penarikan kabel CCTV lantai 1-2',
  'Penarikan kabel coaxial dan UTP untuk 16 kamera di lantai 1-2',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '15 days',
  10000000,
  2,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Penarikan kabel CCTV lantai 3-4',
  'Penarikan kabel coaxial dan UTP untuk 16 kamera di lantai 3-4',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '8 days',
  10000000,
  3,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Instalasi kamera lantai 1-2',
  'Pemasangan 16 kamera CCTV di lantai 1 dan 2',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '5 days',
  15000000,
  4,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Instalasi kamera lantai 3-4',
  'Pemasangan 16 kamera CCTV di lantai 3 dan 4',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '15 days',
  15000000,
  5,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Setup NVR & storage',
  'Instalasi dan konfigurasi NVR dengan storage 8TB',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '25 days',
  12000000,
  6,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Instalasi access control',
  'Pemasangan access control card reader di pintu utama setiap lantai',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '40 days',
  12000000,
  7,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Testing & commissioning',
  'Testing seluruh sistem CCTV dan access control, termasuk uji recording 24 jam',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '55 days',
  3000000,
  8,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Tasks for Project 3: Villa Kaliurang (CRITICAL - Red)
-- 6 tasks, 1 done, 2 working, 2 stuck, 1 to_do
-- ============================================================
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
(
  (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'),
  'Survey villa & desain sistem',
  'Survey layout villa dan desain system automasi',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '38 days',
  2000000,
  1,
  TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'),
  'Instalasi panel kontrol utama',
  'Pemasangan panel kontrol automasi di ruang utility',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'working_on_it',
  CURRENT_DATE - INTERVAL '15 days',
  8000000,
  2,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'),
  'Instalasi smart curtain & AC control',
  'Pemasangan motor curtain dan kontrol AC di seluruh ruangan',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'stuck',
  CURRENT_DATE - INTERVAL '5 days',
  12000000,
  3,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'),
  'Instalasi lighting automation',
  'Pemasangan smart switch, dimmer, dan motion sensor',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'stuck',
  CURRENT_DATE - INTERVAL '2 days',
  8000000,
  4,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'),
  'Instalasi security system',
  'Pemasangan CCTV, alarm, dan smart lock villa',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '5 days',
  10000000,
  5,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home Automation - Villa Kaliurang'),
  'Integrasi & testing',
  'Integrasi seluruh sistem dan testing end-to-end',
  (SELECT id FROM users WHERE email = 'siti@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '12 days',
  3000000,
  6,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Tasks for Project 4: IoT Gudang Logistik (AMBER warning)
-- 5 tasks, 1 done, 2 working, 0 stuck, 2 to_do
-- ============================================================
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
(
  (SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'),
  'Survey gudang & titik sensor',
  'Survey 3 gudang, tentukan titik sensor optimal untuk suhu dan kelembaban',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'done',
  CURRENT_DATE - INTERVAL '12 days',
  3000000,
  1,
  TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'),
  'Instalasi sensor gudang 1',
  'Pemasangan 8 sensor suhu/kelembaban dan 4 sensor keamanan di gudang 1',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '5 days',
  12000000,
  2,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'),
  'Instalasi sensor gudang 2 & 3',
  'Pemasangan sensor di gudang 2 dan 3',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '15 days',
  20000000,
  3,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'),
  'Setup gateway & dashboard monitoring',
  'Konfigurasi IoT gateway dan dashboard monitoring terpusat',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '28 days',
  15000000,
  4,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'IoT Sensor Network - Gudang Logistik'),
  'Testing & kalibrasi sensor',
  'Testing akurasi sensor dan kalibrasi threshold alarm',
  (SELECT id FROM users WHERE email = 'reza@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '35 days',
  5000000,
  5,
  FALSE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Tasks for Project 5: Smart Lighting Hotel (SURVEY phase - no SPI yet)
-- 3 survey tasks
-- ============================================================
INSERT INTO tasks (project_id, name, description, assigned_to, status, due_date, budget, sort_order, is_survey_task, created_by) VALUES
(
  (SELECT id FROM projects WHERE name = 'Smart Lighting - Hotel Melia'),
  'Survey lobby & ballroom',
  'Survey area lobby dan ballroom untuk perencanaan sistem lighting',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'working_on_it',
  CURRENT_DATE + INTERVAL '10 days',
  2000000,
  1,
  TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Lighting - Hotel Melia'),
  'Survey koridor & area publik',
  'Survey koridor setiap lantai dan area publik hotel',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '15 days',
  2000000,
  2,
  TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  (SELECT id FROM projects WHERE name = 'Smart Lighting - Hotel Melia'),
  'Survey sample kamar hotel',
  'Survey 3 tipe kamar hotel untuk desain sistem lighting per kamar',
  (SELECT id FROM users WHERE email = 'andi@shi.co.id'),
  'to_do',
  CURRENT_DATE + INTERVAL '20 days',
  1000000,
  3,
  TRUE,
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Materials for Project 1: Smart Home IoT
-- ============================================================
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Smart Lock Yale YDM4109', 10, 'unit', 3500000, 'Digital door lock dengan fingerprint & PIN'
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Kabel UTP Cat6', 500, 'meter', 5000, 'Kabel jaringan utama'
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Smart Switch Sonoff', 40, 'unit', 250000, 'Smart switch WiFi single channel'
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'IP Camera Hikvision DS-2CD1043', 20, 'unit', 1200000, 'Kamera 4MP outdoor'
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'IoT Gateway Tuya ZS-GW', 10, 'unit', 800000, 'Gateway smart home per unit'
);

-- ============================================================
-- Materials for Project 2: CCTV BPD DIY
-- ============================================================
INSERT INTO materials (project_id, name, quantity, unit, unit_price, notes) VALUES
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'IP Camera Dahua IPC-HFW2431S', 32, 'unit', 1500000, 'Kamera 4MP indoor/outdoor'
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'NVR Dahua DHI-NVR4232-4KS2', 2, 'unit', 8500000, 'NVR 32 channel 4K'
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'HDD WD Purple 4TB', 4, 'unit', 1800000, 'Hard disk surveillance grade'
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Access Control ZKTeco F18', 8, 'unit', 2200000, 'Fingerprint & card reader'
);

-- ============================================================
-- Budget items for Project 1: Smart Home IoT
-- ============================================================
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Material', 'Pembelian material smart home (smart lock, switch, kamera, gateway, kabel)', 100000000, FALSE
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Jasa Instalasi', 'Biaya tenaga kerja instalasi 10 unit rumah', 30000000, FALSE
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Transport', 'Biaya transportasi dan akomodasi tim', 5000000, FALSE
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Material', 'Pembelian material batch 1 (smart lock, kabel)', 45000000, TRUE
),
(
  (SELECT id FROM projects WHERE name = 'Smart Home IoT - Perumahan Citra Raya'),
  'Jasa Instalasi', 'Pembayaran tenaga kerja bulan 1', 12000000, TRUE
);

-- ============================================================
-- Budget items for Project 2: CCTV BPD DIY
-- ============================================================
INSERT INTO budget_items (project_id, category, description, amount, is_actual) VALUES
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Material', 'Pembelian kamera, NVR, HDD, access control', 60000000, FALSE
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Jasa Instalasi', 'Biaya penarikan kabel dan instalasi', 15000000, FALSE
),
(
  (SELECT id FROM projects WHERE name = 'CCTV & Security System - Kantor BPD DIY'),
  'Material', 'Pembelian kamera dan NVR batch 1', 35000000, TRUE
);

-- ============================================================
-- Daily reports (legacy format, project-level progress)
-- ============================================================

-- Reports for Project 1: Citra Raya (behind schedule)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '30 days', 20.0, 'Keterlambatan pengiriman material gateway IoT', u.id
FROM projects p, users u WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '15 days', 35.0, 'Masalah koneksi jaringan di cluster B, belum terselesaikan', u.id
FROM projects p, users u WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '5 days', 42.0, 'Progres lambat akibat tenaga kurang', u.id
FROM projects p, users u WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

-- Reports for Project 2: BPD DIY (on track)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '20 days', 15.0, NULL, u.id
FROM projects p, users u WHERE p.name = 'CCTV & Security System - Kantor BPD DIY' AND u.email = 'andi@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '10 days', 28.0, NULL, u.id
FROM projects p, users u WHERE p.name = 'CCTV & Security System - Kantor BPD DIY' AND u.email = 'andi@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '2 days', 35.0, 'Instalasi kabel di lantai 3 selesai', u.id
FROM projects p, users u WHERE p.name = 'CCTV & Security System - Kantor BPD DIY' AND u.email = 'andi@shi.co.id'
ON CONFLICT DO NOTHING;

-- Reports for Project 3: Villa Kaliurang (critical)
INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '40 days', 10.0, 'Akses lokasi terbatas oleh pemilik villa', u.id
FROM projects p, users u WHERE p.name = 'Smart Home Automation - Villa Kaliurang' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '20 days', 25.0, 'Modul controller belum datang dari supplier', u.id
FROM projects p, users u WHERE p.name = 'Smart Home Automation - Villa Kaliurang' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;

INSERT INTO daily_reports (project_id, report_date, progress_percentage, constraints, created_by)
SELECT p.id, CURRENT_DATE - INTERVAL '7 days', 40.0, 'Masih kekurangan 60% dari target, risiko deadline', u.id
FROM projects p, users u WHERE p.name = 'Smart Home Automation - Villa Kaliurang' AND u.email = 'siti@shi.co.id'
ON CONFLICT DO NOTHING;
