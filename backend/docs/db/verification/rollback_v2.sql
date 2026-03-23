-- ROLLBACK SCRIPT FOR MILESTONE 2
-- CAUTION: This will drop the CategoryRules table and its data.

-- 1. Drop Indexes
DROP INDEX IF EXISTS public.idx_transactions_agg_covering;
DROP INDEX IF EXISTS public.idx_transactions_debit_only;

-- 2. Drop Constraints
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_month_year_category_key;
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS unique_user_alert;

-- 3. Drop Table
DROP TABLE IF EXISTS public.category_rules;
