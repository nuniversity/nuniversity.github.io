---
title: "GROUP BY and HAVING — Grouping and Filtering Aggregates"
description: "Master GROUP BY, aggregate functions (COUNT, SUM, AVG, MIN, MAX), and understand HAVING vs WHERE"
order: 8
duration: "20-30 minutes"
difficulty: "beginner"
---

# GROUP BY and HAVING — Grouping and Filtering Aggregates

Raw data is noisy. Aggregation lets you summarize thousands of rows into meaningful metrics: totals, averages, counts, and extremes.

## Aggregate Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `COUNT()` | Number of rows | `COUNT(*)` or `COUNT(column)` |
| `SUM()` | Total of numeric column | `SUM(salary)` |
| `AVG()` | Arithmetic mean | `AVG(price)` |
| `MIN()` | Smallest value | `MIN(age)` |
| `MAX()` | Largest value | `MAX(salary)` |

```sql
-- Simple aggregates on the whole table
SELECT
    COUNT(*) AS total_employees,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS payroll_total
FROM employees;
```

> [!NOTE]
> Aggregate functions ignore `NULL` values (except `COUNT(*)` which counts rows, not values). `AVG(NULL, 10, 20)` = 15, not 10.

## GROUP BY — Grouping Rows

`GROUP BY` divides rows into groups and applies aggregate functions to each group:

```sql
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department;
```

Sample result:

| department | avg_salary |
|------------|------------|
| Engineering | 91500.00 |
| Marketing | 75000.00 |
| Sales | 65000.00 |

### GROUP BY Multiple Columns

```sql
SELECT department, status, COUNT(*) AS count
FROM employees
GROUP BY department, status
ORDER BY department;
```

| department | status | count |
|------------|--------|-------|
| Engineering | active | 12 |
| Engineering | on_leave | 2 |
| Marketing | active | 8 |
| Sales | active | 5 |
| Sales | inactive | 1 |

> [!SUCCESS]
> Every column in the SELECT list must either be in the GROUP BY or wrapped in an aggregate function. Otherwise, SQL doesn't know which value to show.

### GROUP BY with WHERE

`WHERE` filters rows **before** grouping:

```sql
-- Average salary for Engineering and Marketing only
SELECT department, AVG(salary) AS avg_salary
FROM employees
WHERE department IN ('Engineering', 'Marketing')
GROUP BY department;
```

Filtering order: `WHERE` → `GROUP BY` → aggregate functions

## HAVING — Filtering Groups

`WHERE` cannot filter aggregate results because aggregates don't exist yet when `WHERE` runs. Use `HAVING` instead:

```sql
-- Departments with average salary above 80,000
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 80000;
```

| department | avg_salary |
|------------|------------|
| Engineering | 91500.00 |

### HAVING vs WHERE

| Clause | Filters | Runs When | Can Use Aggregates |
|--------|---------|-----------|-------------------|
| `WHERE` | Individual rows | Before GROUP BY | No |
| `HAVING` | Groups | After GROUP BY | Yes |

```sql
-- Correct: WHERE filters rows, HAVING filters groups
SELECT department, COUNT(*) AS employee_count
FROM employees
WHERE salary > 50000             -- exclude low earners first
GROUP BY department
HAVING COUNT(*) > 5             -- only departments with 5+ high earners
ORDER BY employee_count DESC;
```

> [!WARNING]
> Using `HAVING` where `WHERE` would work (e.g., `HAVING department = 'Engineering'`) is valid but inefficient. `WHERE` is faster because it eliminates rows before grouping.

## Grouping with Expressions

You can group by calculated expressions:

```sql
-- Group employees by salary bracket
SELECT
    CASE
        WHEN salary < 50000 THEN 'Low'
        WHEN salary BETWEEN 50000 AND 90000 THEN 'Mid'
        ELSE 'High'
    END AS bracket,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY bracket
ORDER BY avg_salary DESC;
```

## COUNT(*) vs COUNT(column) vs COUNT(DISTINCT column)

```sql
SELECT
    COUNT(*) AS total_rows,
    COUNT(department) AS non_null_depts,
    COUNT(DISTINCT department) AS unique_depts
FROM employees;
```

| total_rows | non_null_depts | unique_depts |
|------------|----------------|--------------|
| 100 | 98 | 4 |

- `COUNT(*)` counts every row
- `COUNT(col)` counts non-NULL values in that column
- `COUNT(DISTINCT col)` counts unique non-NULL values

## Real-World Use Case: Sales Dashboard

```sql
SELECT
    DATE_TRUNC('month', order_date) AS month,  -- PostgreSQL
    COUNT(DISTINCT customer_id) AS active_customers,
    COUNT(*) AS total_orders,
    SUM(total) AS revenue,
    AVG(total) AS avg_order_value,
    MAX(total) AS biggest_order
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY month
ORDER BY month;
```

## Real-World Use Case: Identifying Anomalies

```sql
-- Find products with unusually high return rates
SELECT
    product_id,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returns,
    ROUND(
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) AS return_rate_pct
FROM order_items
GROUP BY product_id
HAVING return_rate_pct > 15
ORDER BY return_rate_pct DESC;
```

## Full SELECT Order of Execution

Understanding the order in which SQL processes clauses helps you write correct queries:

1. `FROM` / `JOIN` — identify source tables
2. `WHERE` — filter individual rows
3. `GROUP BY` — group rows
4. `HAVING` — filter groups
5. `SELECT` — compute expressions and aliases
6. `ORDER BY` — sort results
7. `LIMIT` / `OFFSET` — paginate

This explains why `WHERE` cannot use aliases from SELECT, but `ORDER BY` can.

> [!NOTE]
> Most SQL compilers optimize the logical order internally, but understanding the conceptual order helps debug query issues.

## Practice Questions

Given `orders(id, customer_id, total, status, order_date)`:

1. Count the total number of orders.
2. Calculate the total revenue (sum of totals) from all orders.
3. Find the average order value per customer.
4. List customers who have placed more than 5 orders.
5. What is the difference between WHERE and HAVING?
6. Find the maximum and minimum order total.
7. Show the number of orders per month in 2024, sorted by month.
8. Why does `SELECT name, COUNT(*) FROM employees GROUP BY department` fail? Fix it.
9. Find statuses that have fewer than 10 orders.
10. Write a query that shows the percentage of orders that are 'shipped' vs 'pending' vs 'cancelled'.
