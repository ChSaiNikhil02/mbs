-- 04_concurrency.sql
-- Verify transaction isolation and deadlock detection configuration.

-- 1. Check isolation level
SHOW default_transaction_isolation;

-- 2. Check lock timeout settings
SHOW deadlock_timeout;
SHOW log_lock_waits;

-- 3. Check for currently waiting locks
SELECT count(*) FROM pg_locks WHERE NOT granted;
