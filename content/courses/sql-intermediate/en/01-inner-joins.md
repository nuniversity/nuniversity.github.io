---
title: "INNER JOINs and Equi-Joins"
description: "Master INNER JOIN, equi-joins, joining 3+ tables, table aliases, and natural joins in SQL"
order: 1
duration: "45 minutes"
difficulty: "intermediate"
---

# INNER JOINs and Equi-Joins

Relational databases store data across multiple tables. JOINs let you bring that data back together. The INNER JOIN is the most common and foundational join type.

## INNER JOIN Basics

An INNER JOIN returns rows where the join condition matches — rows that don't match are dropped from both sides.

```sql
SELECT *
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id;
```

| employees |   | departments |
|-----------|-------|-------------|
| 1 | Alice | 10 |  | 10 | Engineering |
| 2 | Bob   | 20 |  | 20 | Marketing   |
| 3 | Carol | 30 |  | 30 | Finance     |
| 4 | Dave  | 40 |  |  |  |

Result: rows 1-3 match; Dave (dept 40) and Finance (no employees) are excluded.

> [!NOTE]
> `INNER JOIN` and `JOIN` are synonymous in SQL. Use whichever you prefer, but `INNER JOIN` is more explicit.

## Equi-Joins

An equi-join uses equality (`=`) in the ON clause. This is the most common join pattern.

```sql
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id;
```

Equi-joins map foreign keys to primary keys. The column names need not match — only the values do.

```sql
-- Different column names, same values
SELECT o.order_id, c.name
FROM orders o
INNER JOIN customers c
    ON o.customer_id = c.id;
```

## Table Aliases

Table aliases shorten queries and disambiguate column references.

```sql
SELECT e.name AS employee_name,
       d.name AS department_name,
       l.city
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id
INNER JOIN locations l ON d.location_id = l.id;
```

| Alias | Full Table |
|-------|-----------|
| `e` | employees |
| `d` | departments |
| `l` | locations |

> [!WARNING]
> Always use meaningful aliases (`e`, `d`, `l`) rather than `a`, `b`, `c`. Your future self will thank you.

## Joining 3+ Tables

There is no limit on the number of JOINs in a query, but each additional join reduces performance.

```sql
SELECT
    e.first_name,
    e.last_name,
    d.department_name,
    p.project_name,
    t.task_description
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id
INNER JOIN projects p ON d.dept_id = p.dept_id
INNER JOIN tasks t ON p.project_id = t.project_id
WHERE e.hire_date >= '2023-01-01';
```

This query starts with employees, filters by hire date, then joins outward — the WHERE filter happens conceptually before the final projection, but the database optimizer reorders these steps.

> [!NOTE]
> The order of JOINs in your query does not guarantee execution order. Modern optimizers rearrange joins based on statistics, row counts, and available indexes.

## Joining a Table to Itself (Self-Join via INNER JOIN)

A self-join joins a table to itself. You *must* use aliases.

```sql
-- Find employee-manager pairs
SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
INNER JOIN employees m
    ON e.manager_id = m.employee_id;
```

Self-joins are useful for hierarchical data (org charts, categories, threaded comments) and finding related rows in the same table.

## Natural Joins

A NATURAL JOIN automatically joins on columns with the same name in both tables.

```sql
-- Both tables have 'department_id'
SELECT *
FROM employees
NATURAL JOIN departments;
```

| Pros | Cons |
|------|------|
| Less typing | Implicit — can break when schema changes |
| Clean for well-named schemas | Hard to debug unintended column matches |

> [!WARNING]
> Many SQL style guides forbid NATURAL JOIN because it hides the join condition. Prefer explicit `INNER JOIN ... ON` in production code.

## Non-Equi Joins

While rare, INNER JOIN works with any condition, not just equality.

```sql
-- Find employees whose salary is within a department budget range
SELECT e.name, e.salary, d.department_name
FROM employees e
INNER JOIN departments d
    ON e.dept_id = d.dept_id
    AND e.salary BETWEEN d.budget_min AND d.budget_max;
```

```sql
-- Find orders placed within a promotion period
SELECT o.order_id, o.order_date, p.promo_name
FROM orders o
INNER JOIN promotions p
    ON o.order_date BETWEEN p.start_date AND p.end_date;
```

## Join Performance Considerations

| Factor | Impact |
|--------|--------|
| Indexed join columns | Dramatically faster |
| Fewer rows joined | Lower memory and CPU |
| Selective WHERE clauses | Reduces rows before join |
| Composite indexes | Help multi-column joins |

```sql
-- Creating indexes to speed up joins
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_dept_id ON departments(department_id);
```

## Real-World Example: Sales Dashboard Query

```sql
SELECT
    c.name AS customer,
    p.product_name,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price AS line_total,
    o.order_date,
    s.full_name AS sales_rep
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
INNER JOIN employees s ON o.sales_rep_id = s.employee_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY o.order_date DESC, c.name;
```

> [!SUCCESS]
> Think of INNER JOIN as a filter on both tables — only matching rows survive. Every row in the result is guaranteed to have a partner on both sides.

## Practice Questions

1. What is the difference between `INNER JOIN` and `JOIN` in SQL?
2. Write an INNER JOIN that returns employee names and their department names from `employees` (dept_id) and `departments` (id, name).
3. What is an equi-join? Can INNER JOIN be used with non-equality conditions?
4. Write a query joining 4 tables: `customers`, `orders`, `order_items`, and `products`. Return customer name, order date, product name, and quantity.
5. Why do you need table aliases when joining a table to itself?
6. What is a NATURAL JOIN and what are its drawbacks?
7. Write a self-join that finds employee pairs who work in the same department (hint: use `a.department_id = b.department_id` and `a.id < b.id`).
8. How would you join two tables where the relationship is date-based (e.g., a transaction occurred during a campaign period)?
9. Explain what happens to rows that don't match in an INNER JOIN.
10. Write a query that joins `students`, `enrollments`, and `courses` to show each student's enrolled course names. Use table aliases.
