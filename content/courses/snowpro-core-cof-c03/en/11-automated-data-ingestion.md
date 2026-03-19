---
title: "Domain 3.2 — Automated Data Ingestion"
description: "Learn to automate data ingestion with Snowpipe, Snowpipe Streaming, Streams, Tasks, and Dynamic Tables. Build continuous and event-driven data pipelines entirely within Snowflake."
order: 11
difficulty: intermediate
duration: "70 min"
---

# Domain 3.2 — Automated Data Ingestion

## Exam Weight

**Domain 3.0** accounts for **~18%** of the exam. Automated ingestion patterns are frequently tested.

> [!NOTE]
> This lesson maps to **Exam Objective 3.2**: *Perform automated data ingestion*, including Snowpipe, Snowpipe Streaming, Streams, Tasks, and Dynamic Tables.

---

## Ingestion Patterns Overview

| Tool | Trigger | Latency | Best For |
|---|---|---|---|
| **COPY INTO** | Manual / scheduled | Minutes to hours | Batch loads |
| **Snowpipe** | Cloud storage event | Near-real-time (seconds–minutes) | Continuous file-based ingestion |
| **Snowpipe Streaming** | SDK push | Sub-second | High-frequency row-level streaming |
| **Streams + Tasks** | Time or stream condition | Configurable | CDC-based pipeline orchestration |
| **Dynamic Tables** | Automatic (lag-based) | Configurable | Declarative incremental refresh |

---

## Snowpipe

**Snowpipe** is Snowflake's serverless, continuous ingestion service — it automatically loads files as they arrive in a stage.

### How Snowpipe Works

```
Files arrive in S3/Azure/GCS
         │
         ▼
Cloud Storage Event (S3 Event, Azure Event Grid, GCS Pub/Sub)
         │
         ▼
Snowpipe receives notification (or REST API call)
         │
         ▼
COPY INTO executes (serverless — no warehouse required)
         │
         ▼
Data available in Snowflake table (seconds to minutes)
```

### Creating a Pipe

```sql
-- Create a pipe with auto-ingest (cloud event trigger)
CREATE PIPE orders_pipe
    AUTO_INGEST = TRUE
    COMMENT = 'Automatically ingest order files from S3'
AS
COPY INTO raw.orders (order_id, customer_id, amount, order_ts)
FROM (
    SELECT $1, $2, $3::DECIMAL(10,2), $4::TIMESTAMP
    FROM @s3_orders_stage/orders/
)
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- View the pipe's SQS ARN (for S3 event notification setup)
SHOW PIPES LIKE 'orders_pipe';
```

### Snowpipe with REST API

For cases where cloud events are not available, you can trigger Snowpipe via REST API:

```python
import requests
from snowflake.ingest import SimpleIngestManager

# Initialize the ingest manager
manager = SimpleIngestManager(
    account='myaccount.us-east-1',
    host='myaccount.us-east-1.snowflakecomputing.com',
    user='my_user',
    pipe='my_database.my_schema.orders_pipe',
    private_key=private_key_bytes
)

# Notify Snowpipe about new files
response = manager.ingest_files([
    {'path': 'orders/orders_2025_01_15.csv'}
])
```

### Snowpipe Properties and Billing

| Property | Value |
|---|---|
| **Warehouse needed?** | No — serverless |
| **Billing** | Per-file compute credits (serverless rate) |
| **Latency** | Typically < 1 minute |
| **Deduplication** | 14-day window (files not re-processed) |
| **Error handling** | Files with errors are skipped; check COPY_HISTORY |

```sql
-- Monitor Snowpipe load status
SELECT *
FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
    TABLE_NAME => 'ORDERS',
    START_TIME => DATEADD('hour', -24, CURRENT_TIMESTAMP)
))
ORDER BY LAST_LOAD_TIME DESC;

-- Snowpipe credit usage
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.PIPE_USAGE_HISTORY
WHERE PIPE_NAME = 'ORDERS_PIPE'
AND START_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP);

-- Refresh Snowpipe (force re-scan of stage)
ALTER PIPE orders_pipe REFRESH;
```

---

## Snowpipe Streaming

**Snowpipe Streaming** enables **row-level, sub-second ingestion** directly into Snowflake tables via the Snowflake Ingest SDK — without staging files first:

```
Application / Kafka / CDC tool
         │
         ▼ (Snowflake Ingest SDK or Kafka Connector)
Snowflake Streaming Channel
         │
         ▼
Snowflake Table (latency: milliseconds to seconds)
```

### Key Differences: Snowpipe vs Snowpipe Streaming

| Aspect | Snowpipe | Snowpipe Streaming |
|---|---|---|
| Data unit | Files | Rows |
| Latency | Seconds to minutes | Milliseconds to seconds |
| Staging required | Yes (files in stage) | No |
| SDK | Ingest SDK (file paths) | Ingest SDK (row-level) |
| Use case | File-based continuous load | Real-time event streaming |
| Kafka integration | Snowflake Kafka Connector v1 | Snowflake Kafka Connector v2+ |

```java
// Java example — Snowpipe Streaming
SnowflakeStreamingIngestClient client = SnowflakeStreamingIngestClientFactory
    .builder("myClient")
    .setProperties(props)
    .build();

OpenChannelRequest request = OpenChannelRequest.builder("MY_CHANNEL")
    .setDBName("MY_DB")
    .setSchemaName("PUBLIC")
    .setTableName("EVENTS")
    .setOnErrorOption(OpenChannelRequest.OnErrorOption.CONTINUE)
    .build();

SnowflakeStreamingIngestChannel channel = client.openChannel(request);

// Insert rows
Map<String, Object> row = new HashMap<>();
row.put("event_id", "12345");
row.put("event_type", "click");
row.put("event_ts", System.currentTimeMillis());
channel.insertRow(row, "offset_12345");
```

---

## Streams — Change Data Capture

A **Stream** is a Snowflake object that captures DML changes (INSERT, UPDATE, DELETE) on a source table or view. It acts as a **CDC (Change Data Capture) log**.

### Stream Types

| Type | Captures | Source |
|---|---|---|
| **Standard** | INSERT, UPDATE, DELETE | Tables, directory tables |
| **Append-only** | INSERT only (no updates/deletes) | Tables, views |
| **Insert-only** | INSERT only | External tables |

```sql
-- Create a standard stream
CREATE STREAM orders_stream ON TABLE raw.orders;

-- Create an append-only stream (lighter weight for insert-heavy tables)
CREATE STREAM events_stream ON TABLE raw.events
    APPEND_ONLY = TRUE;

-- Query the stream
SELECT
    *,
    METADATA$ACTION,       -- 'INSERT' or 'DELETE'
    METADATA$ISUPDATE,     -- TRUE if this DELETE is the old row of an UPDATE
    METADATA$ROW_ID        -- unique row identifier
FROM orders_stream;
```

### Stream Offset and Consumption

A stream tracks changes from its **offset** (its last consumed position). After consuming (via a DML inside a Task or explicit statement), the offset advances:

```sql
-- Consume the stream in a MERGE (most common pattern)
MERGE INTO analytics.orders tgt
USING orders_stream src
ON tgt.order_id = src.order_id
WHEN MATCHED AND src.METADATA$ACTION = 'DELETE' THEN DELETE
WHEN MATCHED AND src.METADATA$ACTION = 'INSERT' THEN UPDATE SET
    tgt.amount = src.amount,
    tgt.status = src.status
WHEN NOT MATCHED AND src.METADATA$ACTION = 'INSERT' THEN INSERT
    (order_id, amount, status) VALUES (src.order_id, src.amount, src.status);
```

> [!WARNING]
> Streams consume **Time Travel** to track their offset. If the Time Travel period expires before the stream is consumed, the stream becomes **stale**. Always consume streams within the retention window.

---

## Tasks — Scheduled Execution

A **Task** schedules SQL execution — it is Snowflake's native job scheduler.

### Task Types

| Property | Warehouse-Based Task | Serverless Task |
|---|---|---|
| Compute | Uses a named virtual warehouse | Snowflake-managed serverless |
| Cost control | Warehouse Resource Monitor | Per-credit serverless billing |
| Best for | Predictable, heavy workloads | Lightweight, frequent tasks |

```sql
-- Warehouse-based task (every 5 minutes)
CREATE TASK refresh_staging
    WAREHOUSE = WH_TRANSFORM
    SCHEDULE = '5 MINUTE'
AS
INSERT INTO staging.orders_processed
SELECT * FROM raw.orders
WHERE processed = FALSE;

-- Serverless task
CREATE TASK serverless_task
    USER_TASK_MANAGED_INITIAL_WAREHOUSE_SIZE = 'SMALL'
    SCHEDULE = 'USING CRON 0 3 * * * UTC'  -- every day at 3am UTC
AS
CALL my_stored_procedure();

-- Stream-triggered task (only runs when stream has data)
CREATE TASK process_orders_task
    WAREHOUSE = WH_TRANSFORM
    WHEN SYSTEM$STREAM_HAS_DATA('orders_stream')
    SCHEDULE = '1 MINUTE'  -- check every minute
AS
MERGE INTO analytics.orders tgt
USING orders_stream src ON tgt.id = src.id
WHEN NOT MATCHED THEN INSERT ...;

-- Tasks start SUSPENDED — must be resumed
ALTER TASK refresh_staging RESUME;
ALTER TASK serverless_task RESUME;
ALTER TASK process_orders_task RESUME;
```

### Task DAGs (Directed Acyclic Graphs)

Tasks can be chained into a **DAG** where downstream tasks run after upstream tasks complete:

```sql
-- Root task (scheduled)
CREATE TASK root_task
    WAREHOUSE = WH_TRANSFORM
    SCHEDULE = '1 HOUR'
AS
TRUNCATE TABLE staging.work;

-- Child task 1 (depends on root)
CREATE TASK child_task_1
    WAREHOUSE = WH_TRANSFORM
    AFTER root_task
AS
INSERT INTO staging.work SELECT * FROM raw.orders;

-- Child task 2 (depends on root)
CREATE TASK child_task_2
    WAREHOUSE = WH_TRANSFORM
    AFTER root_task
AS
INSERT INTO staging.work SELECT * FROM raw.events;

-- Grandchild task (depends on both children)
CREATE TASK final_task
    WAREHOUSE = WH_TRANSFORM
    AFTER child_task_1, child_task_2
AS
CALL process_final_data();

-- Resume all tasks (must resume leaf → root or use SYSTEM$TASK_DEPENDENTS_ENABLE)
SELECT SYSTEM$TASK_DEPENDENTS_ENABLE('root_task');
```

---

## Dynamic Tables

**Dynamic Tables** provide a **declarative** approach to incremental data pipelines — define the transformation as a SELECT, set a `TARGET_LAG`, and Snowflake automatically refreshes the table:

```sql
-- Source table
CREATE TABLE orders (order_id NUMBER, customer_id NUMBER, amount DECIMAL, status STRING);

-- Dynamic table (automatically refreshed)
CREATE DYNAMIC TABLE customer_metrics
    TARGET_LAG = '1 hour'        -- max acceptable lag from source
    WAREHOUSE = WH_TRANSFORM
AS
SELECT
    customer_id,
    count(*) AS order_count,
    sum(amount) AS total_spent,
    max(order_id) AS latest_order_id
FROM orders
WHERE status = 'COMPLETED'
GROUP BY customer_id;

-- Check dynamic table status
SHOW DYNAMIC TABLES LIKE 'customer_metrics';

-- Manually trigger refresh
ALTER DYNAMIC TABLE customer_metrics REFRESH;
```

### Dynamic Tables vs Streams + Tasks

| Aspect | Dynamic Tables | Streams + Tasks |
|---|---|---|
| Complexity | Low (declarative) | Higher (imperative) |
| Lag control | `TARGET_LAG` parameter | Task schedule frequency |
| Custom merge logic | Limited | Full control |
| Dependency tracking | Automatic | Manual |
| Monitoring | Built-in DYNAMIC_TABLE views | TASK_HISTORY |

---

## Practice Questions

**Q1.** A company receives CSV files in an S3 bucket continuously throughout the day. Which feature provides the lowest-latency automatic loading without requiring a running virtual warehouse?

- A) COPY INTO with a scheduled task
- B) Snowpipe with AUTO_INGEST = TRUE ✅
- C) Snowpipe Streaming SDK
- D) Dynamic Table with TARGET_LAG = '5 MINUTE'

**Q2.** A stream becomes stale. What caused this?

- A) The stream was consumed too many times
- B) The stream was not consumed before the Time Travel period expired ✅
- C) The source table was dropped and recreated
- D) The task consuming the stream was suspended

**Q3.** Which Snowpipe feature enables row-level data streaming with sub-second latency, without first staging files?

- A) AUTO_INGEST = TRUE
- B) Snowpipe REST API
- C) Snowpipe Streaming SDK ✅
- D) Append-only Stream

**Q4.** A Task is created but no data is being processed. What is the most likely cause?

- A) The warehouse is too small
- B) The task is in SUSPENDED state and needs to be RESUMED ✅
- C) The task's schedule is too infrequent
- D) The stream has already been consumed

**Q5.** A Dynamic Table is configured with `TARGET_LAG = '30 minutes'`. What does this guarantee?

- A) The table refreshes every 30 minutes on the clock
- B) Data in the table is never more than 30 minutes behind the source ✅
- C) The refresh job runs for at most 30 minutes
- D) Results are cached for 30 minutes

**Q6.** When using `SYSTEM$STREAM_HAS_DATA()` in a Task's WHEN clause, what happens if the stream is empty?

- A) The Task runs and executes an empty merge
- B) The Task is skipped for that schedule interval ✅
- C) The Task fails with an error
- D) The Task suspends itself

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. **Snowpipe** = file-based, serverless, near-real-time (seconds to minutes)
> 2. **Snowpipe Streaming** = row-based, sub-second, no staging required
> 3. Streams go **stale** if not consumed within the Time Travel window
> 4. Tasks start **SUSPENDED** — always resume them explicitly
> 5. **Dynamic Tables** = declarative `TARGET_LAG` approach — simpler than Streams + Tasks
> 6. Task DAGs: child tasks defined with `AFTER <parent_task>`