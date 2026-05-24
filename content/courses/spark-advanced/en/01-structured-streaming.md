---
title: "Structured Streaming"
description: "Understand streaming concepts, micro-batch architecture, readStream, writeStream, and building real-time data pipelines"
order: 1
duration: "35-45 minutes"
difficulty: "advanced"
---

# Structured Streaming

Structured Streaming provides a scalable, fault-tolerant stream processing engine built on the Spark SQL API. You write streaming queries using the same DataFrame/SQL API as batch queries, and Spark incrementally executes them on streaming data.

## Streaming Concepts

### Stream Processing Models

| Model | Description | Latency |
|---|---|---|
| **Micro-batch** | Processes data in small batches (default) | 100ms - 1s |
| **Continuous** | Processes each record as it arrives (Spark 2.3+) | 1ms - 10ms |

> [!NOTE]
> Micro-batch mode is the default and most reliable. Continuous processing offers lower latency but supports fewer operations. Start with micro-batch and switch only if sub-100ms latency is required.

### Key Concepts

- **Input Stream**: Unbounded data arriving continuously (Kafka, files, sockets, etc.)
- **Output Stream**: Results written continuously to a sink
- **Trigger**: Interval at which streaming data is processed
- **Watermark**: Maximum delay to wait for late data
- **Checkpointing**: Stores progress metadata for fault recovery

## Streaming Architecture

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("StructuredStreaming") \
    .master("local[*]") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoints") \
    .getOrCreate()
```

## readStream

Reading from a streaming source:

```python
# File source (monitor a directory for new files)
streaming_df = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .option("cleanSource", "archive") \
    .csv("data/input/")

# Kafka source
kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .load()

# Rate source (for testing)
rate_df = spark.readStream \
    .format("rate") \
    .option("rowsPerSecond", 10) \
    .option("numPartitions", 1) \
    .load()

# Socket source (simple testing)
socket_df = spark.readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()
```

> [!SUCCESS]
> The file source is the easiest way to learn streaming. Drop files into a directory and Spark processes them incrementally. The `maxFilesPerTrigger` option controls throughput.

## writeStream

Writing to a streaming sink:

```python
# Console sink (debugging)
query = streaming_df.writeStream \
    .format("console") \
    .outputMode("append") \
    .option("truncate", "false") \
    .start()

# Memory sink (for interactive querying)
query = streaming_df.writeStream \
    .format("memory") \
    .queryName("recent_events") \
    .outputMode("append") \
    .start()

# Query the in-memory table
spark.sql("SELECT * FROM recent_events").show()

# File sink (write to Parquet/CSV/JSON)
query = streaming_df.writeStream \
    .format("parquet") \
    .option("path", "data/output/") \
    .option("checkpointLocation", "/tmp/checkpoints") \
    .outputMode("append") \
    .start()

# Kafka sink
query = streaming_df.selectExpr("key", "value") \
    .writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "processed-events") \
    .option("checkpointLocation", "/tmp/checkpoints") \
    .start()

# ForeachBatch sink (custom processing)
def process_batch(batch_df, batch_id):
    batch_df.write.mode("append").parquet(f"data/batches/{batch_id}/")

query = streaming_df.writeStream \
    .foreachBatch(process_batch) \
    .outputMode("append") \
    .start()
```

## Output Modes

| Mode | Description | When to Use |
|---|---|---|
| **Append** | Only new rows | Map/filter operations (no aggregation) |
| **Complete** | Full result table every trigger | Aggregated queries (no watermark) |
| **Update** | Only updated rows | Aggregated queries (with watermark) |

## Complete Streaming Example

```python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType
from pyspark.sql.functions import window, col, count, sum, avg, to_timestamp

# Define schema for streaming data
schema = StructType([
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("amount", IntegerType()),
    StructField("timestamp", StringType())
])

# Read streaming data
raw_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .json("data/events/")

# Parse timestamp
parsed_stream = raw_stream \
    .withColumn("event_time", to_timestamp(col("timestamp"))) \
    .drop("timestamp")

# Windowed aggregation with watermark
aggregated = parsed_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event_type")
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount")
    )

# Write aggregated results
query = aggregated.writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", "false") \
    .option("numRows", 10) \
    .start()

query.awaitTermination()
```

## Managing Streaming Queries

```python
# Start multiple streams
query1 = stream1.writeStream.queryName("stream1").format("console").start()
query2 = stream2.writeStream.queryName("stream2").format("console").start()

# List active streams
for q in spark.streams.active:
    print(f"Query: {q.name}, Status: {q.status}")

# Wait for any stream to terminate
spark.streams.awaitAnyTermination()

# Stop a specific query
query.stop()

# Stop all queries
spark.streams.resetTerminated()
```

## Checkpointing and Recovery

Checkpointing stores the progress and state of a streaming query for fault recovery.

```python
checkpoint_dir = "hdfs://namenode:9000/checkpoints/log_processor"

query = streaming_df.writeStream \
    .option("checkpointLocation", checkpoint_dir) \
    .format("parquet") \
    .option("path", "data/output/") \
    .start()
```

> [!WARNING]
> Checkpoint directories must be stored in a fault-tolerant filesystem (HDFS, S3, GCS). Local filesystem checkpoints are lost if the driver fails. Never reuse a checkpoint directory for a different query.

## Testing Streaming Applications

```python
# Stream to memory sink for testing
def test_streaming_pipeline():
    test_df = spark.readStream \
        .format("rate") \
        .option("rowsPerSecond", 5) \
        .load()
    
    result = test_df \
        .withColumn("doubled", col("value") * 2) \
        .writeStream \
        .format("memory") \
        .queryName("test_results") \
        .outputMode("append") \
        .start()
    
    import time
    time.sleep(3)
    
    # Query in-memory table
    df = spark.sql("SELECT * FROM test_results")
    assert df.count() > 0
    print(f"Test passed: {df.count()} rows")
    
    result.stop()
```

## Practice Questions

1. What is the difference between micro-batch and continuous processing?
2. What are the three output modes in Structured Streaming?
3. How does checkpointing enable fault recovery?
4. What is a watermark and why is it necessary for aggregations?
5. How do you read from Kafka in a streaming query?
6. What happens if you restart a streaming query without a checkpoint?
7. How does `maxFilesPerTrigger` control file stream throughput?
8. What is `foreachBatch` used for?
9. How do you handle schema changes in streaming data?
10. Design a streaming pipeline that reads from Kafka, aggregates by 5-minute windows, and writes to Parquet.
