---
title: "Query Execution Plans"
description: "Read EXPLAIN plans, understand sequential vs index scans, join algorithms (NLJ, HASH, MERGE), and interpret query costs"
order: 7
duration: "55 minutes"
difficulty: "intermediate"
---

# Query Execution Plans

A query execution plan shows exactly how the database will execute your SQL. Learning to read execution plans is the most important skill for query optimization.

## Reading EXPLAIN Output

EXPLAIN shows a tree of plan nodes. Each node has a cost, estimated rows, and row width.

```sql
EXPLAIN
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE e.salary > 80000;
```

```
                                QUERY PLAN
---------------------------------------------------------------------------
 Hash Join  (cost=12.50..45.20 rows=150 width=58)
   Hash Cond: (e.department_id = d.department_id)
   ->  Seq Scan on employees e  (cost=0.00..30.40 rows=150 width=34)
         Filter: (salary > 80000)
   ->  Hash  (cost=10.00..10.00 rows=200 width=32)
         ->  Seq Scan on departments d  (cost=0.00..10.00 rows=200 width=32)
```

Read execution plans **inside-out and bottom-up**:

1. Scan employees (filter salary > 80000) → 150 rows
2. Scan departments → 200 rows, build hash table
3. Hash Join the two results on department_id → 150 rows

> [!NOTE]
> Read execution plans from the inside out, bottom to top. The outermost node (first line) is the final step that produces the query result.

## Cost Terminology

| Term | Meaning | Typical Range |
|------|---------|---------------|
| `cost=0.00..30.40` | Estimated cost (startup..total) | Arbitrary units |
| `rows=150` | Estimated row count | Depends on table size |
| `width=34` | Average row width in bytes | Depends on columns |
| `actual time=0.015..0.030` | Real time (ms) | From EXPLAIN ANALYZE |
| `loops=1` | Times the node executed | >1 for nested loop inner |

Cost is an arbitrary unit combining:
- **I/O cost**: disk pages read
- **CPU cost**: row processing, tuple formatting
- **Memory cost**: hash tables, sort buffers

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE order_date >= '2024-01-01'
  AND order_date < '2024-02-01';
```

```
Index Scan using idx_orders_date on orders
  (cost=0.28..12.50 rows=50 width=40)
  (actual time=0.018..0.042 rows=45 loops=1)
  Index Cond: (order_date >= '2024-01-01'::date)
  Planning Time: 0.058 ms
  Execution Time: 0.064 ms
```

The estimate says 50 rows; actual was 45 — a good estimate. Large discrepancies suggest stale statistics.

## Sequential Scans vs Index Scans

### Sequential (Seq) Scan

```
Seq Scan on large_table  (cost=0.00..1000.00 rows=50000 width=100)
```

Reads the entire table from disk sequentially. Best when:
- Reading a large percentage of rows (> 10-20%)
- Table is very small
- No suitable index exists

### Index Scan

```
Index Scan using idx_last_name on employees  (cost=0.28..4.29 rows=1 width=36)
  Index Cond: (last_name = 'Smith')
```

Navigates the B-tree index, then fetches matching rows from the heap. Best when:
- Reading a small percentage of rows
- High selectivity on the filter column

### Bitmap Index Scan

```
Bitmap Heap Scan on orders  (cost=12.50..45.20 rows=500 width=40)
  Recheck Cond: (status = 'shipped')
  ->  Bitmap Index Scan on idx_orders_status  (cost=0.00..10.00 rows=500 width=0)
        Index Cond: (status = 'shipped')
```

Combines multiple index scans into a bitmap in memory, then fetches heap rows in physical order. Best when:
- Filtering on multiple indexed columns
- Getting 5-20% of rows (middle ground between Index Scan and Seq Scan)

> [!SUCCESS]
| Scan Type | Row Access % | Typical Use |
|-----------|-------------|-------------|
| Index Scan | < 5% | Point lookups, high selectivity |
| Bitmap Scan | 5-20% | Multiple filters, moderate selectivity |
| Seq Scan | > 20% | Large portions of table, no index |

## Join Algorithms

### Nested Loop Join (NLJ)

```sql
EXPLAIN SELECT * FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'USA';
```

```
Nested Loop  (cost=0.28..15.50 rows=10 width=80)
   ->  Seq Scan on customers c  (cost=0.00..5.00 rows=2 width=50)
         Filter: (country = 'USA')
   ->  Index Scan using idx_orders_customer on orders o
         (cost=0.28..5.25 rows=5 width=40)
         Index Cond: (customer_id = c.customer_id)
```

For each row in the outer table, scan the inner table. Complexity: **O(N × M)**.

Best when:
- One side is very small
- Inner side has an index
- Joining on a small number of rows

### Hash Join

```
Hash Join  (cost=10.50..35.20 rows=1000 width=80)
   Hash Cond: (c.customer_id = o.customer_id)
   ->  Seq Scan on orders o  (cost=0.00..18.00 rows=1000 width=40)
   ->  Hash  (cost=8.00..8.00 rows=200 width=50)
         ->  Seq Scan on customers c  (cost=0.00..8.00 rows=200 width=50)
```

Builds a hash table on the smaller table, then probes with the larger table. Complexity: **O(N + M)**.

| Phase | Operation | Memory |
|-------|-----------|--------|
| Build | Hash smaller table into memory | O(smaller table) |
| Probe | Scan larger table, probe hash | O(larger table) |

Best when:
- Joining large, unindexed tables
- Equality conditions only
- One side fits in memory

### Merge Join

```
Merge Join  (cost=15.50..45.30 rows=1000 width=80)
   Merge Cond: (c.customer_id = o.customer_id)
   ->  Index Scan using customers_pkey on customers c
   ->  Index Scan using idx_orders_customer on orders o
```

Both inputs must be sorted on the join key. Complexity: **O(N + M)**.

Best when:
- Both inputs are already sorted (e.g., from index scans)
- Joining on non-equality conditions (`<`, `>`, `<=`)
- Large tables where hash table won't fit in memory

| Algorithm | Condition | Prefers Indexes | Memory |
|-----------|-----------|-----------------|--------|
| Nested Loop | Any | Yes (inner) | Low |
| Hash Join | Equality only | No | High |
| Merge Join | Equality + range | Yes (sorted) | Low |

## Analyzing Slow Queries

```sql
-- Step 1: EXPLAIN ANALYZE the query
EXPLAIN ANALYZE
SELECT o.order_id, c.name, p.product_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '7 days';
```

Red flags in execution plans:

| Red Flag | What It Means | Fix |
|----------|---------------|-----|
| `Seq Scan` on large table | Missing or unused index | Create appropriate index |
| `Sort` on large result set | No index for ORDER BY | Add index on sort columns |
| Nested Loop with `Seq Scan` inner | Inner table not indexed | Index the join column |
| `Rows Removed by Filter` >> rows returned | Poor selectivity | Better index or query rewrite |
| Large discrepancy: `rows=` vs `actual` | Stale statistics | Run `ANALYZE` / `VACUUM` |

## Real-World Example: Query Tuning Session

```sql
-- Slow query: 5 seconds
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.name
ORDER BY order_count DESC;

-- EXPLAIN shows: Seq Scan on orders (100K rows), Hash Join
-- Fix: add index
CREATE INDEX idx_orders_customer_date
ON orders(customer_id, created_at);

-- After index: 50ms — 100x faster
```

```sql
-- Another pattern: repeated subquery
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products)
  AND category_id IN (SELECT id FROM categories WHERE active = true);

-- Better: rewrite with JOIN
SELECT p.*
FROM products p
INNER JOIN categories c ON p.category_id = c.id
CROSS JOIN (SELECT AVG(price) AS avg_price FROM products) stats
WHERE p.price > stats.avg_price AND c.active = true;
```

## Using pg_stat_statements (PostgreSQL)

```sql
-- Find the most expensive queries
SELECT
    queryid,
    calls,
    total_exec_time / calls AS avg_time_ms,
    rows / calls AS avg_rows,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

> [!SUCCESS]
| Optimization Priority | Impact | Effort |
|----------------------|--------|--------|
| Seq → Index scan on large tables | High | Low |
| Remove unnecessary sorts | Medium | Medium |
| Nested Loop → Hash Join | High | Low (add index) |
| Rewrite complex subqueries | Medium | Medium |
| Add covering indexes | High | Medium |

Start with the queries your application runs most often and optimize those. A query that runs once per night matters less than one that runs 1000 times per second.

## Practice Questions

1. How do you read an EXPLAIN plan? What direction (top-down or bottom-up)?
2. What does `cost=0.28..12.50` mean in an EXPLAIN output?
3. When does the database choose a sequential scan over an index scan?
4. What is a Bitmap Index Scan? When is it used?
5. Describe the three main join algorithms and when each is preferred.
6. What are the red flags to look for in an execution plan?
7. Write an EXPLAIN ANALYZE query and explain each part of the output.
8. What does `Rows Removed by Filter` mean? Why is a high value problematic?
9. How do you identify a query that would benefit from a new index using EXPLAIN?
10. What is the difference between `planning time` and `execution time` in EXPLAIN ANALYZE?
