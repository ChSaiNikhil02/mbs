-- PERFORMANCE INDEXES (Run outside transaction for zero-downtime)
-- Using CONCURRENTLY ensures readers/writers are not blocked during index builds

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_agg_covering 
ON public.transactions (account_id, txn_type, txn_date, category) INCLUDE (amount);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_debit_only 
ON public.transactions (account_id, txn_date, category) 
INCLUDE (amount) WHERE (txn_type = 'debit');
