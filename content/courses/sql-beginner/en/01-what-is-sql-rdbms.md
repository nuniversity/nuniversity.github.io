---
title: "What is SQL and Relational Databases?"
description: "Understand SQL, relational databases, tables, rows, columns, primary keys, and popular RDBMS like MySQL, PostgreSQL, and SQLite"
order: 1
duration: "20-30 minutes"
difficulty: "beginner"
---

# What is SQL and Relational Databases?

SQL (Structured Query Language) is the standard language for managing and querying data in relational database management systems (RDBMS). It lets you create, read, update, and delete data — often called CRUD operations.

## What is a Relational Database?

A relational database organizes data into **tables** (like spreadsheets) where each table stores information about one topic. Tables relate to each other through **keys**, eliminating redundancy while keeping data connected.

> [!NOTE]
> The relational model was invented by Edgar F. Codd at IBM in 1970. It revolutionized how we store and query data by separating logical structure from physical storage.

## Core Concepts

### Tables

A table is a collection of related data organized into rows and columns.

```
users
| id | name   | email              | age |
|----|--------|--------------------|-----|
| 1  | Alice  | alice@example.com  | 30  |
| 2  | Bob    | bob@example.com    | 25  |
| 3  | Carol  | carol@example.com  | 28  |
```

### Rows and Columns

- **Column**: A single field (attribute) of data, like `name` or `email`. Columns have a **data type** (text, number, date, etc.).
- **Row**: A single record in a table, representing one entity (one user, one product, etc.).

### Primary Key

A **primary key** uniquely identifies each row in a table. Every table should have one.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT
);
```

> [!SUCCESS]
> A good primary key is unique, never null, and never changes. Auto-incrementing integers are the most common choice.

### Foreign Key

A **foreign key** links rows across tables, creating relationships.

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    total DECIMAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Popular RDBMS Systems

| RDBMS | Type | Best For | License |
|-------|------|----------|---------|
| **PostgreSQL** | Object-relational | Advanced features, data integrity | Open Source |
| **MySQL** | Relational | Web apps, wide hosting support | Open Source |
| **SQLite** | Embedded | Mobile apps, local storage, prototyping | Public Domain |
| **SQL Server** | Relational | Enterprise Windows ecosystems | Commercial |
| **Oracle DB** | Relational | Large-scale enterprise | Commercial |

### When to Choose Which

- **SQLite**: Your project needs a lightweight, serverless database (mobile apps, small websites, development/testing).
- **PostgreSQL**: You need advanced features (JSON, full-text search, custom types, concurrent writes).
- **MySQL**: You want a widely-hosted, battle-tested web database (WordPress, e-commerce).
- **SQL Server / Oracle**: You work in an enterprise environment with existing licenses.

> [!WARNING]
> Although SQL is standardized, each RDBMS has its own dialect. `LIMIT` in MySQL/PostgreSQL is `TOP` in SQL Server and `ROWNUM` in Oracle. Stick to ANSI SQL when possible.

## Your First SQL Query

```sql
SELECT 'Hello, SQL World!' AS greeting;
```

This returns:
| greeting |
|----------|
| Hello, SQL World! |

## How Data Flows in an RDBMS

1. Client sends a SQL query (via app, CLI, or GUI).
2. Parser checks syntax and builds a parse tree.
3. Optimizer chooses the most efficient execution plan.
4. Executor runs the plan and fetches/updates data.
5. Results are sent back to the client.

## Real-World Use Case: E-Commerce Database

An online store might have tables like:

- `customers` — who buys
- `products` — what they buy
- `orders` — when they buy
- `order_items` — which products in each order
- `categories` — product grouping

Instead of storing customer name in every order, each `orders` row holds a `customer_id` foreign key. This avoids duplication and makes updates easy — change the address in one place.

```sql
-- Find all orders by customer Alice
SELECT o.id, o.order_date, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.name = 'Alice';
```

## SQL Statement Categories

| Category | Purpose | Examples |
|----------|---------|---------|
| **DDL** | Define structure | CREATE, ALTER, DROP |
| **DML** | Manipulate data | SELECT, INSERT, UPDATE, DELETE |
| **DCL** | Control access | GRANT, REVOKE |
| **TCL** | Manage transactions | COMMIT, ROLLBACK, SAVEPOINT |

> [!NOTE]
> Throughout this course, you will use **DML** the most. SELECT alone accounts for ~80% of all SQL written.

## Why Learn SQL?

- **Universal**: Every tech company uses a database. SQL is the gateway.
- **Stable**: SQL was invented in the 1970s and is still the #1 data language.
- **High impact**: A single query can analyze millions of rows in milliseconds.
- **Transferable**: Skills apply across MySQL, PostgreSQL, SQLite, BigQuery, Snowflake, and more.

> [!SUCCESS]
> SQL is not just for engineers. Data analysts, product managers, marketers, and designers all benefit from querying data directly.

## SQL in the Real World

SQL isn't just for backend engineers. Here's how different roles use it:

| Role | What They Query | Why |
|------|----------------|-----|
| **Data Analyst** | Sales, user behavior, funnels | Generate reports and dashboards |
| **Product Manager** | Feature adoption, retention | Make data-informed product decisions |
| **Marketing** | Campaign performance, segments | Optimize ad spend and targeting |
| **Engineer** | Application data, logs, metrics | Build features and debug issues |
| **Finance** | Revenue, costs, forecasts | Close books and plan budgets |

### Example: Marketing Query

```sql
-- Find the top 5 marketing channels by conversion rate
SELECT
    channel,
    COUNT(DISTINCT user_id) AS visitors,
    COUNT(DISTINCT CASE WHEN purchased THEN user_id END) AS buyers,
    ROUND(COUNT(DISTINCT CASE WHEN purchased THEN user_id END) * 100.0 /
          COUNT(DISTINCT user_id), 2) AS conversion_pct
FROM campaign_data
WHERE campaign_date >= '2024-01-01'
GROUP BY channel
ORDER BY conversion_pct DESC
LIMIT 5;
```

## Setting Up Your Environment

To practice SQL locally, choose one:

1. **SQLite** (easiest): Install `sqlite3` and open a `.db` file.
2. **PostgreSQL**: Install, run `psql`, create a database.
3. **MySQL**: Install, run `mysql -u root -p`.
4. **Online**: Use SQLFiddle, DB Fiddle, or SQLite Online.

```bash
# SQLite — zero setup required
sqlite3 test.db
```

```sql
-- Create a table and query it immediately
CREATE TABLE hello (message TEXT);
INSERT INTO hello VALUES ('SQL works!');
SELECT * FROM hello;
```

## Common SQL Mistakes Beginners Make

- **Forgetting the semicolon**: SQL statements need a `;` at the end
- **Using `=` instead of `IS NULL`**: `WHERE name = NULL` never works
- **Mixing single and double quotes**: SQL uses single quotes for strings
- **Omitting WHERE in DELETE/UPDATE**: Accidental mass deletion
- **SELECT ***: Returns unnecessary data and breaks on schema changes

> [!WARNING]
> Always test your queries on a copy of the data first. A runaway UPDATE or DELETE on production data can cause irreversible damage.

## Practice Questions

1. What does SQL stand for?
2. Name three popular RDBMS systems and one use case for each.
3. What is the difference between a primary key and a foreign key?
4. In the table `employees(id, name, department_id, salary)`, which column is likely the primary key? Which is a foreign key?
5. What are the four categories of SQL statements?
6. Why is SQLite considered "serverless"?
7. True or False: SQL is identical across all database systems.
8. Why should an e-commerce database use foreign keys instead of storing customer names in every order row?
9. What does the SQL optimizer do?
10. List five industries or roles where SQL skills are valuable.
