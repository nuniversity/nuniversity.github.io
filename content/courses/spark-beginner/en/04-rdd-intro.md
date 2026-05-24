---
title: "Introduction to RDDs"
description: "Learn about Resilient Distributed Datasets, creating RDDs with parallelize() and textFile(), and understanding RDD lineage"
order: 4
duration: "30-40 minutes"
difficulty: "beginner"
---

# Introduction to RDDs

Resilient Distributed Datasets (RDDs) are the fundamental data structure in Apache Spark. They represent an immutable, partitioned collection of elements that can be processed in parallel.

## What is an RDD?

An RDD has three key characteristics:

| Characteristic | Description |
|---|---|
| **Resilient** | Automatically recovers from failures using lineage |
| **Distributed** | Data is partitioned across multiple nodes |
| **Dataset** | A collection of typed objects (Python, Scala, Java) |

> [!NOTE]
> While DataFrames and Datasets are now the recommended APIs, understanding RDDs is crucial for low-level optimization and when working with unstructured data.

### Properties of RDDs

1. **Immutability**: RDDs cannot be modified after creation. Transformations produce new RDDs.
2. **Lazy Evaluation**: Transformations are not executed until an action is called.
3. **Partitioning**: Data is split into partitions that can be processed in parallel.
4. **Lineage**: Spark tracks the transformations used to build an RDD, enabling fault recovery.

## Creating RDDs

### From a Collection with `parallelize()`

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("RDDIntro") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Create an RDD from a Python list
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
rdd = sc.parallelize(data)

print(rdd.collect())
# Output: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### Specifying Partition Count

```python
# Create RDD with 4 partitions
rdd = sc.parallelize(data, numSlices=4)
print(f"Number of partitions: {rdd.getNumPartitions()}")

# Get partition sizes
glommed = rdd.glom().collect()
for i, partition in enumerate(glommed):
    print(f"Partition {i}: {partition}")
```

> [!WARNING]
> Too few partitions underutilize cluster resources. Too many partitions create scheduling overhead. A good starting point is 2-4 partitions per core.

### From a File with `textFile()`

```python
# Read a text file — each line becomes an element
rdd = sc.textFile("data/sample.txt")

# Read multiple files using wildcards
rdd = sc.textFile("data/logs/*.log")

# Read from HDFS
rdd = sc.textFile("hdfs://namenode:9000/user/data/logs/")

# Read from S3
rdd = sc.textFile("s3a://my-bucket/logs/2024/*.gz")

print(f"Number of lines: {rdd.count()}")
print(f"First 5 lines: {rdd.take(5)}")
```

### Controlling Partition Count for Files

```python
# Minimum partitions (Spark may use more based on HDFS block count)
rdd = sc.textFile("data/large_file.txt", minPartitions=10)
```

> [!NOTE]
> For `textFile()`, if the file is on HDFS, Spark creates one partition per HDFS block (default 128 MB). You can increase partitions with `minPartitions` but cannot reduce below the HDFS block count.

### Other Creation Methods

```python
# From a whole text file (returns (filename, content) pairs)
rdd = sc.wholeTextFiles("data/directory/")

# From a CSV-like file (manual parsing needed)
rdd = sc.textFile("data/people.csv")
header = rdd.first()
data = rdd.filter(lambda row: row != header)

# Empty RDD
empty_rdd = sc.emptyRDD()

# Range RDD
range_rdd = sc.range(1, 1000, step=1, numSlices=10)
```

## RDD Lineage

Spark records each transformation as a **lineage graph** (DAG). If a partition is lost, Spark recomputes it by replaying the lineage.

```python
rdd1 = sc.textFile("data/sample.txt")
rdd2 = rdd1.filter(lambda line: "ERROR" in line)
rdd3 = rdd2.map(lambda line: (line.split(",")[0], 1))
rdd4 = rdd3.reduceByKey(lambda a, b: a + b)

# View lineage
print(rdd4.toDebugString())
# (4) ShuffledRDD[4] at reduceByKey at <...>
#  +-(3) MapPartitionsRDD[3] at map at <...>
#     |  MapPartitionsRDD[2] at filter at <...>
#     |  data/sample.txt MapPartitionsRDD[1] at textFile at <...>
#     |  data/sample.txt HadoopRDD[0] at textFile at <...>
```

> [!SUCCESS]
> RDD lineage is Spark's primary fault-tolerance mechanism. It avoids the need for replication or checkpointing because lost partitions can always be recomputed from source data.

## Types of RDDs

| RDD Type | Description | Example |
|---|---|---|
| **HadoopRDD** | Reads from HDFS, S3, etc. | `sc.textFile()` |
| **ParallelCollectionRDD** | From a local collection | `sc.parallelize()` |
| **MapPartitionsRDD** | After map/flatMap/filter | `rdd.map()` |
| **ShuffledRDD** | After shuffle operations | `rdd.reduceByKey()` |
| **UnionRDD** | Union of multiple RDDs | `rdd1.union(rdd2)` |
| **CoGroupedRDD** | After cogroup/join | `rdd1.join(rdd2)` |

## Understanding Spark Context

The `SparkContext` (`sc`) is the entry point for low-level Spark functionality.

```python
from pyspark import SparkContext

# Create SparkContext directly (less common with SparkSession)
sc = SparkContext("local[*]", "MyContext")

# Get context from SparkSession
sc = spark.sparkContext

print(f"Default parallelism: {sc.defaultParallelism}")
print(f"Application ID: {sc.applicationId}")
print(f"Spark version: {sc.version}")
```

## Working with Key-Value RDDs

Many Spark operations work on key-value pairs (tuples of two elements).

```python
# Create a key-value RDD
data = [("Alice", 34), ("Bob", 45), ("Charlie", 28)]
rdd = sc.parallelize(data)

# Keys and values
print(rdd.keys().collect())    # ['Alice', 'Bob', 'Charlie']
print(rdd.values().collect())  # [34, 45, 28]

# Look up a key (efficient if RDD is partitioned)
print(rdd.lookup("Alice"))     # [34]
```

> [!WARNING]
> Key-value operations like `reduceByKey` and `groupByKey` trigger a **shuffle** — data is redistributed across partitions by key. Shuffles are expensive and should be minimized.

## RDD Persistence

By default, RDDs are recomputed each time an action runs. Use `cache()` or `persist()` to keep data in memory.

```python
# Cache RDD in memory
rdd_cached = rdd.cache()

# Persist with storage level
from pyspark import StorageLevel
rdd_persisted = rdd.persist(StorageLevel.MEMORY_AND_DISK)
```

| Storage Level | Description |
|---|---|
| `MEMORY_ONLY` | Store as deserialized objects in memory (default) |
| `MEMORY_AND_DISK` | Memory first, spill to disk |
| `DISK_ONLY` | Store on disk only |
| `MEMORY_ONLY_SER` | Store as serialized objects (more compact) |
| `OFF_HEAP` | Store in off-heap memory |

## Key Takeaways

1. RDDs are immutable, partitioned, and fault-tolerant collections
2. Create RDDs via `parallelize()` (collections) or `textFile()` (files)
3. Transformations are lazy — nothing happens until an action
4. Lineage tracks how to recompute any lost partition
5. Key-value RDDs enable shuffle-based operations
6. Persistence (cache/persist) avoids recomputation

## Practice Questions

1. What does "Resilient" mean in the context of RDDs?
2. What is the difference between `parallelize()` and `textFile()`?
3. How does lazy evaluation improve Spark's performance?
4. What is RDD lineage and how does it enable fault tolerance?
5. How many partitions does `sc.textFile()` create for a 512 MB file on HDFS (128 MB blocks)?
6. What is a shuffle and why is it expensive?
7. When would you use `persist(StorageLevel.MEMORY_AND_DISK)` instead of `cache()`?
8. What does `rdd.glom().collect()` show you?
9. How do you create an RDD with a specific number of partitions?
10. What is the difference between an RDD and a regular Python list?
