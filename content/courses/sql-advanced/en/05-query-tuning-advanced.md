---
title: "Advanced Query Tuning"
description: "Master advanced EXPLAIN analysis, index hints, query rewrite techniques, statistics management, and systematic slow-query diagnosis"
order: 5
duration: "120 minutes"
difficulty: advanced
---

# Advanced Query Tuning

## EXPLAIN Deep Dive

The query planner's execution plan reveals every step your database takes.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT e.*, d.name
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE e.salary > 100000;
```

### Key Plan Nodes

| Node | Meaning | Red Flags |
|---|---|---|
| `Seq Scan` | Full table scan | Large tables without filter |
| `Index Scan` | Index lookup by value | High `rows=...` vs actual |
| `Index Only Scan` | All data in index | Rarely, index bloat |
| `Bitmap Heap Scan` | Bitmap index scan + heap fetch | High `lossy` blocks |
| `Nested Loop` | For each outer row, probe inner | Bad when outer is large |
| `Hash Join` | Build hash table on one side | Memory spill to disk |
| `Merge Join` | Sort both sides + merge | Sorting large datasets |
| `Sort` | Explicit sort | Memory: `external merge Disk` |

### Reading EXPLAIN Output

```text
Sort  (cost=184.32..189.45 rows=2050 width=36)
  Sort Key: e.salary DESC
  ->  Hash Join  (cost=45.12..78.23 rows=2050 width=36)
        Hash Cond: (e.department_id = d.id)
        ->  Seq Scan on employees e
              Filter: (salary > 100000)
        ->  Hash  (cost=30.10..30.10 rows=1200 width=18)
              ->  Seq Scan on departments d
```

- **cost**: First number = start-up cost, second = total cost (arbitrary units).
- **rows**: Estimated number of rows (compare with `actual rows` in `ANALYZE`).
- **width**: Average row width in bytes.

[!WARNING]
Always use `ANALYZE` to get actual vs estimated rows. A large discrepancy indicates stale statistics or a poor cardinality estimate.

## Statistics Management

```sql
-- Update statistics
ANALYZE employees;

-- Update statistics for a specific column
ANALYZE employees (salary);

-- Set column statistics target (higher = more detailed histogram)
ALTER TABLE employees ALTER COLUMN salary SET STATISTICS 1000;

-- View statistics
SELECT tablename, attname, n_distinct, most_common_vals, histogram_bounds
FROM pg_stats
WHERE tablename = 'employees';
```

### When Statistics Go Stale

```sql
-- Check last analyzed time
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'orders';

-- Force analyze on a busy table
ANALYZE orders;
```

## Index Strategies

### Composite Index Column Order

Place the most selective column first, then the sort column.

```sql
-- Good for: WHERE department_id = ? ORDER BY salary DESC
CREATE INDEX idx_dept_salary ON employees (department_id, salary DESC);

-- Bad: sort column first — cannot use index for equality + sort
CREATE INDEX idx_salary_dept ON employees (salary, department_id);
```

### Partial Indexes

```sql
-- Index only active orders
CREATE INDEX idx_active_orders ON orders (order_date)
WHERE status = 'active';

-- Query that uses it
SELECT * FROM orders
WHERE status = 'active' AND order_date > '2024-01-01';
```

### Covering Indexes (Include Columns)

```sql
-- Index covers the query without touching the table
CREATE INDEX idx_covering ON employees (department_id, salary)
INCLUDE (first_name, last_name);

-- Now this query can use Index Only Scan:
SELECT first_name, last_name, salary
FROM employees
WHERE department_id = 10;
```

### Expression Indexes

```sql
-- Speed up queries on transformed columns
CREATE INDEX idx_lower_email ON users (LOWER(email));

-- Query
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';
```

## Query Rewrite Techniques

### 1. Convert Subqueries to JOINs

```sql
-- Slow
SELECT * FROM products
WHERE category_id IN (
    SELECT id FROM categories WHERE active = true
);

-- Fast (same semantics)
SELECT p.*
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.active = true;
```

[!NOTE]
`IN (subquery)` can be slower than `JOIN` because the subquery is materialized. However, `IN` handles NULLs differently — test for semantic equivalence.

### 2. Use EXISTS Instead of COUNT(*)

```sql
-- Slow
SELECT * FROM customers c
WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) > 0;

-- Fast
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

### 3. Avoid Functions in WHERE Clauses

```sql
-- Bad: DATE() on every row prevents index usage
SELECT * FROM orders
WHERE DATE(order_date) = '2024-01-15';

-- Good: range query uses index
SELECT * FROM orders
WHERE order_date >= '2024-01-15' AND order_date < '2024-01-16';
```

### 4. Use UNION ALL Instead of OR

```sql
-- OR can't always use indexes efficiently
SELECT * FROM employees
WHERE department_id = 5 OR status = 'active';

-- UNION ALL with separate indexes
SELECT * FROM employees WHERE department_id = 5
UNION ALL
SELECT * FROM employees WHERE status = 'active' AND department_id <> 5;
```

## Identifying Slow Queries

```sql
-- PostgreSQL: current running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Longest running queries (cumulative)
SELECT queryid, query, calls, mean_exec_time, rows,
       shared_blks_hit, shared_blks_read, shared_blks_dirtied
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Common Bottlenecks

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Seq Scan` on large table | Missing index | Add index on filter column |
| `Sort` with `external merge Disk` | Sort memory exceeded | Increase `work_mem` |
| `Nested Loop` with many iterations | Wrong join order | Increase stats target, rewrite query |
| `Hash Join` spilling to disk | Not enough `work_mem` | Increase `work_mem` or tune hash_mem_multiplier |
| `Bitmap Heap Scan` with many `lossy` pages | `work_mem` too low for bitmap | Increase `work_mem` |

## Practical Case Studies

### Case 1: Pagination with OFFSET

```sql
-- Slow for high offsets (OFFSET 100000)
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;

-- Keyset pagination (fast)
SELECT * FROM orders
WHERE id > 100000
ORDER BY id
FETCH FIRST 20 ROWS ONLY;
```

### Case 2: Count Optimization

```sql
-- Very slow on large tables
SELECT COUNT(*) FROM orders;

-- Use estimated counts for dashboards
-- PostgreSQL: approx count via stats
SELECT reltuples::BIGINT AS estimated_count
FROM pg_class WHERE relname = 'orders';
```

### Case 3: Update with Join

```sql
-- Slow: correlated subquery
UPDATE products p
SET last_sale_date = (
    SELECT MAX(sale_date)
    FROM sales s
    WHERE s.product_id = p.id
);

-- Fast: use a FROM clause
UPDATE products p
SET last_sale_date = t.max_date
FROM (
    SELECT product_id, MAX(sale_date) AS max_date
    FROM sales
    GROUP BY product_id
) t
WHERE t.product_id = p.id;
```

## Configuration Tuning

```sql
-- Work memory for sorts
SET work_mem = '64MB';

-- Effective cache size (for planner estimates)
SET effective_cache_size = '4GB';

-- Parallel query workers
SET max_parallel_workers_per_gather = 4;

-- Genetic query optimizer (GEQO) threshold
SET geqo_threshold = 12;
```

[!TIP]
Settings like `work_mem` apply per-operation, per-query. A query with 10 sort operations uses 10× `work_mem`. Monitor for memory pressure.

## Practice Questions

1. What does `EXPLAIN (ANALYZE, BUFFERS)` show that plain `EXPLAIN` does not?
2. Given `EXPLAIN ANALYZE` output with `rows=1000` but `actual rows=10`, what is the likely problem?
3. Write a query to find the top 10 slowest queries in a PostgreSQL database using `pg_stat_statements`.
4. What is the difference between a partial index and a covering index? Give an example of each.
5. Rewrite this slow query for better performance: `SELECT * FROM orders WHERE DATE(created_at) = CURRENT_DATE`.
6. How would you identify and fix a query that uses a Seq Scan on a table with 10M rows filtering by `status = 'active'`?
7. Explain the trade-offs of composite index column ordering. Give an example of a good and bad order.
8. Convert this slow query using COUNT to EXISTS: `SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE user_id = users.id) > 5`.
9. What is keyset pagination and why is it faster than OFFSET-based pagination?
10. You see `Sort Method: external merge Disk: 2048kB` in EXPLAIN ANALYZE. What does it mean and how do you fix it?
