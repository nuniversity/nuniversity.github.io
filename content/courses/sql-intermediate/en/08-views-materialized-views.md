---
title: "Views and Materialized Views"
description: "Master CREATE VIEW, updatable views, WITH CHECK OPTION, materialized views, and refresh strategies"
order: 8
duration: "45 minutes"
difficulty: "intermediate"
---

# Views and Materialized Views

A view is a saved query that behaves like a virtual table. A materialized view stores the query results physically. Both simplify complex queries and add a layer of abstraction.

## Creating Views

```sql
CREATE VIEW active_customers AS
SELECT
    customer_id,
    first_name,
    last_name,
    email,
    created_at
FROM customers
WHERE status = 'active'
  AND deleted_at IS NULL;
```

Once created, query it like a table:

```sql
SELECT * FROM active_customers
WHERE created_at >= '2024-01-01'
ORDER BY last_name;
```

> [!NOTE]
> A view is just a stored query. It has no data of its own — every query against a view runs the underlying SELECT. Tables referenced in a view are called base tables.

### Why Use Views?

| Benefit | Description |
|---------|-------------|
| Simplification | Encapsulate complex JOINs and aggregations |
| Security | Restrict access to specific columns or rows |
| Consistency | Standardize queries across the organization |
| Abstraction | Shield users from schema changes |
| Reusability | Write once, query many times |

```sql
-- Business-friendly view
CREATE VIEW monthly_sales_report AS
SELECT
    d.department_name,
    EXTRACT(YEAR FROM o.order_date) AS year,
    EXTRACT(MONTH FROM o.order_date) AS month,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(oi.quantity * oi.unit_price) AS total_revenue
FROM departments d
INNER JOIN employees e ON d.department_id = e.department_id
INNER JOIN orders o ON e.employee_id = o.sales_rep_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY d.department_name, year, month;
```

## Updatable Views

Simple views can support INSERT, UPDATE, and DELETE. The view must meet certain conditions:

```sql
-- Updatable view: single table, no aggregation
CREATE VIEW active_products AS
SELECT product_id, product_name, price, category_id
FROM products
WHERE discontinued = false;

-- These modify the underlying products table
INSERT INTO active_products (product_name, price, category_id)
VALUES ('Widget Pro', 29.99, 1);

UPDATE active_products
SET price = 24.99
WHERE product_id = 101;

DELETE FROM active_products
WHERE product_id = 101;
```

A view is updatable when:
- It references a single base table (no JOINs)
- It doesn't use DISTINCT, GROUP BY, HAVING, or window functions
- It doesn't use set operations (UNION, INTERSECT, EXCEPT)
- It doesn't use aggregate functions

> [!WARNING]
| Non-Updatable Pattern | Reason |
|-----------------------|--------|
| `CREATE VIEW v AS SELECT ... FROM a JOIN b` | Multiple base tables |
| `CREATE VIEW v AS SELECT DISTINCT ...` | Cannot map back to single row |
| `CREATE VIEW v AS SELECT SUM(...)` | Aggregate — no row identity |
| `CREATE VIEW v AS SELECT ... UNION ...` | Multiple sources |

## WITH CHECK OPTION

WITH CHECK OPTION prevents INSERTs and UPDATEs that would make rows disappear from the view.

```sql
CREATE VIEW high_value_orders AS
SELECT order_id, customer_id, total, order_date
FROM orders
WHERE total >= 1000
WITH CHECK OPTION;

-- This works:
INSERT INTO high_value_orders (order_id, customer_id, total, order_date)
VALUES (1001, 42, 1500.00, '2024-01-15');

-- This FAILS (total < 1000 would make row invisible):
INSERT INTO high_value_orders (order_id, customer_id, total, order_date)
VALUES (1002, 42, 500.00, '2024-01-15');
-- ERROR: new row violates WITH CHECK OPTION for view "high_value_orders"
```

| Option | Behavior |
|--------|----------|
| `WITH CHECK OPTION` | Rejects changes that violate the view's WHERE clause |
| `WITH CASCADED CHECK OPTION` | Applies to all underlying views (default) |
| `WITH LOCAL CHECK OPTION` | Applies only to current view |

## Materialized Views

Materialized views store the query result physically. They trade freshness for speed.

```sql
-- PostgreSQL / Oracle / Snowflake
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT
    order_date,
    product_id,
    SUM(quantity) AS units_sold,
    SUM(quantity * unit_price) AS revenue
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
GROUP BY order_date, product_id
WITH DATA;
```

```sql
-- Query a materialized view (fast — data is pre-computed)
SELECT * FROM daily_sales_summary
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';
```

### Refreshing Materialized Views

Unlike regular views, materialized views become stale and must be refreshed.

```sql
-- PostgreSQL: replace all data
REFRESH MATERIALIZED VIEW daily_sales_summary;

-- PostgreSQL: concurrent refresh (non-blocking for readers)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
```

| Refresh Strategy | Behavior | Table Locking | Requires Unique Index |
|-----------------|----------|--------------|----------------------|
| Standard | Replace all data | Blocks reads | No |
| Concurrent | Replace incrementally | Non-blocking | Yes |
| Scheduled (cron) | Refresh at intervals | Depends | Depends |
| Trigger-based | Refresh on data change | Variable | No |

> [!NOTE]
> `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index on the materialized view. It creates a temporary version and swaps it in, allowing reads during the refresh.

### Refresh Strategies

```sql
-- 1. Scheduled with cron/pg_cron
SELECT cron.schedule('refresh-sales', '0 6 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary'
);

-- 2. Manual refresh after ETL
-- (in your pipeline script)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;

-- 3. Trigger-based (PostgreSQL function)
CREATE FUNCTION refresh_sales_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_sales
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT EXECUTE FUNCTION refresh_sales_view();
```

> [!WARNING]
> Trigger-based refreshes on every write can destroy performance. Use scheduled refreshes unless you need near-real-time data and have low write volume.

## Views vs Materialized Views

| Aspect | View | Materialized View |
|--------|------|-------------------|
| Storage | None (query only) | Stores data on disk |
| Speed | Slower (runs query each time) | Fast (pre-computed) |
| Freshness | Always current | Stale until refreshed |
| Indexable | No | Yes |
| Space | None | Uses disk space |
| Updatable | Sometimes | No (refresh only) |

```sql
-- When to use each

-- Regular view: always-fresh, simple abstraction
CREATE VIEW current_employee_details AS
SELECT e.*, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- Materialized view: complex aggregation, query performance critical
CREATE MATERIALIZED VIEW monthly_category_revenue AS
SELECT
    c.category_name,
    DATE_TRUNC('month', o.order_date) AS month,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM categories c
INNER JOIN products p ON c.category_id = p.category_id
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
GROUP BY c.category_name, month;
```

## Real-World Example: Reporting Layer

```sql
-- 1. Base views for security
CREATE VIEW customer_safe AS
SELECT customer_id, first_name, last_name, country
FROM customers;  -- excludes email, phone, ssn

-- 2. Aggregated materialized views for dashboards
CREATE MATERIALIZED VIEW dashboard_kpi AS
SELECT
    COUNT(DISTINCT o.customer_id) AS active_customers,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total) AS total_revenue,
    AVG(o.total) AS avg_order_value,
    MAX(o.order_date) AS last_order_date
FROM orders o
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
WITH DATA;

-- 3. Refresh in off-peak hours
-- Schedule: REFRESH MATERIALIZED VIEW dashboard_kpi at 3 AM daily
```

> [!SUCCESS]
> Views are for abstraction and security. Materialized views are for performance. Use regular views to simplify code and hide complexity. Use materialized views when you need fast access to pre-computed data and can tolerate some staleness.

## Practice Questions

1. What is a view? Does it store data?
2. Write a CREATE VIEW statement for `recent_orders` showing orders from the last 7 days.
3. When is a view updatable? What operations are supported?
4. What does WITH CHECK OPTION do? Write a query that would fail because of it.
5. What is a materialized view and how does it differ from a regular view?
6. Write a query that creates a materialized view summarizing total sales by product category.
7. What does `REFRESH MATERIALIZED VIEW CONCURRENTLY` do? When would you use it?
8. What is the trade-off between regular views and materialized views?
9. Write a regular view that hides sensitive columns (e.g., `salary`, `ssn`) from users.
10. Describe three strategies for refreshing materialized views. Which is best for near-real-time?
