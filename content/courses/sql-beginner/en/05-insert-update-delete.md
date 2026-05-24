---
title: "INSERT, UPDATE, DELETE — Data Manipulation"
description: "Learn INSERT INTO, UPDATE SET, DELETE FROM, TRUNCATE, and an introduction to transactions"
order: 5
duration: "20-30 minutes"
difficulty: "beginner"
---

# INSERT, UPDATE, DELETE — Data Manipulation

Reading data is useful, but you also need to create, modify, and remove it. These operations are called **data manipulation language (DML)** and form the backbone of any application.

## INSERT INTO — Adding New Rows

### Insert a Single Row

```sql
INSERT INTO users (name, email, age)
VALUES ('Alice', 'alice@example.com', 30);
```

The columns list is optional but recommended:

```sql
-- Without column list (brittle, position-dependent)
INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', 30);
```

> [!WARNING]
> Omitting the column list requires knowing the exact column order in the table. If the schema changes, your INSERT breaks. Always specify columns.

### Insert Multiple Rows

```sql
INSERT INTO users (name, email, age)
VALUES
    ('Bob', 'bob@example.com', 25),
    ('Carol', 'carol@example.com', 28),
    ('David', 'david@example.com', 35);
```

### Insert from a Query

```sql
INSERT INTO archived_users (name, email, age)
SELECT name, email, age
FROM users
WHERE age > 60;
```

> [!SUCCESS]
> `INSERT INTO ... SELECT` is powerful for copying, archiving, and transforming data between tables. The column count and types must match.

## UPDATE SET — Modifying Existing Rows

### Basic Update

```sql
UPDATE users
SET age = 31
WHERE name = 'Alice';
```

Always include a `WHERE` clause unless you intend to update every row:

```sql
-- Give everyone a 10% raise
UPDATE employees
SET salary = salary * 1.10;
```

> [!WARNING]
> A missing `WHERE` in an UPDATE modifies **all rows** in the table. Always double-check your WHERE clause before executing.

### Update Multiple Columns

```sql
UPDATE users
SET
    name = 'Alice Johnson',
    email = 'alice.johnson@example.com',
    age = 31
WHERE id = 1;
```

### Update with Expressions

```sql
UPDATE products
SET
    price = price * 1.05,
    updated_at = CURRENT_TIMESTAMP
WHERE category = 'Electronics';
```

## DELETE FROM — Removing Rows

### Basic Delete

```sql
DELETE FROM users WHERE id = 5;
```

### Delete with Conditions

```sql
DELETE FROM orders
WHERE status = 'cancelled' AND order_date < '2023-01-01';
```

> [!WARNING]
> A missing `WHERE` in DELETE removes **all rows**. The table structure remains, but the data is gone (unless you have a transaction).

### DELETE vs TRUNCATE

| Feature | DELETE | TRUNCATE |
|---------|--------|----------|
| Can use WHERE | Yes | No |
| Removes rows | Yes | Yes |
| Resets auto-increment | No | Yes |
| Speed | Slower (row by row) | Fast (deallocates pages) |
| Can rollback | Yes (with transaction) | Yes (with transaction) |
| Fires triggers | Yes | No |

```sql
-- Remove all rows, keep table structure
TRUNCATE TABLE temp_logs;
```

> [!NOTE]
> `TRUNCATE` is DDL (not DML) in some databases. It cannot be used with a WHERE clause and is generally faster because it doesn't scan individual rows.

## Introduction to Transactions

A **transaction** groups multiple operations into a single unit that either **commits** (all succeed) or **rolls back** (all undone).

### Why Transactions Matter

Imagine a bank transfer:

```sql
-- Without transactions, if step 2 fails, money disappears
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- Crash!
```

### Using Transactions

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If everything looks good:
COMMIT;

-- If something went wrong:
ROLLBACK;
```

### ACID Properties

| Property | Meaning |
|----------|---------|
| **Atomicity** | All or nothing |
| **Consistency** | Database stays valid |
| **Isolation** | Concurrent transactions don't interfere |
| **Durability** | Committed data survives crashes |

> [!SUCCESS]
> Every single SQL statement runs inside an implicit transaction (auto-commit mode). Explicit transactions become essential when you update two or more tables in one logical operation.

## Real-World Use Case: User Registration

```sql
BEGIN TRANSACTION;

-- 1. Create the user account
INSERT INTO users (name, email, password_hash)
VALUES ('Jane', 'jane@example.com', 'hashed_pw_here');

-- 2. Create a default profile
INSERT INTO profiles (user_id, display_name, avatar_url)
VALUES (LAST_INSERT_ROWID(), 'Jane', '/avatars/default.png');

-- 3. Add welcome email to queue
INSERT INTO email_queue (recipient, subject, body)
VALUES ('jane@example.com', 'Welcome!', 'Thanks for joining...');

COMMIT;
```

> [!WARNING]
> `LAST_INSERT_ROWID()` (MySQL/SQLite) or `RETURNING id` (PostgreSQL) retrieves the auto-generated ID. Check your database's syntax.

## Real-World Use Case: Clean Up Old Data

```sql
-- Archive orders older than 1 year, then delete them
BEGIN TRANSACTION;

INSERT INTO orders_archive (id, customer_id, total, order_date)
SELECT id, customer_id, total, order_date
FROM orders
WHERE order_date < DATE('now', '-1 year');

DELETE FROM orders
WHERE order_date < DATE('now', '-1 year');

COMMIT;
```

## Practice Questions

Given `employees(id, name, department, salary)`:

1. Write an INSERT statement to add a new employee named 'Eve' in 'Engineering' with salary 85000.
2. Write an UPDATE to give all employees in 'Sales' a 15% raise.
3. What is the difference between DELETE and TRUNCATE?
4. Write a DELETE statement to remove employees with salary less than 30000.
5. What happens if you run UPDATE without a WHERE clause?
6. Write a single INSERT statement that adds three new employees at once.
7. What does `BEGIN TRANSACTION` do? Why is it important for a bank transfer?
8. Write an INSERT that copies all employees from 'employees' into 'employees_backup'.
9. After deleting all rows from a table with DELETE, does the auto-increment counter reset? What about TRUNCATE?
10. Write a transaction that inserts a new department 'AI' and moves all 'Engineering' employees into it.
