-- 05_scalability_partitioning.sql
-- Verify range partitioning implementation for transactions.

SELECT 
    nmsp_parent.nspname AS parent_schema,
    parent.relname      AS parent_table,
    child.relname       AS partition_name
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child  ON pg_inherits.inhrelid  = child.oid
JOIN pg_namespace nmsp_parent ON nmsp_parent.oid = parent.relnamespace
WHERE parent.relname = 'transactions';
