---
title: "Domain 1.4 — Snowflake Architecture"
description: "Deep dive into Snowflake's three-layer architecture: cloud services, query processing (virtual warehouses), and centralized storage — and how they interact."
order: 4
difficulty: intermediate
duration: "75 min"
---

# Domain 1.4 — Snowflake Architecture

> [!NOTE]
> This lesson maps to **Exam Objective 1.4**: *Explain Snowflake architecture.*  
> This is the **highest-weighted topic in Domain 1.0** and one of the most tested areas across the entire COF-C03 exam.

---

## The Three-Layer Architecture

Snowflake's architecture consists of three independent, loosely coupled layers:

```
┌──────────────────────────────────────────────────────────────┐
│                  LAYER 3: CLOUD SERVICES                     │
│                                                              │
│  Authentication │ Authorization │ Metadata │ Query Compiler  │
│  Query Optimizer │ Transaction Mgr │ Infrastructure Mgr      │
└──────────────────────────┬───────────────────────────────────┘
                           │ orchestrates
┌──────────────────────────▼───────────────────────────────────┐
│              LAYER 2: QUERY PROCESSING                       │
│                   (Virtual Warehouses)                       │
│                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │ WH_SMALL │  │ WH_LARGE │  │ WH_INGEST│  │  WH_DS   │   │
│   │ (2 nodes)│  │ (8 nodes)│  │ (4 nodes)│  │ (16 nodes│   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│             Each VW = MPP cluster with local SSD cache       │
└──────────────────────────┬───────────────────────────────────┘
                           │ reads/writes
┌──────────────────────────▼───────────────────────────────────┐
│                 LAYER 1: CENTRALIZED STORAGE                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Columnar Micro-partitions (50–500 MB compressed)       │  │
│  │  AES-256 encrypted │ Metadata stored in cloud services  │  │
│  │  Backed by: AWS S3 │ Azure Blob │ Google Cloud Storage  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Each layer scales and is billed **independently**.

---

## Layer 1: Centralized Storage

### Micro-Partitions

Snowflake stores all table data as **micro-partitions** — immutable, contiguous chunks of data stored in a columnar format.

| Property | Value |
|---|---|
| **Size (uncompressed)** | 50 MB – 500 MB |
| **Format** | Columnar (column-first ordering) |
| **Compression** | Automatic — AES-256 |
| **Immutability** | Write-once — DML creates new partitions |
| **Location** | Cloud object storage (S3/Blob/GCS) |

```
TABLE: ORDERS
──────────────────────────────────────────
Micro-partition 1        Micro-partition 2
┌────────────────┐       ┌────────────────┐
│ ORDER_ID: 1-100│       │ ORDER_ID: 101-200│
│ STATUS: col2   │       │ STATUS: col2    │
│ AMOUNT: col3   │       │ AMOUNT: col3    │
│ DATE: col4     │       │ DATE: col4      │
│                │       │                 │
│ Min/Max stored │       │ Min/Max stored  │
│ per column     │       │ per column      │
└────────────────┘       └─────────────────┘
```

### Metadata per Micro-partition

Snowflake automatically stores **metadata** for each micro-partition:
- **Row count**
- **Min and max value** of each column
- **Null count** per column
- **Distinct value count**

This metadata is used for **partition pruning** — the query optimizer skips partitions that cannot contain relevant data.

### Natural Clustering

Data is organized into micro-partitions based on the **order it was inserted**. This is called **natural clustering**.

```sql
-- Data inserted in date order naturally clusters by date
INSERT INTO ORDERS SELECT * FROM STAGING_ORDERS ORDER BY ORDER_DATE;
-- Result: micro-partitions tend to contain orders from the same date range
-- Queries filtering on ORDER_DATE will prune effectively
```

### Automatic Clustering (Clustering Keys)

For large tables where natural clustering is insufficient, you can define a **Clustering Key** to reorganize micro-partitions:

```sql
-- Define a clustering key on ORDER_DATE
ALTER TABLE ORDERS CLUSTER BY (ORDER_DATE);
-- Snowflake automatically re-clusters data in the background
```

> [!WARNING]
> Clustering keys incur **additional cost** for the background re-clustering compute. Use only for very large tables (hundreds of GB+) with predictable filter patterns.

---

## Layer 2: Query Processing — Virtual Warehouses

### What Is a Virtual Warehouse?

A **Virtual Warehouse (VW)** is a **named, managed cluster of compute resources** (virtual machines) that executes SQL queries, DML, and data loading operations.

- Each VW is an **MPP (Massively Parallel Processing)** cluster
- Nodes in a VW have **local SSD disk cache** for hot data
- Multiple VWs can run **simultaneously** against the same storage without interference

### Virtual Warehouse Sizes

| Size | Servers | Credits/Hour | Use Case |
|---|---|---|---|
| X-Small | 1 | 1 | Development, small queries |
| Small | 2 | 2 | Light workloads |
| Medium | 4 | 4 | Standard analytics |
| Large | 8 | 8 | Complex queries, ELT |
| X-Large | 16 | 16 | Heavy ETL, ML training |
| 2X-Large | 32 | 32 | Very large datasets |
| 3X-Large | 64 | 64 | Extreme workloads |
| 4X-Large | 128 | 128 | Maximum performance |
| 5X-Large | 256 | 256 | |
| 6X-Large | 512 | 512 | |

> [!NOTE]
> Credits/hour = servers count. Doubling the warehouse size **doubles the cost** but can halve the query execution time — the cost is roughly the same, but you get results faster.

### Warehouse States

| State | Billing | Description |
|---|---|---|
| **Started (Running)** | ✅ Credits charged | Actively running queries or idle after last query |
| **Suspended** | ❌ No credits | Warehouse is dormant, resumes when a query arrives |
| **Resuming** | ❌ Typically free | Starting back up (usually seconds) |

### Auto-Suspend and Auto-Resume

```sql
-- Create a warehouse with auto-suspend after 60 seconds of inactivity
CREATE WAREHOUSE COMPUTE_WH
  WAREHOUSE_SIZE = 'MEDIUM'
  AUTO_SUSPEND = 60        -- seconds (default: 600)
  AUTO_RESUME = TRUE;      -- auto-start when a query arrives

-- Change suspend timeout
ALTER WAREHOUSE COMPUTE_WH SET AUTO_SUSPEND = 300;
```

> [!NOTE]
> **Best practice**: Set `AUTO_SUSPEND` as low as makes sense for your workload. A warehouse sitting idle burns credits for nothing. `AUTO_RESUME = TRUE` ensures users don't get errors when submitting queries.

### Multi-Cluster Warehouses (Enterprise+)

A **Multi-Cluster Warehouse** automatically adds additional clusters to handle query concurrency spikes.

```sql
CREATE WAREHOUSE REPORTING_WH
  WAREHOUSE_SIZE = 'LARGE'
  MIN_CLUSTER_COUNT = 1     -- minimum clusters running
  MAX_CLUSTER_COUNT = 5     -- maximum clusters (scale out limit)
  SCALING_POLICY = 'STANDARD';  -- or 'ECONOMY'
```

| Scaling Policy | Behavior |
|---|---|
| **Standard** | Prioritizes performance — adds clusters immediately when queues form |
| **Economy** | Prioritizes cost — waits for queues before adding clusters |

Multi-cluster warehouses solve **concurrency problems** (too many simultaneous queries). They do **not** make individual queries faster — increase warehouse size for that.

### Query Queuing

When a single-cluster warehouse is at full concurrency:
- Incoming queries are placed in a **queue**
- Queued queries wait for running queries to complete
- Multi-cluster warehouses eliminate queuing by adding more clusters

---

## Layer 3: Cloud Services

The **Cloud Services Layer** is the "brain" of Snowflake. It's always running (no virtual warehouse needed) and handles:

| Function | Description |
|---|---|
| **Authentication** | Username/password, SSO (SAML 2.0), MFA, OAuth, Key Pair |
| **Authorization** | RBAC — role-based access control for all objects |
| **Infrastructure management** | Manages the virtual warehouse VMs |
| **Metadata management** | Stores all micro-partition metadata, table statistics |
| **Query compilation** | Parses SQL → logical plan |
| **Query optimization** | Rewrites query plan for efficiency (partition pruning, join ordering) |
| **Transaction management** | ACID compliance, serializable isolation |

### Cloud Services Billing

Cloud Services Layer usage is **not charged** if it remains under **10% of the daily virtual warehouse compute usage**. If it exceeds 10%, the overage is billed.

```
Daily VW usage: 100 credits
Cloud Services (free threshold): ≤ 10 credits/day → FREE
Cloud Services (if > 10 credits): charged for the overage
```

---

## Data Caching in Snowflake

Snowflake uses **three levels of caching** to optimize query performance:

### 1. Metadata Cache (Cloud Services Layer)

- Stores micro-partition statistics (min/max, row counts, etc.)
- Enables **partition pruning** without touching actual data
- Always available — no warm-up needed
- Lives in Cloud Services layer (no VW required)

### 2. Result Cache (Cloud Services Layer)

- Stores the **exact result set** of a previously executed query
- If the **same query is resubmitted** and the underlying data hasn't changed, the result is returned instantly — **no compute used**
- Cache persists for **24 hours** (resets if underlying table changes)
- Can be disabled: `ALTER SESSION SET USE_CACHED_RESULT = FALSE`

```sql
-- First execution: uses compute, result cached
SELECT COUNT(*) FROM ORDERS WHERE STATUS = 'COMPLETED';
-- Runs in, say, 5 seconds

-- Second execution (within 24h, no data changes): instant
SELECT COUNT(*) FROM ORDERS WHERE STATUS = 'COMPLETED';
-- Returns immediately from result cache — 0 credits used
```

### 3. Local Disk Cache (Virtual Warehouse — SSD)

- Each virtual warehouse node has **local SSD storage**
- Caches **micro-partition data** that was read from remote storage (S3/Blob/GCS)
- Subsequent queries on the same data read from local SSD — much faster
- Cache is **lost when the warehouse is suspended** (cold start after suspension)
- Larger warehouses have more total SSD cache capacity

```
Query 1: reads micro-partitions from S3 → loaded into local SSD → result returned
Query 2: reads same micro-partitions → found in local SSD → result returned faster
WH suspended → SSD cache cleared
Query 3 (after resume): reads from S3 again (cold)
```

| Cache | Location | Survives Suspension? | Credit Cost on Hit |
|---|---|---|---|
| Metadata cache | Cloud Services | ✅ Yes | None |
| Result cache | Cloud Services | ✅ Yes (24h) | None |
| Local disk cache | Virtual Warehouse SSD | ❌ No | None (just faster) |

---

## ACID Transactions in Snowflake

Snowflake provides full **ACID compliance** using **Optimistic Concurrency Control (OCC)**:

| Property | Snowflake Implementation |
|---|---|
| **Atomicity** | DML operations are all-or-nothing |
| **Consistency** | All constraints enforced before commit |
| **Isolation** | **Snapshot isolation** — each transaction sees a consistent snapshot |
| **Durability** | Committed data persisted to micro-partitions in cloud storage |

### Isolation Level

Snowflake uses **Snapshot Isolation** (not full serializable by default):
- Reads see the state of data **at the start of the transaction**
- Concurrent writes to different rows don't block each other
- Write-write conflicts are detected and the second writer gets an error

---

## Logical Object Hierarchy

All Snowflake objects follow this containment hierarchy:

```
Organization
  └── Account(s)
        └── Database(s)
              └── Schema(s)
                    ├── Table(s)
                    ├── View(s)
                    ├── Stage(s)
                    ├── Pipe(s)
                    ├── Stream(s)
                    ├── Task(s)
                    ├── Sequence(s)
                    ├── Stored Procedure(s)
                    └── UDF(s)
```

### Table Types

| Type | Persistence | Time Travel | Fail-Safe | Use Case |
|---|---|---|---|---|
| **Permanent** | Persists until dropped | Yes (0–90 days) | Yes (7 days) | Production data |
| **Transient** | Persists until dropped | Yes (0–1 day) | ❌ No | Staging/intermediate data |
| **Temporary** | Session only — auto-dropped | Yes (0–1 day) | ❌ No | Session-scoped temp work |
| **External** | Data in external storage | ❌ No | ❌ No | Query data in S3/Blob/GCS without loading |

```sql
-- Create a transient table (no Fail-Safe = lower storage cost)
CREATE TRANSIENT TABLE STAGING_ORDERS LIKE ORDERS;

-- Create a temporary table (auto-dropped at end of session)
CREATE TEMPORARY TABLE SESSION_WORK AS
SELECT * FROM ORDERS WHERE STATUS = 'PENDING';
```

### View Types

| Type | Definition Visible? | Pushdown Optimization | Use Case |
|---|---|---|---|
| **Standard View** | ✅ Yes | Partial | General SQL abstraction |
| **Secure View** | ❌ Hidden | No (intentional) | Sharing sensitive logic |
| **Materialized View** | ✅ Yes | Yes | Pre-computed aggregations |

> [!WARNING]
> **Secure views** intentionally **disable some optimizations** to prevent inferring the underlying query from execution plans. This is a security trade-off, not a bug.

---

## Stages

A **Stage** is a named storage location used to move data in and out of Snowflake.

### Stage Types

| Type | Location | Managed By | Use Case |
|---|---|---|---|
| **Internal — User** (`@~`) | Snowflake-managed storage | Snowflake | Personal staging area |
| **Internal — Table** (`@%TABLE`) | Snowflake-managed, per-table | Snowflake | Files destined for specific table |
| **Internal — Named** (`@MY_STAGE`) | Snowflake-managed | Customer (CREATE STAGE) | Shared, reusable staging |
| **External — Named** | AWS S3, Azure Blob, GCS | Customer (cloud bucket) | Data already in cloud storage |

```sql
-- Create a named internal stage
CREATE STAGE MY_INTERNAL_STAGE
  ENCRYPTION = (TYPE = 'SNOWFLAKE_SSE');

-- Create a named external stage pointing to S3
CREATE STAGE MY_S3_STAGE
  URL = 's3://my-bucket/data/'
  CREDENTIALS = (AWS_KEY_ID = '...' AWS_SECRET_KEY = '...');

-- List files in a stage
LIST @MY_S3_STAGE;

-- Copy from stage into table
COPY INTO ORDERS FROM @MY_S3_STAGE/orders/
  FILE_FORMAT = (TYPE = 'CSV' FIELD_DELIMITER = ',' SKIP_HEADER = 1);
```

---

## Practice Questions

**Q1.** Which layer of Snowflake's architecture is responsible for query optimization and authorization?

- A) Virtual Warehouse layer  
- B) Storage layer  
- C) Cloud Services layer ✅  
- D) Network layer

**Q2.** A query is re-submitted 2 hours after its first execution. The underlying data has not changed. What happens?

- A) The virtual warehouse runs the query again  
- B) The result is served from the local disk cache  
- C) The result is served from the result cache — no compute used ✅  
- D) The query fails because the cache expired

**Q3.** What happens to the local disk (SSD) cache when a virtual warehouse is suspended?

- A) It is persisted for 24 hours  
- B) It is uploaded to cloud storage  
- C) It is cleared and lost ✅  
- D) It is transferred to the Cloud Services layer

**Q4.** A table is created as TRANSIENT. Which of the following is TRUE?

- A) It has no Time Travel capability  
- B) It has Time Travel (up to 1 day) but no Fail-Safe ✅  
- C) It has both Time Travel and Fail-Safe  
- D) It is automatically dropped at the end of the session

**Q5.** Which warehouse scaling policy adds additional clusters as soon as a query queue forms?

- A) Economy  
- B) Standard ✅  
- C) Premium  
- D) Burst

**Q6.** What is the maximum size of a Snowflake micro-partition (uncompressed)?

- A) 50 MB  
- B) 100 MB  
- C) 500 MB ✅  
- D) 1 GB

**Q7.** Cloud Services compute usage is free as long as it stays under what percentage of daily virtual warehouse usage?

- A) 5%  
- B) 10% ✅  
- C) 15%  
- D) 20%

**Q8.** A secure view is used instead of a regular view in a share. What is the primary reason?

- A) Secure views are faster  
- B) Secure views support Time Travel  
- C) Secure views hide the view definition from the consumer ✅  
- D) Regular views cannot query external tables

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**  
> 1. Three layers: **Cloud Services → Virtual Warehouse → Storage** (each independent, each billed separately)  
> 2. Micro-partitions: **50–500 MB, columnar, immutable, auto-compressed/encrypted**  
> 3. Result cache = **24 hours, no compute, in Cloud Services** — survives warehouse suspension  
> 4. Local disk cache = **lost on warehouse suspension**  
> 5. **Transient** table = Time Travel (max 1 day) + NO Fail-Safe  
> 6. **Temporary** table = session-only + Time Travel (max 1 day) + NO Fail-Safe  
> 7. Multi-cluster WH = solves **concurrency** (not individual query speed)  
> 8. Cloud Services billing = free if ≤ **10%** of daily VW compute
