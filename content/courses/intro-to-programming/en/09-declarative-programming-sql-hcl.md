---
title: "Declarative Programming: SQL and HCL"
description: "Learn the declarative paradigm: describe what you want, not how to get it — using SQL and HCL"
order: 9
duration: "35 minutes"
difficulty: "intermediate"
---

# Declarative Programming: SQL and HCL

Every programming paradigm you have seen so far is **imperative**: you write step-by-step instructions describing exactly how to achieve a result. **Declarative programming** flips this: you describe the desired outcome, and the system figures out how to get there.

## Imperative vs Declarative

**Imperative** (how):

```javascript
// Step by step: how to find users over 18
let result = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].age >= 18) {
    result.push(users[i]);
  }
}
```

**Declarative** (what):

```sql
-- Describe what you want, not how
SELECT * FROM users WHERE age >= 18;
```

You do not tell the database how to iterate, filter, or collect results. You just state what you need.

## SQL: Structured Query Language

SQL is the most widely used declarative language. It lets you query, insert, update, and delete data in relational databases.

### SELECT — Retrieving Data

```sql
SELECT name, age FROM users;
```

This returns the `name` and `age` columns for every row in the `users` table.

### WHERE — Filtering Rows

```sql
SELECT * FROM products
WHERE price < 50 AND category = 'Electronics';
```

### ORDER BY — Sorting

```sql
SELECT name, salary FROM employees
ORDER BY salary DESC;
```

### JOIN — Combining Tables

Data is often spread across multiple tables. `JOIN` connects them:

```sql
SELECT orders.id, customers.name, orders.total
FROM orders
JOIN customers ON orders.customer_id = customers.id
WHERE orders.total > 100;
```

This query answers: "Which customers placed orders over $100 and what were the amounts?" — without writing a single loop.

### INSERT, UPDATE, DELETE

```sql
-- Add a new record
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');

-- Update existing records
UPDATE users SET age = 31 WHERE name = 'Alice';

-- Remove records
DELETE FROM users WHERE age < 18;
```

> [!NOTE]
> SQL is declarative at the statement level, but behind the scenes the database engine creates an execution plan — it decides the optimal way to run your query.

## HCL: HashiCorp Configuration Language

HCL is used by Terraform, a tool for managing infrastructure as code. You declare what infrastructure you want, and Terraform creates it.

### Terraform Example

```hcl
# Declare an AWS EC2 instance
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "WebServer"
  }
}
```

This defines a virtual machine: the AMI (image), the instance size, and tags. You do not write code to call cloud APIs, handle errors, or check state — Terraform handles all of that.

### Variables and Outputs

```hcl
variable "region" {
  description = "AWS region"
  default     = "us-east-1"
}

resource "aws_instance" "server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
}

output "public_ip" {
  value = aws_instance.server.public_ip
}
```

### The Declarative Advantage

With Terraform, your infrastructure configuration is:
- **Version-controlled** — stored in Git alongside your code
- **Repeatable** — same config produces same infrastructure
- **Self-documenting** — the config file describes exactly what exists
- **Idempotent** — running it again makes no changes if nothing is out of date

## Practice Exercise

Write SQL queries for an online store database:

```sql
-- 1. Find all products under $50
SELECT name, price FROM products WHERE price < 50;

-- 2. List orders placed in 2024 with customer names
SELECT customers.name, orders.date, orders.total
FROM orders
JOIN customers ON orders.customer_id = customers.id
WHERE orders.date >= '2024-01-01' AND orders.date < '2025-01-01'
ORDER BY orders.total DESC;

-- 3. Show how many products are in each category
SELECT category, COUNT(*) AS product_count
FROM products
GROUP BY category
ORDER BY product_count DESC;
```

## Summary

| Concept | Imperative | Declarative |
|---------|------------|-------------|
| Focus | How to do it | What to get |
| SQL example | Loop + filter | `SELECT ... WHERE` |
| Infrastructure | API calls + scripts | `resource "type" "name" { }` |
| Key benefit | Full control | Simplicity, readability, idempotence |

## Next Steps

You have now completed the course. You learned the fundamentals of programming — variables, functions, control flow, and data structures — and explored three major paradigms: functional (Python), compiled (Rust), and declarative (SQL/HCL). Keep practicing and building!
