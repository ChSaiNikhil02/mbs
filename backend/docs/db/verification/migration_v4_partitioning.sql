-- MILESTONE 4: PARTITIONING & SCALABILITY
-- Objective: Implement Range Partitioning for Transactions

BEGIN;

-- 1. Rename existing table
ALTER TABLE public.transactions RENAME TO transactions_old;

-- 2. Create the partitioned table
-- Note: Partitioned tables cannot have a primary key that doesn't include the partition key
CREATE TABLE public.transactions (
    id SERIAL,
    account_id INTEGER NOT NULL REFERENCES public.accounts(id),
    txn_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description VARCHAR(255),
    merchant VARCHAR(255),
    category VARCHAR(100),
    txn_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, txn_date)
) PARTITION BY RANGE (txn_date);

-- 3. Create partitions
CREATE TABLE public.transactions_2025 PARTITION OF public.transactions
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE public.transactions_2026 PARTITION OF public.transactions
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- 4. Default partition for outliers
CREATE TABLE public.transactions_default PARTITION OF public.transactions DEFAULT;

-- 5. Migrate data
-- We use a loop or batch if this was a production env, but here we do it in one go
INSERT INTO public.transactions (account_id, txn_type, amount, currency, description, merchant, category, txn_date)
SELECT account_id, txn_type, amount, currency, description, merchant, category, txn_date
FROM transactions_old;

-- 6. Re-apply performance indexes
CREATE INDEX idx_transactions_2025_agg ON public.transactions_2025 (account_id, txn_type, txn_date, category);
CREATE INDEX idx_transactions_2026_agg ON public.transactions_2026 (account_id, txn_type, txn_date, category);

COMMIT;
