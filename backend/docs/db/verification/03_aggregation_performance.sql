-- 03_aggregation_performance.sql
-- Check index usage efficiency and hit ratios.

SELECT 
    relname AS table_name, 
    100 * idx_scan / (seq_scan + idx_scan + 1) AS index_hit_ratio, 
    n_live_tup AS total_rows
FROM pg_stat_user_tables 
WHERE relname IN ('transactions', 'budgets', 'accounts');
