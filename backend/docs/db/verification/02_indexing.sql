-- 02_indexing.sql
-- Verify covering aggregation indexes and partition keys.

SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE indexname IN (
    'idx_transactions_agg_covering', 
    'idx_transactions_debit_only',
    'idx_category_rules_user_id'
) OR tablename = 'budgets';
