---
title: "Delta Lake"
description: "Implement Delta Lake: ACID transactions, time travel, schema enforcement, merge operations (upsert), and performance optimization"
order: 8
duration: "35-45 minutes"
difficulty: "advanced"
---

# Delta Lake

Delta Lake is an open-source storage layer that brings ACID transactions to Apache Spark and big data workloads. It runs on top of existing data lakes (Parquet files on HDFS/S3) and provides streaming capabilities, schema enforcement, and time travel.

## What Delta Lake Provides

| Feature | Description | Benefit |
|---|---|---|
| **ACID Transactions** | Atomic, Consistent, Isolated, Durable | No partial failures, concurrent readers get consistent view |
| **Schema Enforcement** | Validates writes against table schema | Prevents data corruption |
| **Schema Evolution** | Allows safe schema changes | Graceful column additions |
| **Time Travel** | Query previous versions of data | Audit, rollback, reproducibility |
| **Merge/Upsert** | INSERT, UPDATE, DELETE with condition | CDC, slowly changing dimensions |
| **Vacuum** | Clean up old files | Storage management |

## Setup

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("DeltaLake") \
    .master("local[*]") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()
```

## Creating Delta Tables

```python
from pyspark.sql.functions import col, current_timestamp

data = [
    (1, "Alice", "Engineering", 120000),
    (2, "Bob", "Design", 90000),
    (3, "Charlie", "Engineering", 150000),
    (4, "Diana", "Marketing", 80000)
]
df = spark.createDataFrame(data, ["id", "name", "dept", "salary"])

# Save as Delta table
df.write.format("delta").mode("overwrite").save("/data/delta/employees")

# Create managed table
df.write.format("delta").saveAsTable("employees")

# Create Delta table from existing Parquet
df_parquet = spark.read.parquet("/data/parquet/employees")
df_parquet.write.format("delta").mode("overwrite").save("/data/delta/employees")
```

> [!SUCCESS]
> Delta tables are self-describing — the schema, version history, and transaction log are stored alongside the data. No external metastore is required.

## Reading Delta Tables

```python
# Standard read
df = spark.read.format("delta").load("/data/delta/employees")
df.show()

# Time travel — query previous versions
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .load("/data/delta/employees")

df_timestamp = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-15") \
    .load("/data/delta/employees")

# Compare current vs previous
print(f"Current version count: {df.count()}")
print(f"Version 0 count: {df_v0.count()}")
```

## ACID Transactions

```python
# Concurrent writes are atomic
df1.write.format("delta").mode("append").save("/data/delta/employees/")
df2.write.format("delta").mode("append").save("/data/delta/employees/")
# Both writes happen atomically — no partial state

# Check transaction history
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/delta/employees")
history = delta_table.history()
history.show()
# +-------+------------------+------+--------+
# |version|      timestamp   |operation|...|
# +-------+------------------+------+--------+
# |      3|2024-01-15 10:30..|   WRITE|    |
# |      2|2024-01-15 09:15..|   WRITE|    |
# |      1|2024-01-14 16:00..|   WRITE|    |
# |      0|2024-01-14 10:00..|   WRITE|    |
# +-------+------------------+------+--------+
```

## Schema Enforcement and Evolution

```python
# Schema enforcement — rejects incompatible writes
bad_data = [(5, "Eve", 95000)]  # Missing dept column — FAILS
try:
    bad_df = spark.createDataFrame(bad_data, ["id", "name", "salary"])
    bad_df.write.format("delta").mode("append").save("/data/delta/employees")
except Exception as e:
    print(f"Schema enforcement blocked write: {e}")

# Schema evolution — allow adding columns
new_data = [(5, "Eve", "Engineering", 125000, "NY")]
new_df = spark.createDataFrame(new_data, ["id", "name", "dept", "salary", "city"])

new_df.write \
    .format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save("/data/delta/employees")

# Read updated schema
updated_df = spark.read.format("delta").load("/data/delta/employees")
updated_df.printSchema()
# root
#  |-- id: integer
#  |-- name: string
#  |-- dept: string
#  |-- salary: integer
#  |-- city: string (new column)
```

> [!WARNING]
> Schema evolution (`mergeSchema=true`) adds new columns but does not remove or change existing column types. For column removal, use ALTER TABLE or rewrite the table.

## Merge (Upsert)

```python
delta_table = DeltaTable.forPath(spark, "/data/delta/employees")

# New data with changes
updates = spark.createDataFrame([
    (1, "Alice", "Engineering", 130000),   # Updated salary
    (2, "Bob", "Design", 95000),            # Updated salary
    (6, "Frank", "Marketing", 90000)        # New employee
], ["id", "name", "dept", "salary"])

# Merge: INSERT new, UPDATE existing
delta_table.alias("target") \
    .merge(
        updates.alias("source"),
        "target.id = source.id"
    ) \
    .whenMatchedUpdate(set={
        "name": "source.name",
        "dept": "source.dept",
        "salary": "source.salary"
    }) \
    .whenNotMatchedInsert(values={
        "id": "source.id",
        "name": "source.name",
        "dept": "source.dept",
        "salary": "source.salary"
    }) \
    .execute()
```

### Advanced Merge Operations

```python
# Delete matched records
delta_table.alias("target") \
    .merge(updates.alias("source"), "target.id = source.id") \
    .whenMatchedDelete(condition="source.salary < 50000") \
    .whenNotMatchedInsertAll() \
    .execute()

# Conditional updates with different logic
delta_table.alias("target") \
    .merge(updates.alias("source"), "target.id = source.id") \
    .whenMatchedUpdate(condition="target.salary < source.salary", set={
        "salary": "source.salary",
        "updated_at": "current_timestamp()"
    }) \
    .whenNotMatchedInsertAll() \
    .execute()
```

## Streaming with Delta

```python
# Streaming write to Delta
streaming_df = spark.readStream \
    .format("kafka") \
    .option("subscribe", "events") \
    .load()

streaming_df.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/data/checkpoints/events") \
    .outputMode("append") \
    .start("/data/delta/events/")

# Streaming read from Delta (CDC)
streaming_read = spark.readStream \
    .format("delta") \
    .load("/data/delta/employees")

streaming_read.writeStream \
    .format("console") \
    .start()
```

## Vacuum and Optimization

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/delta/employees")

# Optimize file layout (compact small files)
delta_table.optimize().execute()

# Optimize with Z-ordering (like clustering)
delta_table.optimize().executeZOrderBy("id", "dept")

# Vacuum — remove old files (default retention: 7 days)
delta_table.vacuum(retentionHours=168)  # 7 days

# Describe history
delta_table.history().show(10, truncate=False)

# Describe details
delta_table.detail().show(truncate=False)
```

> [!NOTE]
> Vacuum removes files older than the retention period. Spark's time travel queries cannot access vacuumed versions. The default retention of 7 days protects against concurrent operations.

## Performance Tuning

```python
# Enable Delta caching
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled", "true")

# Auto-optimize on writes
spark.conf.set("spark.databricks.delta.autoCompact.enabled", "true")

# Column statistics for data skipping
spark.conf.set("spark.databricks.delta.properties.defaults.dataSkippingNumIndexedCols", "10")

# Set Delta table properties
sql = """
ALTER TABLE employees SET TBLPROPERTIES (
    delta.minFileSize = 104857600,
    delta.maxFileSize = 1073741824,
    delta.autoOptimize.optimizeWrite = true,
    delta.autoOptimize.autoCompact = true
)
"""
spark.sql(sql)
```

## Practice Questions

1. What ACID guarantees does Delta Lake provide on top of Parquet files?
2. How does time travel work in Delta Lake?
3. What happens during a merge (upsert) operation?
4. How does schema enforcement protect data quality?
5. What is the purpose of vacuum and what is the default retention?
6. How does Delta Lake support streaming reads and writes?
7. What is the Delta transaction log and what does it store?
8. How do you resolve conflicts during concurrent writes?
9. When would you use `optimize` and `ZORDER BY`?
10. How does Delta Lake differ from standard Parquet tables?
