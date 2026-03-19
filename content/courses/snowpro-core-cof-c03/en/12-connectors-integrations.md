---
title: "Domain 3.3 — Snowflake Connectors and Integrations"
description: "Understand Snowflake's ecosystem of drivers, connectors, and integrations: JDBC, ODBC, Python connector, Kafka connector, storage integrations, API integrations, and Git integration."
order: 12
difficulty: intermediate
duration: "50 min"
---

# Domain 3.3 — Snowflake Connectors and Integrations

## Exam Weight

**Domain 3.0** accounts for **~18%** of the exam.

> [!NOTE]
> This lesson maps to **Exam Objective 3.3**: *Identify the different Snowflake Connectors and integrations*, including drivers, connectors, storage integrations, API integrations, and Git integration.

---

## Snowflake Drivers

**Drivers** provide direct SQL connectivity to Snowflake from applications and tools. They implement standard protocols (JDBC, ODBC) so existing tools work without modification.

### JDBC Driver

Used by Java applications, BI tools (Tableau, Looker, DBeaver), and data integration platforms:

```java
// Java JDBC connection
Properties props = new Properties();
props.put("user", "myuser");
props.put("password", "mypassword");
props.put("db", "MY_DB");
props.put("schema", "PUBLIC");
props.put("warehouse", "WH_ANALYTICS");
props.put("role", "ANALYST");

Connection conn = DriverManager.getConnection(
    "jdbc:snowflake://myaccount.snowflakecomputing.com/",
    props
);
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM orders LIMIT 10");
```

### ODBC Driver

Used by Excel, Power BI, MicroStrategy, and other ODBC-compatible tools:
- Available for Windows, macOS, Linux
- Configured via ODBC Data Source Administrator (Windows) or `odbc.ini` (Linux/macOS)

### Python Connector

The official Snowflake connector for Python:

```python
import snowflake.connector

# Standard connection
conn = snowflake.connector.connect(
    account='myaccount.us-east-1',
    user='myuser',
    password='mypassword',
    warehouse='WH_ANALYTICS',
    database='MY_DB',
    schema='PUBLIC',
    role='ANALYST'
)

cursor = conn.cursor()
cursor.execute("SELECT count(*) FROM orders")
result = cursor.fetchone()
print(f"Order count: {result[0]}")

# Execute with parameters (prevents SQL injection)
cursor.execute(
    "SELECT * FROM orders WHERE customer_id = %s AND status = %s",
    (customer_id, 'ACTIVE')
)

# Using DictCursor for dict results
cursor_dict = conn.cursor(snowflake.connector.DictCursor)
cursor_dict.execute("SELECT order_id, amount FROM orders LIMIT 5")
for row in cursor_dict:
    print(row['ORDER_ID'], row['AMOUNT'])
```

### Other Official Drivers

| Driver | Use Case |
|---|---|
| **Node.js** | JavaScript/TypeScript applications |
| **.NET** | C# applications |
| **Go** | Go applications |
| **PHP PDO** | PHP web applications |
| **Spark Connector** | Apache Spark integration |
| **Kafka Connector** | Apache Kafka → Snowflake streaming |

---

## Snowflake Connectors

**Connectors** are higher-level integrations built on top of drivers — they handle specific data source patterns.

### Snowflake Connector for Apache Kafka

The **Kafka Connector** enables real-time message streaming from Kafka topics into Snowflake tables:

```json
// Kafka Connector configuration (connector.json)
{
  "name": "snowflake-sink",
  "config": {
    "connector.class": "com.snowflake.kafka.connector.SnowflakeSinkConnector",
    "tasks.max": "8",
    "topics": "orders,events,users",
    "snowflake.url.name": "myaccount.snowflakecomputing.com:443",
    "snowflake.user.name": "kafka_user",
    "snowflake.private.key": "<RSA_PRIVATE_KEY>",
    "snowflake.database.name": "RAW_DB",
    "snowflake.schema.name": "KAFKA",
    "snowflake.ingestion.method": "SNOWPIPE_STREAMING",
    "buffer.flush.time": "10",
    "buffer.count.records": "10000"
  }
}
```

| Ingestion Method | Description |
|---|---|
| **Snowpipe (v1)** | File-based ingestion via stages |
| **Snowpipe Streaming (v2+)** | Row-level direct ingestion (lower latency) |

### Snowflake Connector for Python (Snowpark)

The Snowpark Python connector provides a DataFrame API:

```python
from snowflake.snowpark import Session

session = Session.builder.configs({
    "account": "myaccount",
    "user": "myuser",
    "authenticator": "externalbrowser",  # SSO
    "warehouse": "WH_DS",
    "database": "ANALYTICS",
    "schema": "PUBLIC"
}).create()

# DataFrame operations
df = session.table("orders")
df.filter(df["amount"] > 100).group_by("region").count().show()
```

### Snowflake Connector for Spark

Connect Apache Spark workloads to Snowflake:

```scala
// Scala/Spark with Snowflake connector
val df = spark.read
  .format("snowflake")
  .options(sfOptions)
  .option("dbtable", "MY_DB.PUBLIC.ORDERS")
  .load()

df.write
  .format("snowflake")
  .options(sfOptions)
  .option("dbtable", "MY_DB.PUBLIC.ORDERS_OUTPUT")
  .mode(SaveMode.Overwrite)
  .save()
```

---

## Storage Integrations

A **storage integration** creates a trusted relationship between Snowflake and your cloud storage **without storing credentials in Snowflake**. It uses cloud IAM (Identity and Access Management) for authentication.

### AWS S3 Integration

```sql
-- Step 1: Create the integration
CREATE STORAGE INTEGRATION aws_s3_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = S3
    ENABLED = TRUE
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789012:role/SnowflakeRole'
    STORAGE_ALLOWED_LOCATIONS = ('s3://my-data-bucket/snowflake/');

-- Step 2: Get Snowflake's AWS identity for trust policy
DESC INTEGRATION aws_s3_integration;
-- Note: STORAGE_AWS_IAM_USER_ARN and STORAGE_AWS_EXTERNAL_ID

-- Step 3: Update the IAM trust policy in AWS with those values
-- Step 4: Create a stage using the integration
CREATE STAGE my_s3_stage
    URL = 's3://my-data-bucket/snowflake/'
    STORAGE_INTEGRATION = aws_s3_integration
    FILE_FORMAT = (TYPE = PARQUET);
```

### Azure Blob Storage Integration

```sql
CREATE STORAGE INTEGRATION azure_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = AZURE
    ENABLED = TRUE
    AZURE_TENANT_ID = '<your-tenant-id>'
    STORAGE_ALLOWED_LOCATIONS = ('azure://myaccount.blob.core.windows.net/mycontainer/');

-- Get the service principal details for Azure role assignment
DESC INTEGRATION azure_integration;
```

### GCS Integration

```sql
CREATE STORAGE INTEGRATION gcs_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = GCS
    ENABLED = TRUE
    STORAGE_ALLOWED_LOCATIONS = ('gcs://my-bucket/snowflake/');

-- Get the service account for GCS IAM role assignment
DESC INTEGRATION gcs_integration;
```

---

## API Integrations

An **API integration** allows Snowflake to call **external REST API endpoints** — used for External Functions and notification integrations.

### External Functions

External functions call APIs outside Snowflake via an API Gateway:

```sql
-- Create an API integration (pointing to AWS API Gateway / Azure App Service)
CREATE API INTEGRATION my_api_integration
    API_PROVIDER = AWS_API_GATEWAY
    API_AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/SnowflakeAPIRole'
    API_ALLOWED_PREFIXES = ('https://abc123.execute-api.us-east-1.amazonaws.com/prod/')
    ENABLED = TRUE;

-- Create the external function
CREATE EXTERNAL FUNCTION call_sentiment_api(text STRING)
RETURNS VARIANT
API_INTEGRATION = my_api_integration
AS 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/sentiment';

-- Use it in SQL
SELECT call_sentiment_api(review_text) AS sentiment
FROM product_reviews;
```

### Notification Integrations

Used for Snowpipe event notifications and alert systems:

```sql
-- AWS SNS notification integration
CREATE NOTIFICATION INTEGRATION aws_sns_integration
    ENABLED = TRUE
    TYPE = QUEUE
    NOTIFICATION_PROVIDER = AWS_SNS
    DIRECTION = OUTBOUND
    AWS_SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789:my-topic'
    AWS_SNS_ROLE_ARN = 'arn:aws:iam::123456789:role/SNSRole';

-- Auto-ingest (Snowpipe) using SQS
CREATE NOTIFICATION INTEGRATION sqs_ingest
    ENABLED = TRUE
    TYPE = QUEUE
    NOTIFICATION_PROVIDER = AWS_SQS
    AWS_SQS_ARN = 'arn:aws:sqs:us-east-1:123456789:snowpipe-queue';
```

---

## Git Integration

**Git Integration** allows Snowflake to connect to a Git repository (GitHub, GitLab, Bitbucket) and execute SQL files, Snowpark code, or other scripts directly from the repo:

```sql
-- Create an API integration for the Git provider
CREATE API INTEGRATION github_integration
    API_PROVIDER = GIT_HTTPS_API
    API_ALLOWED_PREFIXES = ('https://github.com/myorg/')
    ENABLED = TRUE;

-- Create a Git repository object in Snowflake
CREATE GIT REPOSITORY my_repo
    API_INTEGRATION = github_integration
    GIT_CREDENTIALS = my_github_credentials  -- stored as a Secret
    ORIGIN = 'https://github.com/myorg/snowflake-pipelines.git';

-- Fetch latest from remote
ALTER GIT REPOSITORY my_repo FETCH;

-- List files in the repository
SHOW GIT FILES IN @my_repo/branches/main;

-- Execute a SQL file directly from Git
EXECUTE IMMEDIATE FROM @my_repo/branches/main/migrations/001_create_tables.sql;

-- Reference Snowpark Python code from Git in a procedure
CREATE PROCEDURE my_proc()
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
IMPORTS = ('@my_repo/branches/main/src/utils.py')
HANDLER = 'utils.run'
AS $$
# Code in Git
$$;
```

---

## Connector and Integration Summary

| Integration Type | Purpose | Examples |
|---|---|---|
| **JDBC Driver** | SQL connectivity from Java apps / BI tools | Tableau, DBeaver, custom Java apps |
| **ODBC Driver** | SQL connectivity from ODBC clients | Excel, Power BI |
| **Python Connector** | Python app connectivity | ETL scripts, data science |
| **Kafka Connector** | Real-time streaming from Kafka | Event streaming, CDC |
| **Spark Connector** | Spark ↔ Snowflake data exchange | Big data processing |
| **Storage Integration** | Secure access to cloud storage | S3, Azure Blob, GCS |
| **API Integration** | External REST API calls | External functions, alerts |
| **Notification Integration** | Push notifications | SNS, SQS, Event Grid, Pub/Sub |
| **Git Integration** | Version-controlled code execution | CI/CD, pipeline versioning |

---

## Practice Questions

**Q1.** A company wants to connect Power BI to Snowflake without writing any code. Which connectivity option is most appropriate?

- A) Python Connector
- B) JDBC Driver
- C) ODBC Driver ✅
- D) Kafka Connector

**Q2.** A storage integration uses which mechanism to authenticate with cloud storage instead of storing credentials?

- A) Username and password stored in a Snowflake Secret
- B) Cloud IAM roles (trust relationship) ✅
- C) API keys stored in the stage definition
- D) OAuth tokens managed by the user

**Q3.** A Kafka Connector configured with `snowflake.ingestion.method = SNOWPIPE_STREAMING` provides which advantage over file-based ingestion?

- A) Lower cost
- B) Better compression
- C) Lower latency (row-level direct ingestion) ✅
- D) Support for more file formats

**Q4.** Which Snowflake feature allows executing SQL files directly from a GitHub repository without downloading them first?

- A) Snowflake CLI
- B) Snowsight Notebooks
- C) Git Integration ✅
- D) Storage Integration

**Q5.** An external function requires which type of integration to call an external REST API?

- A) Storage Integration
- B) Notification Integration
- C) API Integration ✅
- D) Security Integration

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. **JDBC** = Java + BI tools | **ODBC** = Excel, Power BI | **Python Connector** = scripts/apps
> 2. **Storage Integration** = IAM role auth, no credentials stored in Snowflake
> 3. **Kafka Connector v2+ with Snowpipe Streaming** = lowest-latency Kafka ingestion
> 4. **API Integration** = required for External Functions calling REST APIs
> 5. **Git Integration** = execute SQL/Snowpark code directly from a Git repository