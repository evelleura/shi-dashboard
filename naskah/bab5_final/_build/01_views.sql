-- BAB IV nomenklatur views (auto-updatable)
-- Maps base tables to BAB IV-spec names AND column names without renaming
-- the physical tables. Single-table SELECT with column aliases keeps
-- these views simple-auto-updatable in PostgreSQL.

DROP VIEW IF EXISTS tb_eskalasi CASCADE;
DROP VIEW IF EXISTS tb_bukti CASCADE;
DROP VIEW IF EXISTS tb_tugas CASCADE;
DROP VIEW IF EXISTS tb_penugasan_proyek CASCADE;
DROP VIEW IF EXISTS tb_proyek CASCADE;
DROP VIEW IF EXISTS tb_klien CASCADE;
DROP VIEW IF EXISTS tb_user CASCADE;

CREATE VIEW tb_user AS
  SELECT id AS id_user, name, email, role, password_hash,
         is_active, created_at
  FROM users;

CREATE VIEW tb_klien AS
  SELECT id AS id_klien, name, address, phone, email, notes,
         latitude, longitude, created_by, created_at, updated_at
  FROM clients;

CREATE VIEW tb_proyek AS
  SELECT id AS id_proyek, project_code, name, description,
         client_id AS id_klien, start_date, end_date, duration,
         status, phase, category, project_value,
         survey_approved, survey_approved_by, survey_approved_at,
         target_description, created_by, created_at, updated_at
  FROM projects;

CREATE VIEW tb_penugasan_proyek AS
  SELECT project_id AS id_proyek, user_id AS id_user, assigned_at
  FROM project_assignments;

CREATE VIEW tb_tugas AS
  SELECT id AS id_tugas, project_id AS id_proyek, name, description,
         assigned_to, status, due_date, timeline_start, timeline_end,
         notes, sort_order, is_survey_task, estimated_hours,
         status_changed_at, created_by, created_at, updated_at
  FROM tasks;

CREATE VIEW tb_bukti AS
  SELECT id AS id_bukti, task_id AS id_tugas, file_path, file_name,
         file_type, file_size, description, uploaded_by, uploaded_at
  FROM task_evidence;

CREATE VIEW tb_eskalasi AS
  SELECT id AS id_eskalasi, task_id AS id_tugas,
         project_id AS id_proyek, reported_by,
         title, description, status, priority,
         file_path, file_name, file_type, file_size,
         resolved_by, resolved_at, resolution_notes,
         created_at, updated_at
  FROM escalations;
