---
title: "Intermediate Project: Web Server Log ETL Pipeline"
description: "Build a complete ETL pipeline processing web server logs using Spark DataFrames, SQL, and best practices"
order: 10
duration: "45-60 minutes"
difficulty: "intermediate"
---

# Intermediate Project: Web Server Log ETL Pipeline

This capstone project combines all intermediate Spark skills. You'll build an ETL pipeline that ingests web server logs, cleans and transforms them, computes analytics, and loads results for consumption.

## Project Overview

You will build a pipeline that:

1. Reads raw web server log files (Apache Common Log Format)
2. Parses and cleans the data
3. Enriches logs with geolocation and session information
4. Computes traffic analytics using window functions
5. Detects anomalies and bot activity
6. Loads clean data and aggregations to Parquet
7. Runs quality checks throughout the pipeline

## Data Format

Apache Common Log Format:

```
127.0.0.1 - frank [10/Oct/2024:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
192.168.1.1 - - [10/Oct/2024:14:00:12 -0700] "POST /api/users HTTP/1.1" 201 124
10.0.0.2 - - [10/Oct/2024:14:01:05 -0700] "GET /index.html HTTP/1.1" 200 4321
```

### Generate Sample Logs

```python
import random
from datetime import datetime, timedelta

def generate_logs(output_path, num_lines=10000):
    """Generate sample Apache log data for testing."""
    
    ips = [f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,255)}" 
           for _ in range(50)]
    users = ["alice", "bob", "charlie", "diana", "eve", "-"]
    methods = ["GET", "POST", "PUT", "DELETE"]
    paths = ["/index.html", "/api/users", "/api/products", "/about", "/login",
             "/api/orders", "/images/logo.png", "/css/style.css", "/js/app.js",
             "/api/search?q=spark", "/checkout", "/cart"]
    statuses = [200]*60 + [201]*10 + [301]*5 + [302]*5 + [400]*3 + [401]*2 + [404]*8 + [500]*5 + [503]*2
    
    with open(output_path, "w") as f:
        start = datetime(2024, 10, 1)
        for i in range(num_lines):
            timestamp = start + timedelta(seconds=random.randint(0, 86400*30))
            ip = random.choice(ips)
            user = random.choice(users) if random.random() > 0.7 else "-"
            method = random.choice(methods)
            path = random.choice(paths)
            status = random.choice(statuses)
            size = random.randint(50, 50000)
            
            f.write(f'{ip} - {user} [{timestamp.strftime("%d/%b/%Y:%H:%M:%S %z")}] '
                    f'"{method} {path} HTTP/1.1" {status} {size}\n')

generate_logs("data/weblogs/access.log", 10000)
```

## Pipeline Implementation

### 1. Parse Log Files

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType
import re

spark = SparkSession.builder \
    .appName("WebLogETL") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.shuffle.partitions", "10") \
    .getOrCreate()

# Parse Apache log line using regex
LOG_PATTERN = r'^(\S+) \S+ (\S+) \[([^\]]+)\] "(\S+) (\S+) [^"]+" (\d{3}) (\d+)$'

# Parse with RDD then convert to DataFrame
log_rdd = spark.sparkContext.textFile("data/weblogs/access.log")

def parse_log(line):
    match = re.match(LOG_PATTERN, line)
    if match:
        ip, user, timestamp, method, path, status, size = match.groups()
        try:
            parsed_ts = datetime.strptime(timestamp, "%d/%b/%Y:%H:%M:%S %z")
        except:
            parsed_ts = None
        return (ip, user if user != "-" else None, parsed_ts, method, path, int(status), int(size))
    return None

parsed_rdd = log_rdd.map(parse_log).filter(lambda x: x is not None)

logs_df = parsed_rdd.toDF(["ip", "user", "timestamp", "method", "path", "status", "bytes"])
logs_df.printSchema()
logs_df.show(5, truncate=False)
```

> [!SUCCESS]
> Using regex with RDD for initial parsing gives full control over malformed lines. After parsing, convert to DataFrame for access to Catalyst optimization.

### 2. Clean and Transform

```python
# Add derived columns
logs_clean = logs_df \
    .withColumn("date", to_date(col("timestamp"))) \
    .withColumn("hour", hour(col("timestamp"))) \
    .withColumn("day_of_week", dayofweek(col("timestamp"))) \
    .withColumn("is_error", when(col("status") >= 400, True).otherwise(False)) \
    .withColumn("is_bot", 
        when(col("user_agent").like("%bot%"), True)
        .when(col("user_agent").like("%crawler%"), True)
        .when(col("user_agent").like("%spider%"), True)
        .otherwise(False)) \
    .withColumn("path_category",
        when(col("path").startswith("/api"), "API")
        .when(col("path").rlike(r"\.(css|js|png|jpg|gif|ico)$"), "Static")
        .when(col("path") == "/", "Home")
        .otherwise("Page"))

# Cache cleaned data
logs_clean.cache()
print(f"Total logs: {logs_clean.count()}")
print(f"Error logs: {logs_clean.filter(col("is_error")).count()}")
```

### 3. Traffic Analytics with Window Functions

```python
logs_clean.createOrReplaceTempView("logs")

# Hourly traffic pattern
hourly_traffic = spark.sql("""
    SELECT date, hour,
           COUNT(*) as hits,
           COUNT(DISTINCT ip) as unique_ips,
           SUM(bytes) as total_bytes,
           ROUND(AVG(bytes), 0) as avg_bytes
    FROM logs
    GROUP BY date, hour
    ORDER BY date, hour
""")
hourly_traffic.show(10)

# Top pages
top_pages = spark.sql("""
    SELECT path,
           COUNT(*) as hits,
           COUNT(DISTINCT ip) as unique_visitors,
           ROUND(AVG(bytes), 0) as avg_size,
           ROUND(SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as error_pct
    FROM logs
    GROUP BY path
    ORDER BY hits DESC
    LIMIT 20
""")
top_pages.show(truncate=False)
```

### 4. Session Detection

```python
# Detect sessions using window functions (30-minute timeout)
sessions = spark.sql("""
    WITH ordered_logs AS (
        SELECT ip, timestamp, path,
               LAG(timestamp) OVER (PARTITION BY ip ORDER BY timestamp) as prev_timestamp
        FROM logs
    ),
    session_starts AS (
        SELECT ip, timestamp, path,
               CASE WHEN prev_timestamp IS NULL 
                    OR (unix_timestamp(timestamp) - unix_timestamp(prev_timestamp)) > 1800
                    THEN 1 ELSE 0 END as is_new_session
        FROM ordered_logs
    ),
    session_ids AS (
        SELECT ip, timestamp, path,
               SUM(is_new_session) OVER (PARTITION BY ip ORDER BY timestamp 
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as session_id
        FROM session_starts
    )
    SELECT ip, 
           CONCAT(ip, '_', session_id) as full_session_id,
           timestamp, path
    FROM session_ids
""")

session_analysis = spark.sql("""
    SELECT full_session_id, ip,
           COUNT(*) as page_views,
           MIN(timestamp) as session_start,
           MAX(timestamp) as session_end,
           (unix_timestamp(MAX(timestamp)) - unix_timestamp(MIN(timestamp))) / 60 as duration_minutes
    FROM sessions
    GROUP BY full_session_id, ip
""")
session_analysis.show(10)
```

> [!NOTE]
> Session detection uses a 30-minute inactivity timeout. Each click resets the timer. Sessions exceeding 24 hours are typically split by most analytics platforms.

### 5. Anomaly Detection

```python
# Detect potential DDoS or scraping
anomalies = spark.sql("""
    WITH ip_stats AS (
        SELECT ip,
               COUNT(*) as request_count,
               COUNT(DISTINCT path) as unique_paths,
               COUNT(DISTINCT user) as unique_users,
               COUNT(CASE WHEN status >= 400 THEN 1 END) as error_count,
               ROUND(AVG(bytes), 0) as avg_bytes
        FROM logs
        GROUP BY ip
    ),
    thresholds AS (
        SELECT PERCENTILE(request_count, 0.95) as p95_requests,
               PERCENTILE(error_count, 0.95) as p95_errors
        FROM ip_stats
    )
    SELECT i.*
    FROM ip_stats i, thresholds t
    WHERE i.request_count > t.p95_requests * 3
       OR (i.error_count > 50 AND i.error_count > i.request_count * 0.5)
    ORDER BY i.request_count DESC
""")
print("Potential anomalous IPs:")
anomalies.show(truncate=False)
```

### 6. Bot Detection

```python
bot_activity = spark.sql("""
    WITH bot_candidates AS (
        SELECT ip,
               COUNT(*) as requests,
               COUNT(DISTINCT path) as paths,
               COUNT(DISTINCT user) as users,
               MIN(timestamp) as first_seen,
               MAX(timestamp) as last_seen,
               ROUND((unix_timestamp(MAX(timestamp)) - unix_timestamp(MIN(timestamp))) / 60, 0) as active_minutes
        FROM logs
        WHERE is_bot = true
        GROUP BY ip
    )
    SELECT *,
           ROUND(requests / NULLIF(active_minutes, 0), 0) as req_per_minute
    FROM bot_candidates
    ORDER BY requests DESC
""")
print("Bot activity:")
bot_activity.show(truncate=False)
```

### 7. Load Results

```python
# Write cleaned logs
logs_clean.write \
    .mode("overwrite") \
    .partitionBy("date") \
    .option("compression", "snappy") \
    .parquet("data/weblogs/cleaned/")

# Write analytics
hourly_traffic.write \
    .mode("overwrite") \
    .partitionBy("date") \
    .parquet("data/weblogs/analytics/hourly/")

top_pages.coalesce(1).write \
    .mode("overwrite") \
    .option("header", "true") \
    .csv("data/weblogs/analytics/top_pages/")

# Write anomalies for alerting
anomalies.coalesce(1).write \
    .mode("overwrite") \
    .json("data/weblogs/alerts/anomalies/")

# Write session data
session_analysis.write \
    .mode("overwrite") \
    .parquet("data/weblogs/analytics/sessions/")
```

### 8. Data Quality Checks

```python
def validate_pipeline():
    checks = []
    
    # No null timestamps
    null_count = logs_clean.filter(col("timestamp").isNull()).count()
    checks.append(("null_timestamps", null_count == 0))
    
    # Valid status codes
    invalid_status = logs_clean.filter(~col("status").between(100, 599)).count()
    checks.append(("invalid_status", invalid_status == 0))
    
    # Non-negative bytes
    neg_bytes = logs_clean.filter(col("bytes") < 0).count()
    checks.append(("negative_bytes", neg_bytes == 0))
    
    # Hourly data exists for each day
    days_with_data = hourly_traffic.select("date").distinct().count()
    checks.append(("has_multiple_days", days_with_data >= 1))
    
    # Check partitioned output exists
    import os
    output_exists = os.path.exists("data/weblogs/cleaned/")
    checks.append(("output_exists", output_exists))
    
    for name, passed in checks:
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {name}")
    
    return all(passed for _, passed in checks)

validate_pipeline()
```

## Business Questions

Answer these using your pipeline results:

1. Which hour of the day has the highest traffic?
2. What is the average session duration?
3. Which pages have the highest error rate?
4. What percentage of traffic comes from bots?
5. Which IPs show anomalous behavior?
6. What is the peak requests-per-minute for each IP?
7. How many unique users per day?
8. What is the most requested API endpoint?
9. What is the distribution of HTTP methods (GET, POST, etc.)?
10. How does traffic pattern differ between weekdays and weekends?

## Practice Questions

1. What regex pattern matches the Apache Common Log Format?
2. How do you detect sessions with a 30-minute timeout?
3. What window function creates session IDs from timestamps?
4. How do you identify potential DDoS attacks from log data?
5. What criteria indicate bot activity in web logs?
6. How do you calculate error rate per endpoint?
7. How do you partition cleaned logs by date for efficient querying?
8. What quality checks should a log processing pipeline include?
9. How do you use `LAG()` to calculate time between requests?
10. How would you extend this pipeline to handle real-time streaming?
