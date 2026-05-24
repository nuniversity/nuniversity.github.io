---
title: "Database Design Basics and Normalization"
description: "Learn database design principles, normalization (1NF, 2NF, 3NF), ER diagrams, and how to choose SQL data types"
order: 2
duration: "20-30 minutes"
difficulty: "beginner"
---

# Database Design Basics and Normalization

A well-designed database saves time, prevents errors, and scales gracefully. Poor design leads to duplicate data, update anomalies, and slow queries. This lesson teaches you how to get it right from the start.

## Why Database Design Matters

Consider a badly designed `orders` table:

```
orders
| order_id | customer_name | customer_email | product1 | product2 | qty1 | qty2 |
```

Problems:
- **Duplication**: Customer name and email repeat on every order
- **Fixed columns**: Can't sell more than 2 products per order
- **Update anomaly**: Changing a customer's email requires updating many rows
- **Delete anomaly**: Deleting an order also deletes customer info

> [!NOTE]
> These are called **anomalies** — data inconsistencies caused by poor design. Normalization eliminates them.

## Entity-Relationship (ER) Diagrams

An ER diagram visually represents tables and their relationships. Three types of relationships exist:

| Relationship | Example | Diagram Notation |
|-------------|---------|-----------------|
| **One-to-One** | User ↔ Profile | `|---|` |
| **One-to-Many** | Customer → Orders | `|---|{` |
| **Many-to-Many** | Student ↔ Course | `}{|{` |

### Example: Library System

```
AUTHOR ──< BOOK >── BOOK_GENRE >── GENRE
  │                    │
  └──< COPY            │
                        │
MEMBER ──< LOAN >──┘
```

- One author writes many books (one-to-many)
- A book has many copies (one-to-many)
- A book belongs to many genres, and a genre has many books (many-to-many)
- A member borrows many copies (one-to-many)

## Normalization

Normalization organizes columns and tables to reduce redundancy and dependency. It is applied in successive **normal forms**.

### First Normal Form (1NF)

A table is in 1NF when:
1. Each cell contains a **single value** (atomic).
2. Each column contains values of the **same type**.
3. Each row is **unique** (has a primary key).

**Bad (not 1NF):**
```
| student_id | name   | courses           |
|------------|--------|-------------------|
| 1          | Alice  | Math, Science     |
| 2          | Bob    | History, Math     |
```

**Good (1NF):**
```
| student_id | name   | course   |
|------------|--------|----------|
| 1          | Alice  | Math     |
| 1          | Alice  | Science  |
| 2          | Bob    | History  |
| 2          | Bob    | Math     |
```

> [!NOTE]
> Multi-valued columns violate 1NF. If you're tempted to store a list in one cell, you need a separate table or a junction table.

### Second Normal Form (2NF)

A table is in 2NF when:
1. It is in 1NF.
2. Every non-key column depends on the **whole** primary key (not just part of it).

**Bad (composite key `order_id, product_id`):**
```
| order_id | product_id | product_name | quantity |
```
`product_name` depends only on `product_id`, not the whole key.

**Good:**
```
order_items:      products:
| order_id | product_id | qty |    | product_id | product_name |
```

### Third Normal Form (3NF)

A table is in 3NF when:
1. It is in 2NF.
2. No non-key column depends on another non-key column (no transitive dependencies).

**Bad:**
```
| employee_id | department_id | department_name |
```
`department_name` depends on `department_id`, not on `employee_id`.

**Good:**
```
employees:              departments:
| emp_id | dept_id |    | dept_id | dept_name |
```

> [!SUCCESS]
> In practice, most databases aim for **3NF**. Beyond 3NF (BCNF, 4NF, 5NF) is rarely needed for typical applications.

## Choosing SQL Data Types

Picking the right data type affects storage, performance, and correctness.

| Data | Recommended Type | Why |
|------|----------------|-----|
| Person name | `VARCHAR(100)` | Variable-length, capped |
| Email | `VARCHAR(255)` | RFC-compliant max length |
| Age | `INTEGER` or `SMALLINT` | Whole number, small range |
| Price | `DECIMAL(10,2)` | Exact precision, no rounding |
| Description | `TEXT` | Unlimited length |
| Date of birth | `DATE` | Date-only type |
| Created timestamp | `TIMESTAMP` | Date + time with timezone |
| Boolean flag | `BOOLEAN` / `TINYINT(1)` | True/false values |
| UUID | `CHAR(36)` or `UUID` type | Fixed format |

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Denormalization (When to Break the Rules)

Sometimes you intentionally **denormalize** for performance:

- **Reporting tables**: Pre-joined data for dashboards
- **Read-heavy APIs**: Store a copy of a frequently accessed field
- **Caching**: Avoid expensive joins on hot paths

> [!WARNING]
> Denormalization introduces redundancy and update anomalies. Only do it after you measure and prove a performance need. Premature denormalization is a common beginner mistake.

## Real-World Use Case: Blog Platform

Tables needed:

- `authors(id, name, email, bio)`
- `posts(id, author_id, title, body, published_at)`
- `categories(id, name, slug)`
- `post_categories(post_id, category_id)` — junction table
- `comments(id, post_id, author_name, body, created_at)`

```sql
-- Find all posts by author "Alice" in category "SQL"
SELECT p.title, p.published_at
FROM posts p
JOIN authors a ON p.author_id = a.id
JOIN post_categories pc ON p.id = pc.post_id
JOIN categories c ON pc.category_id = c.id
WHERE a.name = 'Alice' AND c.name = 'SQL';
```

## Designing a Table: Step by Step

Let's design a table for an e-commerce `products` table from scratch:

1. **Identify the entity**: A product.
2. **List attributes**: Name, description, price, category, SKU, stock count, image URL, created date.
3. **Choose data types**:
   - `name` → `VARCHAR(200)` NOT NULL
   - `description` → `TEXT`
   - `price` → `DECIMAL(10,2)` NOT NULL
   - `category` → `VARCHAR(100)` (or a foreign key to `categories`)
   - `sku` → `VARCHAR(50)` UNIQUE
   - `stock` → `INTEGER` DEFAULT 0
   - `image_url` → `VARCHAR(500)`
   - `created_at` → `TIMESTAMP` DEFAULT CURRENT_TIMESTAMP
4. **Identify keys**: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `sku VARCHAR(50) UNIQUE`.
5. **Add constraints**: `CHECK (price > 0)`, `CHECK (stock >= 0)`.
6. **Consider relationships**: Foreign key to `categories(id)`.

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    category_id INTEGER,
    sku VARCHAR(50) UNIQUE NOT NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## Normalization Example: Full Walkthrough

Start with one big denormalized table:

```
orders (order_id, customer_name, customer_email, customer_phone,
        product_name, product_price, product_category, order_date, quantity)
```

### Step 1: Apply 1NF

Already in 1NF (all atomic values). But there's redundancy.

### Step 2: Apply 2NF

Identify partial dependencies. If `product_name` depends only on `product_id` (not on the full order), split it out:

```
order_items (order_id, product_id, quantity)
products (id, name, price, category)
orders (id, customer_name, customer_email, customer_phone, order_date)
```

### Step 3: Apply 3NF

Identify transitive dependencies. `customer_phone` depends on `customer_name` (not on `order_id`). Split it out:

```
orders (id, customer_id, order_date)
customers (id, name, email, phone)
order_items (order_id, product_id, quantity)
products (id, name, price, category_id)
categories (id, name)
```

The result: 5 tables, zero redundancy, clear relationships.

> [!SUCCESS]
> Good design is invisible — you only notice it when it's missing. Take time to plan before you write a single CREATE TABLE.

## Practice Questions

1. What three problems does normalization solve?
2. Describe 1NF, 2NF, and 3NF in your own words.
3. A table has columns `(order_id, product_id, product_name, quantity)` with a composite primary key of `(order_id, product_id)`. Which normal form is violated? Why?
4. Draw a simple ER diagram for a school where students enroll in courses and teachers teach courses.
5. What data type would you use for a product price? Why not FLOAT?
6. When would you intentionally denormalize a database?
7. Suppose a table has `(student_id, advisor_name, advisor_phone)`. Each student has one advisor. What normal form issue exists?
8. What is a junction table, and when is it needed?
9. Convert this denormalized table to 3NF: `(order_id, customer_name, customer_email, product_name, product_price)`
10. Why is `VARCHAR(255)` a common choice for email columns?
