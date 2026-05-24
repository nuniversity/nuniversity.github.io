---
title: "Memory Tuning"
description: "Master Spark memory management: execution vs storage, off-heap memory, garbage collection tuning, and spill optimization"
order: 7
duration: "35-45 minutes"
difficulty: "advanced"
---

# Memory Tuning

Memory is the most critical resource in Spark. Poor memory management causes OOM errors, excessive GC pauses, and disk spills that degrade performance. This lesson covers Spark's memory model and tuning strategies.

## Spark Memory Model

```
Executor Memory (e.g., 8g)
  |
  +-- Reserved Memory (300 MB) — system overhead
  |
  +-- User Memory (40%) — user code, UDFs, data structures
  |   spark.memory.userFraction = 0.4
  |
  +-- Spark Memory (60%) — unified execution + storage
      spark.memory.fraction = 0.6
        |
        +-- Execution Memory (50% of Spark Memory)
        |   spark.memory.storageFraction = 0.5
        |   (can borrow from storage if unused)
        |
        +-- Storage Memory (50% of Spark Memory)
            (can borrow from execution if unused)
```

### Memory Breakdown Example

```python
# For an 8g executor:
# Reserved:     300 MB
# User:         (8g - 300 MB) × 0.4 = ~3.1g
# Execution:   (8g - 300 MB) × 0.6 × 0.5 = ~2.3g
# Storage:     (8g - 300 MB) × 0.6 × 0.5 = ~2.3g
# 
# Execution can expand to 4.6g if storage is empty
```

> [!NOTE]
> The unified memory model allows execution and storage to borrow from each other. Execution can evict storage blocks, but storage cannot evict execution blocks. This prioritizes computation over caching.

## Execution Memory

Used for shuffle, joins, aggregations, and sorting.

```python
# Execution memory configuration
spark.conf.set("spark.memory.fraction", "0.6")
spark.conf.set("spark.memory.storageFraction", "0.5")

# Spill settings
spark.conf.set("spark.shuffle.spill.compress", "true")
spark.conf.set("spark.shuffle.spill.initialMemoryThreshold", "5m")
spark.conf.set("spark.shuffle.spill.numElementsForceSpillThreshold", "10000000")
```

### Spill Behavior

When execution memory is exhausted, Spark spills data to disk:

```python
from pyspark.sql.functions import col

# This operation may spill if memory is insufficient
large_df.groupBy("key").agg(sum("value")).show()

# Monitor spills in Spark UI:
# Stages > Stage ID > Shuffle Write/Read > Spill (disk)
# High spill = insufficient execution memory
```

> [!WARNING]
> Spilling to disk dramatically slows down Spark jobs. If you see significant spill in the Spark UI, increase executor memory or reduce shuffle partitions to make each partition smaller.

## Storage Memory

Used for caching RDDs, DataFrames, and broadcast variables.

```python
# Cache with different storage levels
from pyspark import StorageLevel

# Default: MEMORY_ONLY
df.cache()

# Memory and disk (spill to disk if memory full)
df.persist(StorageLevel.MEMORY_AND_DISK)

# Only disk
df.persist(StorageLevel.DISK_ONLY)

# Serialized (lower memory footprint)
df.persist(StorageLevel.MEMORY_ONLY_SER)

# Check cache status
from pyspark.sql.functions import col

catalog = spark.catalog
print(f"Cached tables: {catalog.listTables()}")
# Check cache size
df_cached = df.cache()
df_cached.count()  # Materialize cache
print(spark.sparkContext.getRDDStorageInfo())
```

### Cache Size Estimation

```python
# Estimate cache size for a DataFrame
def estimate_cache_size(df):
    """Sample rows to estimate full cache size."""
    sample = df.sample(0.01, seed=42).cache()
    sample.count()
    
    # Get per-partition sizes
    sizes = sample.rdd.mapPartitions(
        lambda it: [sum(len(str(x).encode('utf-8')) for x in it)]
    ).collect()
    
    avg_partition_size = sum(sizes) / len(sizes)
    num_partitions = df.rdd.getNumPartitions()
    
    estimated_total = avg_partition_size * num_partitions
    return estimated_total

# Usage
est_size = estimate_cache_size(df)
print(f"Estimated cache size: {est_size / 1024**3:.2f} GB")
```

## Off-Heap Memory

Off-heap memory bypasses JVM garbage collection.

```python
# Enable off-heap memory
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")

# Tungsten uses off-heap for:
# - Shuffle operations
# - Caching serialized data
# - Sort and aggregation buffers
```

> [!SUCCESS]
> Off-heap memory can significantly reduce GC pauses for large shuffles by keeping data outside the JVM heap. However, off-heap memory must be accounted for in container/YARN memory requests.

## Garbage Collection Tuning

GC pauses can cause executor timeouts and job failures.

### Monitoring GC

```python
# Add GC logging to spark-submit
# --conf spark.executor.extraJavaOptions="-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps"
```

```bash
spark-submit \
  --conf "spark.executor.extraJavaOptions=-XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=35 -XX:ConcGCThreads=4 -verbose:gc -XX:+PrintGCDetails" \
  --conf "spark.driver.extraJavaOptions=-XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=35" \
  app.py
```

### GC Tuning Strategies

```python
# Strategy 1: Use G1GC (default in Java 8u45+)
# -XX:+UseG1GC
# -XX:InitiatingHeapOccupancyPercent=35 (start GC earlier)
# -XX:ConcGCThreads=4 (parallel GC threads)

# Strategy 2: Increase NewRatio for shuffle-heavy jobs
# -XX:NewRatio=3 (larger old gen for cached data)

# Strategy 3: Reduce GC pressure by caching serialized
df.persist(StorageLevel.MEMORY_ONLY_SER)
```

| GC Strategy | Best For |
|---|---|
| **G1GC** | General purpose, large heaps (>4g) |
| **Parallel GC** | Throughput-oriented, medium heaps |
| **CMS** | Low-latency (deprecated in Java 14) |
| **ZGC** | Very large heaps (>100g), low latency |

## Out of Memory (OOM) Prevention

```python
# Tune memory to avoid OOM

# 1. Increase memory
spark.conf.set("spark.executor.memory", "16g")
spark.conf.set("spark.executor.memoryOverhead", "2g")  # Off-heap overhead

# 2. Reduce data per partition
spark.conf.set("spark.sql.shuffle.partitions", "400")  # More partitions = less data each

# 3. Enable spill
spark.conf.set("spark.shuffle.spill.compress", "true")

# 4. Use broadcast for small tables
from pyspark.sql.functions import broadcast
df_large.join(broadcast(df_small), "key")

# 5. Cache judiciously — only when reused
# Don't cache everything

# 6. Reduce batch size for UDFs
spark.conf.set("spark.sql.execution.arrow.maxRecordsPerBatch", "5000")
```

## Memory Profiling

```python
from pyspark.sql.functions import col, size

# Find memory-heavy columns
def profile_memory_usage(df):
    """Identify columns consuming the most memory."""
    
    shape = len(df.columns)
    estimated_bytes = {
        "string": 40,    # Overhead per string field
        "integer": 4,
        "long": 8,
        "double": 8,
        "array": 16
    }
    
    for field in df.schema.fields:
        col_name = field.name
        dtype = str(field.dataType).lower()
        
        sample = df.select(col(col_name)).limit(1000).collect()
        total_bytes = sum(len(str(row[0]).encode('utf-8')) for row in sample)
        avg_bytes = total_bytes / len(sample)
        
        print(f"{col_name}: {dtype}, avg {avg_bytes:.0f} bytes/row")

# Check partition sizes
def check_partition_sizes(df):
    """Check data distribution across partitions."""
    sizes = df.rdd.mapPartitions(
        lambda it: [sum(len(str(x).encode('utf-8')) for x in it)]
    ).collect()
    
    print(f"Partition sizes: min={min(sizes)}, max={max(sizes)}, "
          f"avg={sum(sizes)/len(sizes):.0f}")
    print(f"Skew: max/avg = {max(sizes) / (sum(sizes)/len(sizes)):.1f}x")
```

## Memory Tuning Decision Tree

```
Is the job OOM or spilling?
  |
  +-- Yes: Increase executor memory? 
  |   |  
  |   +-- Yes, available: Increase memory
  |   |
  |   +-- No (at limit): 
  |       +-- Shuffle heavy? Increase partitions
  |       +-- Cache heavy? Use MEMORY_AND_DISK or MEMORY_ONLY_SER
  |       +-- UDF heavy? Reduce batch size, optimize UDF
  |
  +-- No, but slow GC:
      +-- Use G1GC
      +-- Reduce caching
      +-- Use off-heap

Is GC time > 10% of runtime?
  +-- Yes: Tune GC, reduce objects
  +-- No: Focus on other optimizations
```

## Practice Questions

1. What is the difference between execution memory and storage memory?
2. How does the unified memory model handle contention between execution and storage?
3. What causes data spilling to disk?
4. How does off-heap memory reduce GC pressure?
5. What GC algorithm is recommended for large Spark executors?
6. How do you monitor memory usage in the Spark UI?
7. What is the impact of caching too much data?
8. How does serialized caching differ from deserialized caching?
9. What configuration changes reduce OOM errors?
10. How do you calculate the optimal executor memory for a given workload?
