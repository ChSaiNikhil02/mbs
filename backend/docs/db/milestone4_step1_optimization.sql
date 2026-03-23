-- MILESTONE 4: STEP 1 - OPTIMIZE QUERIES FOR INSIGHTS
-- Objective: Add performance indexes and write optimized aggregation queries.

-- 1. Add requested indexes for faster filtering and joins
-- Index on user_id in accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- Index on txn_date in transactions
-- Note: Since transactions is partitioned, this will be created on all partitions
CREATE INDEX IF NOT EXISTS idx_transactions_txn_date ON public.transactions(txn_date);

-- Index on category in transactions
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);

-- Optimized SQL for Insights (for reference in repository implementation)

-- Cashflow: SUM(amount) grouped by month and txn_type
-- SELECT 
--     DATE_TRUNC('month', txn_date) AS month,
--     txn_type,
--     SUM(amount) AS total_amount
-- FROM transactions t
-- JOIN accounts a ON t.account_id = a.id
-- WHERE a.user_id = :user_id
-- GROUP BY 1, 2
-- ORDER BY 1 DESC;

-- Category spend: GROUP BY category
-- SELECT 
--     category,
--     SUM(amount) AS total_amount
-- FROM transactions t
-- JOIN accounts a ON t.account_id = a.id
-- WHERE a.user_id = :user_id AND t.txn_type = 'debit'
-- GROUP BY category
-- ORDER BY total_amount DESC;

-- Top merchants: ORDER BY SUM(amount) DESC
-- SELECT 
--     merchant,
--     SUM(amount) AS total_amount
-- FROM transactions t
-- JOIN accounts a ON t.account_id = a.id
-- WHERE a.user_id = :user_id AND t.txn_type = 'debit'
-- GROUP BY merchant
-- ORDER BY total_amount DESC
-- LIMIT 10;
