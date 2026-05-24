---
title: "Common Table Expressions (CTEs)"
description: "Master WITH/CTE syntax, multiple CTEs, recursive CTEs, and when to use CTEs vs subqueries"
order: 4
duration: "50 minutes"
difficulty: "intermediate"
---

# Common Table Expressions (CTEs)

A Common Table Expression (CTE) is a named temporary result set that exists within the scope of a single query. CTEs make complex queries more readable, reusable, and maintainable.

## Basic CTE Syntax

A CTE uses the `WITH` keyword followed by a name, optional columns, and a query definition.

```sql
WITH regional_sales AS (
    SELECT
        region_id,
        SUM(amount) AS total_sales
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY region_id
)
SELECT
    r.name AS region,
    rs.total_sales
FROM regions r
INNER JOIN regional_sales rs ON r.region_id = rs.region_id
ORDER BY rs.total_sales DESC;
```

The CTE `regional_sales` behaves like a temporary view for the duration of this query.

> [!NOTE]
> CTEs are sometimes called "WITH queries." The `WITH` clause must appear at the very beginning of the statement — only `WITH` can precede it.

## Multiple CTEs

You can define multiple CTEs separated by commas. Each can reference earlier CTEs.

```sql
WITH
avg_salary AS (
    SELECT department_id, AVG(salary) AS avg_dept_salary
    FROM employees
    GROUP BY department_id
),
above_avg AS (
    SELECT
        e.name,
        e.salary,
        e.department_id,
        a.avg_dept_salary
    FROM employees e
    INNER JOIN avg_salary a ON e.department_id = a.department_id
    WHERE e.salary > a.avg_dept_salary
),
dept_summary AS (
    SELECT
        department_id,
        COUNT(*) AS above_avg_count,
        AVG(salary) AS above_avg_avg_salary
    FROM above_avg
    GROUP BY department_id
)
SELECT
    d.department_name,
    ds.above_avg_count,
    ds.above_avg_avg_salary
FROM dept_summary ds
INNER JOIN departments d ON ds.department_id = d.department_id
ORDER BY ds.above_avg_count DESC;
```

```sql
WITH
products_2023 AS (
    SELECT * FROM products WHERE launch_year = 2023
),
products_2024 AS (
    SELECT * FROM products WHERE launch_year = 2024
),
sales_2023 AS (
    SELECT p.product_id, SUM(s.quantity) AS total_qty
    FROM products_2023 p
    INNER JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.product_id
),
sales_2024 AS (
    SELECT p.product_id, SUM(s.quantity) AS total_qty
    FROM products_2024 p
    INNER JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.product_id
)
SELECT
    COALESCE(a.product_id, b.product_id) AS product_id,
    COALESCE(a.total_qty, 0) AS qty_2023,
    COALESCE(b.total_qty, 0) AS qty_2024,
    COALESCE(b.total_qty, 0) - COALESCE(a.total_qty, 0) AS growth
FROM sales_2023 a
FULL OUTER JOIN sales_2024 b ON a.product_id = b.product_id;
```

> [!NOTE]
> Each CTE is separated by a comma — no comma after the last CTE before the main query. This is a common syntax error.

## CTEs vs Subqueries

| Aspect | CTE | Subquery (Derived Table) |
|--------|-----|--------------------------|
| Readability | Excellent — named | Poor — nested |
| Reusability | Referenced multiple times | Must repeat |
| Recursion | Supported | Not supported |
| Optimization | Inlineable — no materialization | Inlineable |
| Scope | Single query | Single expression |

```sql
-- WITH subquery (hard to read)
SELECT name, salary, dept_name
FROM (
    SELECT e.*, d.name AS dept_name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
    WHERE e.salary > (SELECT AVG(salary) FROM employees)
) high_earners
WHERE dept_name LIKE '%Eng%';
```

```sql
-- Same query with CTE (easier to follow)
WITH employee_with_dept AS (
    SELECT e.*, d.name AS dept_name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
),
dept_avg AS (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT e.name, e.salary, e.dept_name
FROM employee_with_dept e
INNER JOIN dept_avg a ON e.department_id = a.department_id
WHERE e.salary > a.avg_salary
  AND e.dept_name LIKE '%Eng%';
```

> [!SUCCESS]
> Use CTEs when readability matters or when you need to reference the same subquery multiple times. Use inline subqueries for very simple cases where a CTE would be overkill.

## Recursive CTEs

Recursive CTEs reference themselves. They're essential for traversing hierarchical or tree-structured data.

```sql
WITH RECURSIVE org_chart AS (
    -- Anchor: the CEO (no manager)
    SELECT
        employee_id,
        name,
        manager_id,
        0 AS level,
        name AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive: direct reports
    SELECT
        e.employee_id,
        e.name,
        e.manager_id,
        oc.level + 1,
        oc.path || ' -> ' || e.name
    FROM employees e
    INNER JOIN org_chart oc ON e.manager_id = oc.employee_id
)
SELECT *
FROM org_chart
ORDER BY level, name;
```

| employee_id | name | manager_id | level | path |
|------------|------|------------|-------|------|
| 1 | Sarah | NULL | 0 | Sarah |
| 2 | Tom | 1 | 1 | Sarah -> Tom |
| 5 | Uma | 1 | 1 | Sarah -> Uma |
| 3 | Jerry | 2 | 2 | Sarah -> Tom -> Jerry |

### Anatomy of a Recursive CTE

```
WITH RECURSIVE name AS (
    -- Anchor member (non-recursive, initial set)
    SELECT ...
    WHERE base_condition

    UNION ALL

    -- Recursive member (references name)
    SELECT ...
    FROM name
    JOIN ... ON recursion_condition
)
SELECT * FROM name;
```

1. **Anchor**: Runs first, produces initial rows.
2. **Recursive**: Runs repeatedly, each time working on the new rows from the previous iteration.
3. **Termination**: Stops when the recursive step returns zero rows.

### Recursive CTE Examples

```sql
-- Category tree (unlimited depth)
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 1 AS depth
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.name, c.parent_id, ct.depth + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree;

-- Generate a date series
WITH RECURSIVE dates AS (
    SELECT '2024-01-01'::date AS dt
    UNION ALL
    SELECT dt + 1
    FROM dates
    WHERE dt < '2024-12-31'
)
SELECT * FROM dates;
```

> [!WARNING]
> Recursive CTEs can run infinitely if the recursion condition never terminates. Always ensure your recursive step eventually returns zero rows. Set `max_recursion_depth` (or equivalent) in production to avoid runaway queries.

## CTE Materialization vs Inlining

Different databases handle CTEs differently:

| Database | Default Behavior | Hint for Control |
|----------|-----------------|------------------|
| PostgreSQL | Inline (unless referenced multiple times) | `MATERIALIZED` / `NOT MATERIALIZED` |
| SQL Server | Same as PostgreSQL | `OPTION (RECOMPILE)` |
| Snowflake | Inline | No control needed |
| DuckDB | Materialized | No control needed |

```sql
-- PostgreSQL: force materialization
WITH high_value AS MATERIALIZED (
    SELECT * FROM orders WHERE total > 10000
)
SELECT * FROM high_value h
INNER JOIN customers c ON h.customer_id = c.id;
```

## Real-World Example: Session Analysis

```sql
WITH
user_sessions AS (
    SELECT
        user_id,
        session_start,
        session_end,
        EXTRACT(EPOCH FROM (session_end - session_start)) / 60 AS duration_minutes
    FROM sessions
    WHERE session_start >= '2024-01-01'
),
session_stats AS (
    SELECT
        user_id,
        COUNT(*) AS total_sessions,
        AVG(duration_minutes) AS avg_duration,
        SUM(duration_minutes) AS total_minutes,
        MAX(session_start) AS last_session
    FROM user_sessions
    GROUP BY user_id
),
active_users AS (
    SELECT *
    FROM session_stats
    WHERE total_sessions >= 5
      AND last_session >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
    u.name,
    au.total_sessions,
    ROUND(au.avg_duration, 2) AS avg_session_minutes,
    ROUND(au.total_minutes, 2) AS total_minutes
FROM active_users au
INNER JOIN users u ON au.user_id = u.user_id
ORDER BY total_minutes DESC;
```

> [!SUCCESS]
> Think of CTEs as named building blocks for your query. Each CTE solves one problem. Together, they compose into complex analytics that are easy to read, debug, and modify.

## Practice Questions

1. What is a CTE and what keyword starts one?
2. Write a CTE named `high_value_customers` that selects customers with total orders over $10,000. Then join it with a regions table.
3. How do you define multiple CTEs in a single query? Is there a comma between them?
4. Write a query with two CTEs where the second CTE references the first.
5. What is the difference between a CTE and a derived table (subquery in FROM)?
6. Write a recursive CTE that generates all numbers from 1 to 100.
7. How does a recursive CTE terminate? What happens if the recursive step never returns zero rows?
8. Write a recursive CTE to traverse an `employees` table where each employee has a `manager_id`. Show name, level, and reporting path.
9. When would you prefer a CTE over a subquery? Give two reasons.
10. What does the `MATERIALIZED` keyword do in PostgreSQL CTEs?
