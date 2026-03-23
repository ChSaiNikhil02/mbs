-- MILESTONE 4: STEP 6 - DATA VALIDATION & EDGE CASE HANDLING
-- Objective: Add database-level constraints to ensure data integrity and prevent invalid values.

DO $$ 
BEGIN
    -- 1. Transactions Validation
    -- Ensure amount is never negative
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_transactions_amount_positive') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT chk_transactions_amount_positive CHECK (amount >= 0);
    END IF;

    -- Ensure category has a fallback if missing (optional, handled at query level but good for DB integrity)
    -- ALTER TABLE public.transactions ALTER COLUMN category SET DEFAULT 'Uncategorized';

    -- 2. Accounts Validation
    -- Ensure balance doesn't drop below zero (basic banking logic)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_accounts_balance_non_negative') THEN
        ALTER TABLE public.accounts ADD CONSTRAINT chk_accounts_balance_non_negative CHECK (balance >= 0);
    END IF;

    -- 3. Budgets Validation
    -- Ensure monthly limit is a positive value
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_budgets_limit_positive') THEN
        ALTER TABLE public.budgets ADD CONSTRAINT chk_budgets_limit_positive CHECK (monthly_limit >= 0);
    END IF;

    -- 4. Bills Validation
    -- Ensure amount due is a positive value
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bills_amount_positive') THEN
        ALTER TABLE public.bills ADD CONSTRAINT chk_bills_amount_positive CHECK (amount_due >= 0);
    END IF;

    -- 5. User Validation
    -- Ensure kyc_status is one of the allowed values
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_kyc_status') THEN
        ALTER TABLE public.users ADD CONSTRAINT chk_user_kyc_status CHECK (kyc_status IN ('pending', 'verified', 'approved', 'rejected', 'unverified'));
    END IF;

END $$;
