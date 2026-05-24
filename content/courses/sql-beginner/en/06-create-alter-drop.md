---
title: "CREATE, ALTER, and DROP Tables"
description: "Learn to define database schemas with CREATE TABLE, modify them with ALTER TABLE, and remove them with DROP TABLE"
order: 6
duration: "20-30 minutes"
difficulty: "beginner"
---

# CREATE, ALTER, and DROP Tables

These **Data Definition Language (DDL)** commands define and manage the structure of your database. Getting schema design right is critical — it's much easier to plan ahead than to migrate later.

## CREATE TABLE

### Basic Syntax

```sql
CREATE TABLE table_name (
    column1 datatype constraints,
    column2 datatype constraints,
    ...
);
```

### Example

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    age INTEGER CHECK (age >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Creating a Table with a Foreign Key

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

> [!NOTE]
> In MySQL, `AUTO_INCREMENT` replaces `AUTOINCREMENT`. PostgreSQL uses `SERIAL` or `GENERATED AS IDENTITY`. Always check your RDBMS dialect.

### IF NOT EXISTS

Prevents errors if the table already exists:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT
);
```

## ALTER TABLE — Changing Table Structure

### ADD COLUMN

```sql
ALTER TABLE users
ADD COLUMN phone VARCHAR(20);

-- With constraints
ALTER TABLE users
ADD COLUMN bio TEXT DEFAULT '';
```

> [!SUCCESS]
> Adding a column with a `DEFAULT` value is usually fast. Adding a `NOT NULL` column without a default on a large table can be very slow.

### MODIFY COLUMN (Changing Data Type / Constraints)

```sql
-- MySQL / SQLite
ALTER TABLE users
MODIFY COLUMN age SMALLINT NOT NULL;

-- PostgreSQL
ALTER TABLE users
ALTER COLUMN age TYPE SMALLINT;
ALTER TABLE users
ALTER COLUMN age SET NOT NULL;
```

### RENAME COLUMN

```sql
-- PostgreSQL, SQLite 3.25+
ALTER TABLE users
RENAME COLUMN phone TO phone_number;

-- MySQL
ALTER TABLE users
CHANGE phone phone_number VARCHAR(20);
```

### DROP COLUMN

```sql
ALTER TABLE users
DROP COLUMN phone;
```

> [!WARNING]
> Dropping a column is destructive and irreversible (outside of a backup or transaction). Some databases (SQLite < 3.35.0) require recreating the table to drop a column.

### RENAME TABLE

```sql
ALTER TABLE users RENAME TO customers;
```

## DROP TABLE — Removing Tables

```sql
-- Permanently removes table and all its data
DROP TABLE users;

-- Only drop if it exists (no error)
DROP TABLE IF EXISTS users;
```

> [!WARNING]
> `DROP TABLE` cannot be rolled back in most databases unless wrapped in a transaction. There is no confirmation prompt. Be absolutely certain before running this in production.

### DROP vs TRUNCATE vs DELETE

| Command | Removes Data | Removes Structure | Can Rollback | Resets Indexes | Speed |
|---------|-------------|-------------------|-------------|----------------|-------|
| `DELETE` | Yes | No | Yes | No | Slow |
| `TRUNCATE` | Yes | No | Yes* | Yes | Fast |
| `DROP` | Yes | Yes | Yes* | Yes | Fastest |

*In most databases if wrapped in a transaction.

## Putting It All Together: Building a Schema

```sql
-- Step 1: Create the database (MySQL/PostgreSQL)
CREATE DATABASE ecommerce;

USE ecommerce;  -- MySQL
-- \c ecommerce  -- PostgreSQL

-- Step 2: Create tables
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Step 3: Alter after creation (if needed)
ALTER TABLE products ADD COLUMN sku VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN active BOOLEAN DEFAULT TRUE;
```

## Real-World Use Case: Schema Migration

Imagine you inherited a `customers` table with a single `full_name` column, but now you need first and last names separately:

```sql
-- 1. Add new columns
ALTER TABLE customers ADD COLUMN first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN last_name VARCHAR(100);

-- 2. Populate from existing data
UPDATE customers
SET
    first_name = SUBSTR(full_name, 1, INSTR(full_name, ' ') - 1),
    last_name = SUBSTR(full_name, INSTR(full_name, ' ') + 1);

-- 3. (Optional) Drop the old column
ALTER TABLE customers DROP COLUMN full_name;
```

> [!NOTE]
> In production, schema changes like dropping columns should be done during maintenance windows and tested on a copy first. Use a migration tool (Flyway, Alembic, Liquibase) to track changes.

## Real-World Use Case: Adding Auditing

```sql
-- Add timestamp tracking to an existing table
ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create a trigger to auto-update on modification (PostgreSQL / SQLite)
CREATE TRIGGER update_products_timestamp
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

## Practice Questions

1. Write a CREATE TABLE statement for a `books` table with columns: id, title, author_id, published_year, isbn, and a foreign key to `authors`.
2. What does `ALTER TABLE students ADD COLUMN gpa DECIMAL(3,2) DEFAULT 0.00;` do?
3. What is the difference between `DROP TABLE` and `TRUNCATE TABLE`?
4. Write an ALTER statement to rename the `students` table to `enrollees`.
5. How would you add a `UNIQUE` constraint to an existing column named `email`?
6. What does `CREATE TABLE IF NOT EXISTS` do and why is it useful?
7. Write a sequence of ALTER statements that: add a `middle_name` column, drop the `nickname` column, and rename `full_name` to `display_name`.
8. Why is adding a `NOT NULL` column without a default potentially problematic on large tables?
9. Write a CREATE TABLE for a `reviews` table with a composite foreign key referencing `(product_id, user_id)`.
10. What happens to the data in a table when you run `DROP TABLE products`?
