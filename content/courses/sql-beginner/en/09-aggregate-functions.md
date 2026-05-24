---
title: "Advanced Aggregate Functions"
description: "Deep dive into aggregation with ROLLUP, GROUPING, NULL handling in aggregates, and window function previews"
order: 9
duration: "20-30 minutes"
difficulty: "beginner"
---

# Advanced Aggregate Functions

You already know COUNT, SUM, AVG, MIN, and MAX. Now it's time to push aggregation further with subtotals, grouping sets, and understanding how NULL behaves.

## Recap: Basic Aggregate Functions

| Function | Description | Return Type |
|----------|-------------|-------------|
| `COUNT(*)` | Total rows in group | INTEGER |
| `COUNT(expr)` | Non-NULL values of expr | INTEGER |
| `SUM(expr)` | Sum of values | Same as expr |
| `AVG(expr)` | Arithmetic mean | Usually DECIMAL |
| `MIN(expr)` | Smallest value | Same as expr |
| `MAX(expr)` | Largest value | Same as expr |

```sql
SELECT
    COUNT(*) AS total,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount
FROM payments;
```

## NULL Behavior in Aggregates

> [!NOTE]
> Aggregate functions ignore NULL values — except `COUNT(*)` which counts rows regardless. This can give misleading results if you don't account for it.

```sql
SELECT
    COUNT(*) AS row_count,          -- 10
    COUNT(rating) AS rating_count,   -- 7 (3 NULLs ignored)
    AVG(rating) AS avg_rating,       -- correct average of 7 values
    SUM(rating) / COUNT(*) AS wrong  -- incorrect: divides by 10
FROM reviews;
```

### COALESCE — Replace NULLs Before Aggregation

```sql
SELECT
    AVG(COALESCE(rating, 0)) AS avg_with_zeros,  -- treats NULL as 0
    AVG(rating) AS avg_nulls_ignored              -- NULLs excluded
FROM reviews;
```

> [!WARNING]
> Choosing between ignoring NULLs and treating them as 0 is a business decision. If a review has no rating, should it bring the average down? Usually not — it's better to exclude it.

### NULLIF — Prevent Division by Zero

```sql
-- Division that might divide by zero
SELECT
    department,
    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(*), 0) AS return_pct
FROM orders
GROUP BY department;
```

`NULLIF(a, b)` returns NULL if a = b, otherwise returns a. This prevents divide-by-zero errors.

## GROUP BY Extensions

### GROUP BY ROLLUP

`ROLLUP` generates subtotals and grand totals for hierarchical data:

```sql
SELECT
    department,
    status,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY ROLLUP (department, status);
```

Result:

| department | status | count | avg_salary |
|------------|--------|-------|------------|
| Engineering | active | 10 | 92000 |
| Engineering | on_leave | 2 | 88000 |
| Engineering | NULL | 12 | 91500 |  ← subtotal for Engineering
| Marketing | active | 6 | 75000 |
| Marketing | NULL | 6 | 75000 |    ← subtotal for Marketing
| NULL | NULL | 18 | 86000 |      ← grand total

> [!SUCCESS]
> `ROLLUP` is ideal for report generation. One query replaces the need for multiple UNION queries to get per-group subtotals and a grand total.

### GROUP BY CUBE (if available)

`CUBE` generates subtotals for **every combination** of the listed columns:

```sql
SELECT department, status, COUNT(*)
FROM employees
GROUP BY CUBE (department, status);
```

This produces 2^n grouping rows (including all combinations), not just hierarchical ones.

### GROUPING — Identify Subtotals

`GROUPING(column)` returns 1 if the column is aggregated in the current row (used in subtotal/grand total rows):

```sql
SELECT
    CASE
        WHEN GROUPING(department) = 1 AND GROUPING(status) = 1 THEN 'Grand Total'
        WHEN GROUPING(status) = 1 THEN 'Subtotal: ' || department
        ELSE department
    END AS department_group,
    status,
    COUNT(*) AS count
FROM employees
GROUP BY ROLLUP (department, status);
```

## FILTER Clause (PostgreSQL, SQLite 3.30+)

`FILTER` applies a condition to a single aggregate without affecting others:

```sql
SELECT
    department,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE salary > 80000) AS high_earners,
    AVG(salary) FILTER (WHERE age < 30) AS avg_salary_young,
    AVG(salary) FILTER (WHERE age >= 30) AS avg_salary_senior
FROM employees
GROUP BY department;
```

Without `FILTER`, you'd need verbose CASE expressions:

```sql
COUNT(CASE WHEN salary > 80000 THEN 1 ELSE NULL END) AS high_earners
```

## Window Functions Preview

Window functions perform calculations across rows related to the current row **without collapsing them**:

```sql
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary,
    salary - AVG(salary) OVER (PARTITION BY department) AS diff_from_avg
FROM employees;
```

| name | department | salary | dept_avg_salary | diff_from_avg |
|------|------------|--------|-----------------|---------------|
| Alice | Engineering | 95000 | 91500 | 3500 |
| Bob | Marketing | 72000 | 75000 | -3000 |
| Carol | Engineering | 88000 | 91500 | -3500 |

> [!NOTE]
> Unlike GROUP BY, window functions keep individual rows. The aggregate value is computed over a "window" (PARTITION BY) and attached to each row. You'll explore these in depth in the intermediate course.

## Real-World Use Case: Sales Report with Subtotals

```sql
SELECT
    CASE WHEN GROUPING(category) = 1 THEN 'All Categories'
         ELSE category
    END AS category,
    CASE WHEN GROUPING(product_name) = 1 THEN 'Subtotal'
         ELSE product_name
    END AS product,
    SUM(quantity) AS units_sold,
    SUM(revenue) AS total_revenue
FROM sales
WHERE sale_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY ROLLUP (category, product_name)
ORDER BY category, product;
```

## Real-World Use Case: Employee Statistics

```sql
SELECT
    department,
    COUNT(*) AS total_employees,
    COUNT(*) FILTER (WHERE salary > 100000) AS executives,
    ROUND(AVG(salary), 2) AS avg_salary,
    ROUND(AVG(salary) FILTER (WHERE hire_date < '2020-01-01'), 2) AS avg_salary_veteran,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    ROUND(MAX(salary) - MIN(salary), 2) AS salary_spread
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
```

## Aggregate Cheat Sheet

| Need | Solution |
|------|----------|
| Count rows | `COUNT(*)` |
| Count non-NULL values | `COUNT(column)` |
| Count unique values | `COUNT(DISTINCT column)` |
| Sum with condition | `SUM(CASE WHEN ... THEN val ELSE 0 END)` |
| Conditional aggregate (clean) | `COUNT(*) FILTER (WHERE ...)` |
| Avoid divide-by-zero | `/ NULLIF(denominator, 0)` |
| Replace NULL in aggregate | `AVG(COALESCE(col, 0))` |
| Subtotals | `GROUP BY ROLLUP (a, b)` |
| All subtotal combos | `GROUP BY CUBE (a, b)` |
| Detect subtotal rows | `GROUPING(col) = 1` |

> [!SUCCESS]
> Mastery of aggregation is what separates beginner from intermediate SQL users. Practice writing queries that combine GROUP BY, HAVING, ROLLUP, FILTER, and COALESCE.

## Practice Questions

Given `sales(id, product, category, amount, sale_date)`:

1. Write a query that returns total sales amount per category.
2. What is the difference between `COUNT(*)` and `COUNT(amount)`?
3. Use `COALESCE` to replace NULL amounts with 0, then calculate the average.
4. Write a query with `GROUP BY ROLLUP (category, product)` showing total sales.
5. What does `GROUPING(category)` return on a grand total row?
6. Write a query using `FILTER` to count high-value sales (amount > 100) per category.
7. What is the output of `AVG(NULL, 10, 20)`?
8. Use `NULLIF` to prevent a divide-by-zero error in `SUM(amount) / COUNT(*)`.
9. Write a query that shows each product's sales alongside the average sales for its category (use a window function).
10. Create a report showing: category, product count, total revenue, average revenue per product, and the highest single sale per category.
