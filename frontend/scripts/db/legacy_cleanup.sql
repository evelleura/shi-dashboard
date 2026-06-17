-- Legacy cleanup: drop tables and columns that existed in earlier builds
-- but are no longer part of the canonical class diagram. Safe to re-run.
-- Run this ONCE on existing installs before re-applying schema.sql.

DROP TABLE IF EXISTS budget_items CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
ALTER TABLE IF EXISTS tasks DROP COLUMN IF EXISTS budget;
ALTER TABLE IF EXISTS project_health DROP COLUMN IF EXISTS deviation_percent;
ALTER TABLE IF EXISTS tasks DROP COLUMN IF EXISTS timer_started_at;
ALTER TABLE IF EXISTS tasks DROP COLUMN IF EXISTS is_tracking;
