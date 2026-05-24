---
title: "Join Strategies"
description: "Understand join types (inner, outer, semi, anti), broadcast hash join, sort merge join, and skew join handling"
order: 4
duration: "35-45 minutes"
difficulty: "intermediate"
---

# Join Strategies

Joins are among the most expensive operations in Spark. Choosing the right join strategy can mean the difference between a pipeline that runs in minutes versus one that crashes with OOM errors. This lesson covers join types, physical join strategies, and optimization techniques.

## Join Types

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("JoinStrategies") \
    .master("local[*]") \
    .getOrCreate()

employees = spark.createDataFrame([
    (1, "Alice", "Engineering"),
    (2, "Bob", "Design"),
    (3, "Charlie", "Engineering"),
    (4, "Diana", "Marketing"),
    (5, "Eve", None)
], ["emp_id", "name", "dept"])

salaries = spark.createDataFrame([
    (1, 120000),
    (2, 90000),
    (3, 150000),
    (4, 110000),
    (6, 95000)
], ["emp_id", "salary"])
```

### Inner Join

Returns rows where keys match in both DataFrames.

```python
inner = employees.join(salaries, on="emp_id", how="inner")
inner.show()
# +------+-------+-----------+------+
# |emp_id|   name|       dept|salary|
# +------+-------+-----------+------+
# |     1|  Alice|Engineering|120000|
# |     2|    Bob|     Design| 90000|
# |     3|Charlie|Engineering|150000|
# |     4|  Diana|  Marketing|110000|
# +------+-------+-----------+------+
```

### Left Outer Join

Returns all rows from the left DataFrame, with nulls where right side is missing.

```python
left = employees.join(salaries, on="emp_id", how="left")
left.show()
# +------+-------+-----------+------+
# |emp_id|   name|       dept|salary|
# +------+-------+-----------+------+
# |     1|  Alice|Engineering|120000|
# |     2|    Bob|     Design| 90000|
# |     3|Charlie|Engineering|150000|
# |     4|  Diana|  Marketing|110000|
# |     5|    Eve|       null|  null|
# +------+-------+-----------+------+
```

### Right Outer Join

Returns all rows from the right DataFrame.

```python
right = employees.join(salaries, on="emp_id", how="right")
right.show()
# +------+-------+-----------+------+
# |emp_id|   name|       dept|salary|
# +------+-------+-----------+------+
# |     1|  Alice|Engineering|120000|
# |     2|    Bob|     Design| 90000|
# |     3|Charlie|Engineering|150000|
# |     4|  Diana|  Marketing|110000|
# |     6|   null|       null| 95000|
# +------+-------+-----------+------+
```

### Full Outer Join

Returns all rows from both DataFrames.

```python
full = employees.join(salaries, on="emp_id", how="full")
full.orderBy("emp_id").show()
```

### Left Semi Join

Returns rows from the left DataFrame that have a match in the right. No right-side columns are included.

```python
semi = employees.join(salaries, on="emp_id", how="left_semi")
semi.show()
# +------+-------+-----------+
# |emp_id|   name|       dept|
# +------+-------+-----------+
# |     1|  Alice|Engineering|
# |     2|    Bob|     Design|
# |     3|Charlie|Engineering|
# |     4|  Diana|  Marketing|
# +------+-------+-----------+
# (Eve excluded because emp_id 5 has no salary record)
```

> [!SUCCESS]
> `left_semi` is the most efficient way to filter one DataFrame by the existence of keys in another. It avoids shuffling right-side columns.

### Left Anti Join

Returns rows from the left DataFrame that have **no** match in the right.

```python
anti = employees.join(salaries, on="emp_id", how="left_anti")
anti.show()
# +------+----+----+
# |emp_id|name|dept|
# +------+----+----+
# |     5| Eve|null|
# +------+----+----+
```

## Physical Join Strategies

Spark's query planner selects a join strategy based on statistics, hints, and configuration.

### Broadcast Hash Join (BHJ)

For small tables (default < 10 MB), Spark broadcasts the entire table to all executors.

```python
from pyspark.sql.functions import broadcast

# Force broadcast hint
small_df = salaries  # Assuming this is small
result = employees.join(broadcast(small_df), "emp_id", "inner")
result.explain()
# == Physical Plan ==
# BroadcastHashJoin ...
```

| Property | Value |
|---|---|
| **Best for** | One table small enough to fit in executor memory |
| **No shuffle** for the small table | Broadcasted once to all executors |
| **Threshold** | `spark.sql.autoBroadcastJoinThreshold` (default 10 MB) |
| **Risk** | Broadcasting a large table causes OOM or driver bottleneck |

> [!NOTE]
> To disable broadcast join for a specific query, set `spark.sql.autoBroadcastJoinThreshold=-1` or use `/*+ BROADCAST(t) */` and `/*+ NO_BROADCAST(t) */` hints.

### Sort Merge Join (SMJ)

Default for large tables. Both sides are sorted and merged.

```python
# Set to prefer sort merge join
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", -1)

large_df1 = spark.range(1, 1000000)
large_df2 = spark.range(1, 1000000)

result = large_df1.join(large_df2, "id")
result.explain()
# == Physical Plan ==
# SortMergeJoin ...
```

| Property | Value |
|---|---|
| **Best for** | Large tables (both sides) |
| **Requires** | Sorting both sides by join key |
| **Shuffle** | Both sides shuffled by join key |
| **Scales to** | Any size (disk-backed) |

### Shuffled Hash Join

Like SMJ but uses hashing instead of sorting. Enabled when `spark.sql.join.preferSortMergeJoin=false`.

```python
spark.conf.set("spark.sql.join.preferSortMergeJoin", false)
```

### Broadcast Nested Loop Join

Fallback when no equi-join condition exists (cross join or complex condition).

```python
# Cross join (cartesian product)
cross = employees.crossJoin(salaries)
cross.show()

# With non-equi condition
from pyspark.sql.functions import col
result = employees.alias("e").join(
    salaries.alias("s"),
    col("e.emp_id") < col("s.emp_id"),
    "inner"
)
```

> [!WARNING]
> Cross joins generate N×M rows. With two datasets of 1 million rows each, that's 1 trillion rows. Avoid cross joins on large data.

## Skew Join Handling

Data skew — where one key has disproportionately many values — can cause long-tail tasks.

```python
# Check for skew
skew_check = df.groupBy("join_key").agg(count("*").alias("cnt")) \
    .orderBy(col("cnt").desc())
skew_check.show(10)

# Enable skew join optimization (Spark 3.x)
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")
```

> [!NOTE]
> Spark 3.x's Adaptive Query Execution (AQE) can automatically detect and split skewed partitions during join. This is a major improvement over Spark 2.x where skew had to be handled manually.

### Manual Skew Handling

```python
# Salt the skewed key (add random suffix to split across partitions)
from pyspark.sql.functions import rand, concat, floor

skewed_key = "NY"

# Salting the large side
salted_large = large_df \
    .withColumn("salt", (rand() * 10).cast("int")) \
    .withColumn("salted_key", concat(col("key"), lit("_"), col("salt")))

# Duplicating the small side
from pyspark.sql.functions import explode, array, lit

salted_small = small_df \
    .withColumn("salt", explode(array([lit(i) for i in range(10)]))) \
    .withColumn("salted_key", concat(col("key"), lit("_"), col("salt")))

# Join on salted keys then deduplicate
result = salted_large.join(salted_small, "salted_key").drop("salt")
```

## Join Performance Summary

| Strategy | Small Table | Large Table | Shuffle | Memory |
|---|---|---|---|---|
| **Broadcast Hash** | < 10 MB | Any size | None (small broadcasted) | Small table in each executor |
| **Sort Merge** | Any | Any | Both sides sorted | Minimal (streams from disk) |
| **Shuffled Hash** | Any | Any | Both sides hashed | One side in hash table |
| **Broadcast Nested Loop** | < 10 MB | Any | None | High (cross join memory) |

## Best Practices

1. **Filter before joining** to reduce data volume
2. **Select only needed columns** before the join
3. **Broadcast small tables** explicitly with `broadcast()`
4. **Use `left_semi`** instead of inner join when you only need left-side columns
5. **Monitor for skew** using Spark UI's stage details
6. **Enable AQE** (`spark.sql.adaptive.enabled=true`) for automatic skew handling
7. **Avoid Cartesian products** (cross joins)

## Practice Questions

1. What are the five main join types in Spark?
2. How does `left_semi` differ from an inner join?
3. When does Spark choose a broadcast hash join over a sort merge join?
4. What is the default broadcast threshold and how do you change it?
5. How does sort merge join work internally?
6. What causes data skew and how does it affect join performance?
7. How does Adaptive Query Execution (AQE) handle skewed joins?
8. What is salting and when would you use it?
9. Why is a cross join dangerous on large datasets?
10. How can you force a broadcast join using a hint?
