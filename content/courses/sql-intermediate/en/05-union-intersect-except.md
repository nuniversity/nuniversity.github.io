---
title: "UNION, INTERSECT, and EXCEPT"
description: "Master UNION, UNION ALL, INTERSECT, EXCEPT/MINUS, and set operation ordering in SQL"
order: 5
duration: "40 minutes"
difficulty: "intermediate"
---

# UNION, INTERSECT, and EXCEPT

Set operations combine results from multiple SELECT statements. Unlike JOINs that combine columns horizontally, set operations stack or compare rows vertically.

## Rules for Set Operations

Every set operation follows the same rules:

1. Same number of columns in all SELECT statements.
2. Corresponding columns must have compatible data types.
3. Column names come from the first SELECT.
4. ORDER BY applies to the final result only.

```sql
SELECT column1, column2, column3 FROM table1
UNION
SELECT col_a, col_b, col_c FROM table2
ORDER BY column1;
```

> [!WARNING]
> Column names and aliases in the second and subsequent SELECT statements are ignored. The result uses the column names from the first SELECT.

## UNION

UNION combines results from two or more queries and removes duplicates.

```sql
-- Customers and employees in one mailing list
SELECT name, email, 'Customer' AS source
FROM customers
UNION
SELECT name, email, 'Employee' AS source
FROM employees
ORDER BY name;
```

| name | email | source |
|------|-------|--------|
| Alice | alice@example.com | Customer |
| Bob | bob@work.com | Employee |
| Carol | carol@example.com | Customer |

If a person is both a customer and an employee, they appear once.

## UNION ALL

UNION ALL combines results without removing duplicates. It's faster than UNION because it skips the deduplication step.

```sql
-- Total event log (duplicates preserved)
SELECT event_type, event_time, 'web' AS source
FROM web_events
WHERE event_time >= '2024-01-01'
UNION ALL
SELECT event_type, event_time, 'mobile' AS source
FROM mobile_events
WHERE event_time >= '2024-01-01'
ORDER BY event_time;
```

> [!NOTE]
| UNION | UNION ALL |
|-------|-----------|
| Removes duplicates | Preserves duplicates |
| Sorts internally (dedup) | Appends only |
| Slower on large sets | Faster — no sorting overhead |
| Use when you want distinct rows | Use when duplicates are acceptable or desired |

### UNION vs UNION ALL: Performance

```sql
-- 1M rows each from two tables
-- UNION: 1.8s (dedup pass requires sort/hash)
-- UNION ALL: 0.3s (simple concatenation)

EXPLAIN ANALYZE
SELECT * FROM large_table_1
UNION
SELECT * FROM large_table_2;
-- vs
EXPLAIN ANALYZE
SELECT * FROM large_table_1
UNION ALL
SELECT * FROM large_table_2;
```

## INTERSECT

INTERSECT returns only the rows that appear in both result sets (with duplicates removed).

```sql
-- Products that have been both viewed AND purchased
SELECT product_id
FROM page_views
WHERE view_date >= '2024-01-01'
INTERSECT
SELECT product_id
FROM purchases
WHERE purchase_date >= '2024-01-01';
```

```sql
-- Customers who have ordered both categories
SELECT customer_id
FROM orders
WHERE category = 'Electronics'
INTERSECT
SELECT customer_id
FROM orders
WHERE category = 'Books';
```

> [!NOTE]
> INTERSECT is equivalent to an INNER JOIN with DISTINCT on the join column. Use whichever is more readable for your use case.

## EXCEPT / MINUS

EXCEPT returns rows from the first query that do **not** appear in the second query (with duplicates removed).

```sql
-- Products that have never been sold
SELECT product_id
FROM products
EXCEPT
SELECT product_id
FROM order_items;
```

```sql
-- Customers with accounts but no orders in the last 90 days
SELECT customer_id
FROM customers
WHERE status = 'active'
EXCEPT
SELECT customer_id
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days';
```

> [!NOTE]
> Oracle uses `MINUS` instead of `EXCEPT`. PostgreSQL, SQL Server, Snowflake, and DuckDB use `EXCEPT`. Both mean the same thing.

## Set Operation Order and Parentheses

Without parentheses, set operations are evaluated top to bottom. Use parentheses to control evaluation order.

```sql
-- UNION of two INTERSECT results
(
    SELECT product_id FROM electronics_products
    INTERSECT
    SELECT product_id FROM top_selling_products
)
UNION
(
    SELECT product_id FROM clothing_products
    INTERSECT
    SELECT product_id FROM top_selling_products
);
```

```sql
-- Without parentheses: all three are unioned, then intersected
SELECT product_id FROM electronics_products
UNION
SELECT product_id FROM clothing_products
INTERSECT
SELECT product_id FROM top_selling_products;
```

| Expression | Meaning |
|------------|---------|
| `A UNION B INTERSECT C` | `A UNION (B INTERSECT C)` — INTERSECT binds tighter |
| `(A UNION B) INTERSECT C` | Union first, then intersect (override with parentheses) |

> [!WARNING]
> INTERSECT binds more tightly than UNION in SQL standard. Always use parentheses to make your intent explicit — this is one area where clarity matters more than brevity.

## Practical Patterns

### Combining Historical and Current Data

```sql
-- Customer master data from legacy and current systems
SELECT id, name, email, 'legacy' AS system
FROM customers_archive
WHERE status = 'active'
UNION ALL
SELECT id, name, email, 'current' AS system
FROM customers
WHERE status = 'active
ORDER BY name;
```

### Finding Gaps

```sql
-- Missing employee IDs (e.g., terminated employees whose records were deleted)
SELECT generate_series(1, 1000) AS employee_id
EXCEPT
SELECT employee_id FROM employees;
```

### Cross-Database Reporting

```sql
-- Combine sales data from multiple regions (separate databases)
SELECT 'North America' AS region, SUM(amount) AS total_sales
FROM na_sales
WHERE year = 2024
UNION ALL
SELECT 'Europe', SUM(amount)
FROM eu_sales
WHERE year = 2024
UNION ALL
SELECT 'Asia Pacific', SUM(amount)
FROM apac_sales
WHERE year = 2024
ORDER BY total_sales DESC;
```

## Real-World Example: User Engagement Report

```sql
WITH
-- Users who visited the site
visitors AS (
    SELECT DISTINCT user_id
    FROM sessions
    WHERE session_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Users who added to cart
cart_adders AS (
    SELECT DISTINCT user_id
    FROM cart_events
    WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Users who purchased
purchasers AS (
    SELECT DISTINCT user_id
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Users who visited AND added to cart (but didn't purchase)
abandoned_cart AS (
    SELECT user_id FROM visitors
    INTERSECT
    SELECT user_id FROM cart_adders
    EXCEPT
    SELECT user_id FROM purchasers
)
SELECT COUNT(*) AS abandoned_cart_users
FROM abandoned_cart;
```

| Set Operation | Behavior | Duplicates | Performance Cost |
|---------------|----------|------------|-----------------|
| UNION | Combines, deduplicates | Removed | Higher |
| UNION ALL | Combines, raw append | Preserved | Lower |
| INTERSECT | Common rows only | Removed | Higher |
| EXCEPT | First minus second | Removed | Higher |

> [!SUCCESS]
> UNION ALL is your go-to for combining similar data (logs, multi-region data). Use UNION, INTERSECT, and EXCEPT for set-based logic. When in doubt about evaluation order, use parentheses.

## Practice Questions

1. What are the three rules every set operation query must follow?
2. What is the difference between UNION and UNION ALL? Which is faster?
3. Write a query using UNION ALL to combine `sales_2023` and `sales_2024` tables. Add a `year` column to distinguish them.
4. What does INTERSECT do? How is it different from an INNER JOIN?
5. Write a query that finds product IDs that were ordered in Q1 but NOT in Q2.
6. Does `A UNION B INTERSECT C` mean the same as `(A UNION B) INTERSECT C`? Explain.
7. Write a query that uses both INTERSECT and UNION to find customers who bought from both Electronics and Clothing categories, combined with customers who bought from both Books and Home categories.
8. What is the Oracle equivalent of EXCEPT?
9. Write a query that finds all customer IDs from `customers` minus those from `inactive_customers`.
10. How does ORDER BY work with set operations? Where should you place it?
