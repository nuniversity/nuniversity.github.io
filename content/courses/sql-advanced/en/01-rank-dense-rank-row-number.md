---
title: "ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE()"
description: "Master window ranking functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE, and ORDER BY behavior in window frames"
order: 1
duration: "90 minutes"
difficulty: advanced
---

# ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE()

## Window Functions Overview

Window functions perform calculations across a set of rows related to the current row. Unlike aggregate functions with `GROUP BY`, window functions **do not collapse rows** — every input row retains its identity.

```sql
-- Aggregate: collapses
SELECT department_id, AVG(salary)
FROM employees
GROUP BY department_id;

-- Window: preserves detail
SELECT employee_id, department_id, salary,
       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
FROM employees;
```

[!NOTE]
The `OVER` clause defines the window. A window can include `PARTITION BY` (row groups), `ORDER BY` (ordering within groups), and frame specifications (row boundaries).

## ROW_NUMBER()

Assigns a unique sequential integer to each row within a partition, starting at 1.

```sql
SELECT
  employee_id,
  department_id,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
FROM employees;
```

### Common Use Cases

- **Deduplication**: Keep the first occurrence and delete duplicates.
- **Pagination**: Number rows and filter by page.
- **Top-N per group**: Assign row numbers and filter.

```sql
-- Deduplicate
WITH numbered AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS rn
  FROM users
)
DELETE FROM users WHERE (email, created_at) IN (
  SELECT email, created_at FROM numbered WHERE rn > 1
);

-- Pagination
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM products
) t WHERE rn BETWEEN 21 AND 40;
```

## RANK() and DENSE_RANK()

Both assign ranks with ties handled differently:

| Function | Ties | Next rank after tie | Example (values: 100, 90, 90, 80) |
|---|---|---|---|
| `ROW_NUMBER()` | Arbitrary | N/A | 1, 2, 3, 4 |
| `RANK()` | Same rank | Skips | 1, 2, 2, 4 |
| `DENSE_RANK()` | Same rank | No skip | 1, 2, 2, 3 |

```sql
SELECT
  employee_id,
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
  RANK()       OVER (ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;
```

### Use Cases for RANK/DENSE_RANK

- **RANK**: "Give me the top 5 salaries" — if 3 people tie at #1, the next is #4.
- **DENSE_RANK**: "Give me the top 5 salary tiers" — everyone in the top 5 distinct values.

```sql
-- Top 5 distinct salary tiers
SELECT *
FROM (
  SELECT *,
         DENSE_RANK() OVER (ORDER BY salary DESC) AS dr
  FROM employees
) t WHERE dr <= 5;
```

## NTILE()

Divides rows into N roughly equal buckets and assigns a bucket number (1 through N).

```sql
SELECT
  employee_id,
  salary,
  NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

### NTILE Strategies

| Buckets | Name | Meaning |
|---|---|---|
| 2 | Median split | Upper/lower half |
| 4 | Quartiles | Q1–Q4 |
| 10 | Deciles | Top 10%, bottom 10% |
| 100 | Percentiles | Per-percentile ranking |

```sql
-- Top decile employees
SELECT * FROM (
  SELECT *, NTILE(10) OVER (ORDER BY sales DESC) AS decile
  FROM sales_reps
) t WHERE decile = 1;
```

[!WARNING]
`NTILE` requires an `ORDER BY`. When the number of rows is not divisible by the bucket count, the first buckets get one extra row. Always check your database's tie-breaking behavior.

## ORDER BY in Windows

The `ORDER BY` inside `OVER` defines the logical order within each partition. Importantly, it interacts with the **default frame**:

- Without `ORDER BY`: the frame is **all rows in the partition**.
- With `ORDER BY`: the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

```sql
-- Running total: default frame with ORDER BY
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Equivalent to
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders;
```

### ORDER BY with NULLS

```sql
-- Control NULL placement
SELECT
  employee_id,
  commission,
  ROW_NUMBER() OVER (ORDER BY commission NULLS LAST) AS rn
FROM employees;
```

## Frame Specifications

| Clause | Meaning |
|---|---|
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Physical row offset |
| `RANGE BETWEEN 5 PRECEDING AND CURRENT ROW` | Logical value offset (requires ORDER BY) |
| `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | All rows up to current (default) |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | Current + all after |
| `ROWS BETWEEN 3 PRECEDING AND 1 FOLLOWING` | Window of 5 rows |

```sql
-- 3-day moving average
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS moving_avg_3d
FROM orders;
```

## Practical Examples

### Example 1: Sessionize Web Logs

Assign a session ID to each user session based on a 30-minute inactivity gap.

```sql
WITH lagged AS (
  SELECT
    user_id,
    page,
    event_time,
    LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_time
  FROM web_events
),
sessions AS (
  SELECT *,
    SUM(CASE WHEN prev_time IS NULL
          OR EXTRACT(EPOCH FROM event_time - prev_time) > 1800
        THEN 1 ELSE 0 END
    ) OVER (PARTITION BY user_id ORDER BY event_time) AS session_id
  FROM lagged
)
SELECT user_id, session_id,
       COUNT(*) AS page_views,
       MIN(event_time) AS session_start,
       MAX(event_time) AS session_end
FROM sessions
GROUP BY user_id, session_id;
```

### Example 2: Median Salary per Department

```sql
SELECT DISTINCT department_id,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)
    OVER (PARTITION BY department_id) AS median_salary
FROM employees;
```

### Example 3: Gaps and Islands

```sql
-- Find consecutive date ranges per product
WITH numbered AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sale_date) AS rn,
    sale_date - INTERVAL '1 day' * ROW_NUMBER()
      OVER (PARTITION BY product_id ORDER BY sale_date) AS grp
  FROM sales
)
SELECT product_id,
  MIN(sale_date) AS range_start,
  MAX(sale_date) AS range_end,
  COUNT(*) AS days_in_range
FROM numbered
GROUP BY product_id, grp
ORDER BY product_id, range_start;
```

## Performance Considerations

| Function | Cost | Notes |
|---|---|---|
| `ROW_NUMBER()` | Low | Single sort per partition |
| `RANK()` | Low | Same sort as ROW_NUMBER |
| `DENSE_RANK()` | Low | Same sort as ROW_NUMBER |
| `NTILE()` | Medium | Requires row count + distribution |
| Large partition counts | High | Sort dominates — index on partition + order columns |

[!TIP]
Create a composite index on `(partition_column, order_column)` to make window function sorts use an index scan instead of a full sort.

```sql
CREATE INDEX idx_dept_salary ON employees (department_id, salary DESC);
```

## Practice Questions

1. What is the difference between `RANK()` and `DENSE_RANK()`? Give an example with tied values.
2. Write a query that assigns each employee a row number within their department ordered by hire date (oldest first).
3. You have a table `orders(id, customer_id, order_date, total)`. Write a query to find the top 3 most recent orders per customer.
4. How does `NTILE(4)` behave when there are 10 rows in the partition? How many rows in each bucket?
5. Write a query to deduplicate rows from `users(id, email, signup_date)` keeping only the earliest signup per email.
6. What is the default window frame when `ORDER BY` is specified inside `OVER`? When `ORDER BY` is absent?
7. Use `NTILE` to segment employees into 5 performance tiers by sales amount and count how many are in each tier.
8. Write a moving average of stock prices over a 7-day window (6 preceding + current).
9. Given a table `logs(user_id, action, timestamp)`, write a query that assigns a session number to each user where a new session starts after 30 minutes of inactivity.
10. Explain the difference between `ROWS BETWEEN 3 PRECEDING AND CURRENT ROW` and `RANGE BETWEEN 3 PRECEDING AND CURRENT ROW` with an example.
