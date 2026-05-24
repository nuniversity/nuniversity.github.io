---
title: "Transactions and ACID"
description: "Master BEGIN/COMMIT/ROLLBACK, ACID properties, isolation levels, and deadlock handling"
order: 9
duration: "50 minutes"
difficulty: "intermediate"
---

# Transactions and ACID

A transaction is a unit of work that must succeed or fail as a whole. Transactions ensure data integrity when multiple operations must happen atomically.

## BEGIN, COMMIT, and ROLLBACK

```sql
-- Start a transaction
BEGIN;
-- or: START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

-- If both succeed, persist:
COMMIT;

-- If anything fails, undo everything:
ROLLBACK;
```

> [!NOTE]
> Most databases run in auto-commit mode by default — each statement is its own transaction. Use `BEGIN` to group multiple statements into one transaction.

### Savepoints

Savepoints let you roll back part of a transaction without aborting the whole thing.

```sql
BEGIN;

INSERT INTO orders (customer_id, total) VALUES (1, 250.00);
-- order_id = 101

SAVEPOINT order_created;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (101, 42, 2, 125.00);

-- Oops, wrong product. Roll back the items, keep the order
ROLLBACK TO SAVEPOINT order_created;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (101, 15, 1, 250.00);

COMMIT;
```

| Command | Effect |
|---------|--------|
| `SAVEPOINT name` | Set a partial rollback point |
| `ROLLBACK TO SAVEPOINT name` | Undo changes after the savepoint |
| `RELEASE SAVEPOINT name` | Keep changes, remove savepoint |

## ACID Properties

| Property | Meaning | Ensured By |
|----------|---------|------------|
| **A**tomicity | All or nothing | Transaction log + ROLLBACK |
| **C**onsistency | Data obeys all rules | Constraints, triggers, application code |
| **I**solation | Concurrent transactions don't interfere | Locking / MVCC |
| **D**urability | Committed data survives failures | Write-ahead log (WAL) |

### Atomicity

Either all operations succeed, or none takes effect.

```sql
BEGIN;
UPDATE inventory SET quantity = quantity - 2 WHERE product_id = 1;
UPDATE orders SET status = 'shipped' WHERE order_id = 500;
-- If the server crashes after the first UPDATE but before COMMIT,
-- the inventory change is rolled back on restart
COMMIT;
```

### Consistency

Constraints, triggers, and foreign keys enforce consistency automatically.

```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    owner TEXT NOT NULL,
    balance NUMERIC NOT NULL CHECK (balance >= 0)
);

BEGIN;
UPDATE accounts SET balance = balance - 200 WHERE id = 1;
-- If balance would go negative, CHECK constraint prevents it
-- The transaction must be ROLLBACK'd
COMMIT;
```

### Isolation

Isolation prevents concurrent transactions from seeing each other's uncommitted changes.

```sql
-- Session 1
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- Do not COMMIT yet

-- Session 2
BEGIN;
SELECT balance FROM accounts WHERE id = 1;
-- Returns OLD balance (1000) because Session 1 hasn't committed
-- This prevents dirty reads (at READ COMMITTED level)
COMMIT;
```

### Durability

Once COMMIT succeeds, the data is safe even if the power fails immediately after.

```
COMMIT → Write WAL → Flush to disk → Acknowledge → (power failure OK)
                          ↑
                    This must happen before COMMIT returns
```

> [!NOTE]
> Durability guarantees that committed transactions survive crashes. Databases use write-ahead logging (WAL): changes are written to a log before they're applied to the data files.

## Isolation Levels

The SQL standard defines four isolation levels, from weakest to strongest.

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|-----------|---------------------|--------------|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | Prevented | Possible | Possible |
| REPEATABLE READ | Prevented | Prevented | Possible |
| SERIALIZABLE | Prevented | Prevented | Prevented |

### Dirty Read

Reading uncommitted data from another transaction.

```sql
-- Transaction A (READ UNCOMMITTED)
BEGIN;
UPDATE products SET price = 1000 WHERE id = 1;
-- Not committed yet

-- Transaction B (READ UNCOMMITTED)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT price FROM products WHERE id = 1;
-- Returns 1000 (dirty read — Transaction A may ROLLBACK)
```

### Non-Repeatable Read

Reading different values in two reads within the same transaction.

```sql
-- Transaction A (READ COMMITTED)
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000

-- Transaction B
UPDATE accounts SET balance = 500 WHERE id = 1;
COMMIT;

-- Transaction A (same transaction)
SELECT balance FROM accounts WHERE id = 1;  -- Returns 500 (different!)
-- Non-repeatable read
COMMIT;
```

### Phantom Read

A query returns different sets of rows in the same transaction.

```sql
-- Transaction A (REPEATABLE READ)
BEGIN;
SELECT * FROM products WHERE price > 100;  -- Returns 5 rows

-- Transaction B
INSERT INTO products (name, price) VALUES ('Widget', 150);
COMMIT;

-- Transaction A (same transaction)
SELECT * FROM products WHERE price > 100;  -- Returns 6 rows (phantom!)
COMMIT;
```

### Setting Isolation Levels

```sql
-- Session level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Per transaction
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- ... queries ...
COMMIT;

-- PostgreSQL syntax
BEGIN ISOLATION LEVEL SERIALIZABLE;
```

| Database | Default Isolation | Notes |
|----------|------------------|-------|
| PostgreSQL | READ COMMITTED | Also supports REPEATABLE READ, SERIALIZABLE |
| MySQL/InnoDB | REPEATABLE READ | Default is stronger than standard |
| SQL Server | READ COMMITTED | Also supports SNAPSHOT (MVCC variant) |
| Oracle | READ COMMITTED | SERIALIZABLE available |
| Snowflake | READ COMMITTED | Uses MVCC internally |

## Deadlocks

A deadlock occurs when two transactions wait for each other to release locks.

```
Transaction A:                    Transaction B:
UPDATE accounts SET               UPDATE accounts SET
  balance = balance - 100           balance = balance - 200
WHERE id = 1;                     WHERE id = 2;
-- Holds lock on id=1             -- Holds lock on id=2

UPDATE accounts SET               UPDATE accounts SET
  balance = balance + 100           balance = balance + 200
WHERE id = 2;                     WHERE id = 1;
-- Waits for B's lock on id=2    -- Waits for A's lock on id=1
---- DEADLOCK! ----
```

```sql
-- Database detects deadlock and kills one transaction:
-- ERROR: deadlock detected
-- DETAIL: Process 12345 waits for ShareLock on transaction 67890;
--          blocked by process 67890.
-- HINT: See server log for query details.
```

### Avoiding Deadlocks

```sql
-- 1. Always access tables in the same order
-- Good: both transactions update id=1 first, then id=2
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- 2. Use short transactions
BEGIN;
-- do only what's needed
COMMIT;  -- release locks quickly

-- 3. Use NOWAIT or SKIP LOCKED
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
-- Fails immediately if lock is held, instead of waiting

-- 4. Retry on deadlock
-- (application-side: catch deadlock error and retry)
```

> [!WARNING]
> Deadlocks are not bugs — they're a normal part of concurrent database access. The key is to minimize them (consistent ordering, short transactions) and handle them gracefully (retry logic).

## Real-World Example: Order Processing

```sql
BEGIN;

-- 1. Insert the order
INSERT INTO orders (customer_id, order_date, status, total)
VALUES (42, CURRENT_TIMESTAMP, 'pending', 0);

-- 2. Get the order ID
-- (use RETURNING in PostgreSQL)
WITH new_order AS (
    INSERT INTO orders (customer_id, order_date, status, total)
    VALUES (42, CURRENT_TIMESTAMP, 'pending', 0)
    RETURNING order_id
)
-- 3. Add items and update total
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT
    (SELECT order_id FROM new_order),
    p.product_id,
    2,
    p.price
FROM products p
WHERE p.product_id = 15;

-- 4. Update inventory (FOR UPDATE locks the row)
UPDATE inventory
SET quantity = quantity - 2
WHERE product_id = 15
  AND quantity >= 2;

-- 5. Charge the customer
UPDATE customers
SET balance = balance - 250.00
WHERE customer_id = 42
  AND balance >= 250.00;

-- Check charge succeeded
IF NOT FOUND THEN
    ROLLBACK;
    RAISE EXCEPTION 'Insufficient balance';
END IF;

-- 6. Finalize
UPDATE orders SET total = 250.00, status = 'confirmed'
WHERE order_id = (SELECT order_id FROM new_order);

COMMIT;
```

> [!SUCCESS]
> Think of transactions as safety nets for critical operations. Every financial transaction, inventory deduction, or state change that spans multiple tables should execute inside an explicit transaction. When in doubt, wrap it in BEGIN...COMMIT.

## Practice Questions

1. What SQL commands start and end a transaction?
2. What is a savepoint? Write a transaction that uses SAVEPOINT and ROLLBACK TO.
3. What does ACID stand for? Explain each property in one sentence.
4. How does Atomicity differ from Durability?
5. List the four isolation levels from weakest to strongest.
6. What is a dirty read? Which isolation levels prevent it?
7. What is the difference between a non-repeatable read and a phantom read?
8. Write a scenario that causes a deadlock between two transactions.
9. How can you avoid deadlocks? List at least three strategies.
10. What isolation level does your database default to? How do you change it for a single transaction?
