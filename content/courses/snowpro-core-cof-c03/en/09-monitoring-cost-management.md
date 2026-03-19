---
title: "Domain 2.3 — Monitoring and Cost Management"
description: "Learn to monitor and control Snowflake costs using Resource Monitors, ACCOUNT_USAGE views, credit calculation, warehouse monitoring, and cost attribution strategies."
order: 9
difficulty: intermediate
duration: "55 min"
---

# Domain 2.3 — Monitoring and Cost Management

## Exam Weight

**Domain 2.0** accounts for **~20%** of the exam. Cost management is a practical, frequently tested area.

> [!NOTE]
> This lesson maps to **Exam Objective 2.3**: *Explain monitoring and cost management*, including Resource Monitors, virtual warehouse credit usage calculation, and the ACCOUNT_USAGE schema.

---

## Snowflake Cost Components

Snowflake billing has three main components:

| Component | Billed By | How to Control |
|---|---|---|
| **Compute** | Credits consumed by virtual warehouses | Auto-suspend, right-size, Resource Monitors |
| **Storage** | Per TB per month (compressed) | Remove unused data, reduce Time Travel |
| **Cloud Services** | Credits for Cloud Services > 10% of compute | Minimize unnecessary metadata operations |
| **Serverless features** | Credits (Automatic Clustering, Snowpipe, etc.) | Configure appropriately |

---

## Resource Monitors

A **Resource Monitor** enforces a **credit budget** on virtual warehouses at the account or warehouse level. When a threshold is hit, it can **notify** administrators or **suspend** warehouses.

### Creating a Resource Monitor

```sql
CREATE RESOURCE MONITOR quarterly_budget
    CREDIT_QUOTA = 5000          -- credit limit for the period
    FREQUENCY = MONTHLY          -- MONTHLY, DAILY, WEEKLY, YEARLY, NEVER
    START_TIMESTAMP = '2025-01-01 00:00:00'
    TRIGGERS
        ON 75 PERCENT DO NOTIFY           -- send email alert at 75%
        ON 90 PERCENT DO NOTIFY           -- send another alert at 90%
        ON 100 PERCENT DO SUSPEND         -- suspend warehouse at 100%
        ON 110 PERCENT DO SUSPEND_IMMEDIATE; -- force-suspend all running queries at 110%
```

### Trigger Actions

| Action | Behavior |
|---|---|
| `NOTIFY` | Send email to account administrators |
| `SUSPEND` | Queue new queries; let running queries finish, then suspend |
| `SUSPEND_IMMEDIATE` | Kill all running queries and suspend immediately |

### Attaching a Resource Monitor

```sql
-- Attach to the account (applies to all warehouses)
ALTER ACCOUNT SET RESOURCE_MONITOR = quarterly_budget;

-- Attach to specific warehouses
ALTER WAREHOUSE WH_ANALYTICS SET RESOURCE_MONITOR = quarterly_budget;
ALTER WAREHOUSE WH_INGEST SET RESOURCE_MONITOR = quarterly_budget;
```

> [!WARNING]
> Resource Monitors track **virtual warehouse compute credits** only. They do **not** track storage costs, Snowpipe credits, or Cloud Services credits separately. Also, Resource Monitors operate **at no additional credit cost**.

### Resource Monitor Scope

| Level | Scope |
|---|---|
| **Account-level** | Tracks all credit usage across all warehouses |
| **Warehouse-level** | Tracks usage of specific warehouses only |

> [!NOTE]
> A warehouse can have **one Resource Monitor** assigned to it. If a warehouse has a warehouse-level monitor AND the account has an account-level monitor, **both** apply independently.

---

## Calculating Virtual Warehouse Credit Usage

Credits are consumed **per second** while a warehouse is running (with a 60-second minimum per start):

```
Credits Consumed = Warehouse Size (credits/hour) × Time Running (hours)

Example:
  Large warehouse (8 credits/hour)
  Runs for 45 minutes = 0.75 hours
  
  Credits = 8 × 0.75 = 6 credits
  
But if it starts, runs for 30 seconds, then is suspended:
  Minimum = 1 minute = 8 × (1/60) = 0.133 credits
```

### Credit Usage by Size

| Size | Credits/Hour |
|---|---|
| X-Small | 1 |
| Small | 2 |
| Medium | 4 |
| Large | 8 |
| X-Large | 16 |
| 2X-Large | 32 |
| 3X-Large | 64 |
| 4X-Large | 128 |

For **multi-cluster warehouses**:
```
Total Credits = Credits/Hour per cluster × Number of active clusters × Time
```

---

## The ACCOUNT_USAGE Schema

`SNOWFLAKE.ACCOUNT_USAGE` is a schema inside the `SNOWFLAKE` shared database that provides **historical account-level metadata and usage data**:

- Data latency: up to **45 minutes** (near real-time)
- Historical retention: **1 year** for most views
- Requires the `ACCOUNTADMIN` role (or a role granted to ACCOUNTADMIN with appropriate privileges)

### Key ACCOUNT_USAGE Views

| View | Purpose |
|---|---|
| `QUERY_HISTORY` | All queries executed in the last 365 days |
| `WAREHOUSE_METERING_HISTORY` | Credit consumption per warehouse per hour |
| `STORAGE_USAGE` | Daily storage usage (TB) per database |
| `TABLE_STORAGE_METRICS` | Storage per table including Time Travel and Fail-Safe |
| `LOGIN_HISTORY` | All login attempts (success and failure) |
| `ACCESS_HISTORY` | Data access audit trail (read/write per query) |
| `COPY_HISTORY` | COPY INTO execution history |
| `PIPE_USAGE_HISTORY` | Snowpipe credit consumption |
| `METERING_DAILY_HISTORY` | Daily credit summary across all services |
| `RESOURCE_MONITORS` | All Resource Monitor definitions |
| `OBJECT_DEPENDENCIES` | Object lineage (what depends on what) |

### Common Monitoring Queries

```sql
-- Top 10 most expensive queries in the last 7 days
SELECT
    query_id,
    user_name,
    warehouse_name,
    total_elapsed_time / 1000 AS elapsed_sec,
    credits_used_cloud_services,
    query_text
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
    AND execution_status = 'SUCCESS'
ORDER BY total_elapsed_time DESC
LIMIT 10;

-- Credit consumption by warehouse (last 30 days)
SELECT
    warehouse_name,
    sum(credits_used) AS total_credits,
    round(sum(credits_used) * 3.0, 2) AS estimated_cost_usd  -- $3/credit example
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE start_time > DATEADD('day', -30, CURRENT_TIMESTAMP)
GROUP BY 1
ORDER BY 2 DESC;

-- Storage usage trend
SELECT
    usage_date,
    round(average_database_bytes / POWER(1024, 3), 2) AS avg_storage_gb,
    round(average_stage_bytes / POWER(1024, 3), 2) AS avg_stage_gb
FROM SNOWFLAKE.ACCOUNT_USAGE.STORAGE_USAGE
ORDER BY usage_date DESC
LIMIT 30;

-- Failed logins in the last 24 hours
SELECT
    event_timestamp,
    user_name,
    client_ip,
    error_message
FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY
WHERE event_timestamp > DATEADD('hour', -24, CURRENT_TIMESTAMP)
    AND is_success = 'NO'
ORDER BY event_timestamp DESC;

-- Tables consuming the most Time Travel storage
SELECT
    table_catalog,
    table_schema,
    table_name,
    round(time_travel_bytes / POWER(1024, 3), 2) AS time_travel_gb,
    round(failsafe_bytes / POWER(1024, 3), 2) AS failsafe_gb
FROM SNOWFLAKE.ACCOUNT_USAGE.TABLE_STORAGE_METRICS
WHERE time_travel_bytes > 0
ORDER BY time_travel_bytes DESC
LIMIT 20;
```

---

## INFORMATION_SCHEMA vs ACCOUNT_USAGE

Both provide metadata, but with different scopes:

| Aspect | INFORMATION_SCHEMA | ACCOUNT_USAGE |
|---|---|---|
| Scope | Current database only | Entire account |
| Latency | Real-time | Up to 45 minutes |
| Retention | Limited (7–14 days for historical) | 1 year |
| Access | Any user with DB access | Requires ACCOUNTADMIN |
| Dropped objects | Not included | Included |
| Use case | Immediate, current-state queries | Historical analysis, auditing |

```sql
-- INFORMATION_SCHEMA: current database, real-time
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'PUBLIC';

-- ACCOUNT_USAGE: full account history
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.TABLES WHERE TABLE_CATALOG = 'ANALYTICS';
```

---

## Cost Optimization Best Practices

### Compute Optimization

```sql
-- 1. Use appropriate auto-suspend values
ALTER WAREHOUSE WH_DEV SET AUTO_SUSPEND = 60;    -- dev: suspend fast
ALTER WAREHOUSE WH_PROD SET AUTO_SUSPEND = 300;  -- prod: suspend after 5 min

-- 2. Right-size warehouses (start small, scale up if needed)
-- Run test queries on XS → S → M until performance meets SLA

-- 3. Use query tags for cost attribution
ALTER SESSION SET QUERY_TAG = 'project:crm_refresh team:data-eng';

-- 4. Prevent runaway queries with timeout
ALTER WAREHOUSE WH_ADHOC SET STATEMENT_TIMEOUT_IN_SECONDS = 3600;
```

### Storage Optimization

```sql
-- Reduce Time Travel on staging tables (saves storage cost)
ALTER TABLE staging.raw_events SET DATA_RETENTION_TIME_IN_DAYS = 1;

-- Use Transient tables for intermediate results (no Fail-Safe)
CREATE TRANSIENT TABLE staging.work_table AS SELECT ...;

-- Drop unused stages
REMOVE @old_stage/;
DROP STAGE old_stage;
```

### Serverless Feature Costs

| Serverless Feature | Billed How |
|---|---|
| Snowpipe | Per file loaded (serverless compute) |
| Automatic Clustering | Background service credits |
| Materialized Views | Background refresh credits |
| Dynamic Table refresh | Background service credits |
| Replication | Credits for data transfer and compute |
| Search Optimization | Storage + credits for build |

---

## Practice Questions

**Q1.** A Resource Monitor is configured with `ON 100 PERCENT DO SUSPEND`. What happens when this threshold is reached?

- A) All running queries are immediately killed
- B) New queries are queued; running queries finish, then the warehouse suspends ✅
- C) An email notification is sent and nothing else changes
- D) The warehouse is dropped

**Q2.** What is the minimum billable time each time a virtual warehouse starts running?

- A) 30 seconds
- B) 60 seconds ✅
- C) 5 minutes
- D) 1 hour

**Q3.** Which ACCOUNT_USAGE view provides information about credit consumption per warehouse per hour?

- A) QUERY_HISTORY
- B) STORAGE_USAGE
- C) WAREHOUSE_METERING_HISTORY ✅
- D) METERING_DAILY_HISTORY

**Q4.** How long is the approximate data latency for the ACCOUNT_USAGE schema views?

- A) Real-time
- B) Up to 45 minutes ✅
- C) Up to 24 hours
- D) 7 days

**Q5.** A Resource Monitor is set at both the account level and the warehouse level for `WH_ANALYTICS`. What happens?

- A) Only the warehouse-level monitor applies
- B) Only the account-level monitor applies
- C) Both monitors apply independently ✅
- D) The more restrictive monitor takes precedence

**Q6.** Resource Monitors track which type of credit consumption?

- A) Storage + compute + Cloud Services
- B) Virtual warehouse compute credits only ✅
- C) Snowpipe and serverless feature credits
- D) All types of Snowflake credits equally

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. **Resource Monitor** = credit budget enforcer for warehouses; operates at **no cost**
> 2. `SUSPEND` = let running queries finish | `SUSPEND_IMMEDIATE` = kill all queries now
> 3. Billing: **per second, 60-second minimum** per warehouse start
> 4. **ACCOUNT_USAGE** = 1-year history, up to 45 min latency, account-wide, requires ACCOUNTADMIN
> 5. **INFORMATION_SCHEMA** = real-time, current database only, limited retention
> 6. Both account-level and warehouse-level Resource Monitors apply **independently**