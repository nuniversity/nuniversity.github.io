---
title: "Partitioning and Bucketing"
description: "Learn repartition, coalesce, partitionBy, bucketing, and data layout optimization for better Spark performance"
order: 6
duration: "35-45 minutes"
difficulty: "intermediate"
---

# Partitioning and Bucketing

Proper data layout is critical for Spark performance. Partitioning and bucketing control how data is organized on disk and in memory, directly impacting shuffle size, parallelism, and query speed.

## Partitioning in Memory: repartition vs coalesce

### repartition()

Increases or decreases the number of partitions by shuffling data.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Partitioning") \
    .master("local[*]") \
    .getOrCreate()

df = spark.range(1, 10000, numPartitions=8)
print(f"Initial partitions: {df.rdd.getNumPartitions()}")  # 8

# Increase partitions (full shuffle)
repartitioned = df.repartition(16)
print(f"After repartition: {repartitioned.rdd.getNumPartitions()}")  # 16

# Repartition by column (hash-based)
df_repartitioned = df.repartition(10, "id")
print(f"By column: {df_repartitioned.rdd.getNumPartitions()}")  # 10
```

> [!NOTE]
> `repartition()` causes a full shuffle. Use it to increase parallelism or to group related data on the same partition.

### coalesce()

Shrink partitions without a full shuffle (merges existing partitions).

```python
# Decrease partitions (no shuffle)
coalesced = repartitioned.coalesce(4)
print(f"After coalesce: {coalesced.rdd.getNumPartitions()}")  # 4
```

| Aspect | repartition() | coalesce() |
|---|---|---|
| **Shuffle** | Full shuffle | Minimal (merges) |
| **Partitions** | Increase or decrease | Decrease only |
| **Data distribution** | Even (round-robin) | Uneven possible |
| **Use case** | Increase parallelism | Reduce partitions for output |

> [!WARNING]
> `coalesce()` cannot increase partitions. It only merges existing partitions, which can result in uneven data distribution. Use `repartition()` when you need to increase parallelism or evenly distribute data.

## Partitioning on Disk: partitionBy

When writing data, `partitionBy()` organizes files into directory hierarchies based on column values.

```python
# Write with partitioning
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("data/sales")

# Directory structure:
# data/sales/
#   year=2024/month=01/
#     part-00001.parquet
#     part-00002.parquet
#   year=2024/month=02/
#     part-00001.parquet
#   year=2024/month=03/
#     ...

# Reading back — Spark automatically uses partition pruning
df_2024 = spark.read.parquet("data/sales") \
    .filter(col("year") == 2024)
# Only reads year=2024/ directories
```

> [!SUCCESS]
> Partition pruning is one of the most effective optimizations. When you filter on a partition column, Spark reads only the relevant directories. For a table partitioned by date, querying a single day reads only that day's data.

### Choosing Partition Columns

```python
# Good: low cardinality, frequently filtered
.write.partitionBy("region", "year")

# Bad: high cardinality (creates too many directories)
.write.partitionBy("user_id")

# Bad: too many partition columns (directory explosion)
.write.partitionBy("year", "month", "day", "hour", "region")
```

| Best Practices | Reason |
|---|---|
| **≤ 3 partition columns** | Avoids directory explosion |
| **Low cardinality** | < 500 distinct values per partition column |
| **Frequent filter** | Used in WHERE clauses |
| **Even data distribution** | Avoids small file problem |

## Bucketing

Bucketing organizes data into a fixed number of files (buckets) using a hash of the bucketing column.

```python
# Write with bucketing
df.write \
    .mode("overwrite") \
    .bucketBy(10, "emp_id") \
    .sortBy("salary") \
    .saveAsTable("employees_bucketed")

# Benefits: no shuffle on bucketed join keys
# Read back (automatically uses bucket info)
bucketed_df = spark.table("employees_bucketed")
```

### Bucketing for Join Optimization

```python
# Create two bucketed tables on the same key
df1.write.bucketBy(10, "key").saveAsTable("t1")
df2.write.bucketBy(10, "key").saveAsTable("t2")

# Join — no shuffle needed!
result = spark.table("t1").join(spark.table("t2"), "key")
result.explain()
# SortMergeJoin (no exchange/shuffle before join)
```

> [!NOTE]
> Bucketing eliminates shuffle for joins and aggregations on the bucketed column. Both tables must use the same number of buckets and the same bucketing column for this optimization to work.

### Bucketing vs Partitioning

| Aspect | Partitioning | Bucketing |
|---|---|---|
| **Storage layout** | Directory per value | Fixed number of files |
| **Cardinality limit** | Low (< 500) | Any |
| **Shuffle elimination** | Partition pruning (reads) | Join/agg shuffle (writes) |
| **Best for** | Time-series, geographic data | High-cardinality keys (user_id) |
| **File count** | Variable (depends on values) | Fixed (bucket count) |

## Practical Partition Management

### Dynamic vs Static Partitioning

```python
# Dynamic partitioning (Spark decides values)
df.write \
    .mode("overwrite") \
    .partitionBy("year", "month") \
    .format("parquet") \
    .save("data/sales_dynamic")

# Static partitioning (specify partition value)
df.write \
    .mode("overwrite") \
    .option("partitionOverwriteMode", "static") \
    .partitionBy("year") \
    .parquet("data/sales_static")
```

### Partition Management Tools

```python
# Repair table metadata
spark.sql("MSCK REPAIR TABLE sales_table")

# Show partitions
spark.sql("SHOW PARTITIONS sales_table").show()

# Add partition manually
spark.sql("ALTER TABLE sales_table ADD PARTITION (year=2024, month=4)")

# Drop partition
spark.sql("ALTER TABLE sales_table DROP PARTITION (year=2023)")
```

## Small File Problem

Too many small files creates metadata overhead and slow reads.

```python
# Problem: writing with too many partitions
df.repartition(1000).write.parquet("output/")  # 1000 small files!

# Solution 1: Reduce partition count for output
df.coalesce(4).write.parquet("output/")

# Solution 2: Use maxRecordsPerFile
df.write \
    .option("maxRecordsPerFile", 100000) \
    .parquet("output/")

# Solution 3: Post-processing with file compaction
df_output = spark.read.parquet("output/")
df_output.coalesce(4).write.mode("overwrite").parquet("output_compacted/")
```

## Optimal Partition Count Formula

```
Number of partitions = (Total data size) / (target partition size)
Target partition size = HDFS block size (128 MB) or slightly less
```

```python
# For 1 TB of data with 128 MB target partitions
target_partitions = 1 * 1024 * 1024  # MB / 128 MB = ~8192 partitions

# Adjust based on cluster resources
cores_available = 100  # Total executor cores
partitions = max(cores_available * 2, 8192)  # At least 2x cores
```

## Data Layout Strategy

Choose based on query patterns:

```python
# Time-series data: partition by date
df.write.partitionBy("event_date").parquet("events/")

# User-centric queries: bucket by user_id
df.write.bucketBy(50, "user_id").sortBy("event_date").saveAsTable("user_events")

# Geographic: partition by region, bucket by store_id
df.write \
    .partitionBy("region") \
    .bucketBy(20, "store_id") \
    .sortBy("sale_date") \
    .saveAsTable("store_sales")
```

## Practice Questions

1. What is the difference between `repartition()` and `coalesce()`?
2. When would you use `partitionBy` when writing data?
3. How does bucketing eliminate shuffle during joins?
4. What is the "small file problem" and how do you avoid it?
5. Why is high-cardinality partitioning (e.g., by user_id) problematic?
6. How do you choose between partitioning and bucketing?
7. What is partition pruning and how does it work?
8. How does AQE's dynamic coalescing improve partition management?
9. What is the recommended partition count formula?
10. What does `MSCK REPAIR TABLE` do and when is it needed?
