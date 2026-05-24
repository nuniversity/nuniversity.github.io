---
title: "OUTER JOINs and CROSS JOINs"
description: "Master LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, self-joins, and anti-join patterns"
order: 2
duration: "50 minutes"
difficulty: "intermediate"
---

# OUTER JOINs and CROSS JOINs

While INNER JOIN keeps only matching rows, OUTER JOINs preserve rows from one or both sides even when there's no match. CROSS JOINs produce every possible combination of rows.

## LEFT JOIN

A LEFT JOIN preserves all rows from the left table. When no match exists on the right, columns from the right table are NULL.

```sql
SELECT
    d.department_name,
    e.name AS employee
FROM departments d
LEFT JOIN employees e
    ON d.department_id = e.department_id;
```

| department_name | employee |
|----------------|----------|
| Engineering    | Alice    |
| Marketing      | Bob      |
| Finance        | Carol    |
| HR             | NULL     |

The HR department appears even though it has no employees.

> [!NOTE]
> Some databases use `LEFT OUTER JOIN`. The `OUTER` keyword is optional — `LEFT JOIN` means the same thing.

## RIGHT JOIN

A RIGHT JOIN is the mirror of LEFT JOIN: all rows from the right table are preserved.

```sql
SELECT
    e.name AS employee,
    d.department_name
FROM employees e
RIGHT JOIN departments d
    ON e.department_id = d.department_id;
```

This is functionally identical to the LEFT JOIN example above — just written from the other direction.

> [!WARNING]
> Many developers find RIGHT JOIN confusing. When possible, rewrite as LEFT JOIN by swapping table order. Virtually all production SQL uses LEFT JOIN exclusively.

## FULL OUTER JOIN

A FULL OUTER JOIN preserves rows from both tables. Unmatched rows on either side get NULLs for the opposite table's columns.

```sql
SELECT
    e.name AS employee,
    d.department_name
FROM employees e
FULL OUTER JOIN departments d
    ON e.department_id = d.department_id;
```

| employee | department_name |
|----------|----------------|
| Alice    | Engineering    |
| Bob      | Marketing      |
| Carol    | Finance        |
| Dave     | NULL           |
| NULL     | HR             |

Dave has no department; HR has no employees. Both appear.

```sql
-- Find orphans on both sides
SELECT
    COALESCE(e.name, 'NO EMPLOYEE') AS employee,
    COALESCE(d.department_name, 'NO DEPARTMENT') AS department
FROM employees e
FULL OUTER JOIN departments d
    ON e.department_id = d.department_id
WHERE e.employee_id IS NULL
   OR d.department_id IS NULL;
```

> [!NOTE]
> FULL OUTER JOIN is not supported in MySQL (though you can simulate it with UNION of LEFT and RIGHT JOINs). PostgreSQL, SQL Server, Oracle, and Snowflake support it natively.

## CROSS JOIN

A CROSS JOIN produces the Cartesian product — every row from table A paired with every row from table B.

```sql
SELECT
    s.size,
    c.color
FROM sizes s
CROSS JOIN colors c;
```

| size | color |
|------|-------|
| S    | Red   |
| S    | Blue  |
| M    | Red   |
| M    | Blue  |
| L    | Red   |
| L    | Blue  |

If sizes has 3 rows and colors has 2 rows: 6 rows in result.

> [!WARNING]
| Implicit CROSS JOIN | Explicit CROSS JOIN |
|---------------------|---------------------|
| `SELECT * FROM a, b` | `SELECT * FROM a CROSS JOIN b` |
| Easy to forget WHERE | Intentional and clear |

Always prefer explicit `CROSS JOIN` to avoid accidental Cartesian products.

### Real-World CROSS JOIN Usage

```sql
-- Generate all date-size combinations for inventory reporting
SELECT
    d.date,
    s.size,
    COALESCE(SUM(inv.quantity), 0) AS total_inventory
FROM (
    SELECT generate_series(
        '2024-01-01'::date,
        '2024-12-31'::date,
        '1 day'::interval
    )::date AS date
) d
CROSS JOIN sizes s
LEFT JOIN inventory inv
    ON d.date = inv.date AND s.size = inv.size
GROUP BY d.date, s.size
ORDER BY d.date, s.size;
```

## Self-Joins with OUTER JOINs

Self-joins work with OUTER JOINs to find rows that lack relationships.

```sql
-- Find employees who have no direct reports (managers with no team)
SELECT
    m.name AS manager,
    e.name AS direct_report
FROM employees m
LEFT JOIN employees e
    ON m.employee_id = e.manager_id
WHERE e.employee_id IS NULL;

-- Find all managers and their reports (including those with none)
SELECT
    m.name AS manager,
    e.name AS report
FROM employees m
LEFT JOIN employees e
    ON m.employee_id = e.manager_id;
```

## Anti-Join Pattern

An anti-join finds rows in one table that have no match in another. It's typically done with LEFT JOIN + IS NULL or NOT EXISTS / NOT IN.

```sql
-- Customers who have never placed an order (anti-join)
SELECT c.*
FROM customers c
LEFT JOIN orders o
    ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;
```

| Customer | Has Order | Included |
|----------|-----------|----------|
| Alice    | 1001      | No       |
| Bob      | 1002      | No       |
| Carol    | NULL      | Yes      |

```sql
-- Same result with NOT EXISTS
SELECT c.*
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.customer_id
);
```

> [!SUCCESS]
| Anti-Join Method | Performance | Readability |
|------------------|-------------|-------------|
| LEFT JOIN + IS NULL | Fast with indexes | Clear to SQL veterans |
| NOT EXISTS | Most efficient for correlated subqueries | Intent-revealing |
| NOT IN | Risky with NULLs | Simple but dangerous |

NOT IN is dangerous because it returns zero rows if the subquery contains any NULL:

```sql
-- RISKY: returns nothing if any order has NULL customer_id
SELECT * FROM customers
WHERE customer_id NOT IN (SELECT customer_id FROM orders);

-- SAFE: handles NULLs correctly
SELECT * FROM customers
WHERE customer_id NOT IN (
    SELECT customer_id FROM orders WHERE customer_id IS NOT NULL
);
```

## Join Summary Comparison

| Join Type | Left Rows | Right Rows | Result Rows |
|-----------|-----------|------------|-------------|
| INNER JOIN | Only matched | Only matched | matched |
| LEFT JOIN | All | Only matched | all left + matched right |
| RIGHT JOIN | Only matched | All | matched left + all right |
| FULL OUTER JOIN | All | All | all rows both sides |
| CROSS JOIN | All | All | len(L) × len(R) |

## Real-World Example: Product Catalog with Sales

```sql
SELECT
    p.product_id,
    p.product_name,
    c.category_name,
    COALESCE(SUM(s.quantity), 0) AS units_sold,
    COALESCE(SUM(s.revenue), 0) AS total_revenue
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
LEFT JOIN sales s ON p.product_id = s.product_id
    AND s.sale_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.product_id, p.product_name, c.category_name
ORDER BY total_revenue DESC;
```

> [!SUCCESS]
> Choose your join by which rows you want to keep. INNER JOIN drops non-matches. LEFT JOIN keeps left-side rows. FULL OUTER JOIN keeps everything. CROSS JOIN combines every row with every other row.

## Practice Questions

1. What is the difference between LEFT JOIN and INNER JOIN?
2. Write a query that shows all departments and their employees, including departments with zero employees.
3. When would you use RIGHT JOIN instead of LEFT JOIN? How can you avoid needing RIGHT JOIN?
4. What does FULL OUTER JOIN return? Give a scenario where it's useful.
5. Write a CROSS JOIN between `colors` and `sizes` tables. What is the cardinality if colors has 5 rows and sizes has 4?
6. What is an anti-join? Write one using LEFT JOIN and one using NOT EXISTS.
7. Why is NOT IN dangerous when joining tables? How do you fix it?
8. Write a self-LEFT JOIN that finds all categories and their subcategories, including categories with no subcategories.
9. Given `students`, `enrollments`, and `courses`, write a query showing all students and the courses they're enrolled in, including students with no enrollments.
10. What happens to the columns of the non-preserved table in an OUTER JOIN when there is no match?
