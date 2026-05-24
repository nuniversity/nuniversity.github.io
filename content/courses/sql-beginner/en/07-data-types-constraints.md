---
title: "SQL Data Types and Constraints"
description: "Deep dive into SQL data types (INT, VARCHAR, TEXT, DATE, DECIMAL) and constraints (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT)"
order: 7
duration: "20-30 minutes"
difficulty: "beginner"
---

# SQL Data Types and Constraints

Choosing the right data type and applying appropriate constraints ensures data integrity, optimizes storage, and prevents application bugs.

## SQL Data Types

### Numeric Types

| Type | Storage | Range / Precision | Use Case |
|------|---------|-------------------|----------|
| `INTEGER` / `INT` | 4 bytes | -2^31 to 2^31-1 | Counts, IDs, ages |
| `SMALLINT` | 2 bytes | -32,768 to 32,767 | Small ranges, status codes |
| `BIGINT` | 8 bytes | -2^63 to 2^63-1 | Large counters, big IDs |
| `DECIMAL(p,s)` | Variable | Exact precision | Money, scientific measurements |
| `REAL` / `FLOAT` | 4-8 bytes | Approximate | Percentages, averages (not money!) |

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,  -- 10 digits, 2 after decimal
    rating DECIMAL(3,2),            -- e.g. 4.75
    stock SMALLINT DEFAULT 0
);
```

> [!WARNING]
> Never use `FLOAT` or `REAL` for monetary values. Floating-point rounding errors (e.g., 0.1 + 0.2 = 0.30000000000000004) will cause accounting discrepancies. Always use `DECIMAL`.

### Character/String Types

| Type | Description | Use Case |
|------|-------------|----------|
| `CHAR(n)` | Fixed-length, padded with spaces | Codes, zip codes, hashes |
| `VARCHAR(n)` | Variable-length with max | Names, emails, addresses |
| `TEXT` | Unlimited length | Articles, descriptions, JSON |

```sql
CREATE TABLE articles (
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    body TEXT,
    excerpt VARCHAR(500)
);
```

> [!NOTE]
> `VARCHAR(255)` is a common default because 255 is the max length that can be encoded with a single byte prefix. Use `TEXT` when content can exceed a few hundred characters.

### Date/Time Types

| Type | Format | Example | Precision |
|------|--------|---------|-----------|
| `DATE` | YYYY-MM-DD | 2024-01-15 | Day |
| `TIME` | HH:MM:SS | 14:30:00 | Second |
| `TIMESTAMP` | YYYY-MM-DD HH:MM:SS | 2024-01-15 14:30:00 | Second (or sub-second) |
| `DATETIME` | YYYY-MM-DD HH:MM:SS | 2024-01-15 14:30:00 | No timezone (MySQL) |

```sql
CREATE TABLE events (
    event_name VARCHAR(200),
    event_date DATE,
    start_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Other Useful Types

| Type | Use Case |
|------|----------|
| `BOOLEAN` | True/false flags |
| `BLOB` | Binary data (images, files) |
| `JSON` | Structured nested data (PostgreSQL, MySQL) |
| `UUID` | Universally unique identifiers |
| `ENUM` | Fixed list of values (MySQL) |

## Constraints

Constraints enforce rules on the data in your tables.

### NOT NULL

Ensures a column cannot contain NULL:

```sql
CREATE TABLE users (
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL
);
```

```sql
-- This will fail
INSERT INTO users (name) VALUES ('Alice');  -- email is NULL, violates NOT NULL
```

### UNIQUE

Ensures all values in a column (or combination of columns) are distinct:

```sql
CREATE TABLE users (
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE
);
```

```sql
-- This will fail
INSERT INTO users (email, username) VALUES ('a@x.com', 'alice');
INSERT INTO users (email, username) VALUES ('b@x.com', 'alice');  -- duplicate username
```

> [!SUCCESS]
> `UNIQUE` also creates an index, making lookups fast. Use it for natural keys like email, username, or SKU.

### PRIMARY KEY

Uniquely identifies each row. Combines `NOT NULL` + `UNIQUE`. A table can have only one:

```sql
-- Single column PK
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL
);

-- Composite PK (multiple columns)
CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)
);
```

### FOREIGN KEY

Links rows across tables and maintains **referential integrity**:

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
```

#### Referential Actions

| Action | On Delete | On Update |
|--------|-----------|-----------|
| `CASCADE` | Delete child rows | Update child FK values |
| `SET NULL` | Set child FK to NULL | Set child FK to NULL |
| `RESTRICT` | Prevent parent delete | Prevent parent update |
| `NO ACTION` | Same as RESTRICT (check deferrable) |
| `SET DEFAULT` | Set to default value | Set to default value |

```sql
-- If user is deleted, their orders are also deleted
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- If user is deleted, orders keep user_id as NULL
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
```

> [!WARNING]
> `ON DELETE CASCADE` is powerful but dangerous. Accidentally deleting a parent row can wipe out thousands of child rows silently. Use with caution.

### CHECK

Validates that values meet a condition:

```sql
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    salary DECIMAL(10,2) CHECK (salary > 0),
    age INTEGER CHECK (age >= 16 AND age <= 120),
    department VARCHAR(50) CHECK (department IN ('Engineering', 'Sales', 'HR'))
);
```

```sql
-- This will fail
INSERT INTO employees (salary, age, department)
VALUES (-500, 150, 'Gaming');  -- negative salary, overage, invalid dept
```

### DEFAULT

Sets a value when none is provided:

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    currency VARCHAR(3) DEFAULT 'USD'
);
```

```sql
INSERT INTO orders (id) VALUES (1);
-- status = 'pending', created_at = now, currency = 'USD'
```

## All Together: A Well-Designed Table

```sql
CREATE TABLE accounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin', 'moderator')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    balance     DECIMAL(12,2) NOT NULL DEFAULT 0.00
                    CHECK (balance >= 0),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP
);
```

## Real-World Use Case: Preventing Bad Data

```sql
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (user_id, product_id)  -- one review per user per product
);
```

This table guarantees:
- Rating is always 1-5
- No NULL ratings
- One review per user per product
- If a user/product is deleted, reviews are cleaned up
- Review has a creation timestamp

> [!SUCCESS]
> Constraints are your first line of defense against bad data. Define them at the database level, not just in your application code. Database constraints apply everywhere — even if someone writes a buggy INSERT or connects from a different tool.

## Practice Questions

1. What data type should you use for a column storing product prices? Why?
2. Write a CREATE TABLE statement for `students` with: id (PK), email (unique, not null), age (check 0-150), enrollment_date (default today).
3. What is the difference between `CHAR(10)` and `VARCHAR(10)`?
4. What does `ON DELETE CASCADE` do? Give an example where it's appropriate.
5. Write a CHECK constraint that ensures a `discount` column is between 0 and 100 (inclusive).
6. Can a table have multiple PRIMARY KEY constraints? Can it have multiple UNIQUE constraints?
7. What happens to child rows when a parent row is deleted with `ON DELETE SET NULL`?
8. Write a table `enrollments` with a composite primary key on `(student_id, course_id)` and foreign keys to both tables.
9. Why should you avoid `FLOAT` for monetary columns?
10. What is the storage difference between `INTEGER` and `SMALLINT`? When would you choose one over the other?
