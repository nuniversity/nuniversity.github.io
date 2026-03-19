---
title: "Domain 4.2 — Optimizing Query Performance"
description: "Learn Snowflake's performance optimization tools: Query Acceleration Service, Search Optimization Service, clustering keys, and Materialized Views. Know when and how to use each."
order: 14
difficulty: intermediate
duration: "60 min"
---

# Domain 4.2 — Optimizing Query Performance

## Exam Weight

**Domain 4.0** accounts for **~21%** of the exam.

> [!NOTE]
> This lesson maps to **Exam Objective 4.2**: *Optimize query performance*, including the Query Acceleration Service, Search Optimization Service, clustering keys, and Materialized Views.

---

## Performance Optimization Tools Overview

| Tool | What It Solves | Cost Model | Edition Required |
|---|---|---|---|
| **Clustering Keys** | Poor partition pruning | Automatic Clustering credits | Any |
| **Search Optimization Service** | Selective point lookups | Per-table service fee | Enterprise+ |
| **Query Acceleration Service** | Outlier slow queries on shared WH | Additional credits per query | Enterprise+ |
| **Materialized Views** | Repeated expensive aggregations | Background refresh credits | Enterprise+ |

---

## Clustering Keys

### When to Use Clustering Keys

Clustering is beneficial when:
- The table is **large** (hundreds of GBs or multiple TB)
- Queries **frequently filter** on specific columns
- The **natural load order** doesn't match the query filter columns

```sql
-- Check current clustering quality before adding a key
SELECT SYSTEM$CLUSTERING_INFORMATION(
    'orders',
    '(order_date)'
);
-- Returns: average_depth (lower is better), average_overlaps, etc.

-- Add a clustering key
ALTER TABLE orders CLUSTER BY (order_date);

-- Multi-column clustering key
ALTER TABLE events CLUSTER BY (region, event_type);

-- Expression-based clustering (cluster by date truncated to month)
ALTER TABLE orders CLUSTER BY (DATE_TRUNC('MONTH', order_date));

-- Check if Automatic Clustering is running
SHOW TABLES LIKE 'orders';
-- Look at: cluster_by, automatic_clustering columns
```

### Choosing Good Cluster Keys

**Good candidates:**
- High-cardinality columns used in WHERE clauses (dates, regions, categories)
- Columns used in frequently executed queries
- Join columns for large tables

**Poor candidates:**
- Very low cardinality (e.g., boolean columns — only 2 values)
- Very high cardinality with random distribution (e.g., UUID primary keys — poor pruning)
- Columns rarely used in filters

> [!WARNING]
> Clustering keys trigger **Automatic Clustering** — a background service that consumes credits continuously. Only cluster tables where the query performance gain outweighs the cost.

### Reclustering Cost

```sql
-- Monitor Automatic Clustering credit consumption
SELECT
    start_time,
    end_time,
    table_name,
    credits_used
FROM SNOWFLAKE.ACCOUNT_USAGE.AUTOMATIC_CLUSTERING_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
ORDER BY credits_used DESC;

-- Suspend Automatic Clustering if needed
ALTER TABLE orders SUSPEND RECLUSTER;

-- Resume
ALTER TABLE orders RESUME RECLUSTER;
```

---

## Search Optimization Service

**Search Optimization Service (SOS)** accelerates **high-selectivity point lookups** and equality searches that would otherwise scan many partitions:

### When to Use SOS

| Use Case | Suitable for SOS | Use Cluster Key Instead |
|---|---|---|
| `WHERE email = 'user@example.com'` | ✅ Yes | No |
| `WHERE order_id = 12345` | ✅ Yes | No |
| `WHERE region = 'US-EAST'` (range query, large result) | No | ✅ Yes |
| `WHERE order_date BETWEEN ... AND ...` | No | ✅ Yes |
| `WHERE v:user.id = 123` (semi-structured) | ✅ Yes | No |
| `CONTAINS(description, 'snowflake')` (substring search) | ✅ Yes | No |

```sql
-- Enable Search Optimization on a table
ALTER TABLE customers ADD SEARCH OPTIMIZATION;

-- Enable for specific columns only (more targeted, lower cost)
ALTER TABLE customers ADD SEARCH OPTIMIZATION ON EQUALITY(email, phone_number);

-- Enable for semi-structured JSON paths
ALTER TABLE events ADD SEARCH OPTIMIZATION ON EQUALITY(v:user.id);

-- Enable for substring search (LIKE, ILIKE, CONTAINS)
ALTER TABLE products ADD SEARCH OPTIMIZATION ON SUBSTRING(description);

-- Check SOS status
SHOW TABLES LIKE 'customers';
-- Look at: search_optimization_progress column

-- Monitor SOS build and maintenance cost
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.SEARCH_OPTIMIZATION_HISTORY;
```

> [!NOTE]
> SOS builds a hidden **access path index** optimized for equality lookups. It has an upfront build cost and ongoing maintenance cost. It is most effective when queries target a small fraction of rows (high selectivity).

### SOS vs Cluster Keys: Side-by-Side

| Aspect | Cluster Key | Search Optimization |
|---|---|---|
| Best for | Range scans, date filters, GROUP BY | Point lookups, exact equality |
| How it works | Reorganizes micro-partition order | Builds separate lookup index |
| Query pattern | `BETWEEN`, `>`, `<`, range filters | `= value`, `IN (...)` |
| Cost model | Reclustering credits (background) | Service fee + maintenance credits |
| Semi-structured | Limited | Excellent (`v:field = value`) |

---

## Query Acceleration Service (QAS)

**Query Acceleration Service (QAS)** offloads portions of **outlier slow queries** to Snowflake's serverless compute — useful when a small number of queries take disproportionately long on a shared warehouse:

### When to Use QAS

- Warehouse has many queries, most are fast, but a few are very slow (outliers)
- Outlier queries are slow because they process large amounts of data
- You don't want to upsize the entire warehouse for a few slow queries

```sql
-- Enable QAS on a warehouse
ALTER WAREHOUSE WH_ANALYTICS SET ENABLE_QUERY_ACCELERATION = TRUE;

-- Set the scale factor (limits how much serverless compute can be used)
-- Scale factor of 5 = QAS can use up to 5x the warehouse's credits
ALTER WAREHOUSE WH_ANALYTICS
    SET ENABLE_QUERY_ACCELERATION = TRUE
    QUERY_ACCELERATION_MAX_SCALE_FACTOR = 5;

-- Check if a query is eligible for QAS
SELECT SYSTEM$ESTIMATE_QUERY_ACCELERATION('<query_id>');

-- Monitor QAS usage
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_ACCELERATION_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

### QAS Billing

- When QAS is enabled, eligible queries automatically use serverless compute
- Billed at **serverless credit rates** (similar to Snowpipe) for the accelerated portion
- If QAS doesn't improve a query, it won't be used (no wasted credits)

---

## Materialized Views

A **Materialized View** pre-computes and stores the result of a SELECT query. Queries against the MV read the pre-computed result instead of re-executing the full query against the base table:

```sql
-- Create a materialized view
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT
    date_trunc('day', order_time) AS order_day,
    region,
    sum(amount) AS daily_revenue,
    count(*) AS order_count
FROM orders
WHERE status = 'COMPLETED'
GROUP BY 1, 2;

-- Query the MV (reads pre-computed data)
SELECT * FROM mv_daily_revenue
WHERE order_day >= DATEADD('month', -3, CURRENT_DATE)
ORDER BY daily_revenue DESC;
```

### How Materialized Views Work

- **Automatic refresh**: Snowflake's background service keeps the MV up-to-date as base table data changes
- **No warehouse needed**: Refresh is serverless
- **Transparent rewrite**: Snowflake may automatically route a query to the MV even if the query references the base table

```sql
-- Snowflake automatically rewrites this query to use the MV:
SELECT date_trunc('day', order_time), region, sum(amount)
FROM orders
WHERE status = 'COMPLETED'
GROUP BY 1, 2;
-- → Snowflake sees mv_daily_revenue can satisfy this and uses it
```

### Materialized View Limitations

| Limitation | Notes |
|---|---|
| Cannot reference other MVs | Must query base tables |
| No non-deterministic functions | `CURRENT_TIMESTAMP()`, `RANDOM()` not allowed |
| No joins in the MV definition | Simple aggregations only |
| Enterprise edition required | Not available on Standard |
| Single base table only | Cannot aggregate across multiple tables |

```sql
-- Monitor MV refresh cost and status
SELECT
    table_name AS mv_name,
    last_altered AS last_refresh,
    credits_used
FROM SNOWFLAKE.ACCOUNT_USAGE.MATERIALIZED_VIEW_REFRESH_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

---

## Choosing the Right Optimization Tool

Use this decision framework on the exam:

```
Query is slow because...

→ Too many micro-partitions scanned (range filter, date, region)?
    → CLUSTER KEY

→ Exact equality lookups on specific values (email, ID, UUID)?
    → SEARCH OPTIMIZATION SERVICE

→ Warehouse has occasional very slow outlier queries?
    → QUERY ACCELERATION SERVICE

→ The same expensive aggregation is run repeatedly?
    → MATERIALIZED VIEW

→ Query runs fine but result takes time every time?
    → QUERY RESULT CACHE (next lesson)
```

---

## Practice Questions

**Q1.** A table has 500 million rows. Analysts frequently run queries like `WHERE customer_email = 'user@example.com'`. Which optimization is MOST appropriate?

- A) Cluster Key on `customer_email`
- B) Search Optimization Service ✅
- C) Query Acceleration Service
- D) Materialized View

**Q2.** A warehouse runs 1,000 queries per day. 980 complete in under 5 seconds, but 20 take over 10 minutes. What optimization addresses the slow outlier queries without upsizing the entire warehouse?

- A) Cluster Key on the filter column
- B) Multi-cluster warehouse
- C) Query Acceleration Service ✅
- D) Search Optimization on all tables

**Q3.** A Materialized View is defined on a table. When is the MV's data refreshed?

- A) Only when manually triggered with ALTER MATERIALIZED VIEW REFRESH
- B) Automatically by Snowflake's background service as base data changes ✅
- C) Every time a query is run against the MV
- D) On a fixed schedule defined at creation time

**Q4.** Which clustering key candidate would provide the WORST pruning for a 1-billion-row orders table?

- A) `(order_date)` — date of order
- B) `(region)` — geographic region (20 values)
- C) `(order_uuid)` — randomly generated UUID primary key ✅
- D) `(product_category)` — 50 categories

**Q5.** Which Snowflake feature requires Enterprise edition for all of these capabilities: Materialized Views, Search Optimization, and Query Acceleration?

- A) Standard edition supports all three
- B) These features require Business Critical edition
- C) These features all require Enterprise edition or higher ✅
- D) Each feature requires a different edition level

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. **Cluster Key** = fix poor pruning on range/filter columns (BETWEEN, >, <)
> 2. **Search Optimization** = fix slow equality lookups (`= value`, semi-structured paths)
> 3. **Query Acceleration Service** = fix outlier slow queries on a shared warehouse
> 4. **Materialized View** = pre-compute repeated expensive aggregations
> 5. All four require **Enterprise edition or higher** for Search Optimization, QAS, and MVs
> 6. Cluster Key on a UUID/random column = poor pruning (avoid!)