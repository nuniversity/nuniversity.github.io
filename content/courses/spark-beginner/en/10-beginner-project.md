---
title: "Beginner Project: NYC Taxi Trip Analysis"
description: "Apply everything you learned: analyze NYC taxi trip data using RDDs and DataFrames in a complete project"
order: 10
duration: "45-60 minutes"
difficulty: "beginner"
---

# Beginner Project: NYC Taxi Trip Analysis

This capstone project combines all the skills from this course. You'll analyze a NYC taxi trip dataset using both RDD and DataFrame APIs, practicing transformations, actions, SQL, and file I/O.

## Project Overview

You will:
1. Load raw taxi trip CSV data
2. Clean and transform data with RDDs
3. Load and analyze data with DataFrames
4. Run SQL queries on the dataset
5. Compute insights and save results
6. Answer specific business questions

## Dataset

For this project, we'll use the NYC Yellow Taxi Trip Data. You can download a sample from the NYC Taxi & Limousine Commission's open data portal. For local development, create a sample CSV.

> [!NOTE]
> To run this project, download a sample of NYC taxi data from https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page or use the provided sample generator below.

### Sample Data Generation (for testing)

```python
import csv
import random
from datetime import datetime, timedelta

# Generate sample taxi trip data
headers = [
    "VendorID", "tpep_pickup_datetime", "tpep_dropoff_datetime",
    "passenger_count", "trip_distance", "RatecodeID",
    "store_and_fwd_flag", "PULocationID", "DOLocationID",
    "payment_type", "fare_amount", "extra", "mta_tax",
    "tip_amount", "tolls_amount", "improvement_surcharge",
    "total_amount"
]

with open("data/taxi_trips.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for _ in range(10000):
        pickup = datetime(2024, 1, 1) + timedelta(
            minutes=random.randint(0, 525600)
        )
        dropoff = pickup + timedelta(minutes=random.randint(5, 120))
        writer.writerow([
            random.randint(1, 2),
            pickup.strftime("%Y-%m-%d %H:%M:%S"),
            dropoff.strftime("%Y-%m-%d %H:%M:%S"),
            random.randint(1, 6),
            round(random.uniform(0.5, 30.0), 2),
            random.randint(1, 6),
            random.choice(["N", "Y"]),
            random.randint(1, 265),
            random.randint(1, 265),
            random.randint(1, 4),
            round(random.uniform(3.0, 100.0), 2),
            round(random.uniform(0.0, 5.0), 2),
            round(random.uniform(0.5, 1.0), 2),
            round(random.uniform(0.0, 25.0), 2),
            round(random.uniform(0.0, 15.0), 2),
            round(random.uniform(0.3, 0.5), 2),
            0.0  # will calculate
        ])
```

## Part 1: RDD Analysis

### 1.1 Load and Explore with RDDs

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("NYCTaxiRDD") \
    .master("local[*]") \
    .getOrCreate()

sc = spark.sparkContext

# Load CSV as RDD
taxi_rdd = sc.textFile("data/taxi_trips.csv")

# Split header and data
header = taxi_rdd.first()
data_rdd = taxi_rdd.filter(lambda row: row != header)

# Parse CSV lines
def parse_row(line):
    fields = line.split(",")
    return {
        "vendor": int(fields[0]),
        "pickup": fields[1],
        "dropoff": fields[2],
        "passengers": int(fields[3]),
        "distance": float(fields[4]),
        "fare": float(fields[10]),
        "tip": float(fields[13]),
        "total": float(fields[16]),
        "payment": int(fields[9])
    }

parsed_rdd = data_rdd.map(parse_row)

# Basic statistics
print(f"Total trips: {parsed_rdd.count()}")

total_distance = parsed_rdd.map(lambda r: r["distance"]).reduce(lambda a, b: a + b)
avg_distance = total_distance / parsed_rdd.count()
print(f"Average trip distance: {avg_distance:.2f} miles")
```

> [!SUCCESS]
> Using RDDs gives you explicit control over parsing and transformation logic. This is useful when dealing with messy, non-standard data formats.

### 1.2 RDD Transformations and Actions

```python
# Find top 10 longest trips
longest_trips = parsed_rdd \
    .map(lambda r: (r["distance"], r)) \
    .sortByKey(ascending=False) \
    .map(lambda x: x[1]) \
    .take(10)

print("Longest trips:")
for t in longest_trips:
    print(f"  {t['distance']} miles, fare: ${t['fare']}")

# Average tip by payment type
tip_by_payment = parsed_rdd \
    .map(lambda r: (r["payment"], (r["tip"], 1))) \
    .reduceByKey(lambda a, b: (a[0] + b[0], a[1] + b[1])) \
    .mapValues(lambda v: v[0] / v[1]) \
    .collect()

print("\nAverage tip by payment type:")
for payment, avg_tip in sorted(tip_by_payment):
    print(f"  Type {payment}: ${avg_tip:.2f}")

# Filter trips with high tip percentage
generous_trips = parsed_rdd \
    .filter(lambda r: r["fare"] > 0 and r["tip"] / r["fare"] > 0.25)
print(f"\nTrips with tip > 25%: {generous_trips.count()}")

# Count trips by passenger count
passenger_dist = parsed_rdd \
    .map(lambda r: (r["passengers"], 1)) \
    .reduceByKey(lambda a, b: a + b) \
    .sortByKey() \
    .collect()

print("\nTrip distribution by passenger count:")
for passengers, count in passenger_dist:
    print(f"  {passengers} passenger(s): {count} trips")
```

## Part 2: DataFrame Analysis

### 2.1 Load and Explore with DataFrames

```python
# Load CSV directly into DataFrame
taxi_df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .csv("data/taxi_trips.csv")

print(f"Schema:")
taxi_df.printSchema()

print(f"\nRow count: {taxi_df.count()}")
print(f"\nSample data:")
taxi_df.show(5, truncate=False)

print(f"\nSummary statistics:")
taxi_df.describe(["fare_amount", "tip_amount", "trip_distance", "total_amount"]).show()
```

### 2.2 DataFrame Transformations

```python
from pyspark.sql.functions import col, avg, max, min, sum, count, when, round, hour

# Clean data — filter invalid trips
clean_df = taxi_df \
    .filter(col("trip_distance") > 0) \
    .filter(col("fare_amount") > 0) \
    .filter(col("passenger_count") > 0) \
    .filter(col("total_amount") > 0)

print(f"Trips after cleaning: {clean_df.count()}")

# Add derived columns
analyzed_df = clean_df \
    .withColumn("tip_percentage", round(col("tip_amount") / col("fare_amount") * 100, 2)) \
    .withColumn("price_per_mile", round(col("fare_amount") / col("trip_distance"), 2)) \
    .withColumn("pickup_hour", hour(col("tpep_pickup_datetime")))

# Analysis by hour
hourly_stats = analyzed_df \
    .groupBy("pickup_hour") \
    .agg(
        count("*").alias("trip_count"),
        round(avg("fare_amount"), 2).alias("avg_fare"),
        round(avg("tip_percentage"), 2).alias("avg_tip_pct")
    ) \
    .orderBy("pickup_hour")

print("Hourly analysis:")
hourly_stats.show(24)
```

### 2.3 SQL Queries

```python
# Register as temp view
clean_df.createOrReplaceTempView("trips")

# Busiest hours
busiest_hours = spark.sql("""
    SELECT HOUR(tpep_pickup_datetime) as hour,
           COUNT(*) as trip_count,
           ROUND(AVG(fare_amount), 2) as avg_fare,
           ROUND(AVG(tip_amount), 2) as avg_tip
    FROM trips
    GROUP BY hour
    ORDER BY trip_count DESC
    LIMIT 5
""")
print("Busiest hours:")
busiest_hours.show()

# Payment type analysis
payment_analysis = spark.sql("""
    SELECT payment_type,
           COUNT(*) as count,
           ROUND(AVG(total_amount), 2) as avg_total,
           ROUND(AVG(tip_amount), 2) as avg_tip,
           ROUND(SUM(total_amount), 2) as revenue
    FROM trips
    GROUP BY payment_type
    ORDER BY count DESC
""")
print("Payment type analysis:")
payment_analysis.show()

# High-value trips
high_value = spark.sql("""
    SELECT *
    FROM trips
    WHERE total_amount > 50
      AND tip_amount > 10
    ORDER BY total_amount DESC
    LIMIT 10
""")
print("High-value trips:")
high_value.show()
```

## Part 3: Save Results

```python
# Save analysis to Parquet (efficient columnar format)
hourly_stats.write.mode("overwrite").parquet("output/hourly_stats")
payment_analysis.write.mode("overwrite").json("output/payment_analysis")

# Save as single CSV (repartition to 1 file)
high_value \
    .coalesce(1) \
    .write \
    .mode("overwrite") \
    .option("header", "true") \
    .csv("output/high_value_trips")

# Save RDD results as text
sc.parallelize(tip_by_payment) \
    .map(lambda x: f"PaymentType{x[0]}: ${x[1]:.2f}") \
    .saveAsTextFile("output/avg_tip_by_payment")
```

> [!WARNING]
> `coalesce(1)` forces all data through a single partition. Use only for small result sets. For large outputs, keep the natural partition count for parallel writes.

## Part 4: Business Questions

Answer these questions using your analysis:

```python
# Q1: What is the average trip distance and fare?
avg_metrics = spark.sql("""
    SELECT ROUND(AVG(trip_distance), 2) as avg_distance,
           ROUND(AVG(fare_amount), 2) as avg_fare,
           ROUND(AVG(total_amount), 2) as avg_total
    FROM trips
""")
print("Q1 - Average metrics:")
avg_metrics.show()

# Q2: Which hour has the highest average tip percentage?
best_tip_hour = spark.sql("""
    SELECT HOUR(tpep_pickup_datetime) as hour,
           ROUND(AVG(tip_amount / fare_amount * 100), 2) as avg_tip_pct
    FROM trips
    WHERE fare_amount > 0
    GROUP BY hour
    ORDER BY avg_tip_pct DESC
    LIMIT 3
""")
print("Q2 - Best tip hours:")
best_tip_hour.show()

# Q3: What is the revenue distribution across payment types?
revenue_dist = spark.sql("""
    SELECT payment_type,
           COUNT(*) as trips,
           ROUND(SUM(total_amount), 2) as total_revenue,
           ROUND(AVG(total_amount), 2) as avg_trip_value
    FROM trips
    GROUP BY payment_type
    ORDER BY total_revenue DESC
""")
print("Q3 - Revenue by payment type:")
revenue_dist.show()

# Q4: How does trip distance correlate with fare amount?
correlation = spark.sql("""
    SELECT CASE
        WHEN trip_distance < 1 THEN '<1 mile'
        WHEN trip_distance < 3 THEN '1-3 miles'
        WHEN trip_distance < 5 THEN '3-5 miles'
        WHEN trip_distance < 10 THEN '5-10 miles'
        ELSE '10+ miles'
    END as distance_range,
    COUNT(*) as trips,
    ROUND(AVG(fare_amount), 2) as avg_fare,
    ROUND(AVG(tip_amount), 2) as avg_tip
    FROM trips
    GROUP BY distance_range
    ORDER BY MIN(trip_distance)
""")
print("Q4 - Fare by distance range:")
correlation.show()
```

## Complete Pipeline Script

```python
# taxi_analysis.py - Complete pipeline
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("NYCTaxiAnalysis") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# Load
df = spark.read.option("header", "true") \
    .option("inferSchema", "true") \
    .csv("data/taxi_trips.csv")

# Clean
clean = df.filter(col("trip_distance") > 0) \
    .filter(col("fare_amount") > 0)

# Enrich
enriched = clean.withColumn("tip_pct",
    round(col("tip_amount") / col("fare_amount") * 100, 2)) \
    .withColumn("pickup_hour", hour("tpep_pickup_datetime"))

# Analyze
result = enriched.groupBy("pickup_hour").agg(
    count("*").alias("trips"),
    round(avg("fare_amount"), 2).alias("avg_fare")
).orderBy("pickup_hour")

# Save
result.coalesce(1).write.mode("overwrite") \
    .option("header", "true").csv("output/taxi_analysis")

spark.stop()
```

## Practice Questions

1. How do you parse a CSV file manually using RDDs?
2. Why is cleaning data (removing negative distances, zero fares) important before analysis?
3. What are the advantages of loading data with DataFrames instead of RDDs?
4. How do you compute tip percentage as a derived column?
5. What SQL query finds the busiest hours of the day?
6. How do you save results in Parquet format vs CSV format?
7. Why does `saveAsTextFile` produce multiple part files?
8. How do you save DataFrame results as a single CSV file?
9. What are three business insights you can extract from NYC taxi data?
10. How would you modify the pipeline to analyze data by day of week instead of hour?
