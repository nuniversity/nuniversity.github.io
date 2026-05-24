---
title: "RDD Actions"
description: "Learn RDD actions: collect, count, take, reduce, foreach, and saveAsTextFile with PySpark examples"
order: 6
duration: "30-40 minutes"
difficulty: "beginner"
---

# RDD Actions

Actions trigger Spark to execute the transformation DAG and return a result to the driver or write data to storage. Without actions, transformations are never computed.

> [!NOTE]
> Each action causes Spark to re-evaluate the entire lineage from the source data. Use `cache()` or `persist()` to avoid recomputing intermediate RDDs when running multiple actions.

## collect()

Returns all elements of the RDD as a list to the driver.

```python
rdd = sc.parallelize(range(1, 11))
data = rdd.collect()
print(data)  # [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

> [!WARNING]
> `collect()` brings all data to the driver. For large RDDs, this can cause out-of-memory errors. Only use `collect()` on small datasets or after filtering/aggregation.

## count()

Returns the number of elements in the RDD.

```python
rdd = sc.parallelize(range(1, 1001))
print(f"Count: {rdd.count()}")  # Count: 1000

# Count with filter
errors = sc.parallelize([
    "INFO: OK", "ERROR: Failed", "INFO: Done", "ERROR: Timeout"
])
error_count = errors.filter(lambda x: "ERROR" in x).count()
print(f"Errors: {error_count}")  # Errors: 2
```

## take(n)

Returns the first `n` elements of the RDD to the driver. Unlike `collect()`, it retrieves only a limited number of elements.

```python
rdd = sc.parallelize(range(1, 10001))

# Take first 5 elements
print(rdd.take(5))   # [1, 2, 3, 4, 5]

# Take ordered (uses more resources)
print(rdd.takeOrdered(5))          # [1, 2, 3, 4, 5]
print(rdd.takeOrdered(5, key=lambda x: -x))  # [10000, 9999, 9998, 9997, 9996]

# Take sample
print(rdd.takeSample(False, 3))    # 3 random elements
```

> [!SUCCESS]
> Use `take(n)` for exploring data instead of `collect()`. It's much safer and gives you a representative sample to understand your data structure.

## first()

Returns the first element of the RDD. Equivalent to `take(1)[0]`.

```python
rdd = sc.parallelize(["first", "second", "third"])
print(rdd.first())  # first
```

## reduce()

Aggregates elements using an associative and commutative function.

```python
rdd = sc.parallelize(range(1, 11))

# Sum all elements
total = rdd.reduce(lambda a, b: a + b)
print(total)  # 55

# Find maximum
max_val = rdd.reduce(lambda a, b: a if a > b else b)
print(max_val)  # 10

# Find minimum
min_val = rdd.reduce(lambda a, b: a if a < b else b)
print(min_val)  # 1
```

> [!NOTE]
> The function passed to `reduce()` must be associative and commutative. This is required because data is processed across multiple partitions in parallel, and results are combined in arbitrary order.

## fold()

Similar to `reduce()`, but takes a zero value for each partition.

```python
rdd = sc.parallelize(range(1, 11))

# Sum with zero value 0
total = rdd.fold(0, lambda a, b: a + b)
print(total)  # 55

# Concatenate strings
words = sc.parallelize(["hello", " ", "world"])
result = words.fold("", lambda a, b: a + b)
print(result)  # hello world
```

> [!WARNING]
> The zero value is applied to each partition, not just once. For addition, `0` works. For multiplication, use `1`. An incorrect zero value will produce wrong results.

## aggregate()

Gives fine-grained control over aggregation with separate partition-level and global-level combine functions.

```python
rdd = sc.parallelize(range(1, 11))

# Compute (sum, count) in one pass
seq_op = lambda agg, x: (agg[0] + x, agg[1] + 1)
comb_op = lambda a, b: (a[0] + b[0], a[1] + b[1])
zero = (0, 0)

result = rdd.aggregate(zero, seq_op, comb_op)
print(f"Sum: {result[0]}, Count: {result[1]}, Avg: {result[0]/result[1]}")
# Sum: 55, Count: 10, Avg: 5.5
```

## foreach()

Applies a function to each element without returning anything to the driver. Used for side effects like writing to databases.

```python
rdd = sc.parallelize([1, 2, 3, 4, 5])

# Print each element (output appears on executors' stdout)
rdd.foreach(lambda x: print(f"Processing: {x}"))

# Write each element to a database
def write_to_db(record):
    # database_connection.insert(record)
    pass

rdd.foreach(write_to_db)
```

> [!NOTE]
> `foreach()` runs on executors, so printing goes to executor logs — not your driver console. Use `foreachPartition()` for more efficient resource management (one connection per partition).

## foreachPartition()

Like `foreach()` but operates on an entire partition at once. Useful for initializing expensive resources once per partition.

```python
def process_partition(iterator):
    # Open database connection once per partition
    conn = create_connection()
    for record in iterator:
        conn.insert(record)
    conn.close()

rdd.foreachPartition(process_partition)
```

## saveAsTextFile()

Writes the RDD as a text file (or files) to a directory.

```python
rdd = sc.parallelize(["line1", "line2", "line3", "line4"])

# Save to local filesystem
rdd.saveAsTextFile("output/text_data")

# Save to HDFS
rdd.saveAsTextFile("hdfs://namenode:9000/user/data/output/")

# Save with compression
rdd.saveAsTextFile("output/compressed", compressionCodecClass="org.apache.hadoop.io.compress.GzipCodec")
```

> [!WARNING]
> `saveAsTextFile` creates a **directory** containing multiple part files (one per partition). This is standard for distributed systems but may be unexpected if you expect a single file.

```
output/text_data/
  _SUCCESS
  part-00000
  part-00001
```

## Other Useful Actions

```python
# countByKey — count elements per key (returns dict)
pairs = sc.parallelize([("a", 1), ("b", 1), ("a", 1), ("c", 1)])
counts = pairs.countByKey()
print(dict(counts))  # {'a': 2, 'b': 1, 'c': 1}

# countByValue — count occurrences of each value
rdd = sc.parallelize([1, 2, 1, 3, 2, 1, 4])
value_counts = rdd.countByValue()
print(dict(value_counts))  # {1: 3, 2: 2, 3: 1, 4: 1}

# isEmpty — check if RDD is empty
rdd = sc.parallelize([])
print(rdd.isEmpty())   # True

# max / min
rdd = sc.parallelize([5, 2, 9, 1, 7])
print(rdd.max())  # 9
print(rdd.min())  # 1

# stdev / variance / mean (approximate)
from pyspark.statcounter import StatCounter
rdd = sc.parallelize(range(1, 101))
stats = rdd.stats()
print(f"Mean: {stats.mean()}, Stdev: {stats.stdev()}")

# histogram
rdd = sc.parallelize(range(1, 11))
buckets, counts = rdd.histogram(5)
print(f"Buckets: {buckets}, Counts: {counts}")
```

## Action Summary Table

| Action | Returns | Driver Data | When to Use |
|---|---|---|---|
| `collect()` | List | All data | Small results only |
| `count()` | Int | Single number | Any dataset |
| `take(n)` | List | n elements | Data exploration |
| `first()` | Element | 1 element | Quick peek |
| `reduce()` | Element | Single value | Aggregation |
| `fold()` | Element | Single value | Aggregation with zero |
| `aggregate()` | Element | Single value | Complex aggregation |
| `foreach()` | Nothing | None | Side effects |
| `saveAsTextFile()` | Nothing | None | Persist results |
| `countByKey()` | Dict | Dict of counts | Frequency per key |

## Practice Questions

1. Why does `collect()` risk out-of-memory errors on large datasets?
2. What is the difference between `take(10)` and `collect()`?
3. What constraints must the function passed to `reduce()` satisfy? Why?
4. How does `fold()` differ from `reduce()`? When would you use each?
5. What is the advantage of `aggregate()` over `fold()`?
6. Why does `saveAsTextFile` create a directory instead of a single file?
7. How is `foreachPartition()` more efficient than `foreach()`?
8. What does `takeOrdered(3, key=lambda x: -x)` return?
9. Why might `countByValue()` be expensive on large datasets?
10. When should you call `cache()` before running multiple actions on the same RDD?
