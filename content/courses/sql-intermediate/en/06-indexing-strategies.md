---
title: "Indexing Strategies"
description: "Master CREATE INDEX, composite indexes, covering indexes, B-tree vs hash, and EXPLAIN basics"
order: 6
duration: "50 minutes"
difficulty: "intermediate"
---

# Indexing Strategies

Indexes are data structures that speed up data retrieval at the cost of slower writes and increased storage. Understanding indexing is essential for building performant database applications.

## How Indexes Work

Without an index, the database performs a sequential scan — reading every row in the table. With an index, the database navigates a tree (typically B+Tree) to find rows in logarithmic time.

```
Full Table Scan:  [Row 1] [Row 2] [Row 3] ... [Row 1,000,000]
                  └── Read all rows ──┘

Index Lookup:     Root ──> Branch ──> Leaf ──> Heap (row data)
                  4 I/Os vs 1,000,000 I/Os
```

> [!NOTE]
> An index on a 1M-row table typically requires ~3-5 B+Tree levels, meaning 3-5 disk reads to find any row. A full scan would read 1M rows.

## CREATE INDEX

```sql
-- Basic index on a single column
CREATE INDEX idx_employees_last_name
ON employees(last_name);

-- Unique index (enforces uniqueness, acts as constraint)
CREATE UNIQUE INDEX idx_employees_email
ON employees(email);

-- Index on an expression
CREATE INDEX idx_customers_lower_email
ON customers(LOWER(email));

-- Partial index (only index relevant rows)
CREATE INDEX idx_orders_active
ON orders(order_date)
WHERE status = 'active';
```

| Index Type | Use Case |
|------------|----------|
| B-tree (default) | Equality and range queries |
| Hash | Equality only (fastest for exact match) |
| GiST | Full-text search, geometric data |
| GIN | Arrays, JSONB, full-text search |
| BRIN | Large, physically-sorted tables |

> [!NOTE]
> Most databases default to B-tree, which is suitable for equality (`=`), range (`>`, `<`, `BETWEEN`), and `ORDER BY` queries.

## Composite Indexes

A composite index covers multiple columns. Column order matters enormously.

```sql
-- Composite index on (country, city)
CREATE INDEX idx_customers_country_city
ON customers(country, city);
```

### Column Order Best Practices

```sql
-- Query: Find customers in USA from New York
SELECT * FROM customers
WHERE country = 'USA' AND city = 'New York';
--  Works: both columns in index, equality on both

-- Query: Find all customers in USA
SELECT * FROM customers
WHERE country = 'USA';
--  Works: leftmost column is filtered

-- Query: Find customers named 'New York' in any country
SELECT * FROM customers
WHERE city = 'New York';
--  Fails: leftmost column (country) is not filtered
```

| Rule | Example |
|------|---------|
| Place equality columns first | `WHERE country = 'USA' AND city = 'NY'` → index on `(country, city)` |
| Place range columns last | `WHERE country = 'USA' AND age > 21` → index on `(country, age)` |
| Most selective column first | Column with most distinct values first |

```sql
-- Good: selectivity guides order
CREATE INDEX idx_orders_customer_date
ON orders(customer_id, order_date);
--  customer_id has 10K distinct values, order_date has 365

-- Bad: reversed order
CREATE INDEX idx_orders_date_customer
ON orders(order_date, customer_id);
--  The range on date can't effectively narrow before customer_id
```

## Covering Indexes

A covering index contains all columns needed by a query, eliminating the need to read the table (heap) at all.

```sql
-- Without covering: read index + read table row
EXPLAIN SELECT name, email FROM employees WHERE department_id = 5;
-- Index Scan on idx_emp_dept → Heap fetch for name, email

-- Covering index: everything in the index
CREATE INDEX idx_emp_dept_covering
ON employees(department_id) INCLUDE (name, email);

EXPLAIN SELECT name, email FROM employees WHERE department_id = 5;
-- Index Only Scan — no heap access needed
```

> [!SUCCESS]
| Scenario | Regular Index | Covering Index |
|----------|--------------|----------------|
| `SELECT *` | Must fetch heap | Must fetch heap |
| `SELECT indexed_cols` | Heap fetch | Index-only |
| Write performance | Slight overhead | More overhead |
| Disk space | Less | More |

Use `INCLUDE` for columns that are returned but not used in search/filter conditions.

## B-Tree vs Hash Indexes

```sql
-- B-tree (default for most databases)
CREATE INDEX idx_btree ON products(price);
-- Supports: =, >, <, >=, <=, BETWEEN, LIKE (non-wildcard prefix)

-- Hash (exact match only, but faster for it)
CREATE INDEX idx_hash ON products(price) USING HASH;
-- Supports: = only
```

| Feature | B-Tree | Hash |
|---------|--------|------|
| Equality | Fast | Fastest |
| Range queries | Supported | Not supported |
| ORDER BY | Can return sorted | No ordering |
| LIKE 'prefix%' | Supported | Not supported |
| Disk usage | Moderate | Usually smaller |
| Build time | Moderate | Faster |

> [!WARNING]
> Hash indexes were crash-unsafe in older PostgreSQL versions. They are now WAL-logged and safe. Always verify your database's specific implementation before using hash indexes in production.

## EXPLAIN Basics

EXPLAIN shows how the database plans to execute a query.

```sql
EXPLAIN SELECT * FROM employees WHERE department_id = 5;

-- Example output:
-- Seq Scan on employees  (cost=0.00..1834.00 rows=1 width=36)
--   Filter: (department_id = 5)
```

With an index:

```sql
CREATE INDEX idx_emp_dept ON employees(department_id);

EXPLAIN SELECT * FROM employees WHERE department_id = 5;

-- Output:
-- Index Scan using idx_emp_dept on employees  (cost=0.28..4.29 rows=1 width=36)
--   Index Cond: (department_id = 5)
```

### EXPLAIN ANALYZE

EXPLAIN ANALYZE actually executes the query and shows real timings.

```sql
EXPLAIN ANALYZE SELECT * FROM employees WHERE department_id = 5;

-- Output:
-- Index Scan using idx_emp_dept on employees
--   (cost=0.28..4.29 rows=1 width=36)
--   (actual time=0.015..0.016 rows=1 loops=1)
--   Index Cond: (department_id = 5)
-- Planning Time: 0.068 ms
-- Execution Time: 0.030 ms
```

| Term | Meaning |
|------|---------|
| `cost=0.28..4.29` | Estimated cost (startup..total) |
| `rows=1` | Estimated rows returned |
| `width=36` | Estimated row width in bytes |
| `actual time=0.015..0.016` | Real execution time |
| `loops=1` | Times the node executed |

## When NOT to Index

| Scenario | Reason |
|----------|--------|
| Small tables (< 1000 rows) | Full scan is faster than index overhead |
| Low-cardinality columns (gender, boolean) | Index doesn't filter enough |
| Columns rarely used in WHERE/JOIN | Index goes unused, wastes space |
| Heavy write tables | Index maintenance slows INSERT/UPDATE/DELETE |
| `LIKE '%text%'` queries (wildcard prefix) | B-tree can't help |

```sql
-- Bad index: low cardinality
CREATE INDEX idx_employees_gender ON employees(gender);
-- Only 2 distinct values — database will still scan

-- Good index: high cardinality
CREATE INDEX idx_employees_ssn ON employees(ssn);
-- Millions of distinct values — highly selective
```

## Real-World Example: E-Commerce Query Optimization

```sql
-- Slow query (no useful index)
SELECT order_id, customer_id, total, order_date
FROM orders
WHERE status = 'pending'
  AND order_date >= '2024-01-01'
  AND order_date < '2024-02-01'
ORDER BY total DESC;

-- Sequential scan on orders (slow)

-- Optimized index
CREATE INDEX idx_orders_status_date_total
ON orders(status, order_date DESC, total DESC)
INCLUDE (customer_id);

-- Now: Index Only Scan, fast
```

> [!SUCCESS]
> Indexes are trade-offs. Each index speeds up reads but slows writes. Start with indexes on primary keys and foreign keys used in JOINs, then add indexes based on your slowest queries. Measure before and after.

## Practice Questions

1. What is a B-tree index and what operations does it support?
2. Write a CREATE INDEX statement for an `employees` table on the `last_name` column.
3. What is a composite index? Why does column order matter?
4. Given `WHERE country = 'Canada' AND status = 'active' AND created_at > '2024-01-01'`, what composite index would you create?
5. What is a covering index? How does it differ from a regular index?
6. When would you use a hash index over a B-tree index?
7. What is the difference between EXPLAIN and EXPLAIN ANALYZE?
8. What does `Index Only Scan` mean in an EXPLAIN output?
9. List three situations where you should NOT create an index.
10. Write a covering index for the query `SELECT first_name, last_name FROM employees WHERE department_id = 10`.
