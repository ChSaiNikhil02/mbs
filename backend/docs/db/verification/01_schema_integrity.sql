-- 01_schema_integrity.sql
-- Verify financial precision, mandatory fields, and uniqueness constraints.

-- 1. Check Field Types (DECIMAL 15,2) and Nullability
SELECT 
    table_name, column_name, data_type, is_nullable, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name IN ('users', 'accounts', 'transactions', 'budgets')
AND column_name IN ('amount', 'balance', 'monthly_limit', 'email', 'txn_type');

-- 2. Verify Unique Constraints (Budgets & Rules)
-- Note: 'unique_user_rule' handles NULLs correctly in Postgres 15+
SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname IN (
    'budgets_user_id_month_year_category_key', 
    'unique_user_rule', 
    'unique_user_alert'
);
