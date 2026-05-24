---
title: "PIVOT, UNPIVOT, and Crosstab Queries"
description: "Master row-to-column transformation: CASE-based PIVOT, native PIVOT/UNPIVOT, crosstab queries, and dynamic pivoting techniques"
order: 3
duration: "90 minutes"
difficulty: advanced
---

# PIVOT, UNPIVOT, and Crosstab Queries

## Row-to-Column Transformation

Pivoting transforms unique row values into column headers. This is essential for reporting, dashboards, and data denormalization.

```sql
-- Input: long format
-- department | year | revenue
-- Sales      | 2023 | 100000
-- Sales      | 2024 | 120000
-- Eng        | 2023 | 200000

-- Output: wide format
-- department | 2023    | 2024
-- Sales      | 100000  | 120000
-- Eng        | 200000  | NULL
```

## CASE-Based Pivot (Portable)

Works on **every** SQL database.

```sql
SELECT
  department,
  MAX(CASE WHEN year = 2023 THEN revenue END) AS "2023",
  MAX(CASE WHEN year = 2024 THEN revenue END) AS "2024",
  MAX(CASE WHEN year = 2025 THEN revenue END) AS "2025"
FROM department_revenue
GROUP BY department;
```

### Why MAX()?

Without an aggregate, each combination of `department` and `year` produces a row. `MAX()` collapses it by picking the non-NULL value. If there could be multiple values, use `SUM()`.

```sql
-- Multiple values per cell (sum them)
SELECT
  product_id,
  SUM(CASE WHEN month = 1 THEN amount END) AS jan,
  SUM(CASE WHEN month = 2 THEN amount END) AS feb,
  SUM(CASE WHEN month = 3 THEN amount END) AS mar
FROM monthly_sales
GROUP BY product_id;
```

## Native PIVOT (PostgreSQL, SQL Server, Oracle)

PostgreSQL 16+ and dedicated databases support native `PIVOT` syntax.

```sql
-- PostgreSQL (via tablefunc extension) / SQL Server
SELECT *
FROM (
  SELECT department, year, revenue
  FROM department_revenue
) AS src
PIVOT (
  MAX(revenue)
  FOR year IN (2023, 2024, 2025)
) AS pvt;
```

[!NOTE]
PostgreSQL does not have a native `PIVOT` keyword (pre-16). Use the `tablefunc` extension's `crosstab()` function or the CASE-based approach. SQL Server and Oracle have native `PIVOT`.

## UNPIVOT (Columns to Rows)

```sql
-- Input: wide
-- product | q1 | q2 | q3 | q4
-- Widget  | 10 | 20 | 15 | 25

-- Output: long
-- product | quarter | sales
-- Widget  | q1      | 10
-- Widget  | q2      | 20
```

### CASE-Based UNPIVOT

```sql
SELECT product_id, 'q1' AS quarter, q1 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q2' AS quarter, q2 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q3' AS quarter, q3 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q4' AS quarter, q4 AS sales FROM quarterly_sales
ORDER BY product_id, quarter;
```

### Native UNPIVOT (SQL Server, Oracle)

```sql
SELECT product_id, quarter, sales
FROM quarterly_sales
UNPIVOT (
  sales FOR quarter IN (q1, q2, q3, q4)
) AS unpvt;
```

## Crosstab with tablefunc (PostgreSQL)

```sql
-- Requires: CREATE EXTENSION IF NOT EXISTS tablefunc;

SELECT *
FROM crosstab(
  'SELECT department, year, revenue
   FROM department_revenue
   ORDER BY 1, 2',
  'SELECT DISTINCT year FROM department_revenue ORDER BY 1'
) AS ct (
  department TEXT,
  "2023" NUMERIC,
  "2024" NUMERIC,
  "2025" NUMERIC
);
```

[!WARNING]
`crosstab()` expects exactly 3 columns: `row_name`, `category`, `value`. The second query defines the column values. Mismatches cause runtime errors.

### Crosstab with Multiple Value Columns

```sql
SELECT *
FROM crosstab(
  'SELECT department, year, revenue, expenses
   FROM department_finances
   ORDER BY 1, 2',
  'SELECT DISTINCT year FROM department_finances ORDER BY 1'
) AS ct (
  department TEXT,
  rev2023 NUMERIC, exp2023 NUMERIC,
  rev2024 NUMERIC, exp2024 NUMERIC,
  rev2025 NUMERIC, exp2025 NUMERIC
);
```

## Dynamic Pivoting

When pivot column values are unknown at query-writing time, use dynamic SQL.

### PostgreSQL Dynamic Pivot

```sql
DO $$
DECLARE
  year_list TEXT;
  query TEXT;
BEGIN
  SELECT string_agg(DISTINCT
    FORMAT('MAX(CASE WHEN year = %s THEN revenue END) AS "%s"', year, year), ', ')
  INTO year_list
  FROM department_revenue;

  query := FORMAT(
    'SELECT department, %s FROM department_revenue GROUP BY department ORDER BY department',
    year_list
  );

  EXECUTE query;
END $$;
```

### SQL Server Dynamic Pivot

```sql
DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);

SELECT @columns = STRING_AGG(QUOTENAME(year), ',')
FROM (SELECT DISTINCT year FROM department_revenue) AS years;

SET @sql = N'
  SELECT department, ' + @columns + N'
  FROM (
    SELECT department, year, revenue
    FROM department_revenue
  ) AS src
  PIVOT (
    MAX(revenue) FOR year IN (' + @columns + N')
  ) AS pvt
  ORDER BY department;
';

EXEC sp_executesql @sql;
```

[!TIP]
Dynamic pivoting is powerful but introduces SQL injection risk. Always sanitize column names, or use `QUOTENAME()` (SQL Server) or `format('%I', col)` (PostgreSQL).

## Practical Examples

### Example 1: Attendance Matrix

```sql
-- Long: student, date, status (present/absent/late)
-- Pivot to: student | 2024-01-01 | 2024-01-02 | ...

SELECT *
FROM crosstab(
  'SELECT student, date, status
   FROM attendance
   ORDER BY 1, 2',
  'SELECT DISTINCT date FROM attendance ORDER BY 1'
) AS ct (
  student TEXT,
  "2024-01-01" TEXT,
  "2024-01-02" TEXT,
  "2024-01-03" TEXT
);
```

### Example 2: Survey Response Matrix

```sql
-- Each row = respondent, each column = question
SELECT
  respondent_id,
  MAX(CASE WHEN question_id = 1 THEN answer END) AS q1_rating,
  MAX(CASE WHEN question_id = 2 THEN answer END) AS q2_rating,
  MAX(CASE WHEN question_id = 3 THEN answer END) AS q3_rating
FROM survey_responses
GROUP BY respondent_id;
```

### Example 3: Monthly Revenue by Product Category

```sql
WITH monthly AS (
  SELECT
    category,
    TO_CHAR(order_date, 'YYYY-MM') AS month,
    SUM(amount) AS revenue
  FROM orders
  GROUP BY category, TO_CHAR(order_date, 'YYYY-MM')
)
SELECT *
FROM crosstab(
  'SELECT category, month, revenue
   FROM monthly
   ORDER BY 1, 2',
  'SELECT DISTINCT month FROM monthly ORDER BY 1'
) AS ct (
  category TEXT,
  "2024-01" NUMERIC,
  "2024-02" NUMERIC,
  "2024-03" NUMERIC,
  "2024-04" NUMERIC,
  "2024-05" NUMERIC,
  "2024-06" NUMERIC
);
```

## Performance Comparison

| Method | Portability | Dynamic | Speed | Complexity |
|---|---|---|---|---|
| CASE + aggregate | All databases | Manual | Fast | Low |
| Native PIVOT | SQL Server, Oracle, PG 16+ | Via dynamic SQL | Fast | Low |
| crosstab() | PostgreSQL (tablefunc) | Via dynamic SQL | Fastest | Medium |
| UNION ALL UNPIVOT | All databases | N/A | Slow on wide tables | Low |

## Practice Questions

1. Convert `students(id, subject, score)` from long to wide format (one column per subject) using CASE.
2. What are the three columns required by `crosstab()`? Why must the input be ordered?
3. Write a query to unpivot `sales(product_id, jan, feb, mar, apr, may, jun)` into `(product_id, month, amount)`.
4. How would you implement a pivot when the column values are not known in advance?
5. Given `employees(id, department, salary)`, pivot to show average salary per department as columns.
6. What is the difference between native `PIVOT` and `crosstab()` in PostgreSQL?
7. Write a dynamic pivot query for PostgreSQL that pivots by year without hardcoding column names.
8. Given `orders(order_id, product, quantity, unit_price)`, write a pivot showing total revenue per product as columns.
9. Explain why `MAX()` is commonly used in CASE-based pivots. What happens if you omit the aggregate?
10. Convert a wide table `sensor_log(sensor_id, temp_1h, temp_2h, ..., temp_24h)` to long format with `(sensor_id, hour, temperature)`.
