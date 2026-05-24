---
title: "Subqueries"
description: "Master scalar, row, correlated subqueries, EXISTS/NOT EXISTS, and IN/NOT IN patterns"
order: 3
duration: "50 minutes"
difficulty: "intermediate"
---

# Subqueries

A subquery is a query nested inside another query. Subqueries appear in SELECT, FROM, WHERE, and HAVING clauses. They can return single values, single rows, or entire result sets.

## Scalar Subqueries

A scalar subquery returns exactly one value (one row, one column). It can be used anywhere a single value is expected.

```sql
-- Find employees who earn more than the average salary
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Include the average as a column
SELECT
    name,
    salary,
    (SELECT AVG(salary) FROM employees) AS avg_salary,
    salary - (SELECT AVG(salary) FROM employees) AS difference
FROM employees;
```

| name | salary | avg_salary | difference |
|------|--------|------------|------------|
| Alice | 95000 | 82000 | 13000 |
| Bob | 75000 | 82000 | -7000 |

> [!WARNING]
> A scalar subquery must return exactly one row. If it returns zero rows, the result becomes NULL. If it returns multiple rows, the database throws an error.

```sql
-- This will FAIL if any department has multiple employees with max salary ties
SELECT name, department_id
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees GROUP BY department_id);
```

## Row Subqueries

A row subquery returns a single row with multiple columns. Use row constructors to compare.

```sql
-- Find employees with the highest salary in their department
SELECT name, salary, department_id
FROM employees
WHERE (department_id, salary) IN (
    SELECT department_id, MAX(salary)
    FROM employees
    GROUP BY department_id
);
```

```sql
-- Find employees whose department and job match an existing pattern
SELECT *
FROM employees
WHERE (department_id, job_id) = (
    SELECT department_id, job_id
    FROM employees
    WHERE employee_id = 100
);
```

## Subqueries in the FROM Clause (Derived Tables)

A subquery in FROM acts as a temporary table that the outer query can reference.

```sql
SELECT dept_name, avg_salary
FROM (
    SELECT
        d.department_name AS dept_name,
        AVG(e.salary) AS avg_salary
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.department_id
    GROUP BY d.department_name
) dept_stats
WHERE avg_salary > 80000
ORDER BY avg_salary DESC;
```

```sql
-- Rank products by revenue within each category
SELECT category, product_name, revenue, rank
FROM (
    SELECT
        c.category_name AS category,
        p.product_name,
        SUM(oi.quantity * oi.unit_price) AS revenue,
        RANK() OVER (
            PARTITION BY c.category_id
            ORDER BY SUM(oi.quantity * oi.unit_price) DESC
        ) AS rank
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    INNER JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY c.category_id, c.category_name, p.product_name
) ranked
WHERE rank <= 3;
```

> [!NOTE]
> Derived tables must have an alias. Every subquery in FROM needs a name, even if you don't reference it elsewhere.

## Correlated Subqueries

A correlated subquery references columns from the outer query. It is re-executed for each row of the outer query.

```sql
-- Find employees who earn more than the average in their own department
SELECT e.name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department_id = e.department_id
);
```

| Subquery Type | Executed | Performance |
|---------------|----------|-------------|
| Non-correlated | Once | Fast |
| Correlated | Once per outer row | Slower — watch for large tables |

```sql
-- Find products whose price is above the average for their category
SELECT p.product_name, p.category_id, p.price
FROM products p
WHERE p.price > (
    SELECT AVG(price)
    FROM products
    WHERE category_id = p.category_id
);
```

### Correlated vs Non-Correlated Execution

Non-correlated (one execution):
```
1. Compute AVG(salary) from all employees  → 82000
2. Find employees WHERE salary > 82000
   → scan 1000 rows, compare to constant
```

Correlated (N executions):
```
For each of 1000 employees:
  1. Compute AVG(salary) for that employee's department
  2. Compare employee salary to department average
```

## EXISTS and NOT EXISTS

EXISTS returns TRUE if the subquery produces any rows. It doesn't care about the values — only row existence.

```sql
-- Find departments that have at least one employee
SELECT d.department_name
FROM departments d
WHERE EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);

-- Find departments with no employees
SELECT d.department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);
```

> [!SUCCESS]
> Always use `SELECT 1` (or `SELECT *`) in EXISTS subqueries — the actual columns don't matter. The database only checks for row existence.

### EXISTS vs IN

| Aspect | EXISTS | IN |
|--------|--------|----|
| Stops on first match | Yes | No (evaluates all) |
| Handles NULLs | Safely | Problematic |
| Performance (large subquery) | Better | Worse |
| Performance (small subquery) | Comparable | Comparable |

```sql
-- EXISTS is often faster when the subquery is large
SELECT c.*
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
      AND o.order_date >= '2024-01-01'
);

-- IN is clearer for small, static lists
SELECT *
FROM products
WHERE category_id IN (1, 3, 5);
```

## IN and NOT IN

```sql
-- Find customers from specific countries
SELECT name, country
FROM customers
WHERE country IN ('USA', 'Canada', 'Mexico');

-- Using a subquery
SELECT name
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE total > 1000
);
```

> [!WARNING]
> NOT IN with a subquery that returns NULL yields zero rows. Use NOT EXISTS or add `WHERE col IS NOT NULL` to the subquery.

## ANY, ALL, and SOME

```sql
-- Salary greater than ANY employee in department 10
SELECT name, salary
FROM employees
WHERE salary > ANY (
    SELECT salary
    FROM employees
    WHERE department_id = 10
);

-- Salary greater than ALL employees in department 10
SELECT name, salary
FROM employees
WHERE salary > ALL (
    SELECT salary
    FROM employees
    WHERE department_id = 10
);
```

| Operator | Meaning |
|----------|---------|
| `> ANY(...)` | Greater than at least one value |
| `> ALL(...)` | Greater than every value |
| `= ANY(...)` | Equal to at least one (same as IN) |
| `<> ALL(...)` | Not equal to any (same as NOT IN) |

## Nested Subqueries

Subqueries can nest multiple levels deep, though this often signals a refactoring opportunity.

```sql
SELECT name
FROM employees
WHERE department_id IN (
    SELECT department_id
    FROM departments
    WHERE location_id IN (
        SELECT location_id
        FROM locations
        WHERE country = 'USA'
    )
);
```

```sql
-- Equivalent with JOINs (usually preferred)
SELECT e.name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
INNER JOIN locations l ON d.location_id = l.location_id
WHERE l.country = 'USA';
```

## Real-World Example: Customer Report

```sql
SELECT
    c.name,
    c.email,
    (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS total_orders,
    (
        SELECT SUM(o.total_amount)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS lifetime_value,
    (
        SELECT MAX(o.order_date)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS last_order_date,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.customer_id = c.customer_id
              AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
        ) THEN 'Active'
        ELSE 'Inactive'
    END AS customer_status
FROM customers c
ORDER BY lifetime_value DESC NULLS LAST;
```

> [!SUCCESS]
> Subqueries are powerful but can hurt readability. As a rule of thumb: use subqueries for simple aggregations and existence checks; use JOINs for multi-table row data. CTEs (next lesson) offer a middle ground.

## Practice Questions

1. What is a scalar subquery? What happens if it returns zero rows? What if it returns multiple rows?
2. Write a query that lists products with a price above the overall average price.
3. What is the difference between a correlated and non-correlated subquery?
4. Write a correlated subquery to find employees who were hired before the average hire date of their department.
5. When would you use EXISTS instead of IN? Give an example.
6. Rewrite `SELECT * FROM products WHERE category_id NOT IN (SELECT category_id FROM categories WHERE active = false)` safely.
7. What do `> ANY()` and `> ALL()` mean? Provide example queries.
8. Write a query using a derived table (subquery in FROM) to find the top 2 highest-paid employees per department.
9. What is a row subquery? Write one that uses a row constructor in a WHERE clause.
10. Why is `SELECT 1` commonly used inside EXISTS subqueries?
