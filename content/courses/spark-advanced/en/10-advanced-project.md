---
title: "Advanced Project: Real-Time Streaming Analytics with ML Inference"
description: "Capstone: build a real-time streaming analytics pipeline with ML inference using Structured Streaming, MLlib, and Delta Lake"
order: 10
duration: "60-90 minutes"
difficulty: "advanced"
---

# Advanced Project: Real-Time Streaming Analytics with ML Inference

This capstone project combines structured streaming, ML models, window operations, Delta Lake, and monitoring into a complete real-time analytics pipeline.

## Project Overview

You will build a real-time pipeline that:

1. Ingests streaming event data from Kafka
2. Computes real-time aggregations with tumbling windows
3. Runs ML model inference on streaming data
4. Stores raw and aggregated data in Delta Lake
5. Detects anomalies using statistical methods
6. Monitors pipeline health with custom metrics
7. Handles late-arriving data with watermarks

## Architecture

```
IoT Devices / Web Apps
    |
    v
Kafka (events topic)
    |
    v
Structured Streaming
    |-- Windowed Aggregations (5-min tumbling)
    |-- ML Inference (fraud detection model)
    |-- Anomaly Detection (statistical thresholds)
    |-- Raw Event Storage (Delta Lake)
    |
    v
Delta Lake Tables
    |-- raw_events
    |-- agg_events
    |-- predictions
    |-- anomalies
    |
    v
Consumption (BI, dashboards, alerts)
```

## Setup

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
from delta.tables import DeltaTable
import json

spark = SparkSession.builder \
    .appName("RealTimeStreamingAnalytics") \
    .master("local[*]") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoints/analytics") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.shuffle.partitions", "10") \
    .getOrCreate()

sc = spark.sparkContext
sc.setLogLevel("WARN")
```

## Step 1: Generate Synthetic Streaming Data

```python
import random
from datetime import datetime, timedelta
import time

def generate_events(num_events=1000):
    """Generate synthetic streaming events for testing."""
    
    users = [f"user_{i}" for i in range(100)]
    events = ["purchase", "click", "login", "logout", "view", "add_to_cart"]
    categories = ["electronics", "clothing", "home", "sports", "books"]
    
    events_data = []
    base_time = datetime.now()
    
    for i in range(num_events):
        event_time = base_time - timedelta(
            seconds=random.randint(0, 3600),
            milliseconds=random.randint(0, 1000)
        )
        
        amount = round(random.uniform(5.0, 500.0), 2) if random.random() > 0.3 else 0.0
        
        events_data.append({
            "user_id": random.choice(users),
            "event_type": random.choice(events),
            "amount": amount,
            "category": random.choice(categories),
            "ip_address": f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,255)}",
            "timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "device": random.choice(["web", "mobile", "tablet"]),
            "session_id": f"sess_{random.randint(1000, 9999)}"
        })
    
    return events_data

# Write test data as JSON files (simulating streaming)
import os
os.makedirs("data/streaming_input", exist_ok=True)

for batch in range(5):
    batch_data = generate_events(200)
    batch_file = f"data/streaming_input/batch_{batch}.json"
    
    with open(batch_file, "w") as f:
        for event in batch_data:
            f.write(json.dumps(event) + "\n")
    
    print(f"Wrote {batch_file}: {len(batch_data)} events")
    time.sleep(1)  # Simulate delay between batches
```

## Step 2: Define Schema and Read Stream

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType

schema = StructType([
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("amount", DoubleType()),
    StructField("category", StringType()),
    StructField("ip_address", StringType()),
    StructField("timestamp", StringType()),
    StructField("device", StringType()),
    StructField("session_id", StringType())
])

# Read streaming data from directory
raw_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .json("data/streaming_input/")

# Parse timestamp
parsed_stream = raw_stream \
    .withColumn("event_time", to_timestamp(col("timestamp"), "yyyy-MM-dd HH:mm:ss.SSS")) \
    .withColumn("processing_time", current_timestamp()) \
    .drop("timestamp")

# Cache checkpoint
parsed_stream.printSchema()
```

> [!SUCCESS]
> Using a file source for testing makes development simple. In production, replace with Kafka: `spark.readStream.format("kafka").option("subscribe", "events")`.

## Step 3: Train ML Model (Pre-computed)

```python
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.classification import LogisticRegression
from pyspark.ml import Pipeline

# Train a simple fraud detection model
training_data = spark.createDataFrame([
    ("purchase", 500.0, 0), ("purchase", 25.0, 0), ("purchase", 450.0, 1),
    ("click", 0.0, 0), ("login", 0.0, 0), ("purchase", 300.0, 0),
    ("purchase", 475.0, 1), ("add_to_cart", 0.0, 0), ("purchase", 50.0, 0),
    ("purchase", 490.0, 1), ("purchase", 100.0, 0), ("purchase", 480.0, 1)
], ["event_type", "amount", "is_fraud"])

# Feature engineering
feature_assembler = VectorAssembler(
    inputCols=["amount"],
    outputCol="features_raw"
)

scaler = StandardScaler(
    inputCol="features_raw",
    outputCol="features"
)

classifier = LogisticRegression(
    featuresCol="features",
    labelCol="is_fraud",
    maxIter=50
)

ml_pipeline = Pipeline(stages=[feature_assembler, scaler, classifier])
fraud_model = ml_pipeline.fit(training_data)

# Save model
fraud_model.write().overwrite().save("models/fraud_detection")
print("Fraud detection model trained and saved.")
```

> [!NOTE]
> In a real deployment, retrain the model periodically with batch jobs and use the streaming pipeline only for inference. Load the latest model version from a model registry.

## Step 4: Streaming Inference Pipeline

```python
from pyspark.ml import PipelineModel

# Load pre-trained model
loaded_model = PipelineModel.load("models/fraud_detection")

# Apply model to streaming data
features_for_ml = parsed_stream \
    .filter(col("event_type") == "purchase") \
    .withColumn("amount", col("amount").cast("double"))

predictions = loaded_model.transform(features_for_ml)

# Select relevant columns
ml_results = predictions.select(
    col("user_id"),
    col("event_time"),
    col("amount"),
    col("event_type"),
    col("category"),
    col("device"),
    col("prediction").alias("is_fraud_prediction"),
    col("probability").getItem(1).alias("fraud_probability")
)
```

## Step 5: Real-Time Aggregations with Windows

```python
# Windowed aggregations
windowed_aggs = parsed_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("event_type"),
        col("category")
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount"),
        countDistinct("user_id").alias("unique_users"),
        countDistinct("ip_address").alias("unique_ips")
    )

# Rolling user stats
user_window = Window.partitionBy("user_id") \
    .orderBy(col("event_time")) \
    .rowsBetween(-100, Window.currentRow)

rolling_stats = parsed_stream \
    .withColumn("user_event_count", count("*").over(user_window)) \
    .withColumn("user_total_amount", sum("amount").over(user_window))
```

## Step 6: Anomaly Detection

```python
# Statistical anomaly detection
anomaly_check = parsed_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("user_id")
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        countDistinct("ip_address").alias("ip_count")
    ) \
    .withColumn("is_anomalous_rate",
        when(col("event_count") > 100, lit(True))
        .otherwise(lit(False))
    ) \
    .withColumn("is_anomalous_amount",
        when(col("total_amount") > 10000, lit(True))
        .otherwise(lit(False))
    ) \
    .withColumn("is_anomalous_geo",
        when(col("ip_count") > 5, lit(True))
        .otherwise(lit(False))
    ) \
    .withColumn("anomaly_score",
        col("is_anomalous_rate").cast("int") +
        col("is_anomalous_amount").cast("int") +
        col("is_anomalous_geo").cast("int")
    ) \
    .filter(col("anomaly_score") > 0)
```

## Step 7: Write to Delta Lake Sinks

```python
# Raw data sink
raw_query = parsed_stream.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/raw_events") \
    .table("raw_events")

# Aggregations sink
agg_query = windowed_aggs.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/agg_events") \
    .table("agg_events")

# ML predictions sink
ml_query = ml_results.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/predictions") \
    .table("predictions")

# Anomaly alerts sink
anomaly_query = anomaly_check.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/tmp/checkpoints/anomalies") \
    .table("anomalies")

# Console output for monitoring
console_query = ml_results.writeStream \
    .format("console") \
    .outputMode("append") \
    .option("truncate", "false") \
    .queryName("fraud_alerts") \
    .start()
```

## Step 8: Monitoring and Observability

```python
# Custom monitoring accumulators
events_processed = sc.accumulator(0)
fraud_detected = sc.accumulator(0)
anomalies_detected = sc.accumulator(0)

def monitor_stream(query, name):
    """Monitor streaming query progress."""
    
    def report():
        progress = query.lastProgress
        if progress:
            print(f"[{name}] Rows: {progress.get('numInputRows', 0)}, "
                  f"Rate: {progress.get('inputRowsPerSecond', 0):.1f}/s, "
                  f"Batch duration: {progress.get('durationMs', {}).get('triggerExecution', 0)}ms")
    
    return report

# Register progress monitor
import threading

def monitoring_loop(interval=5):
    while True:
        for q in spark.streams.active:
            if q.lastProgress:
                p = q.lastProgress
                print(f"[{q.name}] Rows: {p.get('numInputRows', 0)}, "
                      f"Rate: {p.get('inputRowsPerSecond', 0):.1f}/s")
        time.sleep(interval)

monitor_thread = threading.Thread(target=monitoring_loop, daemon=True)
monitor_thread.start()
```

## Step 9: Query Results

```python
# Query Delta tables (in another session or after streaming)
spark.sql("SELECT * FROM raw_events LIMIT 5").show(truncate=False)
spark.sql("SELECT * FROM agg_events ORDER BY window DESC LIMIT 10").show()
spark.sql("SELECT * FROM predictions WHERE is_fraud_prediction = 1 LIMIT 10").show()
spark.sql("SELECT * FROM anomalies ORDER BY anomaly_score DESC LIMIT 10").show()

# Aggregate fraud metrics
fraud_metrics = spark.sql("""
    SELECT category,
           COUNT(*) as total_purchases,
           SUM(is_fraud_prediction) as fraud_count,
           ROUND(AVG(fraud_probability), 4) as avg_fraud_prob
    FROM predictions
    GROUP BY category
    ORDER BY fraud_count DESC
""")
fraud_metrics.show()

# Check latest watermark
for q in spark.streams.active:
    status = q.status
    print(f"Stream: {q.name}")
    print(f"  Status: {status['message']}")
```

## Step 10: Cleanup and Final Script

```python
# Complete pipeline script
class RealTimeAnalyticsPipeline:
    def __init__(self, spark):
        self.spark = spark
        self.queries = []
    
    def build_pipeline(self):
        schema = self._define_schema()
        stream = self._read_stream(schema)
        parsed = self._parse_timestamp(stream)
        model = self._load_model()
        
        # Parallel streams
        self.queries.append(self._write_raw(parsed))
        self.queries.append(self._write_aggregations(parsed))
        self.queries.append(self._write_predictions(parsed, model))
        self.queries.append(self._write_anomalies(parsed))
        return self
    
    def start(self):
        for q in self.queries:
            q.start()
        return self
    
    def await_termination(self):
        self.spark.streams.awaitAnyTermination()
    
    def stop(self):
        for q in self.queries:
            q.stop()

# Run the pipeline
pipeline = RealTimeAnalyticsPipeline(spark)
pipeline.build_pipeline().start()

try:
    pipeline.await_termination()
except KeyboardInterrupt:
    print("Shutting down...")
    pipeline.stop()
```

## Business Questions

Answer these using your pipeline results:

1. What is the average fraud probability per category?
2. Which users show anomalous behavior patterns?
3. How do event counts vary across 5-minute windows?
4. What is the peak events-per-minute rate?
5. Which device type has the highest fraud rate?
6. What is the ratio of purchases to other events?
7. How many unique anomalies were detected?
8. What is the average processing latency?
9. Which hours have the highest transaction volumes?
10. What is the distribution of anomaly scores?

## Practice Questions

1. How does the streaming pipeline apply ML inference to each batch?
2. How do watermarks and windows work together in this pipeline?
3. Why are aggregations written with `append` mode?
4. How would you add more features to the fraud detection model?
5. How do you monitor streaming query health in production?
6. What is the purpose of the `foreachBatch` sink in this pipeline?
7. How would you handle model retraining without downtime?
8. What Delta Lake features ensure exactly-once semantics?
9. How would you scale this pipeline for 10x more data?
10. How do you implement alerting when fraud probability exceeds a threshold?
