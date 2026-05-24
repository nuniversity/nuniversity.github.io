---
title: "SELECT and WHERE: Querying Data"
description: "Master SELECT, FROM, WHERE with comparison operators, AND/OR/NOT, LIKE, IN, and BETWEEN"
order: 3
duration: "20-30 minutes"
difficulty: "beginner"
---

# SELECT and WHERE: Querying Data

The `SELECT` statement is the most frequently used SQL command. Combined with `WHERE`, it becomes a powerful filter that extracts exactly the data you need.

## Basic SELECT

```sql
SELECT column1, column2 FROM table_name;
```

```sql
-- Select specific columns
SELECT name, email FROM users;

-- Select all columns
SELECT * FROM users;
```

> [!WARNING]
> Avoid `SELECT *` in production code. It returns more data than needed, breaks if the schema changes, and prevents the database from using index-only scans.

## The WHERE Clause

`WHERE` filters rows before they are returned:

```sql
SELECT name, age FROM users WHERE age >= 18;
```

| name | age |
|------|-----|
| Alice | 30 |
| Bob | 25 |

## Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equal | `WHERE name = 'Alice'` |
| `<>` or `!=` | Not equal | `WHERE status <> 'inactive'` |
| `>` | Greater than | `WHERE price > 10` |
| `<` | Less than | `WHERE age < 18` |
| `>=` | Greater or equal | `WHERE quantity >= 0` |
| `<=` | Less or equal | `WHERE rating <= 5` |

```sql
SELECT title, price FROM products WHERE price <= 19.99;
```

## AND, OR, NOT

Combine conditions with logical operators:

```sql
-- AND: all conditions must be true
SELECT * FROM employees
WHERE department = 'Engineering' AND salary > 80000;

-- OR: at least one condition must be true
SELECT * FROM products
WHERE category = 'Electronics' OR category = 'Books';

-- NOT: negate a condition
SELECT * FROM users
WHERE NOT status = 'banned';

-- Mixing AND/OR (use parentheses for clarity)
SELECT * FROM orders
WHERE (status = 'pending' OR status = 'shipped')
  AND total > 100;
```

> [!NOTE]
> `AND` is evaluated before `OR`. Always use parentheses to make your intent clear and avoid subtle bugs.

## LIKE — Pattern Matching

`LIKE` matches strings using two wildcards:
- `%` — matches any sequence of characters
- `_` — matches exactly one character

```sql
-- Starts with "A"
SELECT name FROM users WHERE name LIKE 'A%';

-- Contains "smith" anywhere
SELECT name FROM users WHERE name LIKE '%smith%';

-- Exactly 5 characters
SELECT code FROM products WHERE code LIKE '_____';

-- Starts with J, ends with n
SELECT name FROM users WHERE name LIKE 'J%n';
```

### Sample Data: Employees

| id | name | department | salary |
|----|------|-----------|--------|
| 1 | Alice Johnson | Engineering | 95000 |
| 2 | Bob Smith | Marketing | 72000 |
| 3 | Carol Chen | Engineering | 88000 |
| 4 | David Brown | Sales | 65000 |
| 5 | Eve Martinez | Marketing | 78000 |

```sql
-- Find Engineering employees earning over 85,000
SELECT name, salary FROM employees
WHERE department = 'Engineering' AND salary > 85000;
-- Returns: Alice Johnson (95000), Carol Chen (88000)
```

## IN — Match a List

`IN` is shorthand for multiple `OR` conditions:

```sql
-- Without IN
SELECT * FROM products
WHERE category = 'Electronics'
   OR category = 'Books'
   OR category = 'Music';

-- With IN (cleaner)
SELECT * FROM products
WHERE category IN ('Electronics', 'Books', 'Music');
```

You can also use `NOT IN`:

```sql
SELECT name FROM users
WHERE status NOT IN ('banned', 'suspended');
```

## BETWEEN — Range Matching

`BETWEEN` is inclusive on both ends:

```sql
SELECT name, salary FROM employees
WHERE salary BETWEEN 70000 AND 90000;
-- Returns: Bob Smith (72000), Carol Chen (88000), Eve Martinez (78000)

-- Same as:
SELECT name, salary FROM employees
WHERE salary >= 70000 AND salary <= 90000;
```

Works with dates too:

```sql
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31';
```

> [!SUCCESS]
> `BETWEEN` is cleaner than `>= AND <=` for inclusive ranges. For date ranges, remember that `BETWEEN` includes midnight of the end date — use `>= 'start' AND < 'end + 1 day'` for exact boundaries.

## Putting It All Together

```sql
SELECT name, email, age
FROM users
WHERE age BETWEEN 25 AND 40
  AND email LIKE '%@gmail.com'
  AND name NOT LIKE 'Admin%';
```

## Real-World Use Case: Product Inventory Query

```sql
-- Find products that are low in stock, in specific categories,
-- and cost less than $50
SELECT product_name, category, stock, price
FROM inventory
WHERE stock < 10
  AND category IN ('Electronics', 'Accessories')
  AND price < 50
ORDER BY stock ASC;
```

> [!WARNING]
> `LIKE` with a leading wildcard (`'%pattern'`) cannot use indexes and will be slow on large tables. Avoid it on millions of rows.

## NULL Handling

`NULL` means **unknown** — not zero, not empty string.

```sql
-- NULL comparisons require IS NULL, not = NULL
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM users WHERE email IS NOT NULL;

-- This is always false:
SELECT * FROM users WHERE email = NULL;
```

> [!NOTE]
> `NULL` propagates through expressions. `NULL > 5` returns `NULL` (not `TRUE` or `FALSE`). `WHERE` only keeps rows where the condition is `TRUE`, not `NULL`.

## Practice Questions

Given a table `employees(id, name, department, salary, hire_date)`:

1. Write a query to select all employees in the 'Sales' department.
2. Find employees with salaries greater than 60000 but less than or equal to 100000.
3. Find employees whose name starts with 'M'.
4. Find employees hired in 2023 (use `BETWEEN`).
5. Find employees in either 'Engineering' or 'Product' departments with a salary of at least 90000.
6. What is the difference between `WHERE` and `HAVING`? (Just predict for now.)
7. Find employees whose department is NOT 'Marketing'.
8. Write a query using `IN` that returns employees in 'HR', 'Finance', or 'Legal'.
9. What does `SELECT * FROM products WHERE price = NULL` return? Why is it wrong?
10. Find employees whose name contains exactly 5 letters and ends with 'n'.
