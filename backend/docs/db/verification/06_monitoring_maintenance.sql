-- 06_monitoring_maintenance.sql
-- Verify monitoring extensions and WAL archiving status.

-- 1. Check for pg_stat_statements
SELECT name, installed_version FROM pg_available_extensions WHERE name = 'pg_stat_statements';

-- 2. Check Slow Query Logging (Threshold)
SHOW log_min_duration_statement;

-- 3. Check WAL Archiving (Durability)
SHOW archive_mode;
SHOW archive_command;
