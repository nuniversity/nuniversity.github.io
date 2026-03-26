---
title: "Storage & Data Lake"
description: "Learn how each platform manages cloud object storage. Compare AWS S3 with Lake Formation, Snowflake's proprietary micro-partitions, and Databricks' Delta Lake transaction log."
order: 3
difficulty: advanced
duration: "60 min"
---

# Storage & Data Lake

> **Bottom Line:** S3 is the universal substrate that all three platforms can use, but each platform adds a different reliability and management layer on top. Snowflake abstracts it away entirely; Databricks makes it first-class with Delta Lake; AWS gives you the raw controls and the governance tools to manage it yourself.

---

## 3.1 The Object Storage Foundation

All three platforms ultimately store data in **cloud object storage** (S3, ADLS Gen2, or GCS). The differentiation is the management and reliability layer built on top.

```
                    What each platform does with Object Storage:

  AWS              ████████████████████████████████████████████████
  (You manage)     S3  →  [YOU define: folders, formats, partitions, compaction]
                           Governance via: Lake Formation + Glue Catalog

  Snowflake        ████████████████████████████████████████████████
  (They manage)    S3  →  [Snowflake manages: FDN format, micro-partitions, clustering]
                           Your data is ON S3, but you can't directly read it (proprietary format)

  Databricks       ████████████████████████████████████████████████
  (Shared)         S3  →  Delta Log (JSON) + Parquet files
                           YOUR S3, YOUR format, YOU can read it with any Spark engine
```

---

## 3.2 Amazon S3 as a Data Lake (AWS)

### Core S3 Concepts for Data Platforms

S3 is not "just storage" — it has evolved into a sophisticated foundation for data lakes:

```
s3://my-data-lake/
├── raw/                          ← Bronze zone (untouched source data)
│   ├── crm/salesforce/year=2024/month=01/day=01/
│   │   └── contacts_20240101.json.gz
│   └── ecommerce/orders/year=2024/month=01/
│       └── orders_part_00001.parquet
├── curated/                      ← Silver zone (cleaned, typed, joined)
│   └── customer_360/
│       └── year=2024/month=01/
│           └── *.snappy.parquet  ← Hive-style partitioning
└── aggregated/                   ← Gold zone (business-level aggregates)
    └── regional_revenue/
        └── *.parquet
```

### S3 Storage Classes and Cost Optimization

| Storage Class | Use Case | Retrieval Time | Relative Cost |
|--------------|---------|---------------|--------------|
| **S3 Standard** | Hot data, active queries | Immediate | $$$ |
| **S3 Intelligent-Tiering** | Unknown access patterns | Immediate (Standard tier) | $$ + monitoring fee |
| **S3 Standard-IA** | Infrequent access (>1 month) | Immediate | $$ |
| **S3 Glacier Instant Retrieval** | Archive, quarterly access | Immediate | $ |
| **S3 Glacier Deep Archive** | Compliance cold storage | 12 hrs | ¢ |

**💰 Cost Gotcha:** Athena and Glue jobs are billed on **data scanned**, not stored. A poorly partitioned table in S3 Standard can cost 10x more to query than a well-partitioned table in S3 IA, even if the storage cost is similar.

### AWS Glue Data Catalog

The Glue Catalog is the **central metadata registry** for AWS data lake assets. It is Hive Metastore-compatible and used by Athena, EMR, Redshift Spectrum, and Glue ETL jobs.

```python
# Create a table in Glue Catalog using Boto3
import boto3

glue = boto3.client('glue')

glue.create_table(
    DatabaseName='ecommerce',
    TableInput={
        'Name': 'orders',
        'StorageDescriptor': {
            'Columns': [
                {'Name': 'order_id', 'Type': 'string'},
                {'Name': 'customer_id', 'Type': 'string'},
                {'Name': 'revenue', 'Type': 'double'},
                {'Name': 'order_date', 'Type': 'date'}
            ],
            'Location': 's3://my-data-lake/curated/orders/',
            'InputFormat': 'org.apache.hadoop.mapred.TextInputFormat',
            'OutputFormat': 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
            'SerdeInfo': {
                'SerializationLibrary': 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
            }
        },
        'PartitionKeys': [
            {'Name': 'year', 'Type': 'string'},
            {'Name': 'month', 'Type': 'string'}
        ],
        'TableType': 'EXTERNAL_TABLE'
    }
)
```

### AWS Lake Formation: Adding Governance to S3

Lake Formation sits **above** S3 and Glue Catalog to provide fine-grained access control. Without Lake Formation, S3 access is all-or-nothing via IAM bucket policies.

```
WITHOUT Lake Formation:
  IAM Policy: s3:GetObject on s3://data-lake/*
  → User can read ALL files in the bucket (no column/row-level control)

WITH Lake Formation:
  LF Permission: SELECT on database=ecommerce, table=orders, columns=[order_id, revenue]
  → User can only SELECT two specific columns, even if they have S3 access
  
  LF Row Filter: revenue > 0 AND region = 'APAC'
  → User only sees rows matching the filter
```

**Lake Formation Table Formats:**

Lake Formation supports governed tables with ACID properties:

```sql
-- Create a Lake Formation Governed Table (ACID on S3)
CREATE TABLE ecommerce.orders
  LOCATION 's3://my-data-lake/governed/orders/'
  TBLPROPERTIES (
    'table_type' = 'GOVERNED'
  );

-- ACID inserts via Athena (Lake Formation handles the transaction log)
INSERT INTO ecommerce.orders VALUES
  ('ord-001', 'cust-001', 299.99, DATE '2024-01-15');
```

⚠️ **Limitation:** Lake Formation Governed Tables use AWS's own transaction log format, which is NOT compatible with Delta Lake or Apache Iceberg. Prefer **Apache Iceberg** on S3 if you need open-format ACID tables on AWS.

### Apache Iceberg on AWS (The Open Format Recommendation)

For organisations wanting open-format ACID transactions on AWS (comparable to Delta Lake), **Apache Iceberg** via Athena or EMR is the recommended path:

```sql
-- Create an Iceberg table in Athena
CREATE TABLE ecommerce.orders (
    order_id      VARCHAR,
    customer_id   VARCHAR,
    revenue       DOUBLE,
    order_date    DATE
)
PARTITIONED BY (year(order_date))
LOCATION 's3://my-data-lake/iceberg/orders/'
TBLPROPERTIES (
    'table_type' = 'ICEBERG',
    'write_compression' = 'snappy',
    'optimize_rewrite_delete_file_threshold' = '10'
);

-- MERGE (upsert) — fully ACID
MERGE INTO ecommerce.orders t
USING (SELECT * FROM staging.orders_updates) s
ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET revenue = s.revenue
WHEN NOT MATCHED THEN INSERT *;
```

---

## 3.3 Snowflake Storage

### How Snowflake Manages Storage

Snowflake abstracts storage completely. The "database" you interact with via SQL is backed by Snowflake's internal **File/Data Node (FDN)** format, stored in Snowflake's own S3/GCS/Azure Blob tenant. Key properties:

- **Immutable micro-partitions:** 50–500MB compressed blocks, automatically created on INSERT.
- **Automatic clustering:** Snowflake tracks the range of values in each column per micro-partition, enabling automatic partition pruning without explicit indexes.
- **Columnar compression:** Each column within a micro-partition is compressed independently using the optimal algorithm (LZO, Zstd, etc.).

```sql
-- You interact with Snowflake storage purely via SQL
-- All physical layout decisions are automatic

CREATE TABLE orders (
    order_id      VARCHAR,
    customer_id   VARCHAR,
    revenue       NUMBER(10,2),
    order_date    DATE,
    region        VARCHAR
)
-- No SORTKEY, DISTKEY, PARTITION BY required (unlike Redshift)
-- Snowflake handles physical layout automatically
;

-- Optional: Add a clustering key for very large tables (>1TB)
-- where access patterns are highly selective on a specific column
ALTER TABLE orders CLUSTER BY (order_date);
-- Snowflake will automatically re-cluster in the background (costs credits 💰)
```

### Snowflake External Tables and Stages

Snowflake can also query data directly from S3/GCS/ADLS without loading it — useful for landing zones:

```sql
-- Step 1: Create a Storage Integration (one-time, admin task)
CREATE STORAGE INTEGRATION s3_data_lake_int
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = 'S3'
    ENABLED = TRUE
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/snowflake-s3-role'
    STORAGE_ALLOWED_LOCATIONS = ('s3://my-data-lake/');

-- Step 2: Create a Named Stage
CREATE STAGE raw_orders_stage
    STORAGE_INTEGRATION = s3_data_lake_int
    URL = 's3://my-data-lake/raw/orders/'
    FILE_FORMAT = (TYPE = 'PARQUET');

-- Step 3: Create an External Table (queries S3 directly, no data copy)
CREATE EXTERNAL TABLE ext_orders (
    order_id      VARCHAR AS (VALUE:order_id::VARCHAR),
    customer_id   VARCHAR AS (VALUE:customer_id::VARCHAR),
    revenue       FLOAT   AS (VALUE:revenue::FLOAT),
    order_date    DATE    AS (VALUE:order_date::DATE)
)
PARTITION BY (order_date)
LOCATION = @raw_orders_stage
AUTO_REFRESH = TRUE  -- Snowflake monitors S3 event notifications
FILE_FORMAT = (TYPE = 'PARQUET');
```

### Snowflake Time Travel and Fail-Safe

| Feature | Time Travel | Fail-Safe |
|---------|------------|-----------|
| **Purpose** | User-accessible history (queries, clone, undrop) | Disaster recovery (Snowflake-managed) |
| **Duration** | 0–90 days (Standard=1, Enterprise=90) | Fixed 7 days (after Time Travel period) |
| **Accessible by** | You (via AT/BEFORE clause) | Snowflake Support only |
| **Cost** | ✅ Included in storage cost | ✅ Included in storage cost |

```sql
-- Query data as it was 2 days ago
SELECT * FROM orders AT (OFFSET => -172800);  -- seconds

-- Query at a specific timestamp
SELECT * FROM orders AT (TIMESTAMP => '2024-03-15 09:00:00'::TIMESTAMP_LTZ);

-- Restore a dropped table
UNDROP TABLE orders;

-- Zero-Copy Clone (reference original micro-partitions — no data copy)
CREATE TABLE orders_dev CLONE orders;  -- Instant, storage cost = 0 until writes diverge
```

---

## 3.4 Delta Lake on Databricks

### The Delta Lake Transaction Log in Detail

Delta Lake's durability and reliability come from the `_delta_log/` directory. Understanding this is essential for operational work:

```
s3://my-bucket/delta-table/
├── _delta_log/
│   ├── 00000000000000000000.json   {"commitInfo":..., "protocol":..., "metaData":...}
│   ├── 00000000000000000001.json   {"add": {"path": "part-001.parquet", ...}}
│   ├── 00000000000000000002.json   {"remove": {"path": "part-001.parquet",...},
│   │                                "add": {"path": "part-003.parquet",...}}
│   └── 00000000000000000010.checkpoint.parquet  ← Snapshot at commit 10
├── part-00001-uuid.snappy.parquet  ← Still physically exists (soft-deleted)
├── part-00002-uuid.snappy.parquet
└── part-00003-uuid.snappy.parquet  ← Newest data file
```

This log enables:
- **Snapshot isolation:** Readers see a consistent version; writers don't block readers.
- **Time Travel:** Read old snapshots by replaying the log to a target version.
- **Audit History:** Every change is recorded with timestamp, user, and operation.

```python
# Read a specific Delta table version (Time Travel)
df = spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .load("s3://my-bucket/delta-table/")

# Or by timestamp
df = spark.read.format("delta") \
    .option("timestampAsOf", "2024-03-15") \
    .load("s3://my-bucket/delta-table/")

# SQL equivalents
spark.sql("SELECT * FROM orders VERSION AS OF 5")
spark.sql("SELECT * FROM orders TIMESTAMP AS OF '2024-03-15'")
```

### Delta Lake: Key Operations

```python
from delta.tables import DeltaTable
from pyspark.sql import functions as F

# --- MERGE (Upsert) ---
deltaTable = DeltaTable.forPath(spark, "s3://my-bucket/delta/orders/")
updates_df = spark.read.parquet("s3://my-bucket/raw/order_updates/")

deltaTable.alias("t").merge(
    updates_df.alias("s"),
    "t.order_id = s.order_id"
).whenMatchedUpdate(set={
    "revenue": "s.revenue",
    "status": "s.status",
    "updated_at": F.current_timestamp()
}).whenNotMatchedInsert(values={
    "order_id": "s.order_id",
    "revenue": "s.revenue",
    "status": "s.status",
    "created_at": F.current_timestamp(),
    "updated_at": F.current_timestamp()
}).execute()

# --- OPTIMIZE (Compaction + Z-Ordering) ---
# Compact small files AND co-locate related data for faster filtering
spark.sql("""
    OPTIMIZE delta.`s3://my-bucket/delta/orders/`
    ZORDER BY (customer_id, order_date)
""")
# ZORDER co-locates customer_id + order_date values in the same files
# Dramatically improves queries that filter on both columns

# --- VACUUM (Remove old files no longer referenced) ---
spark.sql("""
    VACUUM delta.`s3://my-bucket/delta/orders/`
    RETAIN 168 HOURS  -- 7 days minimum recommended
""")
# WARNING: After VACUUM, Time Travel to pre-VACUUM versions is no longer possible
```

### Databricks Auto Optimize Features

Databricks adds managed optimisation on top of open-source Delta Lake:

```sql
-- Enable Auto Optimize at table creation
CREATE TABLE orders (
    order_id    STRING,
    customer_id STRING,
    revenue     DOUBLE,
    order_date  DATE
)
USING DELTA
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',  -- Compacts during writes
    'delta.autoOptimize.autoCompact'   = 'true',  -- Async compaction post-write
    'delta.dataSkippingNumIndexedCols' = '4'       -- Stats collected on first 4 cols
);
```

---

## 3.5 Medallion Architecture: Implementation per Platform

The Medallion (Bronze/Silver/Gold) pattern is a universal data lake design pattern. Here's how it maps to each platform:

| Layer | Purpose | AWS Implementation | Snowflake Implementation | Databricks Implementation |
|-------|---------|-------------------|-------------------------|--------------------------|
| **Bronze** | Raw, immutable ingestion | S3 prefix `/raw/`, Glue Catalog, no transformations | Raw staging tables or External Tables on S3 | Delta tables with `PERMISSIVE` mode, schema-on-read |
| **Silver** | Cleaned, conformed, joined | S3 `/curated/`, Glue ETL or EMR Spark jobs, Parquet | Snowflake tables after Snowpipe/COPY INTO | Delta tables after DLT (Delta Live Tables) validation |
| **Gold** | Business-level aggregates | S3 `/aggregated/`, served by Athena or Redshift Spectrum | Snowflake views + aggregation tables | Delta tables, served by SQL Warehouses or Databricks dashboards |

```
Databricks DLT (Delta Live Tables) — Declarative Medallion:

import dlt
from pyspark.sql import functions as F

# Bronze — raw ingestion
@dlt.table(comment="Raw orders from source systems")
def bronze_orders():
    return (
        spark.readStream.format("cloudFiles")
            .option("cloudFiles.format", "json")
            .load("s3://my-bucket/landing/orders/")
    )

# Silver — validated and cleaned
@dlt.table(comment="Validated orders with quality checks")
@dlt.expect_or_drop("valid_revenue", "revenue > 0")
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
def silver_orders():
    return (
        dlt.read_stream("bronze_orders")
            .withColumn("order_date", F.to_date("order_date_str", "yyyy-MM-dd"))
            .withColumn("revenue", F.col("revenue").cast("double"))
            .drop("order_date_str")
    )

# Gold — business aggregate
@dlt.table(comment="Daily revenue by region")
def gold_daily_revenue():
    return (
        dlt.read("silver_orders")
            .groupBy("region", "order_date")
            .agg(F.sum("revenue").alias("total_revenue"),
                 F.count("order_id").alias("order_count"))
    )
```

---

## 3.6 Storage Feature Comparison Matrix

| Feature | AWS S3 + Lake Formation | Snowflake | Databricks Delta Lake |
|---------|------------------------|-----------|----------------------|
| **ACID Transactions** | ⚠️ Via Iceberg or Governed Tables | ✅ Native | ✅ Native |
| **Time Travel** | ⚠️ Via S3 Versioning (costly) or Iceberg | ✅ 0–90 days | ✅ 30 days (default) |
| **Zero-Copy Clone** | ❌ Not native | ⚡ Instant clone | ⚠️ Shallow clone (metadata only) |
| **Auto Compaction** | ❌ Manual Glue/EMR job | ✅ Automatic | ✅ Auto Optimize (Databricks) |
| **Schema Evolution** | ⚠️ Manual Glue update | ✅ Automatic with policy | ✅ `mergeSchema` option |
| **Row-Level Security** | ✅ LF Row Filters | ✅ Row Access Policies | ✅ Unity Catalog row filters |
| **Column Masking** | ✅ LF Column Masking | ✅ Dynamic Data Masking | ✅ Unity Catalog column masks |
| **Open Format** | ✅ Parquet/ORC/Iceberg | ❌ Proprietary (internal) | ✅ Parquet + Delta spec |
| **Storage Cost Model** | Pay per GB + requests | Pay per TB compressed | Pay per GB (your own S3 account) |
| **Multi-Cloud Storage** | ❌ AWS only | ✅ S3/GCS/ADLS | ✅ S3/GCS/ADLS |

---

*Next: [04 — Compute & Processing](./04_Compute_and_Processing.md)*
