-- MILESTONE 3 MIGRATION: Rule Uniqueness
-- Objective: Enforce DB-level uniqueness for category rules per user
-- Strategy: Use NULLS NOT DISTINCT (PostgreSQL 15+) to handle merchant_name correctly

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_rule') THEN
        ALTER TABLE public.category_rules 
        ADD CONSTRAINT unique_user_rule UNIQUE NULLS NOT DISTINCT (user_id, keyword, merchant_name);
        RAISE NOTICE 'Unique constraint unique_user_rule added to category_rules';
    END IF;
END $$;
