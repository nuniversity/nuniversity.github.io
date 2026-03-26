---
title: "Data Ingestion & Integration"
description: "Explore four fundamental ingestion patterns and compare native capabilities across AWS Kinesis, Snowflake Snowpipe, and Databricks Auto Loader for streaming, batch, and CDC workloads."
order: 5
difficulty: advanced
duration: "60 min"
---

# Data Ingestion & Integration

> **Bottom Line:** AWS offers the most comprehensive streaming primitives (Kinesis, MSK) but requires manual plumbing. Snowflake's Snowpipe is elegant for near-real-time bulk loading but not true streaming. Databricks Auto Loader + Structured Streaming delivers a unified batch+streaming model that minimises code complexity.

---

## 5.1 Ingestion Pattern Taxonomy

Before comparing platforms, understand the four fundamental ingestion patterns:

```
Pattern 1: BATCH (Scheduled)
  Source → Extract → Transform → Load → Target
  Frequency: Hours to daily. Example: Nightly ETL from OLTP to warehouse.

Pattern 2: MICRO-BATCH (Near Real-Time)
  Source → Small batches every 1-15 min → Target
  Frequency: Minutes. Example: Snowpipe triggered by S3 events.

Pattern 3: STREAMING (True Real-Time)
  Source → Continuous event stream → Process → Target
  Frequency: Milliseconds to seconds. Example: Kinesis → Flink/Spark Streaming.

Pattern 4: CHANGE DATA CAPTURE (CDC)
  Source DB log → Capture changes → Replicate → Target
  Frequency: Near real-time. Example: DMS → Kinesis → Delta Lake.
```

---

## 5.2 AWS Ingestion Services

### Amazon Kinesis Data Streams — Real-Time Streaming

Kinesis is the AWS native real-time data streaming service — equivalent to Apache Kafka but fully managed:

```python
import boto3
import json
from datetime import datetime

# Producer: Write events to Kinesis stream
kinesis = boto3.client('kinesis', region_name='us-east-1')

def publish_order_event(order: dict):
    response = kinesis.put_record(
        StreamName='order-events',
        Data=json.dumps({
            **order,
            'event_timestamp': datetime.utcnow().isoformat(),
            'event_type': 'ORDER_PLACED'
        }),
        PartitionKey=order['customer_id']  # Determines shard routing
        # Same customer_id → same shard → ordered delivery per customer
    )
    return response['SequenceNumber']

# Consumer: Read from Kinesis stream (Lambda or Kinesis Data Analytics)
# Typical pattern: Kinesis → Lambda (light processing) → S3 / DynamoDB / Redshift
```

**Kinesis Shard Capacity:**
- 1 shard = 1 MB/s write OR 1,000 records/s write
- 1 shard = 2 MB/s read (shared among all consumers)
- Auto-scaling via Application Auto Scaling (not instant — takes minutes)

### Amazon MSK (Managed Kafka) — Enterprise Streaming

For organisations with existing Kafka expertise or needing Kafka-compatible APIs:

```yaml
# MSK Cluster Configuration (CloudFormation excerpt)
MSKCluster:
  Type: AWS::MSK::Cluster
  Properties:
    ClusterName: data-platform-kafka
    KafkaVersion: "3.5.1"
    NumberOfBrokerNodes: 6        # 3 AZs × 2 brokers each
    BrokerNodeGroupInfo:
      InstanceType: kafka.m5.2xlarge
      StorageInfo:
        EBSStorageInfo:
          VolumeSize: 1000         # GB per broker
    EncryptionInfo:
      EncryptionInTransit:
        ClientBroker: TLS
        InCluster: true
    EnhancedMonitoring: PER_TOPIC_PER_BROKER
```

**MSK vs. Kinesis Decision:**

| Factor | Choose MSK | Choose Kinesis |
|--------|-----------|----------------|
| **Kafka ecosystem** | ✅ Full Kafka API compatibility | ❌ KPL/KCL only |
| **Consumer groups** | ✅ Native Kafka consumer groups | ⚠️ Limited (via KCL) |
| **Message retention** | Up to 7 days (unlimited with MSK Tiered) | Up to 365 days |
| **Throughput ceiling** | Very high (broker-based scaling) | Add shards (slower) |
| **Management overhead** | High (broker config, ZooKeeper/Raft) | Low (fully serverless) |
| **Existing Kafka tools** | ✅ Kafka Connect, Schema Registry | ❌ Not compatible |

### AWS Glue — ETL at Scale

```python
# AWS Glue ETL Script (runs on serverless Spark)
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame
import pyspark.sql.functions as F

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'source_path', 'target_path'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read from S3 via Glue Catalog
raw_orders = glueContext.create_dynamic_frame.from_catalog(
    database="raw_ecommerce",
    table_name="orders"
)

# Convert to Spark DataFrame for complex transforms
orders_df = raw_orders.toDF()

# Transform
silver_orders = (
    orders_df
    .filter(F.col("revenue") > 0)
    .filter(F.col("order_id").isNotNull())
    .withColumn("order_date", F.to_date(F.col("order_timestamp")))
    .withColumn("year", F.year(F.col("order_date")))
    .withColumn("month", F.month(F.col("order_date")))
    .drop("raw_json", "processing_timestamp")
)

# Write back as Parquet, partitioned
silver_glue_frame = DynamicFrame.fromDF(silver_orders, glueContext, "silver")
glueContext.write_dynamic_frame.from_options(
    frame=silver_glue_frame,
    connection_type="s3",
    format="parquet",
    connection_options={
        "path": args['target_path'],
        "partitionKeys": ["year", "month"]
    },
    format_options={"compression": "snappy"}
)

job.commit()
```

### AWS AppFlow — SaaS Integration

AppFlow provides no-code/low-code connectors to 50+ SaaS applications:

```
Supported Sources (selection):
  Salesforce, SAP, ServiceNow, Zendesk, Google Analytics,
  Slack, Marketo, HubSpot, Veeva, Infor

Supported Destinations:
  Amazon S3, Amazon Redshift, Snowflake (!), Databricks (!), EventBridge

Flow Types:
  - On-demand (triggered via API or Console)
  - Scheduled (cron-based)
  - Event-driven (e.g., new Salesforce record → trigger)
```

```json
{
  "flowName": "salesforce-to-s3-daily",
  "triggerConfig": {
    "triggerType": "Scheduled",
    "triggerProperties": {
      "scheduleExpression": "rate(1 day)",
      "dataPullMode": "Incremental"
    }
  },
  "sourceFlowConfig": {
    "connectorType": "Salesforce",
    "connectorProfileName": "my-sf-connection",
    "sourceConnectorProperties": {
      "Salesforce": {
        "object": "Opportunity",
        "enableDynamicFieldUpdate": true,
        "includeDeletedRecords": false
      }
    }
  },
  "destinationFlowConfigList": [{
    "connectorType": "S3",
    "destinationConnectorProperties": {
      "S3": {
        "bucketName": "my-data-lake",
        "bucketPrefix": "raw/salesforce/opportunities",
        "s3OutputFormatConfig": {
          "fileType": "PARQUET",
          "aggregationConfig": {"aggregationType": "SingleFile"}
        }
      }
    }
  }]
}
```

---

## 5.3 Snowflake Ingestion

### Snowpipe — Continuous Data Loading

Snowpipe is Snowflake's near-real-time, serverless data loading mechanism. It watches an S3 bucket (via S3 event notifications) and loads new files as they arrive:

```sql
-- Step 1: Create a file format
CREATE FILE FORMAT json_format
    TYPE = 'JSON'
    COMPRESSION = 'AUTO'
    STRIP_OUTER_ARRAY = TRUE;

-- Step 2: Create a stage
CREATE STAGE orders_landing_stage
    STORAGE_INTEGRATION = s3_data_lake_int
    URL = 's3://my-bucket/landing/orders/'
    FILE_FORMAT = json_format;

-- Step 3: Create the pipe
CREATE PIPE orders_ingest_pipe
    AUTO_INGEST = TRUE  -- SQS-triggered from S3 events
    COMMENT = 'Ingest order events from landing zone'
AS
COPY INTO raw.orders (
    order_id,
    customer_id,
    revenue,
    status,
    order_timestamp
)
FROM (
    SELECT
        $1:order_id::VARCHAR,
        $1:customer_id::VARCHAR,
        $1:revenue::FLOAT,
        $1:status::VARCHAR,
        $1:timestamp::TIMESTAMP_LTZ
    FROM @orders_landing_stage
);

-- Check pipe status
SELECT SYSTEM$PIPE_STATUS('orders_ingest_pipe');
```

**Snowpipe SQS Integration Setup:**

```bash
# Get the SQS ARN from Snowflake
# (Run this in Snowflake SQL after creating the pipe)
-- SELECT SYSTEM$PIPE_STATUS('orders_ingest_pipe');
-- Note the 'notificationChannelName' from the output

# Configure S3 bucket notification to send to Snowflake's SQS queue
aws s3api put-bucket-notification-configuration \
  --bucket my-bucket \
  --notification-configuration '{
    "QueueConfigurations": [{
      "QueueArn": "arn:aws:sqs:us-east-1:snowflake-account:sf-snowpipe-...",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {"FilterRules": [{"Name": "prefix", "Value": "landing/orders/"}]}
      }
    }]
  }'
```

### COPY INTO — Bulk Loading

For scheduled bulk loads (e.g., nightly files):

```sql
-- Bulk COPY INTO from a stage
COPY INTO raw.orders
FROM @orders_landing_stage
FILE_FORMAT = (FORMAT_NAME = 'json_format')
PATTERN = '.*orders_2024.*\\.json\\.gz'  -- Regex pattern for file selection
PURGE = FALSE                             -- Keep source files
ON_ERROR = 'CONTINUE'                     -- Skip bad records (log errors)
FORCE = FALSE;                            -- Skip already-loaded files (deduplication!)

-- COPY INTO uses load history to avoid reloading files
-- Load history stored for 64 days in INFORMATION_SCHEMA.LOAD_HISTORY
SELECT *
FROM INFORMATION_SCHEMA.LOAD_HISTORY
WHERE TABLE_NAME = 'ORDERS'
ORDER BY LAST_LOAD_TIME DESC;
```

### Kafka Connector for Snowflake

```properties
# Kafka Connect configuration for Snowflake Sink Connector
name=snowflake-orders-sink
connector.class=com.snowflake.kafka.connector.SnowflakeSinkConnector
tasks.max=4
topics=order-events

# Snowflake connection
snowflake.url.name=myorg-myaccount.snowflakecomputing.com
snowflake.user.name=kafka_connector_user
snowflake.private.key=<RSA_PRIVATE_KEY>
snowflake.database.name=ECOMMERCE
snowflake.schema.name=RAW

# Buffer settings (controls micro-batching)
buffer.count.records=10000   # Flush after 10k records
buffer.flush.time=120        # OR after 2 minutes (whichever first)
buffer.size.bytes=5000000    # OR after 5MB

# Converter
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=com.snowflake.kafka.connector.records.SnowflakeJsonConverter
```

---

## 5.4 Databricks Ingestion

### Auto Loader — Incremental File Ingestion

Auto Loader is the recommended way to incrementally ingest files from cloud storage into Delta Lake. It is more efficient than Spark's `spark.readStream.format("parquet").load()` because it uses cloud-native file listing optimisations:

```python
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType

# Define schema explicitly for production reliability
order_schema = StructType([
    StructField("order_id",       StringType(),    nullable=False),
    StructField("customer_id",    StringType(),    nullable=False),
    StructField("revenue",        DoubleType(),    nullable=True),
    StructField("status",         StringType(),    nullable=True),
    StructField("order_timestamp",TimestampType(), nullable=True)
])

# Auto Loader configuration
orders_stream = (
    spark.readStream
        .format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.schemaLocation", "s3://my-bucket/checkpoints/orders/schema/")
        # ↑ Schema stored here — survives cluster restarts
        .option("cloudFiles.inferColumnTypes", "true")
        .option("cloudFiles.maxFilesPerTrigger", 1000)  # Process up to 1000 files per micro-batch
        .schema(order_schema)
        .load("s3://my-bucket/landing/orders/")
)

# Write to Delta Lake Bronze table
query = (
    orders_stream
        .withColumn("ingested_at", F.current_timestamp())
        .withColumn("source_file", F.input_file_name())
        .writeStream
        .format("delta")
        .option("checkpointLocation", "s3://my-bucket/checkpoints/orders/bronze/")
        # ↑ Exactly-once delivery — survived cluster failures
        .option("mergeSchema", "true")  # Handle schema evolution
        .outputMode("append")
        .trigger(availableNow=True)     # Process all available files, then stop (batch-like)
        # .trigger(processingTime='5 minutes')  # For continuous micro-batch
        .toTable("ecommerce.bronze.orders")
)
```

### Structured Streaming — True Real-Time from Kafka

```python
# Read from Kafka (MSK or Confluent)
kafka_stream = (
    spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "broker1:9092,broker2:9092")
        .option("subscribe", "order-events")
        .option("startingOffsets", "latest")
        .option("kafka.security.protocol", "SASL_SSL")
        .option("kafka.sasl.mechanism", "AWS_MSK_IAM")
        .option("kafka.sasl.jaas.config",
                "software.amazon.msk.auth.iam.IAMLoginModule required;")
        .option("kafka.sasl.client.callback.handler.class",
                "software.amazon.msk.auth.iam.IAMClientCallbackHandler")
        .load()
)

# Parse Kafka message (key + value are binary)
orders_stream = (
    kafka_stream
        .select(
            F.col("offset"),
            F.col("timestamp").alias("kafka_timestamp"),
            F.from_json(
                F.col("value").cast("string"),
                order_schema
            ).alias("data")
        )
        .select("offset", "kafka_timestamp", "data.*")
)

# Stateful aggregation with watermarking
windowed_revenue = (
    orders_stream
        .withWatermark("order_timestamp", "10 minutes")  # Late data threshold
        .groupBy(
            F.window("order_timestamp", "5 minutes"),    # 5-min tumbling window
            F.col("region")
        )
        .agg(
            F.sum("revenue").alias("total_revenue"),
            F.count("order_id").alias("order_count")
        )
)

# Write to Delta Lake (streaming)
query = (
    windowed_revenue
        .writeStream
        .format("delta")
        .outputMode("append")   # 'complete' requires full recompute each batch
        .option("checkpointLocation", "s3://my-bucket/checkpoints/windowed-revenue/")
        .trigger(processingTime='30 seconds')
        .toTable("ecommerce.gold.realtime_revenue_windows")
)

query.awaitTermination()
```

### Delta Live Tables — Declarative Streaming Pipelines

DLT abstracts the operational complexity of Structured Streaming:

```python
import dlt
from pyspark.sql import functions as F
from pyspark.sql.types import *

# Quality expectation library
VALID_ORDER = "order_id IS NOT NULL AND revenue > 0"
VALID_CUSTOMER = "customer_id IS NOT NULL AND LENGTH(customer_id) = 36"

@dlt.table(
    name="bronze_order_events",
    comment="Raw order events from Kafka MSK",
    table_properties={"quality": "bronze", "pipelines.reset.allowed": "false"}
)
def bronze_order_events():
    return (
        spark.readStream
            .format("kafka")
            .option("kafka.bootstrap.servers", "${kafka.brokers}")
            .option("subscribe", "order-events")
            .load()
            .select(
                F.col("offset"),
                F.col("timestamp"),
                F.from_json(F.col("value").cast("string"), order_schema).alias("data")
            )
            .select("offset", "timestamp", "data.*")
    )

@dlt.table(name="silver_orders", comment="Validated and enriched orders")
@dlt.expect_or_drop("valid_order_id", "order_id IS NOT NULL")
@dlt.expect_or_drop("positive_revenue", "revenue > 0")
@dlt.expect("valid_customer", "customer_id IS NOT NULL",
             violation_action="warn")  # Log but don't drop
def silver_orders():
    return (
        dlt.read_stream("bronze_order_events")
            .withColumn("order_date", F.to_date("order_timestamp"))
            .withColumn("revenue_usd",
                F.when(F.col("currency") == "EUR", F.col("revenue") * 1.09)
                 .when(F.col("currency") == "GBP", F.col("revenue") * 1.27)
                 .otherwise(F.col("revenue")))
    )
```

---

## 5.5 Change Data Capture (CDC)

CDC is critical for keeping the data platform in sync with operational databases in near-real-time.

### AWS CDC Pattern: DMS + Kinesis + S3

```
Operational DB (RDS/Aurora)
        │
        ▼  AWS DMS reads the binary transaction log
  AWS Database Migration Service (DMS)
  - Task Type: CDC only (or Full Load + CDC)
  - Source: MySQL binlog / PostgreSQL WAL / Oracle Redo Logs
        │
        ▼
  Amazon Kinesis Data Streams  (or S3 directly)
        │
        ▼
  AWS Lambda / Kinesis Data Analytics  (optional transformation)
        │
        ▼
  Amazon S3  (Parquet files)
        │
        ▼
  Amazon Redshift / Glue ETL / Athena
```

### Snowflake CDC: Streams and Tasks

Snowflake has a native CDC mechanism using **Streams** (change tracking on tables) and **Tasks** (scheduled execution):

```sql
-- Step 1: Create a stream on the source table
CREATE STREAM orders_changes ON TABLE raw.orders
    SHOW_INITIAL_ROWS = FALSE;  -- Only capture changes from this point forward

-- The stream tracks three types of changes:
-- METADATA$ACTION: INSERT, DELETE
-- METADATA$ISUPDATE: TRUE if part of an UPDATE (shows as DELETE + INSERT)
-- METADATA$ROW_ID: Unique row identifier

-- Step 2: Create a target table for the SCD Type 1 merge
CREATE TABLE silver.orders_current (
    order_id        VARCHAR PRIMARY KEY,
    customer_id     VARCHAR,
    revenue         FLOAT,
    status          VARCHAR,
    last_updated_at TIMESTAMP_LTZ
);

-- Step 3: Create a task to process the stream on a schedule
CREATE TASK process_order_changes
    WAREHOUSE = 'ETL_WH'
    SCHEDULE = '1 MINUTE'          -- Run every minute
    WHEN SYSTEM$STREAM_HAS_DATA('orders_changes')  -- Only run if there's data
AS
MERGE INTO silver.orders_current AS tgt
USING (
    SELECT
        order_id,
        customer_id,
        revenue,
        status,
        CURRENT_TIMESTAMP() AS last_updated_at,
        METADATA$ACTION,
        METADATA$ISUPDATE
    FROM orders_changes
    WHERE METADATA$ACTION = 'INSERT'  -- After ISUPDATE pair filtering
) AS src
ON tgt.order_id = src.order_id
WHEN MATCHED THEN
    UPDATE SET
        revenue = src.revenue,
        status = src.status,
        last_updated_at = src.last_updated_at
WHEN NOT MATCHED THEN
    INSERT (order_id, customer_id, revenue, status, last_updated_at)
    VALUES (src.order_id, src.customer_id, src.revenue, src.status, src.last_updated_at);

-- Step 4: Resume the task
ALTER TASK process_order_changes RESUME;
```

### Databricks CDC: Delta Lake MERGE

```python
# Databricks CDC using Delta MERGE — handles INSERT, UPDATE, DELETE
from delta.tables import DeltaTable
from pyspark.sql import functions as F

# Read CDC feed (from Kafka, DMS, Debezium, etc.)
# Debezium format: each record has op="c"(insert)/"u"(update)/"d"(delete)
cdc_df = (
    spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "${kafka.brokers}")
        .option("subscribe", "dbserver1.ecommerce.orders")  # Debezium topic
        .load()
        .select(
            F.from_json(F.col("value").cast("string"), debezium_schema).alias("cdc")
        )
        .select(
            F.col("cdc.op").alias("operation"),        # c, u, d, r(snapshot)
            F.col("cdc.after.*"),                       # New row values
            F.col("cdc.source.ts_ms").alias("source_ts")
        )
)

def apply_cdc_to_delta(microBatch_df, batchId):
    """Apply CDC changes to Delta table using MERGE."""
    target = DeltaTable.forName(spark, "ecommerce.silver.orders")

    # Deduplicate within batch (keep latest change per key)
    deduped = (
        microBatch_df
            .withColumn("rank", F.row_number().over(
                Window.partitionBy("order_id").orderBy(F.desc("source_ts"))
            ))
            .filter(F.col("rank") == 1)
            .drop("rank")
    )

    (
        target.alias("t").merge(
            deduped.alias("s"),
            "t.order_id = s.order_id"
        )
        .whenMatchedDelete(condition="s.operation = 'd'")
        .whenMatchedUpdateAll(condition="s.operation IN ('u', 'r')")
        .whenNotMatchedInsertAll(condition="s.operation IN ('c', 'r')")
        .execute()
    )

# Stream with foreachBatch
(
    cdc_df.writeStream
        .foreachBatch(apply_cdc_to_delta)
        .option("checkpointLocation", "s3://my-bucket/checkpoints/orders-cdc/")
        .trigger(processingTime='1 minute')
        .start()
)
```

---

## 5.6 Ingestion Comparison Matrix

| Capability | AWS (Native) | Snowflake | Databricks |
|-----------|-------------|-----------|------------|
| **Bulk file loading** | S3 COPY (Redshift), Glue | ✅ COPY INTO | ✅ Auto Loader |
| **Near-real-time file** | S3 Event → Lambda → Redshift | ✅ Snowpipe (SQS-triggered) | ✅ Auto Loader (trigger=availableNow) |
| **Kafka/MSK** | Kinesis Data Analytics, Lambda | ✅ Kafka Connector | ✅ Native Structured Streaming |
| **True streaming** | ⚡ Kinesis + Flink/KDA | ❌ Not native | ⚡ Structured Streaming |
| **CDC from DBs** | ✅ AWS DMS | ✅ Streams + Tasks | ✅ MERGE foreachBatch |
| **SaaS connectors** | ✅ AppFlow (50+ sources) | ✅ Native connectors + partners | ⚠️ Partner connectors (Fivetran, Airbyte) |
| **Schema inference** | ⚠️ Glue Crawler (slow, imperfect) | ⚠️ Manual or variant | ✅ Auto Loader (cloudFiles.inferColumnTypes) |
| **Exactly-once delivery** | ⚠️ Complex to achieve | ✅ Via deduplication keys | ✅ Via checkpoint + idempotent writes |
| **No-code ingestion** | ✅ AppFlow, Glue Visual ETL | ✅ Snowpipe REST API | ⚠️ Limited (DLT helps) |

---

*Next: [06 — Governance, Security & Compliance](./06_Governance_and_Security.md)*
