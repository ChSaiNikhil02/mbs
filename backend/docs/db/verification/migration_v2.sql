-- MILESTONE 2 MIGRATION SCRIPT
-- Objective: Add CategoryRules, Unique Constraints, and Performance Indexes
-- Strategy: Idempotent (run-once safe)

DO $$ 
BEGIN
    -- 1. Create Category Rules Table if not exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'category_rules') THEN
        CREATE TABLE public.category_rules (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            keyword VARCHAR(255) NOT NULL,
            merchant_name VARCHAR(255),
            category VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_category_rules_user_id ON public.category_rules(user_id);
    END IF;

    -- 2. Add Unique Constraint to Budgets (prevent duplicate monthly categories)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budgets_user_id_month_year_category_key') THEN
        ALTER TABLE public.budgets 
        ADD CONSTRAINT budgets_user_id_month_year_category_key UNIQUE (user_id, month, year, category);
    END IF;

    -- 3. Add Unique Constraint to Alerts (prevent duplicate notification spam)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_alert') THEN
        ALTER TABLE public.alerts 
        ADD CONSTRAINT unique_user_alert UNIQUE (user_id, type, message);
    END IF;

    -- 4. Create Performance Indexes (Concurrent to avoid locking table)
    -- Note: CREATE INDEX CONCURRENTLY cannot be run inside a transaction block (DO block).
    -- We will list them separately below.
END $$;
