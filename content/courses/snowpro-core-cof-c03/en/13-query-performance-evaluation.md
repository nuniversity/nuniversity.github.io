---
title: "Domain 4.1 — Evaluating Query Performance"
description: "Learn to diagnose Snowflake query performance issues using Query Profile, Query History, ACCOUNT_USAGE views, and understand the key performance bottlenecks: data spilling, inefficient pruning, exploding joins, and queuing."
order: 13
difficulty: intermediate
duration: "65 min"
---

# Domain 4.1 — Evaluating Query Performance

## Exam Weight

**Domain 4.0 — Performance Optimization, Querying, and Transformation** accounts for **~21%** of the exam — the second-largest domain.

> [!NOTE]
> This lesson maps to **Exam Objective 4.1**: *Evaluate query performance*, including Query Profile, Query Insights, ACCOUNT_USAGE views, and workload management best practices.

---

## The Query Performance Evaluation Workflow

When a query is slow, follow this diagnostic sequence:

```
1. Find the slow query → QUERY_HISTORY or Snowsight Query History
2. Open Query Profile → identify bottleneck
3. Read operator statistics → bytes spilled, rows processed, pruning
4. Fix the bottleneck → resize, cluster, rewrite, cache
```

---

## Query History

### Via Snowsight

In Snowsight: **Activity → Query History**

Filter by: user, warehouse, time range, duration, status, query type.

Click any query to open its **Query Profile**.

### Via SQL

```sql
-- Recent slow queries (> 60 seconds) in the last 24 hours
SELECT
    query_id,
    query_text,
    user_name,
    warehouse_name,
    total_elapsed_time / 1000 AS elapsed_seconds,
    bytes_spilled_to_local_storage,
    bytes_spilled_to_remote_storage,
    partitions_scanned,
    partitions_total,
    ROUND(partitions_scanned / NULLIF(partitions_total, 0) * 100, 1) AS pct_partitions_scanned
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('hour', -24, CURRENT_TIMESTAMP)
    AND total_elapsed_time > 60000  -- > 60 seconds
    AND execution_status = 'SUCCESS'
ORDER BY total_elapsed_time DESC
LIMIT 20;
```

---

## Query Profile

**Query Profile** is the primary tool for diagnosing query performance. Access it in Snowsight by clicking on any query in Query History.

### What Query Profile Shows

The Query Profile renders the **query execution plan** as a tree of operator nodes. Each operator node shows:

- **Rows processed** — input and output row counts
- **Time** — how long the operator ran
- **Bytes** — data read/processed/written
- **Step statistics** — per-node resource consumption

### Key Operator Nodes

| Node Type | Description |
|---|---|
| **TableScan** | Reads micro-partitions; shows pruning stats |
| **Filter** | Applies WHERE conditions |
| **Join** | Combines two data sets |
| **Aggregate** | GROUP BY computations |
| **Sort** | ORDER BY operations |
| **ResultSet** | Final output sent to client |
| **ExchangeDistribute** | Data movement between warehouse nodes |

---

## Common Performance Bottlenecks

### 1. Data Spilling to Storage

**What it is:** When query data exceeds the warehouse's memory and local disk, it overflows (spills) to remote storage — massively increasing I/O and latency.

**How to detect:**
- In Query Profile: `Bytes spilled to local storage` or `Bytes spilled to remote storage` > 0
- In QUERY_HISTORY: `BYTES_SPILLED_TO_LOCAL_STORAGE` or `BYTES_SPILLED_TO_REMOTE_STORAGE`

**Spilling severity:**

| Spill Type | Severity | Cause |
|---|---|---|
| Local disk spill | Moderate | Query exceeds node memory |
| Remote storage spill | Severe | Query exceeds node memory + local disk |

```sql
-- Find queries with significant spilling
SELECT
    query_id,
    query_text,
    warehouse_name,
    bytes_spilled_to_local_storage / POWER(1024,3) AS gb_spilled_local,
    bytes_spilled_to_remote_storage / POWER(1024,3) AS gb_spilled_remote,
    total_elapsed_time / 1000 AS elapsed_sec
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE bytes_spilled_to_remote_storage > 0
    AND start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
ORDER BY bytes_spilled_to_remote_storage DESC;
```

**Solution:** Scale **UP** the warehouse (larger size = more memory per node).

---

### 2. Inefficient Pruning

**What it is:** Snowflake can't skip micro-partitions because the filter column's values are spread across many partitions — the query reads more data than necessary.

**How to detect in Query Profile:**
- `TableScan` node shows `Partitions scanned` close to `Partitions total`
- `Partitions scanned / Partitions total` ratio is high (> 80% is poor)

```sql
-- Poor pruning example: no clustering on 'status'
SELECT sum(amount) FROM orders WHERE status = 'COMPLETED';
-- Scans 9,800 of 10,000 partitions

-- After clustering on 'status':
-- Scans 1,200 of 10,000 partitions
```

**Solutions:**
- Add a **Cluster Key** on the filtered column
- Ensure queries include high-cardinality filter columns that match the natural sort order
- Use **Search Optimization Service** for high-selectivity point lookups

---

### 3. Exploding Joins

**What it is:** A JOIN that produces **far more rows than expected** — often because join keys are not unique (many-to-many join creating a cartesian product).

**How to detect in Query Profile:**
- A `Join` node shows output rows >> input rows
- The join result is much larger than either input

```sql
-- Example: exploding join (non-unique key)
SELECT o.*, c.name
FROM orders o
JOIN customers c ON o.customer_segment = c.segment;
-- If orders has 10M rows and customers has 1000 rows with non-unique segment values
-- → Can produce billions of intermediate rows!

-- Fix: ensure join keys are unique, or aggregate first
SELECT o.*, c.name
FROM orders o
JOIN (SELECT DISTINCT segment, name FROM customers) c
ON o.customer_segment = c.segment;
```

**Solutions:**
- Verify join key uniqueness before writing the query
- Pre-aggregate before joining
- Use `DISTINCT` or deduplicate the smaller side

---

### 4. Queuing

**What it is:** Queries wait in a queue because all warehouse compute slots are occupied by other running queries.

**How to detect:**
- In Query Profile: query shows long time in `Queued` state before executing
- In QUERY_HISTORY: `QUEUED_OVERLOAD_TIME` is high

```sql
-- Find queries that spent significant time queued
SELECT
    query_id,
    query_text,
    warehouse_name,
    queued_overload_time / 1000 AS queued_sec,
    total_elapsed_time / 1000 AS total_sec
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE queued_overload_time > 10000  -- queued more than 10 seconds
    AND start_time > DATEADD('day', -1, CURRENT_TIMESTAMP)
ORDER BY queued_overload_time DESC;
```

**Solutions:**
- Enable **multi-cluster warehouse** (scale OUT) for concurrent workloads
- Create **separate warehouses** per team/workload
- Prioritize queries using separate warehouses for different SLAs

---

## ACCOUNT_USAGE Views for Performance Analysis

### Key Performance Views

```sql
-- Query attribution: which users/roles consume the most resources
SELECT
    user_name,
    role_name,
    count(*) AS query_count,
    sum(total_elapsed_time) / 1000 / 3600 AS total_hours,
    avg(total_elapsed_time) / 1000 AS avg_elapsed_sec,
    sum(credits_used_cloud_services) AS cloud_svc_credits
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('month', -1, CURRENT_TIMESTAMP)
GROUP BY 1, 2
ORDER BY total_hours DESC;

-- Warehouse utilization (avg queue depth)
SELECT
    start_time::DATE AS usage_date,
    warehouse_name,
    avg(avg_running) AS avg_concurrent_queries,
    avg(avg_queued_load) AS avg_queued_queries,
    avg(avg_blocked) AS avg_blocked_queries
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_LOAD_HISTORY
WHERE start_time > DATEADD('week', -4, CURRENT_TIMESTAMP)
GROUP BY 1, 2
ORDER BY avg_queued_queries DESC;

-- Most scanned tables (candidates for clustering)
SELECT
    table_name,
    count(*) AS scan_count,
    avg(partitions_scanned) AS avg_partitions_scanned,
    avg(partitions_total) AS avg_partitions_total,
    round(avg(partitions_scanned) / NULLIF(avg(partitions_total), 0) * 100, 1) AS avg_scan_pct
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE partitions_total > 0
    AND start_time > DATEADD('day', -30, CURRENT_TIMESTAMP)
GROUP BY 1
HAVING avg_scan_pct > 50  -- poor pruning
ORDER BY scan_count DESC;
```

---

## Workload Management Best Practices

### Group Similar Workloads

Isolate workloads by type to avoid cross-contamination:

```sql
-- Dedicated warehouses per workload type
CREATE WAREHOUSE WH_ETL      WAREHOUSE_SIZE = LARGE;   -- batch ingestion
CREATE WAREHOUSE WH_BI       WAREHOUSE_SIZE = SMALL     -- BI dashboards
                             MAX_CLUSTER_COUNT = 5;     -- handle concurrency
CREATE WAREHOUSE WH_DS       WAREHOUSE_SIZE = MEDIUM;   -- data science
CREATE WAREHOUSE WH_ADHOC    WAREHOUSE_SIZE = MEDIUM;   -- ad-hoc analyst queries
```

### Query Tagging for Attribution

```sql
-- Tag queries for cost attribution
ALTER SESSION SET QUERY_TAG = 'team:analytics project:q4-reporting';

-- Query by tag in ACCOUNT_USAGE
SELECT query_tag, count(*), sum(total_elapsed_time)
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE query_tag LIKE '%analytics%'
GROUP BY 1;
```

---

## Performance Troubleshooting Cheat Sheet

| Symptom | Root Cause | Solution |
|---|---|---|
| Query is slow, big spilling | Not enough memory/disk | Scale UP warehouse |
| Query scans too many partitions | Poor data clustering | Add Cluster Key |
| Join produces huge result set | Non-unique join keys (cartesian) | Deduplicate, check keys |
| Queries wait before starting | Warehouse concurrency full | Multi-cluster or separate WH |
| Fast query but slow over time | Table grown, clustering degraded | Enable Automatic Clustering |
| One warehouse steals resources | Workload mixing | Create dedicated warehouses |

---

## Practice Questions

**Q1.** A Query Profile shows `Bytes spilled to remote storage = 45 GB`. What is the BEST solution?

- A) Add a cluster key on the filter column
- B) Increase the warehouse size ✅
- C) Enable multi-cluster warehouse
- D) Use the query result cache

**Q2.** A query scans 9,500 out of 10,000 micro-partitions on the `orders` table. Which metric in Query Profile reveals this?

- A) Bytes spilled to local storage
- B) Rows produced by the join
- C) Partitions scanned vs Partitions total ✅
- D) Queued overload time

**Q3.** A query unexpectedly joins and produces 10 billion rows from two 1-million-row tables. What is the most likely cause?

- A) Data is spilling to remote storage
- B) The join condition creates a many-to-many (cartesian) join ✅
- C) The warehouse is too small
- D) The result cache is disabled

**Q4.** Which ACCOUNT_USAGE view provides information about concurrent query load and queuing on warehouses?

- A) QUERY_HISTORY
- B) WAREHOUSE_METERING_HISTORY
- C) WAREHOUSE_LOAD_HISTORY ✅
- D) TABLE_STORAGE_METRICS

**Q5.** A team's ad-hoc queries are slowing down because their BI dashboard queries are consuming all warehouse slots. What is the BEST solution?

- A) Increase the warehouse size to 4X-Large
- B) Create separate warehouses for BI and ad-hoc workloads ✅
- C) Enable the query result cache
- D) Add a cluster key on all tables

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. **Query Profile** = primary diagnostic tool — find it in Snowsight Activity → Query History
> 2. **Spilling** = warehouse too small → scale UP | **Queuing** = too many concurrent queries → scale OUT
> 3. **Inefficient pruning** = high `partitions_scanned / partitions_total` → add cluster key
> 4. **Exploding join** = join node output >> input → check for non-unique keys
> 5. `WAREHOUSE_LOAD_HISTORY` = queuing/concurrency metrics
> 6. Use `QUERY_TAG` for workload attribution and cost tracking