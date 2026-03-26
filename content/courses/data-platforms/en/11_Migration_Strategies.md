---
title: "Migration Strategies"
description: "Explore execution plans and common patterns for platform migration, including translating SQL dialects and transitioning from Redshift or Hadoop to Snowflake or Databricks."
order: 11
difficulty: advanced
duration: "60 min"
---

# Migration Strategies

> **Bottom Line:** There is no "lift-and-shift" for data platforms. Every migration is a re-architecture. The most successful migrations treat the move as an opportunity to modernise data models, rationalise pipelines, and establish governance — not just copy SQL from one system to another.

---

## 11.1 Migration Pattern Classification

```
Pattern 1: FORK-AND-RUN (Parallel Running)
  Run old + new platform in parallel → gradually move workloads → decommission old
  Risk: Low | Cost: High (dual running) | Duration: 6-18 months

Pattern 2: BIG BANG MIGRATION
  Freeze old system, migrate everything, cutover on a date
  Risk: High | Cost: Medium | Duration: 3-6 months
  Only viable for small platforms or non-critical data

Pattern 3: INCREMENTAL DOMAIN MIGRATION
  Migrate domain by domain (Finance first, then Marketing, then Operations)
  Risk: Medium | Cost: Medium-High | Duration: 12-24 months
  Recommended for large enterprises

Pattern 4: STRANGLER FIG
  New workloads go to new platform; old platform atrophies as workloads migrate
  Risk: Low | Cost: Medium | Duration: 18-36 months
  Best for politically complex organisations
```

---

## 11.2 Redshift → Snowflake Migration

### Common Drivers
- Snowflake's management-free operation vs. Redshift maintenance overhead
- Need for cross-cloud or cross-org data sharing
- Snowflake's concurrency model for large analyst teams
- Moving away from column DISTKEY/SORTKEY maintenance burden

### Schema Compatibility

```sql
-- Redshift DDL (Before)
CREATE TABLE orders (
    order_id    VARCHAR(36)      NOT NULL,
    customer_id VARCHAR(36),
    revenue     DECIMAL(10, 2),
    region      VARCHAR(50),
    order_date  DATE             NOT NULL,
    created_at  TIMESTAMP        DEFAULT GETDATE()
)
DISTKEY(customer_id)   -- ← Not supported in Snowflake (remove)
SORTKEY(order_date)    -- ← Not supported (remove — Snowflake is automatic)
ENCODE ZSTD;           -- ← Not applicable (remove)

-- Snowflake DDL (After)
CREATE TABLE orders (
    order_id    VARCHAR(36)      NOT NULL,
    customer_id VARCHAR(36),
    revenue     NUMBER(10, 2),   -- ← DECIMAL → NUMBER (compatible)
    region      VARCHAR(50),
    order_date  DATE             NOT NULL,
    created_at  TIMESTAMP_LTZ   DEFAULT CURRENT_TIMESTAMP()  -- ← Timezone-aware!
)
-- No DISTKEY / SORTKEY needed — Snowflake handles physical layout automatically
CLUSTER BY (order_date);  -- ← Optional for very large tables
```

### SQL Dialect Translation: Key Differences

| Feature | Redshift SQL | Snowflake SQL |
|---------|-------------|---------------|
| **String concatenation** | `||` or `+` | `||` (standard) |
| **Date arithmetic** | `DATEADD(day, 7, order_date)` | `DATEADD('day', 7, order_date)` or `order_date + 7` |
| **NVL** | `NVL(col, default)` | `NVL(col, default)` or `IFNULL(col, default)` |
| **ISNULL** | `ISNULL(col, default)` | Use `NVL()` or `COALESCE()` |
| **LISTAGG** | `LISTAGG(col, ',') WITHIN GROUP (ORDER BY col)` | Same syntax ✅ |
| **APPROXIMATE COUNT** | `APPROXIMATE COUNT(DISTINCT col)` | `HLL_ACCUMULATE(col)` / `APPROX_COUNT_DISTINCT(col)` |
| **SUPER type (JSON)** | `JSON_EXTRACT_PATH_TEXT(col, 'key')` | `col:key::STRING` (Snowflake semi-structured) |
| **Window ROWS/RANGE** | Standard | Standard ✅ |
| **COPY FROM S3** | `COPY orders FROM 's3://...' IAM_ROLE '...'` | `COPY INTO orders FROM @stage` |
| **System tables** | `SVL_QUERY_SUMMARY`, `STL_*` | `SNOWFLAKE.ACCOUNT_USAGE.*` |

### Migration Execution Plan

```bash
# Phase 1: Assessment (2-4 weeks)
# 1. Inventory all objects: tables, views, stored procedures, UDFs, external schemas
QUERY: SELECT table_schema, table_name, table_type FROM information_schema.tables;

# 2. Analyse query patterns — identify top 50 queries by frequency/cost
# 3. Map Redshift specific features to Snowflake equivalents
# 4. Identify SUPER columns (JSON) — map to VARIANT in Snowflake
# 5. Estimate storage (compressed Redshift bytes → Snowflake credits)

# Phase 2: Schema Migration (2-4 weeks)
# Use AWS Schema Conversion Tool (SCT) for initial DDL translation
# Then manually review and fix incompatibilities

# Phase 3: Data Migration (varies by size)
# Option A: Redshift → S3 → Snowflake COPY INTO
UNLOAD ('SELECT * FROM orders')
TO 's3://migration-bucket/orders/'
IAM_ROLE 'arn:aws:iam::123456789:role/RedshiftUnloadRole'
PARQUET
ALLOWOVERWRITE
PARALLEL ON;

-- Then in Snowflake:
CREATE STAGE migration_stage
    URL = 's3://migration-bucket/'
    STORAGE_INTEGRATION = s3_migration_int;

COPY INTO snowflake_db.schema.orders
FROM @migration_stage/orders/
FILE_FORMAT = (TYPE = 'PARQUET')
MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;

# Option B: Use a migration tool (Fivetran Log, Matillion, dbt)
```

---

## 11.3 On-Premises Hadoop/Hive → Databricks Migration

### Common Drivers
- HDFS → S3/ADLS cost savings (cloud object storage is cheaper than HDFS at scale)
- Databricks Runtime > raw Apache Spark (Photon, Delta Lake ACID, Unity Catalog)
- Decommission on-premises hardware and Hadoop operations team
- Move to pay-as-you-go model from CapEx

### HDFS → S3/Delta Lake

```python
# Phase 1: Profile the existing Hive tables
# Run this on the Hive cluster to understand data volume:
"""
hive -e "
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'sys');
"
"""

# Phase 2: Use Databricks to read Hive tables directly (temporary bridge)
# Configure spark to use the on-prem Hive Metastore
spark.conf.set("spark.sql.hive.metastore.uris", "thrift://hive-metastore:9083")

# Read from Hive/HDFS table and write to Delta on S3
hive_df = spark.table("hive_db.orders")  # Reads from on-prem HDFS
hive_df.write \
    .format("delta") \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .option("overwriteSchema", "true") \
    .save("s3://my-lake/delta/ecommerce/orders/")

# Register in Unity Catalog
spark.sql("""
    CREATE TABLE IF NOT EXISTS ecommerce_prod.silver.orders
    USING DELTA
    LOCATION 's3://my-lake/delta/ecommerce/orders/'
""")

# Phase 3: Migrate Hive SQL to Spark SQL / Delta SQL
# Most HiveQL is compatible with Spark SQL — common differences below:
```

### HiveQL → Spark SQL Translation

```sql
-- HiveQL (Before):
SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(revenue) AS total_revenue
FROM orders
WHERE dt BETWEEN '2024-01' AND '2024-03'  -- Hive partition column format
GROUP BY customer_id
HAVING COUNT(*) > 5
SORT BY total_revenue DESC;  -- ← Hive-specific (not ORDER BY!)

-- Spark SQL / Delta (After):
SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(revenue) AS total_revenue
FROM ecommerce_prod.silver.orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'  -- Proper date predicates
GROUP BY customer_id
HAVING COUNT(*) > 5
ORDER BY total_revenue DESC;  -- ← Standard SQL ORDER BY

-- Key Hive → Spark differences:
-- SORT BY (intra-reducer) → ORDER BY (global)
-- INSERT OVERWRITE TABLE → INSERT OVERWRITE or write.mode("overwrite")
-- LATERAL VIEW EXPLODE → LATERAL VIEW explode() or built-in EXPLODE()
-- reflect() UDF → Spark built-in equivalents or Python UDFs
-- MAP/ARRAY types → SparkSQL MAP/ARRAY (compatible)
```

---

## 11.4 Snowflake → Databricks Migration

### Common Drivers
- Need for Python/Spark-native ML workflows
- Cost optimisation for large batch transformations
- Open format (Delta Lake) preference over Snowflake proprietary storage
- Unifying data engineering and ML engineering on one platform

### Data Export from Snowflake

```sql
-- Option 1: Unload to S3 as Parquet (recommended)
COPY INTO 's3://migration-bucket/snowflake-export/orders/'
FROM (
    SELECT
        order_id,
        customer_id,
        revenue,
        region,
        order_date::DATE AS order_date,
        created_at::TIMESTAMP_NTZ AS created_at
    FROM ecommerce.analytics.orders
    WHERE order_date >= '2020-01-01'
)
STORAGE_INTEGRATION = s3_migration_int
FILE_FORMAT = (
    TYPE = 'PARQUET'
    SNAPPY_COMPRESSION = TRUE
)
MAX_FILE_SIZE = 256000000  -- 256MB files (good for Spark)
HEADER = FALSE;

-- Option 2: Use Snowflake External Table → read directly from Databricks
-- (Avoids UNLOAD if data is already in External Tables)
```

### Import into Databricks Delta Lake

```python
# Read exported Parquet files into Delta Lake
orders_df = (
    spark.read.parquet("s3://migration-bucket/snowflake-export/orders/")
)

# Type reconciliation (Snowflake types → Spark types)
from pyspark.sql import functions as F
from pyspark.sql.types import *

orders_reconciled = (
    orders_df
    .withColumn("order_date", F.col("order_date").cast(DateType()))
    .withColumn("revenue", F.col("revenue").cast(DecimalType(10, 2)))
    .withColumn("created_at", F.col("created_at").cast(TimestampType()))
)

# Write to Delta Lake with optimal settings
(
    orders_reconciled
    .write
    .format("delta")
    .mode("overwrite")
    .option("overwriteSchema", "true")
    .partitionBy("order_date")
    .save("s3://my-lake/delta/ecommerce_prod/silver/orders/")
)

# Register with Unity Catalog
spark.sql("""
    CREATE TABLE IF NOT EXISTS ecommerce_prod.silver.orders
    USING DELTA
    LOCATION 's3://my-lake/delta/ecommerce_prod/silver/orders/'
""")

# Validate: Compare row counts
sf_count = 125_432_891  # Get from Snowflake beforehand
db_count = spark.table("ecommerce_prod.silver.orders").count()
assert db_count == sf_count, f"Row count mismatch: SF={sf_count}, DB={db_count}"
```

### dbt Migration (Common Pattern)

Most Snowflake shops use dbt for transformations. Migrating the dbt project to Databricks is often simpler than migrating raw SQL:

```yaml
# dbt profiles.yml — change the adapter profile
# Before (Snowflake):
my_project:
  target: prod
  outputs:
    prod:
      type: snowflake
      account: myorg-myaccount
      user: dbt_user
      private_key_path: /path/to/key.p8
      role: TRANSFORMER
      database: ecommerce
      warehouse: TRANSFORMER_WH
      schema: dbt_prod

# After (Databricks):
my_project:
  target: prod
  outputs:
    prod:
      type: databricks
      host: adb-1234567890.12.azuredatabricks.net
      http_path: /sql/1.0/warehouses/abc123def456
      token: "{{ env_var('DBT_DATABRICKS_TOKEN') }}"
      catalog: ecommerce_prod        # Unity Catalog catalog
      schema: dbt_prod
      threads: 8
```

```sql
-- dbt model — Snowflake SQL vs Databricks SQL differences (minimal)

-- Snowflake-specific: QUALIFY window filter
SELECT order_id, customer_id, revenue,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
FROM orders
QUALIFY rn = 1  -- ← Snowflake-specific, not available in Databricks Spark SQL

-- Databricks equivalent:
SELECT order_id, customer_id, revenue
FROM (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
    FROM orders
) WHERE rn = 1
```

---

## 11.5 Migration Validation Framework

No migration is complete without rigorous validation. Apply this three-layer test:

```python
# Layer 1: Structural Validation
def validate_schema(source_df, target_df):
    """Ensure column names and types match."""
    source_cols = {f.name: str(f.dataType) for f in source_df.schema.fields}
    target_cols = {f.name: str(f.dataType) for f in target_df.schema.fields}
    
    missing_in_target = set(source_cols.keys()) - set(target_cols.keys())
    extra_in_target = set(target_cols.keys()) - set(source_cols.keys())
    
    if missing_in_target:
        raise AssertionError(f"Missing columns in target: {missing_in_target}")
    if extra_in_target:
        print(f"WARNING: Extra columns in target: {extra_in_target}")
    
    return True

# Layer 2: Quantitative Validation
def validate_counts_and_aggregates(source_df, target_df, key_col, metric_cols):
    """Validate row counts and aggregate metrics match."""
    
    source_agg = source_df.agg(
        F.count("*").alias("row_count"),
        *[F.sum(c).alias(f"sum_{c}") for c in metric_cols]
    ).collect()[0]
    
    target_agg = target_df.agg(
        F.count("*").alias("row_count"),
        *[F.sum(c).alias(f"sum_{c}") for c in metric_cols]
    ).collect()[0]
    
    tolerance = 0.001  # 0.1% tolerance for floating point differences
    
    assert source_agg["row_count"] == target_agg["row_count"], \
        f"Row count mismatch: {source_agg['row_count']} vs {target_agg['row_count']}"
    
    for col in metric_cols:
        source_val = float(source_agg[f"sum_{col}"] or 0)
        target_val = float(target_agg[f"sum_{col}"] or 0)
        diff_pct = abs(source_val - target_val) / max(source_val, 1)
        
        assert diff_pct <= tolerance, \
            f"Aggregate mismatch for {col}: {source_val} vs {target_val} ({diff_pct:.2%})"

# Layer 3: Sample Data Validation
def validate_sample_rows(source_df, target_df, pk_col, sample_n=1000):
    """Validate a random sample of rows match exactly."""
    
    sample_pks = source_df.select(pk_col).sample(False, 0.01).limit(sample_n)
    
    source_sample = source_df.join(sample_pks, pk_col).orderBy(pk_col)
    target_sample = target_df.join(sample_pks, pk_col).orderBy(pk_col)
    
    diff = source_sample.subtract(target_sample)
    diff_count = diff.count()
    
    if diff_count > 0:
        print(f"⚠️ {diff_count} rows differ in sample:")
        diff.show(10, truncate=False)
    else:
        print(f"✅ All {sample_n} sample rows match")
```

---

## 11.6 Migration Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SQL dialect incompatibility | High | Medium | Automated testing of all queries pre-cutover |
| Data type precision loss | Medium | High | Explicit type casting + validation framework |
| Performance regression | Medium | High | Benchmark top 50 queries before decommission |
| Missing data (partitioned tables) | Low | Critical | Row count + checksum validation per partition |
| Permission/security gaps | Medium | High | Security audit, test all roles on new platform |
| ETL dependency chain breaks | High | High | Dependency mapping, staged pipeline migration |
| Stakeholder BI report breakage | Medium | High | Parallel running, UAT with report owners |
| Cost overrun during dual-run | High | Medium | Time-box dual-running period (max 90 days) |
