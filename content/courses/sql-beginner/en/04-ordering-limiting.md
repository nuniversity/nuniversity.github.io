---
title: "Ordering, Limiting, and Aliasing Results"
description: "Master ORDER BY, LIMIT, OFFSET, DISTINCT, and AS aliases to control result presentation"
order: 4
duration: "20-30 minutes"
difficulty: "beginner"
---

# Ordering, Limiting, and Aliasing Results

Raw query results are rarely in the order you need. This lesson teaches you how to sort, paginate, deduplicate, and rename columns for clean output.

## ORDER BY — Sorting Results

`ORDER BY` sorts the result set by one or more columns.

```sql
SELECT name, salary FROM employees
ORDER BY salary ASC;   -- ascending (default)
```

```sql
SELECT name, salary FROM employees
ORDER BY salary DESC;  -- descending
```

| name | salary |
|------|--------|
| Bob Smith | 72000 |
| Eve Martinez | 78000 |
| Carol Chen | 88000 |
| Alice Johnson | 95000 |

### Sorting by Multiple Columns

```sql
SELECT department, name, salary
FROM employees
ORDER BY department ASC, salary DESC;
```

This sorts by department alphabetically, then by highest salary within each department.

> [!NOTE]
> `ASC` is the default. You only need to write `DESC` for descending order.

### Sorting by Column Position

You can reference columns by their position in the SELECT list (not recommended for production):

```sql
SELECT name, salary FROM employees ORDER BY 2 DESC;
-- Sorts by the 2nd column (salary)
```

> [!WARNING]
> Sorting by ordinal position (2, 3, etc.) is fragile. If the SELECT list changes, the sort order silently changes too. Always use column names.

### Sorting with Expressions

```sql
SELECT name, salary, salary * 1.1 AS projected_raise
FROM employees
ORDER BY projected_raise DESC;
```

## LIMIT and OFFSET — Pagination

`LIMIT` restricts how many rows are returned. `OFFSET` skips a number of rows before returning results.

```sql
-- Top 5 highest-paid employees
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5;
```

```sql
-- 5 employees after skipping the first 5 (page 2)
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5 OFFSET 5;
```

> [!SUCCESS]
> Together, `LIMIT` and `OFFSET` implement pagination. Page 1 is `LIMIT 10 OFFSET 0`, page 2 is `LIMIT 10 OFFSET 10`, etc.

### LIMIT Syntax Variations

Different databases have slightly different syntax:

| RDBMS | Syntax |
|-------|--------|
| PostgreSQL, SQLite | `LIMIT 10 OFFSET 5` |
| MySQL | `LIMIT 5, 10` (offset, count) |
| SQL Server | `OFFSET 5 ROWS FETCH NEXT 10 ROWS ONLY` |
| Oracle | `OFFSET 5 ROWS FETCH NEXT 10 ROWS ONLY` |

```sql
-- MySQL style (offset, count)
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5, 10;  -- Skip 5, return 10
```

## DISTINCT — Remove Duplicates

`DISTINCT` returns only unique values for the selected columns.

```sql
-- List all unique departments
SELECT DISTINCT department FROM employees;
```

| department |
|------------|
| Engineering |
| Marketing |
| Sales |

```sql
-- Unique combinations of department and status
SELECT DISTINCT department, status FROM employees;
```

> [!NOTE]
> `DISTINCT` applies to all selected columns, not just the first one. `SELECT DISTINCT a, b` returns unique pairs, not unique values of `a`.

### COUNT(DISTINCT ...)

```sql
SELECT COUNT(DISTINCT department) AS unique_departments
FROM employees;
```

## AS Aliases

Aliases rename columns or tables in the result set. They do **not** change the underlying schema.

### Column Aliases

```sql
SELECT name AS employee_name,
       salary * 12 AS annual_salary
FROM employees;
```

| employee_name | annual_salary |
|---------------|---------------|
| Alice Johnson | 1140000 |
| Bob Smith | 864000 |

### Table Aliases

Table aliases make queries shorter and more readable, especially with joins:

```sql
SELECT e.name, d.name AS department_name
FROM employees AS e
JOIN departments AS d ON e.department_id = d.id;
```

> [!SUCCESS]
> The `AS` keyword is optional. `SELECT name employee_name` works, but `AS` makes the intent explicit. Use it.

### Aliases with Spaces

If an alias contains spaces, wrap it in double quotes (or backticks in MySQL):

```sql
SELECT name AS "Employee Name", salary AS "Annual Salary"
FROM employees;
```

## Putting It All Together

```sql
-- Page 3 of unique departments, sorted alphabetically
SELECT DISTINCT department AS dept
FROM employees
ORDER BY dept
LIMIT 5 OFFSET 10;
```

## Real-World Use Case: Leaderboard

```sql
-- Top 10 players with the highest scores, paginated
SELECT
    username AS player,
    score,
    RANK() OVER (ORDER BY score DESC) AS rank
FROM leaderboard
ORDER BY score DESC
LIMIT 10 OFFSET 0;
```

## Real-World Use Case: Recent Orders with Pagination

```sql
-- Show page 2 of the most recent orders (5 per page)
SELECT
    id AS order_id,
    customer_name,
    total AS order_total,
    order_date
FROM orders
ORDER BY order_date DESC, id DESC
LIMIT 5 OFFSET 5;
```

> [!WARNING]
> `OFFSET` becomes slow on large datasets because the database must still scan and discard skipped rows. For deep pagination (page 1000+), use keyset pagination (`WHERE id > last_seen_id LIMIT 10`).

## DISTINCT vs GROUP BY

`DISTINCT` and `GROUP BY` can both deduplicate, but they serve different purposes:

| Feature | DISTINCT | GROUP BY |
|---------|----------|----------|
| Purpose | Remove duplicates | Group rows for aggregation |
| Can use aggregates | No | Yes |
| Performance | Similar (same execution plan often) | Similar |
| Readability | Cleaner for simple dedup | Required for aggregates |

```sql
-- Same result, different intent
SELECT DISTINCT department FROM employees;
SELECT department FROM employees GROUP BY department;
```

## Practice Questions

Given `employees(id, name, department, salary, hire_date)`:

1. Write a query to list all employees sorted by hire date, newest first.
2. Return the 3 most recently hired employees.
3. List all unique departments in alphabetical order.
4. What is the difference between `LIMIT 5 OFFSET 5` and `LIMIT 5, 5`?
5. Write a query that returns employee names aliased as "full_name" and their salary aliased as "monthly_pay".
6. Show employees sorted by department (A-Z), then by salary (highest first within each department).
7. Return the 4th page of employees (10 per page).
8. How would you count how many distinct departments exist in the employees table?
9. Why is sorting by column position (`ORDER BY 2`) discouraged?
10. Write a query that returns the 5 lowest-paid employees.
