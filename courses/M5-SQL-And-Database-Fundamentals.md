----
Title: SQL and Database Fundamentals
Description: Advanced SQL concepts, database design principles, and practical implementation using SQLite and PostgreSQL. You'll master query optimization techniques and build real-world data engineering solutions through hands-on projects.
Field: Computer Sciences
---

# SQL and Database Fundamentals

Advanced SQL concepts, database design principles, and practical implementation using SQLite and PostgreSQL. You'll master query optimization techniques and build real-world data engineering solutions through hands-on projects.

---

## Advanced SQL Concepts

### 1 Complex Joins

Joins are fundamental operations that combine rows from two or more tables based on related columns. Understanding when and how to use different join types is crucial for effective data analysis.

#### INNER JOIN

An INNER JOIN returns only the rows where there is a match in both tables.

```
-- Basic INNER JOIN
SELECT 
    customers.customer_name,
    orders.order_date,
    orders.total_amount
FROM customers
INNER JOIN orders ON customers.customer_id = orders.customer_id;

-- Multiple INNER JOINs
SELECT 
    c.customer_name,
    o.order_date,
    p.product_name,
    oi.quantity,
    oi.unit_price
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id;
```

**Use case:** Finding customers who have placed orders, excluding customers without orders.

#### LEFT JOIN (LEFT OUTER JOIN)

A LEFT JOIN returns all rows from the left table and matched rows from the right table. If no match exists, NULL values are returned for right table columns.

```
-- Find all customers and their orders (including customers without orders)
SELECT 
    c.customer_name,
    c.email,
    o.order_id,
    o.order_date,
    COALESCE(o.total_amount, 0) as total_amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;

-- Find customers who have never placed an order
SELECT 
    c.customer_name,
    c.email
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;
```

**Use case:** Identifying gaps in data, such as customers without orders or products never sold.

#### RIGHT JOIN (RIGHT OUTER JOIN)

A RIGHT JOIN returns all rows from the right table and matched rows from the left table. Less commonly used than LEFT JOIN, as you can rewrite it as a LEFT JOIN by switching table positions.

```
-- All orders with customer information (if available)
SELECT 
    o.order_id,
    o.order_date,
    c.customer_name
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;
```

#### FULL OUTER JOIN

A FULL OUTER JOIN returns all rows when there is a match in either table. Rows without matches show NULL values for the non-matching table's columns.

```
-- Find all customers and orders, including unmatched records from both tables
SELECT 
    COALESCE(c.customer_id, o.customer_id) as customer_id,
    c.customer_name,
    o.order_id,
    o.order_date
FROM customers c
FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;
```

**Note:** SQLite does not support FULL OUTER JOIN natively. You can simulate it using UNION:

```
SELECT c.customer_id, c.customer_name, o.order_id
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
UNION
SELECT o.customer_id, c.customer_name, o.order_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id;
```

#### CROSS JOIN

A CROSS JOIN produces a Cartesian product of two tables, combining each row from the first table with every row from the second table.

```
-- Generate all possible combinations of products and warehouses
SELECT 
    p.product_name,
    w.warehouse_name,
    w.location
FROM products p
CROSS JOIN warehouses w;

-- Practical use: Generate date series with dimension tables
SELECT 
    d.date,
    c.category_name
FROM date_dimension d
CROSS JOIN categories c
WHERE d.date BETWEEN '2024-01-01' AND '2024-12-31';
```

**Use case:** Generating all possible combinations for analysis, creating calendar tables, or filling in missing data points.

#### Self Joins

A self join is when a table is joined with itself, useful for hierarchical data or comparing rows within the same table.

```
-- Employee hierarchy: Find employees and their managers
SELECT 
    e.employee_name AS employee,
    m.employee_name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;

-- Find products in the same category
SELECT 
    p1.product_name AS product1,
    p2.product_name AS product2,
    p1.category
FROM products p1
INNER JOIN products p2 
    ON p1.category = p2.category 
    AND p1.product_id < p2.product_id;
```

### 3.1.2 Subqueries and CTEs

#### Subqueries

Subqueries are queries nested within another query. They can appear in SELECT, FROM, WHERE, or HAVING clauses.

**Scalar Subqueries** (return a single value):

```
-- Find customers who spent more than the average
SELECT 
    customer_name,
    total_spent
FROM (
    SELECT 
        c.customer_name,
        SUM(o.total_amount) as total_spent
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_name
) customer_totals
WHERE total_spent > (
    SELECT AVG(total_amount)
    FROM orders
);
```

**Correlated Subqueries** (reference columns from outer query):

```
-- Find products priced higher than their category average
SELECT 
    product_name,
    category,
    price
FROM products p1
WHERE price > (
    SELECT AVG(price)
    FROM products p2
    WHERE p2.category = p1.category
);
```

**EXISTS Subqueries** (check for existence):

```
-- Find customers who have placed orders in the last 30 days
SELECT customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
);
```

**IN Subqueries**:

```
-- Find products that have never been ordered
SELECT product_name
FROM products
WHERE product_id NOT IN (
    SELECT DISTINCT product_id
    FROM order_items
);
```

#### Common Table Expressions (CTEs)

CTEs provide a way to write more readable and maintainable queries by defining temporary named result sets.

**Basic CTE:**

```
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', order_date) as month,
        SUM(total_amount) as total_sales
    FROM orders
    GROUP BY DATE_TRUNC('month', order_date)
)
SELECT 
    month,
    total_sales,
    LAG(total_sales) OVER (ORDER BY month) as prev_month_sales,
    total_sales - LAG(total_sales) OVER (ORDER BY month) as sales_change
FROM monthly_sales
ORDER BY month;
```

**Multiple CTEs:**

```
WITH 
customer_orders AS (
    SELECT 
        customer_id,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent
    FROM orders
    GROUP BY customer_id
),
customer_segments AS (
    SELECT 
        customer_id,
        CASE 
            WHEN total_spent > 10000 THEN 'Premium'
            WHEN total_spent > 5000 THEN 'Gold'
            WHEN total_spent > 1000 THEN 'Silver'
            ELSE 'Bronze'
        END as segment
    FROM customer_orders
)
SELECT 
    c.customer_name,
    co.order_count,
    co.total_spent,
    cs.segment
FROM customers c
JOIN customer_orders co ON c.customer_id = co.customer_id
JOIN customer_segments cs ON c.customer_id = cs.customer_id
ORDER BY co.total_spent DESC;
```

**Recursive CTEs:**

Recursive CTEs allow you to work with hierarchical or graph-like data structures.

```
-- Generate a date series
WITH RECURSIVE date_series AS (
    SELECT DATE('2024-01-01') as date
    UNION ALL
    SELECT date + INTERVAL '1 day'
    FROM date_series
    WHERE date < DATE('2024-12-31')
)
SELECT date FROM date_series;

-- Employee hierarchy traversal
WITH RECURSIVE employee_hierarchy AS (
    -- Anchor member: top-level employees (no manager)
    SELECT 
        employee_id,
        employee_name,
        manager_id,
        1 as level,
        CAST(employee_name AS VARCHAR(1000)) as path
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive member: employees with managers
    SELECT 
        e.employee_id,
        e.employee_name,
        e.manager_id,
        eh.level + 1,
        eh.path || ' -> ' || e.employee_name
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy
ORDER BY level, employee_name;
```

### 3.1.3 Window Functions

Window functions perform calculations across a set of rows related to the current row, without collapsing rows like aggregate functions do.

#### ROW_NUMBER()

Assigns a unique sequential integer to rows within a partition.

```
-- Assign row numbers to orders for each customer
SELECT 
    customer_id,
    order_id,
    order_date,
    total_amount,
    ROW_NUMBER() OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) as order_sequence
FROM orders;

-- Find the most recent order for each customer
WITH ranked_orders AS (
    SELECT 
        customer_id,
        order_id,
        order_date,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id 
            ORDER BY order_date DESC
        ) as rn
    FROM orders
)
SELECT customer_id, order_id, order_date
FROM ranked_orders
WHERE rn = 1;
```

#### RANK() and DENSE_RANK()

RANK() assigns ranks with gaps for ties, while DENSE_RANK() assigns ranks without gaps.

```
-- Rank products by sales within each category
SELECT 
    category,
    product_name,
    total_sales,
    RANK() OVER (
        PARTITION BY category 
        ORDER BY total_sales DESC
    ) as rank,
    DENSE_RANK() OVER (
        PARTITION BY category 
        ORDER BY total_sales DESC
    ) as dense_rank
FROM (
    SELECT 
        p.category,
        p.product_name,
        SUM(oi.quantity * oi.unit_price) as total_sales
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY p.category, p.product_name
) product_sales
ORDER BY category, total_sales DESC;
```

#### LAG() and LEAD()

LAG() accesses data from a previous row, while LEAD() accesses data from a subsequent row.

```
-- Calculate sales growth month over month
SELECT 
    month,
    total_sales,
    LAG(total_sales) OVER (ORDER BY month) as prev_month_sales,
    total_sales - LAG(total_sales) OVER (ORDER BY month) as absolute_change,
    ROUND(
        100.0 * (total_sales - LAG(total_sales) OVER (ORDER BY month)) / 
        LAG(total_sales) OVER (ORDER BY month), 
        2
    ) as percent_change
FROM (
    SELECT 
        DATE_TRUNC('month', order_date) as month,
        SUM(total_amount) as total_sales
    FROM orders
    GROUP BY DATE_TRUNC('month', order_date)
) monthly_sales
ORDER BY month;

-- Find time between consecutive orders for each customer
SELECT 
    customer_id,
    order_date,
    LEAD(order_date) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) as next_order_date,
    LEAD(order_date) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) - order_date as days_until_next_order
FROM orders;
```

#### Other Useful Window Functions

**NTILE()**: Divides rows into a specified number of groups.

```
-- Divide customers into quartiles by total spending
SELECT 
    customer_id,
    customer_name,
    total_spent,
    NTILE(4) OVER (ORDER BY total_spent DESC) as spending_quartile
FROM (
    SELECT 
        c.customer_id,
        c.customer_name,
        COALESCE(SUM(o.total_amount), 0) as total_spent
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.customer_name
) customer_spending;
```

**FIRST_VALUE() and LAST_VALUE()**:

```
-- Compare each sale to the first and last sale of the day
SELECT 
    order_date,
    order_id,
    total_amount,
    FIRST_VALUE(total_amount) OVER (
        PARTITION BY order_date 
        ORDER BY order_id
    ) as first_sale_of_day,
    LAST_VALUE(total_amount) OVER (
        PARTITION BY order_date 
        ORDER BY order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as last_sale_of_day
FROM orders;
```

**Running totals and moving averages:**

```
-- Calculate running total and 7-day moving average
SELECT 
    order_date,
    daily_sales,
    SUM(daily_sales) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as running_total,
    AVG(daily_sales) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7day
FROM (
    SELECT 
        order_date,
        SUM(total_amount) as daily_sales
    FROM orders
    GROUP BY order_date
) daily_totals
ORDER BY order_date;
```

### 3.1.4 Aggregate Functions and GROUP BY with HAVING

#### Common Aggregate Functions

```
-- Basic aggregation
SELECT 
    category,
    COUNT(*) as product_count,
    COUNT(DISTINCT supplier_id) as supplier_count,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    SUM(stock_quantity) as total_stock,
    STDDEV(price) as price_stddev
FROM products
GROUP BY category;
```

#### GROUP BY with Multiple Columns

```
-- Sales summary by year, quarter, and category
SELECT 
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(QUARTER FROM order_date) as quarter,
    p.category,
    COUNT(DISTINCT o.order_id) as order_count,
    SUM(oi.quantity) as units_sold,
    SUM(oi.quantity * oi.unit_price) as revenue
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY 
    EXTRACT(YEAR FROM order_date),
    EXTRACT(QUARTER FROM order_date),
    p.category
ORDER BY year, quarter, category;
```

#### HAVING Clause

HAVING filters grouped results, similar to WHERE but applied after aggregation.

```
-- Find categories with average price above $50 and more than 10 products
SELECT 
    category,
    COUNT(*) as product_count,
    AVG(price) as avg_price,
    SUM(stock_quantity) as total_stock
FROM products
GROUP BY category
HAVING 
    AVG(price) > 50 
    AND COUNT(*) > 10
ORDER BY avg_price DESC;

-- Find customers who placed more than 5 orders totaling over $1000
SELECT 
    c.customer_id,
    c.customer_name,
    COUNT(o.order_id) as order_count,
    SUM(o.total_amount) as total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name
HAVING 
    COUNT(o.order_id) > 5 
    AND SUM(o.total_amount) > 1000
ORDER BY total_spent DESC;
```

#### GROUPING SETS, ROLLUP, and CUBE

These extensions provide multiple levels of aggregation in a single query.

**GROUPING SETS:**

```
-- Sales by different grouping combinations
SELECT 
    EXTRACT(YEAR FROM order_date) as year,
    category,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
GROUP BY GROUPING SETS (
    (year, category),  -- by year and category
    (year),            -- by year only
    (category),        -- by category only
    ()                 -- grand total
)
ORDER BY year, category;
```

**ROLLUP:**

```
-- Hierarchical aggregation: category -> subcategory -> product
SELECT 
    category,
    subcategory,
    product_name,
    SUM(sales_amount) as total_sales
FROM sales_data
GROUP BY ROLLUP (category, subcategory, product_name)
ORDER BY category, subcategory, product_name;
```

**CUBE:**

```
-- All possible combinations of dimensions
SELECT 
    region,
    product_category,
    year,
    SUM(revenue) as total_revenue
FROM sales
GROUP BY CUBE (region, product_category, year)
ORDER BY region, product_category, year;
```

### 3.1.5 Set Operations

Set operations combine results from multiple queries.

#### UNION and UNION ALL

UNION removes duplicates, while UNION ALL keeps all rows.

```
-- Combine current and archived orders
SELECT order_id, customer_id, order_date, 'current' as source
FROM orders_current
UNION ALL
SELECT order_id, customer_id, order_date, 'archived' as source
FROM orders_archived
ORDER BY order_date DESC;

-- Get all unique customer emails from multiple sources
SELECT email FROM customers
UNION
SELECT email FROM newsletter_subscribers
UNION
SELECT email FROM event_registrations;
```

#### INTERSECT

Returns only rows that appear in both result sets.

```
-- Find customers who are also employees
SELECT customer_id, email
FROM customers
INTERSECT
SELECT employee_id, email
FROM employees;

-- Products sold in both Q1 and Q2
SELECT product_id
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
WHERE EXTRACT(QUARTER FROM o.order_date) = 1
INTERSECT
SELECT product_id
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
WHERE EXTRACT(QUARTER FROM o.order_date) = 2;
```

#### EXCEPT (MINUS in Oracle)

Returns rows from the first query that don't appear in the second.

```
-- Find products never ordered
SELECT product_id, product_name
FROM products
EXCEPT
SELECT DISTINCT p.product_id, p.product_name
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id;

-- Customers who registered but never ordered
SELECT customer_id, customer_name
FROM customers
EXCEPT
SELECT c.customer_id, c.customer_name
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id;
```

---

## 3.2 Database Design

### 3.2.1 Normalization

Normalization is the process of organizing data to reduce redundancy and improve data integrity. It involves decomposing tables into smaller, well-structured tables.

#### First Normal Form (1NF)

**Rules:**
- Each column contains atomic (indivisible) values
- Each column contains values of a single type
- Each column has a unique name
- The order of rows doesn't matter

**Before 1NF:**
```
Orders Table:
order_id | customer_name | products
---------|---------------|----------------------------------
1        | John Smith    | Laptop, Mouse, Keyboard
2        | Jane Doe      | Monitor, HDMI Cable
```

**After 1NF:**
```
Orders Table:
order_id | customer_name | product
---------|---------------|----------
1        | John Smith    | Laptop
1        | John Smith    | Mouse
1        | John Smith    | Keyboard
2        | Jane Doe      | Monitor
2        | Jane Doe      | HDMI Cable
```

#### Second Normal Form (2NF)

**Rules:**
- Must be in 1NF
- All non-key attributes must be fully dependent on the entire primary key
- Eliminates partial dependencies

**Before 2NF:**
```
Order_Items Table (composite key: order_id, product_id):
order_id | product_id | product_name | unit_price | quantity | customer_name
---------|------------|--------------|------------|----------|---------------
1        | 101        | Laptop       | 999.99     | 1        | John Smith
1        | 102        | Mouse        | 29.99      | 2        | John Smith
```

Problems: `product_name` and `unit_price` depend only on `product_id`, not the full key. `customer_name` depends only on `order_id`.

**After 2NF:**
```
Orders Table:
order_id | customer_name
---------|---------------
1        | John Smith

Products Table:
product_id | product_name | unit_price
-----------|--------------|------------
101        | Laptop       | 999.99
102        | Mouse        | 29.99

Order_Items Table:
order_id | product_id | quantity
---------|------------|----------
1        | 101        | 1
1        | 102        | 2
```

#### Third Normal Form (3NF)

**Rules:**
- Must be in 2NF
- No transitive dependencies (non-key attributes should not depend on other non-key attributes)

**Before 3NF:**
```
Employees Table:
employee_id | employee_name | department_id | department_name | department_location
------------|---------------|---------------|-----------------|--------------------
1           | Alice         | 10            | Sales           | New York
2           | Bob           | 10            | Sales           | New York
3           | Carol         | 20            | IT              | San Francisco
```

Problem: `department_name` and `department_location` depend on `department_id`, not directly on `employee_id`.

**After 3NF:**
```
Employees Table:
employee_id | employee_name | department_id
------------|---------------|---------------
1           | Alice         | 10
2           | Bob           | 10
3           | Carol         | 20

Departments Table:
department_id | department_name | department_location
--------------|-----------------|--------------------
10            | Sales           | New York
20            | IT              | San Francisco
```

#### Boyce-Codd Normal Form (BCNF)

**Rules:**
- Must be in 3NF
- For every functional dependency X → Y, X must be a superkey

BCNF is a stricter version of 3NF that handles certain anomalies not addressed by 3NF.

**Example scenario:**

```
Course_Professor Table:
student_id | course_id | professor_id
-----------|-----------|-------------
1001       | CS101     | P1
1001       | CS102     | P2
1002       | CS101     | P1
```

If the rule is "each course is taught by only one professor," there's a functional dependency: `course_id → professor_id`, but `course_id` is not a superkey.

**After BCNF:**
```
Student_Course Table:
student_id | course_id
-----------|----------
1001       | CS101
1001       | CS102
1002       | CS101

Course_Professor Table:
course_id | professor_id
----------|-------------
CS101     | P1
CS102     | P2
```

### 3.2.2 Denormalization for Analytical Workloads

While normalization optimizes for transactional systems (OLTP), analytical workloads (OLAP) benefit from denormalization to reduce joins and improve query performance.

**When to denormalize:**
- Read-heavy workloads with complex joins
- Data warehouse and reporting systems
- When query performance is more important than storage efficiency
- Aggregated data for dashboards and reports

**Denormalization techniques:**

1. **Adding redundant columns:**
```
-- Instead of joining to get customer name on every query
CREATE TABLE orders_denormalized (
    order_id INT PRIMARY KEY,
    customer_id INT,
    customer_name VARCHAR(100),  -- Redundant
    customer_email VARCHAR(100), -- Redundant
    order_date DATE,
    total_amount DECIMAL(10,2)
);
```

2. **Precomputed aggregations:**
```
-- Materialized summary table
CREATE TABLE daily_sales_summary (
    sale_date DATE PRIMARY KEY,
    total_orders INT,
    total_revenue DECIMAL(12,2),
    total_items_sold INT,
    avg_order_value DECIMAL(10,2),
    unique_customers INT
);
```

3. **Flattened hierarchies:**
```
-- Instead of multiple joins through category hierarchy
CREATE TABLE products_flat (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(200),
    category_l1 VARCHAR(100),
    category_l2 VARCHAR(100),
    category_l3 VARCHAR(100),
    full_category_path VARCHAR(500)
);
```

### 3.2.3 Star Schema

The star schema is the simplest data warehouse schema, with a central fact table connected to dimension tables.

**Components:**

- **Fact Table:** Contains measurable, quantitative data (metrics)
- **Dimension Tables:** Contain descriptive attributes (context)

**Example: Retail Sales Star Schema**

```
-- Fact table: Sales transactions
CREATE TABLE fact_sales (
    sale_id BIGSERIAL PRIMARY KEY,
    date_key INT REFERENCES dim_date(date_key),
    product_key INT REFERENCES dim_product(product_key),
    customer_key INT REFERENCES dim_customer(customer_key),
    store_key INT REFERENCES dim_store(store_key),
    -- Measures/Metrics
    quantity INT,
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    sales_amount DECIMAL(12,2),
    cost_amount DECIMAL(12,2),
    profit_amount DECIMAL(12,2)
);

-- Dimension: Date
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,
    date DATE UNIQUE,
    day_of_week VARCHAR(10),
    day_of_month INT,
    month INT,
    month_name VARCHAR(10),
    quarter INT,
    year INT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

-- Dimension: Product
CREATE TABLE dim_product (
    product_key SERIAL PRIMARY KEY,
    product_id VARCHAR(50) UNIQUE,
    product_name VARCHAR(200),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    supplier VARCHAR(100)
);

-- Dimension: Customer
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE,
    customer_name VARCHAR(200),
    email VARCHAR(100),
    segment VARCHAR(50),
    region VARCHAR(100),
    country VARCHAR(100),
    signup_date DATE
);

-- Dimension: Store
CREATE TABLE dim_store (
    store_key SERIAL PRIMARY KEY,
    store_id VARCHAR(50) UNIQUE,
    store_name VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    region VARCHAR(100),
    store_type VARCHAR(50),
    opened_date DATE
);
```

**Advantages of Star Schema:**
- Simple and intuitive structure
- Optimized for read performance
- Easy to understand and navigate
- Efficient for BI tools and reporting
- Fewer joins required

**Query example:**
```
-- Monthly sales by category and region
SELECT 
    d.year,
    d.month_name,
    p.category,
    c.region,
    SUM(f.sales_amount) as total_sales,
    SUM(f.profit_amount) as total_profit,
    COUNT(DISTINCT f.customer_key) as unique_customers
FROM fact_sales f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
JOIN dim_customer c ON f.customer_key = c.customer_key
WHERE d.year = 2024
GROUP BY d.year, d.month_name, d.month, p.category, c.region
ORDER BY d.year, d.month, p.category;
```

### 3.2.4 Snowflake Schema

The snowflake schema is a normalized version of the star schema where dimension tables are normalized into multiple related tables.

**Example: Normalized Product Dimension**

```
-- Snowflake schema: Product dimension normalized
CREATE TABLE dim_product (
    product_key SERIAL PRIMARY KEY,
    product_id VARCHAR(50) UNIQUE,
    product_name VARCHAR(200),
    brand_key INT REFERENCES dim_brand(brand_key),
    subcategory_key INT REFERENCES dim_subcategory(subcategory_key)
);

CREATE TABLE dim_subcategory (
    subcategory_key SERIAL PRIMARY KEY,
    subcategory_name VARCHAR(100),
    category_key INT REFERENCES dim_category(category_key)
);

CREATE TABLE dim_category (
    category_key SERIAL PRIMARY KEY,
    category_name VARCHAR(100),
    department_key INT REFERENCES dim_department(department_key)
);

CREATE TABLE dim_department (
    department_key SERIAL PRIMARY KEY,
    department_name VARCHAR(100)
);

CREATE TABLE dim_brand (
    brand_key SERIAL PRIMARY KEY,
    brand_name VARCHAR(100),
    country_of_origin VARCHAR(100)
);
```

**Star vs. Snowflake:**

| Aspect | Star Schema | Snowflake Schema |
|--------|-------------|------------------|
| Structure | Denormalized dimensions | Normalized dimensions |
| Complexity | Simple | More complex |
| Query Performance | Faster (fewer joins) | Slower (more joins) |
| Storage | More redundancy | Less redundancy |
| Maintenance | Easier | More complex |
| Best for | Most data warehouses | When storage is critical |

### 3.2.5 Fact and Dimension Tables

#### Types of Fact Tables

**1. Transaction Fact Table**
Records individual events at the most granular level.

```
CREATE TABLE fact_orders (
    order_key BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50),
    date_key INT,
    customer_key INT,
    product_key INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2)
);
```

**2. Periodic Snapshot Fact Table**
Captures the state at regular intervals (daily, weekly, monthly).

```
CREATE TABLE fact_inventory_snapshot (
    snapshot_key BIGSERIAL PRIMARY KEY,
    date_key INT,
    product_key INT,
    warehouse_key INT,
    quantity_on_hand INT,
    quantity_reserved INT,
    quantity_available INT,
    reorder_point INT,
    unit_cost DECIMAL(10,2)
);
```

**3. Accumulating Snapshot Fact Table**
Tracks the lifecycle of a process with multiple milestones.

```
CREATE TABLE fact_order_fulfillment (
    order_key INT PRIMARY KEY,
    order_date_key INT,
    payment_date_key INT,
    shipment_date_key INT,
    delivery_date_key INT,
    customer_key INT,
    -- Measures
    order_amount DECIMAL(12,2),
    days_to_payment INT,
    days_to_shipment INT,
    days_to_delivery INT
);
```

**4. Factless Fact Table**
Records events without measures, tracking occurrences or relationships.

```
CREATE TABLE fact_student_attendance (
    attendance_key BIGSERIAL PRIMARY KEY,
    date_key INT,
    student_key INT,
    class_key INT,
    instructor_key INT
    -- No measures, just tracking the event
);
```

#### Dimension Table Best Practices

**Surrogate Keys:**
Use auto-incrementing integers instead of natural keys.

```
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,  -- Surrogate key
    customer_id VARCHAR(50) UNIQUE,   -- Natural key
    customer_name VARCHAR(200),
    -- other attributes
    effective_date DATE,
    expiration_date DATE,
    is_current BOOLEAN
);
```

**Handling Unknown/Missing Dimensions:**

```
-- Insert default "Unknown" records
INSERT INTO dim_customer (customer_key, customer_id, customer_name, is_current)
VALUES (0, 'UNKNOWN', 'Unknown Customer', TRUE);

INSERT INTO dim_product (product_key, product_id, product_name)
VALUES (0, 'UNKNOWN', 'Unknown Product');
```

**Conformed Dimensions:**
Dimensions shared across multiple fact tables ensure consistency.

```
-- Same dim_date used by multiple fact tables
CREATE TABLE fact_sales (..., date_key INT REFERENCES dim_date(date_key));
CREATE TABLE fact_inventory (..., date_key INT REFERENCES dim_date(date_key));
CREATE TABLE fact_shipments (..., date_key INT REFERENCES dim_date(date_key));
```

### 3.2.6 Slowly Changing Dimensions (SCD)

SCDs handle changes to dimension attributes over time.

#### Type 1: Overwrite

Simply update the record, losing historical data.

```
-- Customer changes address
UPDATE dim_customer
SET 
    address = '456 New St',
    city = 'Boston',
    state = 'MA'
WHERE customer_id = 'C12345';
```

**Use case:** Correcting data errors, tracking attributes that don't require history (e.g., fixing typos).

**Pros:** Simple, no storage overhead
**Cons:** No history preserved

#### Type 2: Add New Row

Create a new record with updated values, keeping historical records.

```
CREATE TABLE dim_customer_scd2 (
    customer_key SERIAL PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(200),
    email VARCHAR(100),
    segment VARCHAR(50),
    -- SCD Type 2 fields
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1
);

-- Initial insert
INSERT INTO dim_customer_scd2 
(customer_id, customer_name, email, segment, effective_date, expiration_date, is_current, version)
VALUES 
('C12345', 'John Doe', 'john@email.com', 'Silver', '2023-01-01', '9999-12-31', TRUE, 1);

-- Customer segment changes to Gold
-- Step 1: Expire the current record
UPDATE dim_customer_scd2
SET 
    expiration_date = '2024-06-30',
    is_current = FALSE
WHERE customer_id = 'C12345' AND is_current = TRUE;

-- Step 2: Insert new record
INSERT INTO dim_customer_scd2 
(customer_id, customer_name, email, segment, effective_date, expiration_date, is_current, version)
VALUES 
('C12345', 'John Doe', 'john@email.com', 'Gold', '2024-07-01', '9999-12-31', TRUE, 2);
```

**Querying SCD Type 2:**

```
-- Get current customer information
SELECT *
FROM dim_customer_scd2
WHERE customer_id = 'C12345' AND is_current = TRUE;

-- Get customer information as of a specific date
SELECT *
FROM dim_customer_scd2
WHERE 
    customer_id = 'C12345' 
    AND '2024-03-15' BETWEEN effective_date AND expiration_date;

-- Sales report with customer segment at time of sale
SELECT 
    d.date,
    c.customer_name,
    c.segment,
    SUM(f.sales_amount) as total_sales
FROM fact_sales f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_customer_scd2 c ON f.customer_key = c.customer_key
WHERE d.year = 2024
GROUP BY d.date, c.customer_name, c.segment;
```

**Use case:** Tracking historical changes for analysis (customer segments, product prices, employee departments).

**Pros:** Complete history preserved, can analyze trends over time
**Cons:** Increased storage, more complex queries

#### Type 3: Add New Column

Add columns to track previous values (limited history).

```
CREATE TABLE dim_product_scd3 (
    product_key SERIAL PRIMARY KEY,
    product_id VARCHAR(50) UNIQUE,
    product_name VARCHAR(200),
    current_price DECIMAL(10,2),
    previous_price DECIMAL(10,2),
    price_change_date DATE,
    current_category VARCHAR(100),
    previous_category VARCHAR(100),
    category_change_date DATE
);

-- Update when price changes
UPDATE dim_product_scd3
SET 
    previous_price = current_price,
    current_price = 89.99,
    price_change_date = CURRENT_DATE
WHERE product_id = 'P12345';
```

**Use case:** Tracking only the most recent change for comparison.

**Pros:** Simple queries, moderate storage
**Cons:** Limited history (usually only one previous value)

#### Hybrid Approach: Type 2 + Type 3

Combine approaches for different attributes.

```
CREATE TABLE dim_customer_hybrid (
    customer_key SERIAL PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(200),
    -- Type 1: Always current
    email VARCHAR(100),
    phone VARCHAR(20),
    -- Type 2: Full history
    address VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(50),
    effective_date DATE,
    expiration_date DATE,
    is_current BOOLEAN,
    -- Type 3: Track one change
    current_segment VARCHAR(50),
    previous_segment VARCHAR(50),
    segment_change_date DATE
);
```

---

## 3.3 SQLite

### 3.3.1 When to Use SQLite

SQLite is a lightweight, serverless, self-contained database engine ideal for specific use cases.

**Best use cases:**
- Embedded applications (mobile apps, desktop software)
- Local data storage and caching
- Prototyping and development
- Small to medium-sized websites (< 100K hits/day)
- Data analysis and ETL pipelines
- IoT devices and edge computing
- Testing and CI/CD pipelines
- File-based data interchange

**When NOT to use SQLite:**
- High-concurrency write operations
- Large-scale multi-user applications
- Distributed systems requiring replication
- When network access to database is needed
- Databases exceeding several hundred GB
- Applications requiring fine-grained access control

### 3.3.2 Creating and Managing Databases

**Installation:**
SQLite comes pre-installed on most systems. Check with:
```
sqlite3 --version
```

**Creating a database:**
```
# Create/open a database file
sqlite3 mydata.db

# Create an in-memory database (temporary)
sqlite3 :memory:
```

**Basic commands:**
```
-- In SQLite shell
.help                    -- Show all commands
.databases              -- List databases
.tables                 -- List tables
.schema table_name      -- Show table structure
.mode column            -- Set output mode
.headers on             -- Show column headers
.output results.txt     -- Redirect output to file
.quit                   -- Exit SQLite

-- Create a table
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    hire_date TEXT,
    salary REAL,
    department TEXT
);

-- Insert data
INSERT INTO employees (first_name, last_name, email, hire_date, salary, department)
VALUES 
    ('John', 'Doe', 'john.doe@company.com', '2023-01-15', 75000, 'Engineering'),
    ('Jane', 'Smith', 'jane.smith@company.com', '2023-02-01', 82000, 'Engineering'),
    ('Bob', 'Johnson', 'bob.j@company.com', '2023-03-10', 68000, 'Sales');

-- Query data
SELECT * FROM employees WHERE department = 'Engineering';
```

**Importing/Exporting data:**
```
# Import CSV
.mode csv
.import data.csv employees

# Export to CSV
.headers on
.mode csv
.output employees.csv
SELECT * FROM employees;
.output stdout

# Dump entire database
.output backup.sql
.dump
.output stdout

# Restore from dump
sqlite3 newdb.db < backup.sql
```

### 3.3.3 Transactions and ACID Properties

SQLite is fully ACID compliant (Atomicity, Consistency, Isolation, Durability).

**Transaction basics:**
```
-- Explicit transaction
BEGIN TRANSACTION;

INSERT INTO employees (first_name, last_name, email, hire_date, salary, department)
VALUES ('Alice', 'Williams', 'alice.w@company.com', '2024-01-10', 79000, 'Marketing');

UPDATE employees 
SET salary = salary * 1.05 
WHERE department = 'Engineering';

COMMIT;

-- Rollback on error
BEGIN TRANSACTION;

INSERT INTO employees (first_name, last_name, email, hire_date, salary, department)
VALUES ('Charlie', 'Brown', 'charlie@company.com', '2024-02-01', 72000, 'IT');

-- Something goes wrong...
ROLLBACK;
```

**ACID properties in SQLite:**

1. **Atomicity:** All operations in a transaction succeed or fail together
2. **Consistency:** Database remains in a valid state
3. **Isolation:** Concurrent transactions don't interfere (default: SERIALIZABLE)
4. **Durability:** Committed data persists even after crashes

**Transaction modes:**
```
-- Deferred (default): Locks acquired when first read/write
BEGIN DEFERRED TRANSACTION;

-- Immediate: Write lock acquired immediately
BEGIN IMMEDIATE TRANSACTION;

-- Exclusive: Exclusive lock, no other connections allowed
BEGIN EXCLUSIVE TRANSACTION;
```

**WAL mode (Write-Ahead Logging):**
Improves concurrency by allowing reads while writing.

```
-- Enable WAL mode
PRAGMA journal_mode = WAL;

-- Check current mode
PRAGMA journal_mode;
```

### 3.3.4 Indexes and Query Optimization

**Creating indexes:**
```
-- Single column index
CREATE INDEX idx_employees_email ON employees(email);

-- Multi-column index
CREATE INDEX idx_employees_dept_salary ON employees(department, salary);

-- Unique index
CREATE UNIQUE INDEX idx_employees_email_unique ON employees(email);

-- Partial index (SQLite 3.8.0+)
CREATE INDEX idx_high_salary 
ON employees(salary) 
WHERE salary > 100000;

-- Expression index
CREATE INDEX idx_employees_lower_email 
ON employees(LOWER(email));
```

**Viewing indexes:**
```
-- List all indexes
.indexes

-- See index details
.schema sqlite_master

-- Show indexes for a specific table
SELECT * FROM sqlite_master 
WHERE type = 'index' AND tbl_name = 'employees';
```

**Query optimization with EXPLAIN QUERY PLAN:**
```
-- Analyze query execution
EXPLAIN QUERY PLAN
SELECT * FROM employees 
WHERE department = 'Engineering' 
  AND salary > 70000;

-- Without index (SCAN TABLE)
-- With index (SEARCH TABLE using index)
```

**Optimization tips:**
```
-- Use ANALYZE to update statistics
ANALYZE;

-- Specific table
ANALYZE employees;

-- Vacuum to reclaim space and optimize
VACUUM;

-- Check database integrity
PRAGMA integrity_check;

-- Optimize database
PRAGMA optimize;
```

### 3.3.5 Full-Text Search Capabilities

SQLite provides FTS (Full-Text Search) through virtual tables.

**Creating FTS table:**
```
-- FTS5 (recommended)
CREATE VIRTUAL TABLE documents_fts USING fts5(
    title,
    content,
    author,
    tokenize = 'porter ascii'
);

-- Insert data
INSERT INTO documents_fts (title, content, author)
VALUES 
    ('Introduction to SQL', 'SQL is a powerful query language...', 'John Doe'),
    ('Advanced Database Design', 'Normalization is crucial for...', 'Jane Smith'),
    ('SQLite Best Practices', 'SQLite is perfect for embedded applications...', 'Bob Johnson');

-- Full-text search
SELECT title, author 
FROM documents_fts 
WHERE documents_fts MATCH 'database OR sql';

-- Phrase search
SELECT title, content
FROM documents_fts 
WHERE documents_fts MATCH '"query language"';

-- Proximity search (words within 5 words of each other)
SELECT title
FROM documents_fts 
WHERE documents_fts MATCH 'NEAR(database design, 5)';

-- Ranking results
SELECT 
    title,
    rank
FROM documents_fts 
WHERE documents_fts MATCH 'sqlite'
ORDER BY rank;
```

**Highlighting matches:**
```
SELECT 
    title,
    snippet(documents_fts, 1, '<b>', '</b>', '...', 30) as snippet
FROM documents_fts 
WHERE documents_fts MATCH 'database'
ORDER BY rank
LIMIT 10;
```

### 3.3.6 Common Use Cases in Data Engineering

**1. Local ETL processing:**
```
import sqlite3
import pandas as pd

# Extract from CSV, transform, load into SQLite
df = pd.read_csv('sales_data.csv')

# Transform
df['sale_date'] = pd.to_datetime(df['sale_date'])
df['revenue'] = df['quantity'] * df['unit_price']

# Load
conn = sqlite3.connect('sales.db')
df.to_sql('sales', conn, if_exists='replace', index=False)

# Query
result = pd.read_sql_query("""
    SELECT 
        strftime('%Y-%m', sale_date) as month,
        SUM(revenue) as total_revenue
    FROM sales
    GROUP BY month
    ORDER BY month
""", conn)

conn.close()
```

**2. Data pipeline intermediate storage:**
```
# Stage 1: Extract and stage
conn = sqlite3.connect('pipeline.db')
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS staging_orders (
        order_id TEXT,
        customer_id TEXT,
        order_date TEXT,
        total_amount REAL,
        processed BOOLEAN DEFAULT 0
    )
""")

# Stage 2: Transform and load to production
cursor.execute("""
    INSERT INTO production_orders
    SELECT 
        order_id,
        customer_id,
        date(order_date) as order_date,
        total_amount
    FROM staging_orders
    WHERE processed = 0
""")

cursor.execute("UPDATE staging_orders SET processed = 1")
conn.commit()
conn.close()
```

**3. Caching query results:**
```
import sqlite3
import time
from datetime import datetime, timedelta

def get_cached_data(cache_hours=24):
    conn = sqlite3.connect('cache.db')
    cursor = conn.cursor()
    
    # Check cache
    cursor.execute("""
        SELECT data, cached_at 
        FROM query_cache 
        WHERE query_name = 'daily_summary'
    """)
    
    result = cursor.fetchone()
    
    if result:
        cached_at = datetime.fromisoformat(result[1])
        if datetime.now() - cached_at < timedelta(hours=cache_hours):
            return result[0]  # Return cached data
    
    # Cache miss or expired - fetch fresh data
    fresh_data = fetch_from_api()  # Your data source
    
    cursor.execute("""
        INSERT OR REPLACE INTO query_cache (query_name, data, cached_at)
        VALUES ('daily_summary', ?, ?)
    """, (fresh_data, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    return fresh_data
```

---

## 3.4 PostgreSQL

### 3.4.1 Installation and Configuration

**Installation on Ubuntu/Debian:**
```
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

**Installation on macOS:**
```
# Using Homebrew
brew install postgresql

# Start service
brew services start postgresql
```

**Installation on Windows:**
Download installer from postgresql.org and follow the wizard.

**Initial configuration:**
```
# Switch to postgres user
sudo -i -u postgres

# Access PostgreSQL prompt
psql

# Or in one command
sudo -u postgres psql
```

**Basic server configuration (`postgresql.conf`):**
```
# Common settings to adjust
max_connections = 100
shared_buffers = 256MB          # 25% of RAM for dedicated server
effective_cache_size = 1GB      # 50-75% of RAM
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1          # For SSD, use 1.1; for HDD, use 4
work_mem = 4MB
```

**Client authentication (`pg_hba.conf`):**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all            postgres                                 peer
local   all            all                                      md5
host    all            all             127.0.0.1/32            md5
host    all            all             ::1/128                 md5
```

**Reload configuration:**
```
-- From psql
SELECT pg_reload_conf();
```

### 3.4.2 User Management and Permissions

**Creating users and roles:**
```
-- Create a user with password
CREATE USER data_analyst WITH PASSWORD 'secure_password';

-- Create a role (group)
CREATE ROLE readonly;
CREATE ROLE readwrite;

-- Create user and assign to role
CREATE USER john_doe WITH PASSWORD 'password123';
GRANT readonly TO john_doe;

-- Create superuser
CREATE USER admin_user WITH SUPERUSER PASSWORD 'admin_pass';

-- Modify existing user
ALTER USER data_analyst WITH CREATEDB;
ALTER USER data_analyst WITH PASSWORD 'new_password';

-- Remove user
DROP USER john_doe;
```

**Granting privileges:**
```
-- Grant database access
GRANT CONNECT ON DATABASE sales_db TO data_analyst;

-- Grant schema access
GRANT USAGE ON SCHEMA public TO data_analyst;

-- Grant table privileges
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite;

-- Grant privileges on specific table
GRANT SELECT, INSERT, UPDATE ON orders TO data_analyst;

-- Grant privileges on columns
GRANT SELECT (order_id, customer_id, order_date) ON orders TO data_analyst;

-- Grant sequence privileges
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO readwrite;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calculate_discount(numeric) TO data_analyst;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO readwrite;
```

**Revoking privileges:**
```
-- Revoke specific privilege
REVOKE INSERT ON orders FROM data_analyst;

-- Revoke all privileges
REVOKE ALL PRIVILEGES ON DATABASE sales_db FROM data_analyst;

-- Revoke role membership
REVOKE readonly FROM john_doe;
```

**Row-level security:**
```
-- Enable RLS on a table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_orders ON orders
    FOR SELECT
    USING (customer_id = current_user);

-- Users can only see their own orders
CREATE POLICY sales_rep_policy ON orders
    FOR ALL
    USING (sales_rep_id = current_setting('app.current_user_id')::int);

-- Disable RLS for specific role
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
```

**Viewing permissions:**
```
-- List users and roles
\du

-- View table privileges
\dp orders

-- Query pg_catalog
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'orders';
```

### 3.4.3 Data Types and Constraints

**Numeric types:**
```
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,        -- Auto-increment integer
    price NUMERIC(10,2),                  -- Exact decimal
    discount_percent REAL,                -- Floating point
    stock_quantity INTEGER,               -- Whole number
    weight_kg DOUBLE PRECISION,           -- Double precision float
    tiny_value SMALLINT,                  -- -32768 to 32767
    huge_value BIGINT                     -- Very large integers
);
```

**String types:**
```
CREATE TABLE content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),              -- Variable length with limit
    description TEXT,                -- Unlimited length
    code CHAR(10),                   -- Fixed length
    slug VARCHAR(100) UNIQUE         -- With constraint
);
```

**Date and time types:**
```
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    event_date DATE,                        -- Date only
    event_time TIME,                        -- Time only
    created_at TIMESTAMP,                   -- Date + time
    updated_at TIMESTAMPTZ,                 -- Timestamp with timezone
    duration INTERVAL,                      -- Time interval
    CHECK (event_date >= CURRENT_DATE)      -- Future dates only
);

-- Working with dates
INSERT INTO events (event_date, event_time, created_at, updated_at)
VALUES (
    '2024-12-25',
    '14:30:00',
    NOW(),
    CURRENT_TIMESTAMP
);
```

**Boolean:**
```
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE
);
```

**JSON types:**
```
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY,
    preferences JSON,              -- JSON text
    settings JSONB                -- Binary JSON (recommended)
);

-- Insert JSON data
INSERT INTO user_preferences (user_id, settings)
VALUES (1, '{"theme": "dark", "notifications": true, "language": "en"}');

-- Query JSON
SELECT settings->>'theme' as theme
FROM user_preferences
WHERE settings->>'notifications' = 'true';

-- JSON operators
SELECT settings->'notifications' as notifications,  -- Returns JSON
       settings->>'language' as language            -- Returns text
FROM user_preferences;
```

**Array types:**
```
CREATE TABLE articles (
    article_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    tags TEXT[],                   -- Array of text
    scores INTEGER[]               -- Array of integers
);

-- Insert array data
INSERT INTO articles (title, tags, scores)
VALUES ('PostgreSQL Tutorial', ARRAY['database', 'sql', 'postgres'], ARRAY[5, 4, 5]);

-- Query arrays
SELECT * FROM articles
WHERE 'database' = ANY(tags);

SELECT * FROM articles
WHERE tags && ARRAY['sql', 'tutorial'];  -- Overlap operator
```

**UUID:**
```
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Constraints:**
```
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) CHECK (total_amount >= 0),
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
    email VARCHAR(100) UNIQUE,
    
    -- Table-level constraints
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT check_future_date CHECK (order_date <= CURRENT_DATE),
    CONSTRAINT check_status_amount CHECK (
        (status = 'pending' AND total_amount > 0) OR 
        status != 'pending'
    )
);
```

### 3.4.4 Indexes (B-tree, Hash, GiST, GIN)

**B-tree indexes (default):**
Best for equality and range queries.

```
-- Single column index
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Multi-column index (column order matters!)
CREATE INDEX idx_orders_date_status ON orders(order_date, status);

-- Unique index
CREATE UNIQUE INDEX idx_customers_email ON customers(email);

-- Partial index
CREATE INDEX idx_active_orders ON orders(order_date)
WHERE status IN ('pending', 'processing');

-- Expression index
CREATE INDEX idx_lower_email ON customers(LOWER(email));

-- Descending index
CREATE INDEX idx_orders_date_desc ON orders(order_date DESC);
```

**Hash indexes:**
Good for simple equality comparisons (PostgreSQL 10+).

```
CREATE INDEX idx_products_sku_hash ON products USING HASH (sku);

-- Use for exact matches only
SELECT * FROM products WHERE sku = 'PROD-12345';
```

**GiST (Generalized Search Tree):**
For geometric data, full-text search, and range types.

```
-- For geometric data
CREATE INDEX idx_locations_point ON locations USING GIST (coordinates);

-- For range types
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    room_number INTEGER,
    during TSRANGE
);

CREATE INDEX idx_reservations_during ON reservations USING GIST (during);

-- Query overlapping ranges
SELECT * FROM reservations
WHERE during && tsrange('2024-10-01', '2024-10-07');
```

**GIN (Generalized Inverted Index):**
For array, JSON, and full-text search.

```
-- For arrays
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);

SELECT * FROM articles WHERE tags @> ARRAY['postgresql'];

-- For JSONB
CREATE INDEX idx_user_prefs_settings ON user_preferences USING GIN (settings);

SELECT * FROM user_preferences
WHERE settings @> '{"theme": "dark"}';

-- For full-text search
CREATE INDEX idx_documents_fts ON documents USING GIN (to_tsvector('english', content));

SELECT * FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'database & design');
```

**BRIN (Block Range Index):**
For very large tables with naturally ordered data.

```
CREATE INDEX idx_logs_timestamp_brin ON logs USING BRIN (timestamp);

-- Excellent for time-series data
SELECT * FROM logs
WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31';
```

**Index maintenance:**
```
-- View indexes
\di

-- Analyze index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan < 50  -- Rarely used indexes
ORDER BY idx_scan;

-- Rebuild index
REINDEX INDEX idx_orders_customer;

-- Rebuild all indexes on a table
REINDEX TABLE orders;

-- Remove unused index
DROP INDEX idx_orders_customer;
```

### 3.4.5 Partitioning Strategies

Partitioning divides large tables into smaller, more manageable pieces.

**Range partitioning:**
```
-- Create partitioned table
CREATE TABLE orders (
    order_id BIGSERIAL,
    customer_id INTEGER,
    order_date DATE NOT NULL,
    total_amount NUMERIC(12,2),
    status VARCHAR(20)
) PARTITION BY RANGE (order_date);

-- Create partitions
CREATE TABLE orders_2023 PARTITION OF orders
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Default partition for data outside ranges
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Insert data (automatically goes to correct partition)
INSERT INTO orders (customer_id, order_date, total_amount, status)
VALUES (101, '2024-02-15', 299.99, 'completed');

-- Create indexes on partitioned table (applies to all partitions)
CREATE INDEX ON orders (order_date);
CREATE INDEX ON orders (customer_id);
```

**List partitioning:**
```
-- Partition by discrete values
CREATE TABLE sales (
    sale_id BIGSERIAL,
    region VARCHAR(50) NOT NULL,
    sale_date DATE,
    amount NUMERIC(12,2)
) PARTITION BY LIST (region);

CREATE TABLE sales_north PARTITION OF sales
    FOR VALUES IN ('North', 'Northeast', 'Northwest');

CREATE TABLE sales_south PARTITION OF sales
    FOR VALUES IN ('South', 'Southeast', 'Southwest');

CREATE TABLE sales_other PARTITION OF sales DEFAULT;
```

**Hash partitioning:**
```
-- Distribute data evenly across partitions
CREATE TABLE user_actions (
    action_id BIGSERIAL,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(50),
    created_at TIMESTAMP
) PARTITION BY HASH (user_id);

-- Create 4 hash partitions
CREATE TABLE user_actions_p0 PARTITION OF user_actions
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE user_actions_p1 PARTITION OF user_actions
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE user_actions_p2 PARTITION OF user_actions
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE user_actions_p3 PARTITION OF user_actions
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

**Sub-partitioning:**
```
-- Partition by range, then by list
CREATE TABLE sales_data (
    sale_id BIGSERIAL,
    sale_date DATE NOT NULL,
    region VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2)
) PARTITION BY RANGE (sale_date);

CREATE TABLE sales_2024 PARTITION OF sales_data
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')
    PARTITION BY LIST (region);

CREATE TABLE sales_2024_north PARTITION OF sales_2024
    FOR VALUES IN ('North');

CREATE TABLE sales_2024_south PARTITION OF sales_2024
    FOR VALUES IN ('South');
```

**Managing partitions:**
```
-- Detach partition (useful for archiving)
ALTER TABLE orders DETACH PARTITION orders_2023;

-- Attach partition
ALTER TABLE orders ATTACH PARTITION orders_2023
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

-- Drop partition
DROP TABLE orders_2023;

-- Query specific partition
SELECT * FROM orders_2024_q1 WHERE customer_id = 101;

-- View partition information
SELECT 
    parent.relname AS parent_table,
    child.relname AS partition_name,
    pg_get_expr(child.relpartbound, child.oid) AS partition_expression
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'orders';
```

**Partition pruning:**
PostgreSQL automatically excludes irrelevant partitions from queries.

```
-- Only scans orders_2024_q1 partition
EXPLAIN SELECT * FROM orders 
WHERE order_date BETWEEN '2024-01-15' AND '2024-02-15';

-- Enable partition pruning (default in PG 11+)
SET enable_partition_pruning = on;
```

### 3.4.6 Performance Tuning and EXPLAIN Plans

**Understanding EXPLAIN:**
```
-- Basic EXPLAIN
EXPLAIN SELECT * FROM orders WHERE customer_id = 101;

-- EXPLAIN ANALYZE (actually runs the query)
EXPLAIN ANALYZE 
SELECT o.order_id, c.customer_name, SUM(oi.quantity * oi.unit_price) as total
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, c.customer_name;

-- Detailed output
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM orders WHERE order_date > '2024-01-01';
```

**Reading EXPLAIN output:**
```
Seq Scan on orders  (cost=0.00..458.00 rows=100 width=45) (actual time=0.015..2.234 rows=98 loops=1)
  Filter: (order_date > '2024-01-01'::date)
  Rows Removed by Filter: 9902
Planning Time: 0.123 ms
Execution Time: 2.456 ms

Key components:
- cost=0.00..458.00: Startup cost..Total cost (not real time, relative units)
- rows=100: Estimated rows returned
- width=45: Average row width in bytes
- actual time=0.015..2.234: Actual startup..total time in ms
- rows=98: Actual rows returned
- loops=1: Number of times the node was executed
```

**Common scan types:**
```
-- Sequential Scan (full table scan)
EXPLAIN SELECT * FROM orders;
-- Use when: No index, small table, retrieving large portion of data

-- Index Scan (uses index)
EXPLAIN SELECT * FROM orders WHERE order_id = 100;
-- Use when: Selective query with index

-- Index Only Scan (all data from index)
EXPLAIN SELECT order_id FROM orders WHERE order_id > 1000;
-- Use when: Covering index, no need to access table

-- Bitmap Index Scan (for multiple conditions)
EXPLAIN SELECT * FROM orders 
WHERE customer_id IN (1,2,3,4,5) AND status = 'completed';
-- Use when: Multiple index conditions, moderate selectivity
```

**Join strategies:**
```
-- Nested Loop (good for small tables)
EXPLAIN SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_id < 10;

-- Hash Join (good for large tables)
EXPLAIN SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;

-- Merge Join (good for sorted data)
EXPLAIN SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.customer_id;
```

**Performance tuning techniques:**

1. **Update statistics:**
```
-- Analyze specific table
ANALYZE orders;

-- Analyze all tables
ANALYZE;

-- Verbose output
ANALYZE VERBOSE customers;

-- Set statistics target for better estimates
ALTER TABLE orders ALTER COLUMN customer_id SET STATISTICS 1000;
```

2. **Adjust work_mem for sorting/hashing:**
```
-- View current setting
SHOW work_mem;

-- Set for session
SET work_mem = '256MB';

-- Set for specific query
SET LOCAL work_mem = '256MB';
SELECT ... -- complex query with sorting
RESET work_mem;
```

3. **Query hints (using pg_hint_plan extension):**
```
-- Force index usage
/*+ IndexScan(orders idx_orders_customer) */
SELECT * FROM orders WHERE customer_id = 101;

-- Force join order
/*+ Leading(c o) HashJoin(c o) */
SELECT * FROM customers c JOIN orders o ON c.customer_id = o.customer_id;
```

4. **Parallel queries:**
```
-- Enable parallel query execution
SET max_parallel_workers_per_gather = 4;

-- Force parallel scan
SET parallel_setup_cost = 0;
SET parallel_tuple_cost = 0;

EXPLAIN SELECT COUNT(*) FROM large_table;
-- Look for "Parallel Seq Scan" nodes
```

**Monitoring query performance:**
```
-- Enable pg_stat_statements extension
CREATE EXTENSION pg_stat_statements;

-- View slow queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();

-- Current running queries
SELECT 
    pid,
    usename,
    state,
    query,
    query_start,
    NOW() - query_start as duration
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Kill long-running query
SELECT pg_cancel_backend(pid);  -- Graceful
SELECT pg_terminate_backend(pid);  -- Forceful
```

### 3.4.7 JSON and JSONB Support

**JSONB vs JSON:**
- **JSON:** Stores text representation, preserves formatting and key order
- **JSONB:** Stores binary format, no whitespace, faster operations, supports indexing

**Basic operations:**
```
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    attributes JSONB
);

-- Insert JSONB data
INSERT INTO products (name, attributes) VALUES
('Laptop', '{"brand": "Dell", "cpu": "Intel i7", "ram": 16, "storage": {"type": "SSD", "capacity": 512}}'),
('Phone', '{"brand": "Samsung", "screen": 6.5, "camera": {"front": 12, "rear": 48}}');

-- Access JSON fields
SELECT 
    name,
    attributes->>'brand' as brand,
    attributes->'storage'->>'type' as storage_type
FROM products;

-- Extract nested values
SELECT 
    name,
    attributes#>>'{storage, capacity}' as storage_gb
FROM products;
```

**JSON operators:**
```
-- -> returns JSON
SELECT attributes->'storage' FROM products;

-- ->> returns text
SELECT attributes->>'brand' FROM products;

-- #> returns JSON (path)
SELECT attributes#>'{storage, type}' FROM products;

-- #>> returns text (path)
SELECT attributes#>>'{camera, rear}' FROM products;

-- ? checks if key exists
SELECT * FROM products WHERE attributes ? 'camera';

-- ?| checks if any key exists
SELECT * FROM products WHERE attributes ?| array['cpu', 'screen'];

-- ?& checks if all keys exist
SELECT * FROM products WHERE attributes ?& array['brand', 'storage'];

-- @> contains JSON
SELECT * FROM products 
WHERE attributes @> '{"brand": "Dell"}';

-- <@ is contained by
SELECT * FROM products 
WHERE '{"brand": "Dell"}' <@ attributes;
```

**JSON functions:**
```
-- Build JSON
SELECT jsonb_build_object(
    'name', name,
    'brand', attributes->>'brand',
    'price', 999.99
) as product_json
FROM products;

-- Aggregate to JSON array
SELECT jsonb_agg(attributes) as all_attributes
FROM products;

-- Aggregate to JSON object
SELECT jsonb_object_agg(name, attributes) as products_map
FROM products;

-- Extract keys
SELECT jsonb_object_keys(attributes) as keys
FROM products;

-- Array elements
SELECT jsonb_array_elements(
    '[{"id": 1}, {"id": 2}, {"id": 3}]'::jsonb
);

-- Pretty print
SELECT jsonb_pretty(attributes) FROM products;
```

**Updating JSONB:**
```
-- Set a value
UPDATE products
SET attributes = jsonb_set(
    attributes,
    '{price}',
    '1299.99',
    true  -- create if doesn't exist
)
WHERE product_id = 1;

-- Remove a key
UPDATE products
SET attributes = attributes - 'discount';

-- Remove nested key
UPDATE products
SET attributes = attributes #- '{storage, warranty}';

-- Merge JSON objects
UPDATE products
SET attributes = attributes || '{"warranty": "2 years", "color": "silver"}'::jsonb
WHERE product_id = 1;
```

**Indexing JSONB:**
```
-- GIN index on entire JSONB column
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- GIN index on specific path
CREATE INDEX idx_products_brand ON products USING GIN ((attributes->'brand'));

-- B-tree index on extracted value
CREATE INDEX idx_products_brand_btree ON products ((attributes->>'brand'));

-- Use indexes in queries
SELECT * FROM products 
WHERE attributes @> '{"brand": "Dell"}';  -- Uses GIN index

SELECT * FROM products 
WHERE attributes->>'brand' = 'Dell';  -- Uses B-tree index
```

### 3.4.8 Extensions

**pg_stat_statements:**
Tracks execution statistics for all SQL statements.

```
-- Install extension
CREATE EXTENSION pg_stat_statements;

-- Configure in postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all

-- Restart PostgreSQL
sudo systemctl restart postgresql

-- View query statistics
SELECT 
    substring(query, 1, 50) as short_query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Find queries consuming most time
SELECT 
    substring(query, 1, 100) as query,
    calls,
    total_exec_time / 1000 as total_seconds,
    mean_exec_time / 1000 as mean_seconds,
    100.0 * total_exec_time / SUM(total_exec_time) OVER () as percentage
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Find queries with high variance
SELECT 
    substring(query, 1, 100) as query,
    calls,
    mean_exec_time,
    stddev_exec_time,
    stddev_exec_time / mean_exec_time as coefficient_of_variation
FROM pg_stat_statements
WHERE calls > 100
ORDER BY coefficient_of_variation DESC
LIMIT 10;
```

**TimescaleDB:**
Extension for time-series data, providing automatic partitioning and time-based queries.

```
-- Install TimescaleDB
CREATE EXTENSION timescaledb;

-- Create regular table
CREATE TABLE sensor_data (
    time TIMESTAMPTZ NOT NULL,
    sensor_id INTEGER NOT NULL,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    pressure DOUBLE PRECISION
);

-- Convert to hypertable (automatic partitioning)
SELECT create_hypertable('sensor_data', 'time');

-- Insert data
INSERT INTO sensor_data VALUES
    ('2024-10-01 00:00:00', 1, 22.5, 45.2, 1013.25),
    ('2024-10-01 00:01:00', 1, 22.6, 45.1, 1013.30),
    ('2024-10-01 00:00:00', 2, 23.1, 48.5, 1012.80);

-- Time-based queries (optimized by TimescaleDB)
SELECT time_bucket('1 hour', time) as hour,
       sensor_id,
       AVG(temperature) as avg_temp,
       MAX(temperature) as max_temp,
       MIN(temperature) as min_temp
FROM sensor_data
WHERE time > NOW() - INTERVAL '24 hours'
GROUP BY hour, sensor_id
ORDER BY hour, sensor_id;

-- Create continuous aggregate (materialized view with auto-refresh)
CREATE MATERIALIZED VIEW sensor_data_hourly
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) as hour,
       sensor_id,
       AVG(temperature) as avg_temperature,
       AVG(humidity) as avg_humidity
FROM sensor_data
GROUP BY hour, sensor_id;

-- Add refresh policy (auto-update every hour)
SELECT add_continuous_aggregate_policy('sensor_data_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Data retention policy (auto-delete old data)
SELECT add_retention_policy('sensor_data', INTERVAL '90 days');

-- Compression policy (compress old data)
ALTER TABLE sensor_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'sensor_id'
);

SELECT add_compression_policy('sensor_data', INTERVAL '7 days');
```

**Other useful extensions:**

```
-- PostGIS (geospatial data)
CREATE EXTENSION postgis;

-- Full-text search
CREATE EXTENSION pg_trgm;  -- Trigram matching

-- Foreign data wrappers
CREATE EXTENSION postgres_fdw;  -- Connect to other PostgreSQL databases

-- Cryptographic functions
CREATE EXTENSION pgcrypto;

-- UUID generation
CREATE EXTENSION "uuid-ossp";

-- List installed extensions
\dx

-- Or query
SELECT * FROM pg_extension;
```

---

## 3.5 Query Optimization

### 3.5.1 Understanding Query Execution Plans

**Components of an execution plan:**

1. **Scan nodes:** How data is read from tables
2. **Join nodes:** How tables are combined
3. **Aggregate nodes:** How grouping/aggregation is performed
4. **Sort nodes:** How data is ordered
5. **Other nodes:** Filters, limits, etc.

**Reading costs:**
```
Node Type  (cost=startup..total rows=estimated width=bytes)
           (actual time=startup..total rows=actual loops=iterations)
```

**Example plan analysis:**
```
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    c.customer_name,
    COUNT(o.order_id) as order_count,
    SUM(o.total_amount) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'USA'
GROUP BY c.customer_id, c.customer_name
HAVING COUNT(o.order_id) > 5
ORDER BY total_spent DESC
LIMIT 10;
```

**Possible output:**
```
Limit  (cost=3589.45..3589.47 rows=10 width=48)
  ->  Sort  (cost=3589.45..3614.70 rows=10100 width=48)
        Sort Key: (sum(o.total_amount)) DESC
        ->  HashAggregate  (cost=3201.25..3352.50 rows=10100 width=48)
              Group Key: c.customer_id
              Filter: (count(o.order_id) > 5)
              ->  Hash Left Join  (cost=825.00..2876.50 rows=43300 width=44)
                    Hash Cond: (c.customer_id = o.customer_id)
                    ->  Seq Scan on customers c  (cost=0.00..1789.00 rows=12000 width=36)
                          Filter: ((country)::text = 'USA'::text)
                    ->  Hash  (cost=550.00..550.00 rows=22000 width=12)
                          ->  Seq Scan on orders o  (cost=0.00..550.00 rows=22000 width=12)
```

**Red flags in execution plans:**
- Sequential scans on large tables
- High cost estimates
- Large difference between estimated and actual rows
- Multiple sorts
- Nested loops with large outer tables
- High buffer reads

### 3.5.2 Index Selection and Usage

**When to create indexes:**
```
-- Columns in WHERE clauses
CREATE INDEX idx_orders_status ON orders(status);

-- Columns in JOIN conditions
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Columns in ORDER BY
CREATE INDEX idx_orders_date ON orders(order_date);

-- Columns in GROUP BY
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Covering indexes (include all columns needed)
CREATE INDEX idx_orders_covering ON orders(customer_id, order_date) 
INCLUDE (total_amount, status);
```

**Index selectivity:**
```
-- Check column selectivity (closer to 1.0 is better for indexing)
SELECT 
    COUNT(DISTINCT status)::float / COUNT(*) as selectivity
FROM orders;

-- High selectivity (good for index): email, order_id, customer_id
-- Low selectivity (bad for index): boolean, status with few values

-- Partial index for low selectivity columns
CREATE INDEX idx_active_orders ON orders(status)
WHERE status IN ('pending', 'processing');
```

**Multi-column index order:**
```
-- Order matters! Most selective column first
-- Good for: WHERE customer_id = X AND order_date > Y
CREATE INDEX idx_orders_cust_date ON orders(customer_id, order_date);

-- Also good for: WHERE customer_id = X (uses leftmost column)
-- NOT good for: WHERE order_date > Y (doesn't use index)

-- For range queries, put equality columns first
CREATE INDEX idx_orders_date_status ON orders(status, order_date);
-- Good for: WHERE status = 'pending' AND order_date > '2024-01-01'
```

**Monitoring index usage:**
```
-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan < 100  -- Adjust threshold
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find missing indexes (from slow queries)
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_rows_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 1000
  AND seq_tup_read / seq_scan > 10000
ORDER BY seq_tup_read DESC;

-- Check index bloat
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 3.5.3 Statistics and Query Planner

**How statistics work:**
PostgreSQL collects statistics about data distribution to estimate query costs.

```
-- View table statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables;

-- View column statistics
SELECT 
    tablename,
    attname,
    n_distinct,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'status';

-- Update statistics manually
ANALYZE orders;
ANALYZE orders(customer_id, order_date);  -- Specific columns

-- Increase statistics target for better estimates
ALTER TABLE orders ALTER COLUMN customer_id SET STATISTICS 1000;
ANALYZE orders;

-- Revert to default
ALTER TABLE orders ALTER COLUMN customer_id SET STATISTICS -1;
```

**Extended statistics:**
```
-- Create statistics on correlated columns
CREATE STATISTICS orders_customer_date_stats (dependencies)
ON customer_id, order_date FROM orders;

-- Multi-column statistics
CREATE STATISTICS products_category_brand_stats (dependencies, ndistinct)
ON category, brand FROM products;

ANALYZE orders;  -- Update statistics

-- View extended statistics
SELECT * FROM pg_statistic_ext WHERE stxname = 'orders_customer_date_stats';
```

**Planner configuration:**
```
-- View planner settings
SHOW random_page_cost;
SHOW seq_page_cost;
SHOW cpu_tuple_cost;
SHOW cpu_index_tuple_cost;
SHOW effective_cache_size;

-- Adjust for SSD (lower random access cost)
ALTER DATABASE mydb SET random_page_cost = 1.1;
ALTER DATABASE mydb SET effective_cache_size = '4GB';

-- Disable specific plan types for testing
SET enable_seqscan = off;
SET enable_indexscan = off;
SET enable_hashjoin = off;
SET enable_mergejoin = off;

-- Reset
RESET enable_seqscan;
```

### 3.5.4 Avoiding Common Anti-Patterns

**Anti-pattern 1: SELECT ***
```
-- Bad: Retrieves unnecessary data
SELECT * FROM orders WHERE order_id = 12345;

-- Good: Select only needed columns
SELECT order_id, customer_id, total_amount, status 
FROM orders WHERE order_id = 12345;
```

**Anti-pattern 2: N+1 queries**
```
-- Bad: Multiple queries in application loop
-- SELECT * FROM customers;
-- For each customer: SELECT * FROM orders WHERE customer_id = ?

-- Good: Single query with JOIN
SELECT 
    c.customer_id,
    c.customer_name,
    o.order_id,
    o.order_date,
    o.total_amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;

-- Or use array aggregation
SELECT 
    c.customer_id,
    c.customer_name,
    json_agg(json_build_object(
        'order_id', o.order_id,
        'order_date', o.order_date,
        'total_amount', o.total_amount
    )) as orders
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name;
```

**Anti-pattern 3: Functions on indexed columns**
```
-- Bad: Function prevents index usage
SELECT * FROM customers WHERE LOWER(email) = 'john@example.com';

-- Good: Use expression index
CREATE INDEX idx_customers_email_lower ON customers(LOWER(email));

-- Or store lowercase version
ALTER TABLE customers ADD COLUMN email_lower VARCHAR(100);
UPDATE customers SET email_lower = LOWER(email);
CREATE INDEX idx_customers_email_lower ON customers(email_lower);
```

**Anti-pattern 4: NOT IN with nullable columns**
```
-- Bad: NOT IN with NULL returns unexpected results
SELECT * FROM products 
WHERE product_id NOT IN (SELECT product_id FROM discontinued_products);

-- Good: Use NOT EXISTS or LEFT JOIN
SELECT p.* FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM discontinued_products dp 
    WHERE dp.product_id = p.product_id
);

-- Or
SELECT p.* FROM products p
LEFT JOIN discontinued_products dp ON p.product_id = dp.product_id
WHERE dp.product_id IS NULL;
```

**Anti-pattern 5: OR conditions on different columns**
```
-- Bad: OR prevents index usage
SELECT * FROM orders 
WHERE customer_id = 123 OR status = 'pending';

-- Good: Use UNION
SELECT * FROM orders WHERE customer_id = 123
UNION
SELECT * FROM orders WHERE status = 'pending';
```

**Anti-pattern 6: OFFSET for pagination**
```
-- Bad: OFFSET scans all skipped rows
SELECT * FROM orders 
ORDER BY order_date DESC 
LIMIT 20 OFFSET 10000;

-- Good: Use keyset pagination
SELECT * FROM orders 
WHERE order_date < '2024-01-15 10:30:00'  -- Last value from previous page
ORDER BY order_date DESC 
LIMIT 20;
```

**Anti-pattern 7: Implicit type conversion**
```
-- Bad: String comparison on integer column
SELECT * FROM orders WHERE order_id = '12345';

-- Good: Use correct type
SELECT * FROM orders WHERE order_id = 12345;

-- Check column types
\d orders
```

### 3.5.5 Materialized Views

Materialized views store query results physically, trading storage for query performance.

**Creating materialized views:**
```
-- Basic materialized view
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT 
    DATE(order_date) as sale_date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders
GROUP BY DATE(order_date);

-- Create with indexes
CREATE UNIQUE INDEX idx_mv_daily_sales_date 
ON mv_daily_sales(sale_date);

-- Query materialized view (fast!)
SELECT * FROM mv_daily_sales 
WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days';
```

**Refreshing materialized views:**
```
-- Full refresh (locks table)
REFRESH MATERIALIZED VIEW mv_daily_sales;

-- Concurrent refresh (no lock, requires unique index)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;

-- Scheduled refresh (using pg_cron extension)
CREATE EXTENSION pg_cron;

-- Refresh every day at 2 AM
SELECT cron.schedule(
    'refresh-daily-sales',
    '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales'
);
```

**Complex example:**
```
-- Customer lifetime value materialized view
CREATE MATERIALIZED VIEW mv_customer_lifetime_value AS
WITH customer_metrics AS (
    SELECT 
        c.customer_id,
        c.customer_name,
        c.email,
        MIN(o.order_date) as first_order_date,
        MAX(o.order_date) as last_order_date,
        COUNT(o.order_id) as total_orders,
        SUM(o.total_amount) as lifetime_value,
        AVG(o.total_amount) as avg_order_value,
        MAX(o.order_date) - MIN(o.order_date) as customer_lifespan_days
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.customer_name, c.email
)
SELECT 
    *,
    CASE 
        WHEN lifetime_value > 10000 THEN 'VIP'
        WHEN lifetime_value > 5000 THEN 'Premium'
        WHEN lifetime_value > 1000 THEN 'Regular'
        ELSE 'Occasional'
    END as customer_segment,
    CASE 
        WHEN last_order_date > CURRENT_DATE - INTERVAL '30 days' THEN 'Active'
        WHEN last_order_date > CURRENT_DATE - INTERVAL '90 days' THEN 'At Risk'
        ELSE 'Churned'
    END as customer_status
FROM customer_metrics;

CREATE INDEX idx_mv_clv_segment ON mv_customer_lifetime_value(customer_segment);
CREATE INDEX idx_mv_clv_status ON mv_customer_lifetime_value(customer_status);
CREATE INDEX idx_mv_clv_value ON mv_customer_lifetime_value(lifetime_value DESC);
```

**Incremental updates (manual pattern):**
```
-- Track last update time
CREATE TABLE mv_refresh_log (
    view_name VARCHAR(100) PRIMARY KEY,
    last_refresh TIMESTAMP
);

-- Incremental update function
CREATE OR REPLACE FUNCTION refresh_mv_daily_sales_incremental()
RETURNS void AS $
DECLARE
    last_update TIMESTAMP;
BEGIN
    -- Get last refresh time
    SELECT last_refresh INTO last_update
    FROM mv_refresh_log
    WHERE view_name = 'mv_daily_sales';
    
    -- If first run, do full refresh
    IF last_update IS NULL THEN
        REFRESH MATERIALIZED VIEW mv_daily_sales;
    ELSE
        -- Delete changed rows
        DELETE FROM mv_daily_sales
        WHERE sale_date IN (
            SELECT DISTINCT DATE(order_date)
            FROM orders
            WHERE updated_at > last_update
        );
        
        -- Insert updated data
        INSERT INTO mv_daily_sales
        SELECT 
            DATE(order_date) as sale_date,
            COUNT(*) as order_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_order_value,
            COUNT(DISTINCT customer_id) as unique_customers
        FROM orders
        WHERE DATE(order_date) IN (
            SELECT DISTINCT DATE(order_date)
            FROM orders
            WHERE updated_at > last_update
        )
        GROUP BY DATE(order_date);
    END IF;
    
    -- Update refresh log
    INSERT INTO mv_refresh_log VALUES ('mv_daily_sales', NOW())
    ON CONFLICT (view_name) DO UPDATE SET last_refresh = NOW();
END;
$ LANGUAGE plpgsql;
```
