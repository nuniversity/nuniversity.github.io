---
title: "Window Operations and Watermarking"
description: "Master tumbling and sliding windows, watermarking, late data handling, and output modes for streaming aggregations"
order: 2
duration: "35-45 minutes"
difficulty: "advanced"
---

# Window Operations and Watermarking

Window operations are the foundation of streaming analytics. Combined with watermarking, they enable robust handling of late-arriving data while maintaining correct results.

## Tumbling Windows

Fixed-size, non-overlapping windows.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import window, col, count, sum, avg
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType

spark = SparkSession.builder \
    .appName("WindowOperations") \
    .master("local[*]") \
    .getOrCreate()

schema = StructType([
    StructField("user_id", StringType()),
    StructField("event", StringType()),
    StructField("amount", IntegerType()),
    StructField("event_time", TimestampType())
])

# Tumbling window (5 minutes)
tumbling = stream_df \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event")
    ) \
    .agg(
        count("*").alias("count"),
        sum("amount").alias("total_amount")
    )

tumbling.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()
```

```
Window output (tumbling, 5 min):
+--------------------+--------+-----+------------+
|                 window|    event|count|total_amount|
+--------------------+--------+-----+------------+
|{2024-01-01 12:00, 12:05}|   click|  150|       12000|
|{2024-01-01 12:00, 12:05}| purchase|   20|        8000|
|{2024-01-01 12:05, 12:10}|   click|  200|       16000|
+--------------------+--------+-----+------------+
```

> [!SUCCESS]
> Tumbling windows are the simplest streaming aggregation. Each event belongs to exactly one window. Use them for periodic metrics (e.g., "requests per 5 minutes").

## Sliding Windows

Overlapping windows with a slide interval.

```python
# Sliding window (15 minutes, sliding every 5 minutes)
sliding = stream_df \
    .groupBy(
        window(col("event_time"), "15 minutes", "5 minutes"),
        col("event")
    ) \
    .agg(count("*").alias("count"))

sliding.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

```
Window output (sliding, 15 min window, 5 min slide):
+--------------------+--------+-----+
|                 window|    event|count|
+--------------------+--------+-----+
|{2024-01-01 12:00, 12:15}|   click|  450|
|{2024-01-01 12:05, 12:20}|   click|  520|
|{2024-01-01 12:10, 12:25}|   click|  480|
+--------------------+--------+-----+
```

> [!NOTE]
> Sliding windows create overlapping windows. Events belonging to multiple windows are included in each. The number of windows = window_length / slide_interval. Use sliding windows for smoothing (e.g., "rolling average over 30 minutes").

### Tumbling vs Sliding Windows

| Aspect | Tumbling | Sliding |
|---|---|---|
| **Overlap** | None | Yes |
| **Output rows per event** | 1 | window_length / slide_interval |
| **Use case** | Periodic snapshots | Rolling averages |
| **Complexity** | Lower | Higher |
| **State size** | Smaller | Larger |

## Watermarking

Watermarks define how late data can arrive and still be included in results.

```python
# Watermark: 10 minutes late data allowed
with_watermark = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event")
    ) \
    .agg(count("*").alias("count"))

with_watermark.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### How Watermarks Work

```
Event Time Progression:

12:00  12:05  12:10  12:15  12:20  12:25  12:30
  |------|------|------|------|------|------|
  W1     W2     W3     W4     W5     W6

Current processing time: 12:35
Watermark: 12:25 (10 minutes behind)

Events with time 12:26 arrive: included in W5 (still open)
Events with time 12:24 arrive: included in W4 (still open)
Events with time 12:15 arrive: DROPPED (before watermark)
```

> [!WARNING]
> Once a watermark passes a window's end time, that window is finalized and its results are emitted. Late events arriving after the watermark are discarded. Set the watermark threshold carefully based on your data's typical delay.

### Choosing Watermark Duration

```python
# Aggressive (lower latency, more late data dropped)
df.withWatermark("event_time", "2 minutes")

# Conservative (higher latency, fewer dropped records)
df.withWatermark("event_time", "1 hour")

# Based on data analysis
def estimate_watermark_delay(spark, source_path, percentile=0.99):
    """Analyze historical data to determine watermark delay."""
    df = spark.read.parquet(source_path)
    
    delay_stats = df \
        .withColumn("processing_delay", 
            col("processing_time").cast("long") - col("event_time").cast("long")) \
        .selectExpr(f"percentile(processing_delay, {percentile}) / 60 as p99_delay_minutes")
    
    return delay_stats.collect()[0]["p99_delay_minutes"]
```

## Late Data Handling Strategies

### Strategy 1: Watermark with Update Mode

```python
# Late data updates the window until watermark passes
query = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(window(col("event_time"), "5 minutes")) \
    .agg(count("*").alias("count")) \
    .writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### Strategy 2: Separate Late Data Queue

```python
# Route late data to a separate stream for reprocessing
from pyspark.sql.functions import current_timestamp, expr

late_data = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .filter(expr("event_time < current_timestamp() - interval 15 minutes"))

late_data.writeStream \
    .format("parquet") \
    .option("path", "data/late_events/") \
    .outputMode("append") \
    .start()
```

### Strategy 3: Re-process with Wider Window Periodically

```python
def reprocess_late_data(spark):
    """Daily batch job to reprocess recent data with a wider window."""
    
    df = spark.read.parquet("data/raw_events/") \
        .filter(col("event_date") >= date.today() - timedelta(days=3))
    
    result = df \
        .withWatermark("event_time", "2 hours") \
        .groupBy(window(col("event_time"), "5 minutes")) \
        .agg(count("*").alias("corrected_count"))
    
    result.write.mode("overwrite").parquet("data/corrected/")
```

## Output Mode Behavior with Windows

| Output Mode | With Watermark | Without Watermark |
|---|---|---|
| **Append** | Final results only (after watermark) | Not supported |
| **Complete** | Full result every trigger | Full result every trigger (state grows unbounded) |
| **Update** | Updated results only | Not supported |

> [!NOTE]
> Without a watermark, `complete` mode accumulates all window state indefinitely, which will eventually cause OOM errors. Always use watermarks with streaming aggregations.

## Multiple Window Aggregations

```python
# Multiple window sizes in one query
multi_window = stream_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes").alias("window_5m"),
        window(col("event_time"), "15 minutes").alias("window_15m"),
        window(col("event_time"), "1 hour").alias("window_1h"),
        col("event_type")
    ) \
    .agg(count("*").alias("count"))

multi_window.writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", "false") \
    .start()
```

## Window with Non-Aggregate Operations

```python
# Filter events within a time window
from pyspark.sql.functions import window, col

sessions = stream_df \
    .withWatermark("event_time", "30 minutes") \
    .groupBy(
        window(col("event_time"), "30 minutes"),
        col("user_id")
    )
# Note: This requires aggregation — can't have window in non-aggregation
```

## Practice Questions

1. What is the difference between tumbling and sliding windows?
2. How does a watermark prevent unbounded state growth?
3. What happens to events arriving after the watermark?
4. What is the relationship between slide interval and window length in sliding windows?
5. Why is `append` mode only supported with watermarks for aggregations?
6. How do you choose the right watermark duration?
7. What happens if you use `complete` mode without a watermark?
8. How do you handle late-arriving data that should update already-emitted results?
9. What output modes work best for tumbling window aggregations?
10. How do you compute a 7-day rolling average in streaming?
