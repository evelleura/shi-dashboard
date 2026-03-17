-- Seed data for development/testing
-- Passwords are: 'password123' (bcrypt hash)

-- Users
INSERT INTO users (name, email, role, password_hash) VALUES
('Admin SHI', 'admin@shi.co.id', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Budi Santoso', 'budi@shi.co.id', 'manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Siti Rahma', 'siti@shi.co.id', 'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Andi Wijaya', 'andi@shi.co.id', 'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Reza Pratama', 'reza@shi.co.id', 'technician', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- Projects (using relative dates based on today)
INSERT INTO projects (name, description, start_date, end_date, status, created_by) VALUES
(
  'Smart Home IoT - Perumahan Citra Raya',
  'Instalasi sistem smart home lengkap di kawasan Perumahan Citra Raya Yogyakarta',
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE + INTERVAL '30 days',
  'active',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'CCTV & Security System - Kantor BPD DIY',
  'Pemasangan CCTV dan sistem keamanan terintegrasi di kantor BPD DIY Yogyakarta',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '60 days',
  'active',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'Smart Home Automation - Villa Kaliurang',
  'Implementasi home automation system di Villa Kaliurang Sleman',
  CURRENT_DATE - INTERVAL '45 days',
  CURRENT_DATE + INTERVAL '15 days',
  'active',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'IoT Sensor Network - Gudang Logistik',
  'Pemasangan jaringan sensor IoT untuk monitoring gudang logistik',
  CURRENT_DATE - INTERVAL '20 days',
  CURRENT_DATE + INTERVAL '40 days',
  'active',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
),
(
  'Smart Lighting - Hotel Melia',
  'Instalasi sistem smart lighting di Hotel Melia Yogyakarta',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '80 days',
  'active',
  (SELECT id FROM users WHERE email = 'budi@shi.co.id')
)
ON CONFLICT DO NOTHING;

-- Assign technicians to projects
INSERT INTO project_assignments (project_id, user_id)
SELECT p.id, u.id FROM projects p, users u
WHERE p.name = 'Smart Home IoT - Perumahan Citra Raya' AND u.email = 'siti@shi.co.id'
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

-- Daily reports for project 1 (Citra Raya - BEHIND SCHEDULE - Red)
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

-- Daily reports for project 2 (BPD DIY - ON TRACK - Green)
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

-- Daily reports for project 3 (Villa Kaliurang - CRITICAL - Red)
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
