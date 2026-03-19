---
title: "Domain 4.3 — Snowflake Caching"
description: "Master Snowflake's three-layer caching system: Query Result Cache (Cloud Services layer), Metadata Cache, and Warehouse (local disk) Cache. Understand when each cache is used and how to leverage them."
order: 15
difficulty: intermediate
duration: "45 min"
---

# Domain 4.3 — Snowflake Caching

## Exam Weight

**Domain 4.0** accounts for **~21%** of the exam. Caching is a favorite exam topic because of its specific rules and behaviors.

> [!NOTE]
> This lesson maps to **Exam Objective 4.3**: *Use Snowflake caching*, including query result cache, metadata cache, and warehouse cache.

---

## Overview of Snowflake's Cache Layers

Snowflake has **three distinct caches** operating at different layers:

```
┌──────────────────────────────────────────────────────┐
│            CLOUD SERVICES LAYER                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │         QUERY RESULT CACHE                      │ │
│  │  Stores complete query results for 24 hours     │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │         METADATA CACHE                          │ │
│  │  Table statistics, MIN/MAX, counts, schema info │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│             COMPUTE LAYER (Virtual WH)               │
│  ┌─────────────────────────────────────────────────┐ │
│  │         WAREHOUSE (LOCAL DISK) CACHE            │ │
│  │  SSD cache of recently accessed micro-partitions│ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Cache 1: Query Result Cache

The **Query Result Cache** stores the **complete result set** of a query and returns it instantly if the exact same query is resubmitted — **without executing the query at all** and **without using the virtual warehouse**.

### How It Works

1. A query is executed → result computed and stored in the result cache
2. Same query submitted by any user within 24 hours → result returned instantly
3. No warehouse credit consumed for the cached result

### Rules for Cache Hits

A query uses the result cache **only if ALL of the following are true**:

| Condition | Requirement |
|---|---|
| **Exact same SQL text** | Query text must be byte-for-byte identical (including whitespace, capitalization) |
| **Same role** | The role executing the query must have the same privileges |
| **No underlying data change** | The tables queried must not have been modified |
| **Same session parameters** | Date format, timezone, and other parameters must match |
| **Within 24 hours** | The cache entry must be less than 24 hours old |
| **`USE_CACHED_RESULT = TRUE`** | Parameter must be enabled (default: TRUE) |

> [!WARNING]
> Even a single extra space in the SQL text will cause a cache miss. `SELECT count(*) FROM orders;` and `select count(*) from orders;` are different queries (case matters for cache key matching).

### Disabling the Result Cache

```sql
-- Disable result cache for a session (useful for benchmarking)
ALTER SESSION SET USE_CACHED_RESULT = FALSE;

-- Re-enable
ALTER SESSION SET USE_CACHED_RESULT = TRUE;

-- Check current setting
SHOW PARAMETERS LIKE 'USE_CACHED_RESULT';
```

### Identifying Cache Hits in Query History

```sql
-- Find queries that used the result cache
SELECT
    query_id,
    query_text,
    user_name,
    execution_status,
    total_elapsed_time,
    -- execution_time = 0 means result cache was used
    execution_time
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE execution_time = 0
    AND start_time > DATEADD('hour', -24, CURRENT_TIMESTAMP)
LIMIT 20;
```

In Snowsight Query History, cached queries show `Query Result Reuse` status.

### Cost Implications

| Scenario | Warehouse Used | Credits Consumed |
|---|---|---|
| First execution | Yes | Yes |
| Result cache hit (within 24h, same SQL, no data change) | **No** | **0 credits** |

---

## Cache 2: Metadata Cache

The **Metadata Cache** stores **table statistics and object metadata** collected by Snowflake's Cloud Services layer. This metadata is used to:

- Answer **metadata-only queries** without touching the warehouse
- Enable **partition pruning** (min/max per partition per column)
- Power the **query optimizer** (estimated row counts, cardinality)

### Metadata-Only Queries (No Warehouse Needed)

These queries are answered entirely from the metadata cache — no virtual warehouse required:

```sql
-- Row count (metadata only)
SELECT COUNT(*) FROM orders;

-- MIN and MAX of a column (metadata)
SELECT MIN(order_date), MAX(order_date) FROM orders;

-- SHOW commands (metadata)
SHOW TABLES IN DATABASE analytics;
SHOW COLUMNS IN TABLE orders;

-- Object existence checks
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'ORDERS';
```

> [!NOTE]
> `COUNT(*)` on a table without a WHERE clause is answered from the metadata cache — **no warehouse credit consumed**. This is a common exam trick: `COUNT(*)` = free; `COUNT(column_name)` with non-null checks may require compute.

### How Metadata Cache Powers Pruning

For each micro-partition and column, Snowflake's metadata stores:
- Minimum value
- Maximum value
- Number of distinct values
- NULL count

At query time, the optimizer uses this metadata to **skip partitions** that can't contain matching rows:

```sql
-- The optimizer checks metadata: which partitions have order_date in 2025-01?
SELECT sum(amount) FROM orders WHERE order_date BETWEEN '2025-01-01' AND '2025-01-31';
-- Only partitions where MAX(order_date) >= 2025-01-01 AND MIN(order_date) <= 2025-01-31 are read
```

---

## Cache 3: Warehouse (Local Disk) Cache

The **Warehouse Cache** (also called the **local disk cache** or **data cache**) stores **recently accessed micro-partitions** on the **SSD of virtual warehouse nodes**.

### How It Works

- When a micro-partition is read from storage, it is cached on the warehouse's local SSD
- Subsequent queries that need the same micro-partition read from the **local cache** instead of cloud storage → much faster
- Cache lives in the warehouse — **when the warehouse is suspended, the cache is lost**

### Implications

| Scenario | Data Source | Speed |
|---|---|---|
| Cold warehouse (first query after resume) | Cloud storage (S3/Blob/GCS) | Slower |
| Warm warehouse (repeated queries, same data) | Local SSD cache | Faster |
| Warehouse suspended and resumed | Cloud storage again | Slower (cache cleared) |

> [!WARNING]
> **Suspending a warehouse clears the warehouse cache**. For performance-sensitive workloads where cache warmth matters, consider using **`INITIALLY_SUSPENDED = FALSE`** or setting a higher `AUTO_SUSPEND` to keep the cache warm.

### Cache Warming Strategies

```sql
-- Option 1: Run the most common query after resume to warm cache
-- (This is sometimes done in ETL workflows)
SELECT COUNT(*) FROM large_table;  -- causes micro-partitions to be cached

-- Option 2: Increase auto-suspend to retain cache between queries
ALTER WAREHOUSE WH_BI SET AUTO_SUSPEND = 600;  -- 10 minutes

-- Option 3: Dedicate a warehouse to repeated workloads (cache stays warm)
-- Don't share the BI warehouse with ETL that reads different data
```

### Multi-Cluster Warehouses and Caching

> [!NOTE]
> Each cluster in a multi-cluster warehouse maintains its **own separate cache**. Data cached in Cluster 1 is not available to Cluster 2. This is why query routing in multi-cluster setups is important — routing similar queries to the same cluster maximizes cache hits.

---

## Cache Hierarchy Summary

When a query executes, Snowflake checks caches in this order:

```
1. Query Result Cache (Cloud Services)
   └── Hit? Return result instantly, zero credits
   └── Miss? Continue...

2. Warehouse Local Disk Cache (SSD)
   └── Hit? Read from local SSD, no remote I/O
   └── Miss? Continue...

3. Remote Storage (S3/Azure/GCS)
   └── Read micro-partitions, populate warehouse cache
```

---

## Practice Questions

**Q1.** A query executed at 10:00 AM returns results and the result is cached. The same exact query is run at 9:00 AM the next day. What happens?

- A) The cached result is returned instantly ✅
- B) The query is re-executed because more than 24 hours have passed — 10:00 AM is exactly 23 hours later at 9:00 AM next day
- C) The query fails because the cache expired
- D) The result cache only works within the same session

**Q2.** Which action clears the Warehouse (local disk) cache?

- A) Running a new query that accesses different tables
- B) Resizing the warehouse
- C) Suspending the warehouse ✅
- D) Switching to a different role

**Q3.** A developer wants to benchmark a query's true execution time without cache interference. Which command prevents the result cache from being used?

- A) `ALTER WAREHOUSE WH SET CACHE = FALSE`
- B) `ALTER SESSION SET USE_CACHED_RESULT = FALSE` ✅
- C) `ALTER TABLE my_table DISABLE CACHE`
- D) `SET QUERY_CACHE = NONE`

**Q4.** Which SQL statement can be answered without a virtual warehouse using the Metadata Cache?

- A) `SELECT * FROM orders WHERE amount > 100`
- B) `SELECT region, sum(amount) FROM orders GROUP BY region`
- C) `SELECT COUNT(*) FROM orders` ✅
- D) `SELECT DISTINCT customer_id FROM orders`

**Q5.** User A runs `SELECT sum(amount) FROM orders WHERE region = 'US'` at 2 PM. User B runs the same query at 3 PM with the same role and no data has changed. What happens?

- A) User B's query executes fresh (different user means no cache hit)
- B) User B's query hits the result cache and returns instantly ✅
- C) User B's query hits the warehouse cache but still uses the warehouse
- D) The cache only applies to the user who ran the original query

**Q6.** In a multi-cluster warehouse with 3 active clusters, which statement about caching is TRUE?

- A) All three clusters share one common cache
- B) Each cluster maintains its own independent local disk cache ✅
- C) The warehouse cache is stored in the Cloud Services layer
- D) Multi-cluster warehouses do not support caching

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. **Result Cache**: 24-hour window, exact SQL match, same role, no data change → **zero credits, no warehouse**
> 2. **Metadata Cache**: answers `COUNT(*)`, `MIN()`, `MAX()` on full tables → **no warehouse needed**
> 3. **Warehouse Cache**: local SSD, lost when warehouse **suspends**, each cluster has its own
> 4. Cache check order: Result → Warehouse Local → Remote Storage
> 5. `ALTER SESSION SET USE_CACHED_RESULT = FALSE` → bypass result cache
> 6. Result cache is **shared across users** with same role and same SQL