---
title: "Compute & Processing"
description: "Evaluate compute abstractions across platforms. Compare Amazon Redshift's MPP, Snowflake's Virtual Warehouses, and Databricks' Spark clusters with the Photon engine."
order: 4
difficulty: advanced
duration: "75 min"
---

# Compute & Processing

> **Bottom Line:** Snowflake's Virtual Warehouses win on simplicity and SQL concurrency. Databricks' Spark clusters with Photon win on flexibility and ML workloads. AWS gives you both options — and the complexity of maintaining them.

---

## 4.1 Compute Abstraction Levels

Each platform abstracts compute differently. Understanding the abstraction level helps set expectations on what you can — and cannot — control.

```
High Abstraction (Simple, Less Control)
│
│   ┌──────────────────────────────────────────┐
│   │  Amazon Athena          (Serverless SQL)  │
│   │  Snowflake VW           (Serverless SQL)  │
│   │  Databricks SQL Wh.     (Serverless SQL)  │
│   └──────────────────────────────────────────┘
│
│   ┌──────────────────────────────────────────┐
│   │  Databricks Job Clusters     (Managed)   │
│   │  Amazon Redshift Serverless  (Managed)   │
│   └──────────────────────────────────────────┘
│
│   ┌──────────────────────────────────────────┐
│   │  Databricks All-Purpose Clusters (Full)  │
│   │  Amazon Redshift Provisioned     (Full)  │
│   │  Amazon EMR (Spark/Trino)        (Full)  │
│   └──────────────────────────────────────────┘
│
Low Abstraction (Complex, Full Control)
```

---

## 4.2 Amazon Redshift

Redshift is AWS's fully managed MPP (Massively Parallel Processing) columnar SQL data warehouse. It is optimised for complex analytical queries on large datasets using SQL.

### Redshift Provisioned vs. Serverless

| Attribute | Provisioned | Serverless |
|-----------|-------------|-----------|
| **Billing** | Per-hour per node (ra3.xlplus → ra3.16xlarge) | Per RPU-second (min 8 RPUs) |
| **Startup Time** | ~5 min cluster start | ~5 sec (warm) |
| **Concurrency Scaling** | Add Concurrency Scaling clusters ($$$) | Automatic |
| **WLM (Workload Management)** | Manual queue config | Automatic |
| **AQUA (Accel. QP)** | ✅ Available on ra3 | ✅ Available |
| **Best For** | Predictable, always-on workloads | Burst/intermittent workloads |
| **Reserved Instance Discount** | Up to 75% (1yr/3yr) | ❌ No RIs |
| **Max Data (managed storage)** | 128TB per node (ra3 managed) | Unlimited (Redshift Managed Storage) |

### Redshift Architecture Internals

```
                    ┌───────────────────────────────┐
                    │         Leader Node             │
                    │  - SQL parsing & optimisation   │
                    │  - Query coordination           │
                    │  - Result aggregation           │
                    └──────────────┬────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
    ┌──────▼──────┐        ┌───────▼──────┐       ┌───────▼──────┐
    │  Compute    │        │  Compute     │       │  Compute     │
    │  Node 1     │        │  Node 2      │       │  Node N      │
    │  ┌───┐┌───┐ │        │  ┌───┐┌───┐ │       │  ┌───┐┌───┐  │
    │  │S1 ││S2 │ │        │  │S3 ││S4 │ │       │  │SN ││.. │  │
    │  └───┘└───┘ │        │  └───┘└───┘ │       │  └───┘└───┘  │
    │  (Slices)   │        │  (Slices)   │       │  (Slices)    │
    └─────────────┘        └────────────-┘       └──────────────┘
    Each node has local SSD. Data distributed by DISTKEY/DISTSTYLE.
```

### Redshift Distribution Styles — Critical for Performance

```sql
-- DISTSTYLE KEY: Distribute rows by a specific column value
-- Use when: Large table joined frequently on a specific column
CREATE TABLE orders (
    order_id    VARCHAR(36),
    customer_id VARCHAR(36),   -- ← Frequently joined with customers table
    revenue     DECIMAL(10,2),
    order_date  DATE
)
DISTKEY(customer_id)    -- Rows with same customer_id go to same node → reduces shuffle
SORTKEY(order_date);    -- Rows stored in order_date order → enables zone map pruning

-- DISTSTYLE ALL: Copy full table to every node
-- Use when: Small dimension tables (< 5M rows) frequently joined to large tables
CREATE TABLE dim_regions (
    region_id   INT,
    region_name VARCHAR(100),
    country     VARCHAR(100)
)
DISTSTYLE ALL;  -- Every node has a full copy — no network shuffle for joins

-- DISTSTYLE EVEN: Round-robin distribution
-- Use when: No clear join key, balanced write throughput is priority
CREATE TABLE staging_events (
    event_id    BIGINT,
    payload     SUPER   -- Semi-structured JSON
)
DISTSTYLE EVEN;

-- ⚠️ GOTCHA: Mismatched DISTKEY between two joined tables = full network shuffle = SLOW
```

### Redshift Spectrum — Querying S3 from Redshift

```sql
-- Create an external schema pointing to Glue Catalog
CREATE EXTERNAL SCHEMA spectrum_raw
FROM DATA CATALOG
DATABASE 'raw_ecommerce'
IAM_ROLE 'arn:aws:iam::123456789:role/RedshiftSpectrumRole'
CREATE EXTERNAL DATABASE IF NOT EXISTS;

-- Query S3 data directly (no data loaded into Redshift)
SELECT
    s.order_id,
    s.revenue,
    d.customer_name
FROM spectrum_raw.orders s                  -- Lives in S3
JOIN redshift_local.dim_customers d         -- Lives in Redshift
ON s.customer_id = d.customer_id
WHERE s.order_date >= '2024-01-01';

-- ⚡ Spectrum pushes predicates down to S3 — only matching rows are transferred
-- 💰 Billed at $5 per TB scanned (plus Redshift compute costs)
```

---

## 4.3 Snowflake Virtual Warehouses

### Virtual Warehouse Sizing

Snowflake VWs are T-shirt sized. Doubling the size roughly doubles the performance (and cost):

| Size | vCores (approx) | Credits/Hour | Use Case |
|------|-----------------|-------------|---------|
| **X-Small** | 1 | 1 | Development, testing |
| **Small** | 2 | 2 | Light BI, simple queries |
| **Medium** | 4 | 4 | Standard analytics |
| **Large** | 8 | 8 | Heavy aggregations |
| **X-Large** | 16 | 16 | Complex joins, large sorts |
| **2X-Large** | 32 | 32 | Very large datasets |
| **3X-Large** | 64 | 64 | Peak load or ML feature engineering |
| **4X-Large** | 128 | 128 | Snowpark heavy ML workloads |
| **5X-Large** | 256 | 256 | Extreme workloads |
| **6X-Large** | 512 | 512 | Largest supported size |

**💰 Cost Note:** Snowflake credits cost approximately $2-4 USD each (varies by edition and cloud region). A 4X-Large running for 1 hour ≈ $256–512 USD.

### Virtual Warehouse Lifecycle Management

```sql
-- Create a warehouse with aggressive auto-suspend for cost savings
CREATE WAREHOUSE analytics_wh
    WAREHOUSE_SIZE = 'LARGE'
    AUTO_SUSPEND = 60           -- Suspend after 60 seconds of inactivity
    AUTO_RESUME = TRUE          -- Automatically resume on query
    INITIALLY_SUSPENDED = TRUE; -- Start suspended (save credits)

-- Create a multi-cluster warehouse for high concurrency
CREATE WAREHOUSE reporting_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 5
    SCALING_POLICY = 'STANDARD' -- 'ECONOMY' waits longer to scale out
    AUTO_SUSPEND = 300;

-- Monitor warehouse credit consumption
SELECT
    warehouse_name,
    start_time,
    end_time,
    credits_used,
    credits_used_cloud_services
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE start_time >= DATEADD('day', -7, CURRENT_TIMESTAMP())
ORDER BY credits_used DESC;
```

### Query Acceleration Service (QAS)

Snowflake's Query Acceleration Service offloads portions of eligible queries to serverless compute — particularly useful for large scans that don't benefit from VW size increases:

```sql
-- Enable QAS on a warehouse (Enterprise Edition+)
ALTER WAREHOUSE analytics_wh SET
    ENABLE_QUERY_ACCELERATION = TRUE
    QUERY_ACCELERATION_MAX_SCALE_FACTOR = 8;  -- Max 8x the VW's compute

-- QAS automatically identifies and offloads:
-- - Large table scans with selective predicates
-- - Queries with high data spillage
-- - Outlier queries (taking much longer than average)
```

### Snowpark — Beyond SQL

Snowpark extends Snowflake's compute to support Python, Java, and Scala directly in the VW:

```python
from snowflake.snowpark import Session
from snowflake.snowpark import functions as F
from snowflake.snowpark.types import IntegerType

# Connect to Snowflake
session = Session.builder.configs({
    "account": "myorg-myaccount",
    "user": "data_engineer",
    "role": "DATA_ENGINEER",
    "warehouse": "ML_WH",
    "database": "ECOMMERCE",
    "schema": "ANALYTICS"
}).create()

# Snowpark DataFrame — executed in Snowflake (not locally)
orders_df = session.table("orders")
customers_df = session.table("dim_customers")

# Complex transformation — all pushed to Snowflake compute
result = (
    orders_df
    .join(customers_df, orders_df["customer_id"] == customers_df["customer_id"])
    .filter(F.col("order_date") >= F.lit("2024-01-01"))
    .with_column("revenue_category",
        F.when(F.col("revenue") > 1000, "high")
         .when(F.col("revenue") > 100, "medium")
         .otherwise("low"))
    .group_by("region", "revenue_category")
    .agg(
        F.sum("revenue").alias("total_revenue"),
        F.count("order_id").alias("order_count")
    )
)

# .show() triggers lazy execution — result runs in Snowflake
result.show()
result.write.mode("overwrite").save_as_table("gold_revenue_by_category")
```

---

## 4.4 Databricks Compute

### Cluster Types

```
┌──────────────────────────────────────────────────────────────┐
│  CLUSTER TYPE          │  USE CASE              │  BILLING   │
├──────────────────────────────────────────────────────────────┤
│  All-Purpose Cluster   │  Interactive notebooks  │  Per-DBU   │
│                        │  Ad-hoc exploration     │  (premium) │
├──────────────────────────────────────────────────────────────┤
│  Job Cluster           │  Automated pipelines    │  Per-DBU   │
│                        │  Scheduled workflows    │  (cheaper) │
├──────────────────────────────────────────────────────────────┤
│  SQL Warehouse         │  SQL analytics / BI     │  Per-DBU   │
│  (Classic / Serverless)│  Dashboards             │  (SQL DBU) │
├──────────────────────────────────────────────────────────────┤
│  DLT Pipeline Cluster  │  Delta Live Tables      │  Per-DBU   │
│                        │  (managed by DLT)       │  (DLT DBU) │
└──────────────────────────────────────────────────────────────┘
```

### Cluster Configuration (PySpark)

```python
# Cluster configuration via Databricks REST API or Terraform
cluster_config = {
    "cluster_name": "data-engineering-prod",
    "spark_version": "14.3.x-scala2.12",
    "node_type_id": "r6id.2xlarge",       # Memory-optimised EC2
    "driver_node_type_id": "r6id.4xlarge", # Larger driver for coordination
    "autoscale": {
        "min_workers": 2,
        "max_workers": 20
    },
    "auto_termination_minutes": 30,
    "spark_conf": {
        "spark.sql.adaptive.enabled": "true",       # AQE — critical!
        "spark.sql.adaptive.coalescePartitions.enabled": "true",
        "spark.databricks.delta.optimizeWrite.enabled": "true",
        "spark.databricks.delta.autoCompact.enabled": "true"
    },
    "aws_attributes": {
        "instance_profile_arn": "arn:aws:iam::123456789:instance-profile/databricks-ec2",
        "availability": "SPOT_WITH_FALLBACK",  # 💰 Use spot instances to save ~70%
        "spot_bid_price_percent": 100
    }
}
```

### Photon Engine — Vectorised Query Execution

Photon is Databricks' proprietary C++ query engine that replaces the JVM-based Spark SQL execution for compatible operations:

```
Without Photon (JVM Spark):
  Query → JVM bytecode → Row-by-row processing → Result
  Speed: Baseline

With Photon (C++ Vectorized):
  Query → LLVM-compiled native code → Column batch processing → Result
  Speed: 2-8x faster for SQL workloads (varies by operation)
```

**Photon-compatible operations:** `SELECT`, `GROUP BY`, `JOIN`, `SORT`, `FILTER`, window functions, most aggregate functions, Delta Lake reads/writes.

**Photon-incompatible (falls back to JVM):** Python UDFs, Java UDFs, some complex lambda expressions, certain Spark ML operations.

```python
# Check if Photon is being used (from query plan)
df = spark.sql("""
    SELECT customer_id, SUM(revenue) as total
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY customer_id
""")

# Inspect physical plan — look for PhotonResultStage
df.explain(mode="formatted")
# Output shows: PhotonGroupingAgg, PhotonFilter, PhotonScan
```

### Databricks SQL Warehouses

SQL Warehouses are purpose-built for SQL analytics — separate from Spark clusters, optimised for concurrency:

```sql
-- Configure via Databricks UI or API
-- Key settings:
-- Type: Serverless (fastest startup, auto-scale) or Classic (more control)
-- Size: 2X-Small to 4X-Large (similar to Snowflake T-shirt sizing)
-- Auto-stop: 10-480 minutes
-- Scaling: Min 1 cluster, Max N clusters

-- Example: Parameterised SQL query for dashboards
SELECT
    date_trunc('month', order_date) AS month,
    region,
    SUM(revenue)                    AS total_revenue,
    COUNT(DISTINCT customer_id)     AS unique_customers
FROM orders
WHERE
    order_date BETWEEN :start_date AND :end_date  -- Dashboard parameter
    AND region IN (:regions)
GROUP BY 1, 2
ORDER BY 1, 2;
```

### Adaptive Query Execution (AQE) — Databricks' Performance Edge

Spark's AQE re-optimises query plans *at runtime* based on actual statistics, unlike Snowflake's static planning:

```python
# AQE is enabled by default in Databricks Runtime 14+
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# How AQE helps at runtime:
# 1. Coalesce Partitions: After a shuffle, reduces 10,000 small partitions
#    to 200 optimally-sized partitions automatically
#
# 2. Skew Join: Detects if one partition has 10x more data than others
#    (data skew) and splits it automatically — no manual salting needed
#
# 3. Join Strategy: Switches from SortMergeJoin to BroadcastHashJoin
#    if the runtime size of a table turns out to be small
```

---

## 4.5 Amazon EMR — Managed Spark/Trino

For teams needing full Spark (or Presto/Trino) control on AWS without Databricks:

```python
# EMR Serverless — no cluster management, pay per use
import boto3

emr_serverless = boto3.client('emr-serverless', region_name='us-east-1')

# Submit a Spark job
response = emr_serverless.start_job_run(
    applicationId='00f1abc123xyz',
    executionRoleArn='arn:aws:iam::123456789:role/EMRServerlessRole',
    jobDriver={
        'sparkSubmit': {
            'entryPoint': 's3://my-bucket/scripts/process_orders.py',
            'entryPointArguments': ['--date', '2024-03-15'],
            'sparkSubmitParameters': '--conf spark.executor.cores=4 '
                                    '--conf spark.executor.memory=8g '
                                    '--conf spark.driver.cores=2 '
                                    '--conf spark.driver.memory=4g'
        }
    },
    configurationOverrides={
        'monitoringConfiguration': {
            'cloudWatchLoggingConfiguration': {
                'enabled': True,
                'logGroupName': '/emr-serverless/applications'
            }
        }
    }
)
```

---

## 4.6 Compute Comparison Matrix

| Dimension | AWS Redshift | AWS EMR | Snowflake VW | Databricks SQL WH | Databricks Clusters |
|-----------|-------------|---------|-------------|------------------|---------------------|
| **Startup Time** | 3-5 min (provisioned) / ~5s (serverless) | 5-15 min | ~2s (warm) | ~2s (serverless) | 2-10 min |
| **Concurrency** | Manual WLM config | Queue-based (YARN) | ⚡ Automatic multi-cluster | Auto-scale | Manual or auto-scale |
| **SQL Performance** | ⚡ Very fast (MPP) | Good (Spark SQL) | ⚡ Very fast | ⚡ Fast (Photon) | Fast (AQE) |
| **Python/Scala** | Limited (UDFs) | ⚡ Full Spark | ✅ Snowpark | Partial (notebook) | ⚡ Full Spark |
| **ML Workloads** | ❌ Not designed for ML | ✅ Good | ⚠️ Snowpark ML | ⚠️ Limited | ⚡ Best-in-class |
| **Auto-Suspend** | ❌ (Provisioned) | ❌ (Long-running) | ✅ Configurable | ✅ Built-in | ✅ Configurable |
| **Spot/Preemptible** | ❌ Not applicable | ✅ (EC2 Spot) | ❌ (Managed) | ✅ (Spot policies) | ✅ (SPOT_WITH_FALLBACK) |
| **Operational Burden** | Medium | ⚠️ High | ⚡ Very Low | Low | Medium |

---

## 4.7 The 1TB Query Benchmark Perspective

*(Illustrative performance benchmarks — actual results vary by query shape, data skew, and configuration)*

| Workload Type | AWS Redshift (2XL, 2 nodes) | Snowflake (Large VW) | Databricks (Photon, 8-core workers) |
|---------------|---------------------------|---------------------|-------------------------------------|
| **Simple point query** | <1s | <1s (result cache) | 1-3s (cluster startup) |
| **Large aggregation** | 8-15s | 10-20s | 12-25s |
| **Multi-table join (5 tables)** | 15-45s | 20-50s | 15-40s (AQE) |
| **Full table scan (1TB)** | 60-120s | 45-90s | 50-100s |
| **Python ML feature transform** | ❌ Not applicable | 30-90s (Snowpark) | ⚡ 10-30s (native Spark) |
| **Streaming aggregation** | ❌ Not native | ❌ Not native | ⚡ Native (Structured Streaming) |

---

*Next: [05 — Data Ingestion & Integration](./05_Data_Ingestion.md)*
