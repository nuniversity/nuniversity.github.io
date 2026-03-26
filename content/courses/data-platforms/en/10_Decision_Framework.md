---
title: "Use Case Decision Framework"
description: "Apply a rigorous decision matrix to choose the right data platform for specific workloads, including SQL Analytics, Data Engineering, and ML, complete with industry-specific recommendations."
order: 10
difficulty: advanced
duration: "45 min"
---

# Use Case Decision Framework

> **Bottom Line:** Platform selection is not a global decision — it's a per-workload decision. The best data organisations make deliberate choices about which platform handles which job. This framework gives you the tools to make those choices rigorously.

---

## 10.1 The Decision Tree

```
START HERE: What is the PRIMARY purpose of this workload?
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   SQL Analytics      Data Engineering     ML / AI
   & BI Serving         & ETL/ELT         Workloads
          │                 │                 │
          ▼                 ▼                 ▼
  [Section 10.2]      [Section 10.3]    [Section 10.4]
```

---

## 10.2 SQL Analytics & BI Serving

### Decision Factors

```
Question 1: How many concurrent users are there?
  < 50 users      →  Any platform works; choose by team skill
  50-500 users    →  Snowflake (multi-cluster auto-scaling) or Redshift Serverless
  500+ users      →  Snowflake (proven at massive concurrency) or Redshift Serverless

Question 2: Is cross-organisation data sharing required?
  YES → Snowflake (clear winner — live sharing, Clean Rooms, Marketplace)
  NO  → Continue to next question

Question 3: What is the team's primary skill set?
  SQL-first, minimal code → Snowflake
  AWS-native, DevOps-oriented → Redshift
  Python/notebook-oriented → Databricks SQL Warehouses

Question 4: Is this on AWS, and deeply integrated with other AWS services?
  YES, and using Glue/Kinesis/Lake Formation extensively → Redshift
  YES, but data platform is relatively standalone → Snowflake or Databricks
  NO (multi-cloud or GCP/Azure primary) → Snowflake or Databricks

Question 5: Is operational simplicity the top priority?
  YES → Snowflake (minimal DBA overhead)
  NO, team has deep DB expertise → Redshift (more control, more tuning required)
```

### Scenario-Based Recommendations

| Scenario | Recommended Platform | Why |
|---------|---------------------|-----|
| Financial services, 200 analysts, strict data segregation | **Snowflake** | Row/column policies, mature RBAC, audit logs |
| Retail analytics, 500+ BI users on Tableau/PowerBI | **Snowflake** | Multi-cluster concurrency, BI tool optimisation |
| AWS-native company, Redshift already in use, cost-conscious | **Redshift** | Lower cost than Snowflake at scale, RI savings |
| E-commerce, daily reporting with seasonal spikes | **Snowflake** | Auto-scaling handles peak without pre-provisioning |
| Ad-hoc exploration on S3 data, low frequency | **AWS Athena** | No warehouse needed, $5/TB pay-per-query |
| Unified SQL + notebook analytics for data science teams | **Databricks SQL WH** | One platform for SQL and notebook workflows |

---

## 10.3 Data Engineering & ETL/ELT

### Decision Factors

```
Question 1: Is the primary transformation paradigm SQL or code (Python/Scala)?
  SQL-first ELT   → Snowflake (Streams + Tasks + dbt) or Redshift
  Python/Spark    → Databricks or AWS EMR/Glue

Question 2: Is real-time streaming required?
  YES, sub-second latency → AWS Kinesis + Lambda (or Flink) — Databricks Structured Streaming
  YES, minute-level latency → Databricks Structured Streaming (best unified batch+stream)
  NO, hourly/daily batch → Any platform

Question 3: What is the data scale?
  < 100GB/day   → Snowflake tasks, dbt on any platform, Glue
  100GB-1TB/day → Databricks (better price/performance for large Spark jobs)
  > 1TB/day     → Databricks or EMR (Snowflake can do this but cost is high)

Question 4: Are there complex custom transformations (ML features, graph, NLP)?
  YES → Databricks (Python UDFs, MLlib, custom libraries)
  NO  → Snowflake Streams/Tasks or AWS Glue

Question 5: Do you need CDC from operational databases?
  YES → AWS DMS + Databricks MERGE (most mature) or Snowflake Streams + Tasks
```

### ETL Tool Integration

| Tool | AWS | Snowflake | Databricks |
|------|-----|-----------|------------|
| **dbt** | ✅ Redshift + Athena adapters | ✅ Best-in-class integration | ✅ Databricks adapter |
| **Fivetran** | ✅ 300+ connectors → S3/Redshift | ✅ 300+ connectors → Snowflake | ✅ 300+ connectors → Databricks |
| **Airbyte** | ✅ Open source, self-hosted | ✅ Strong Snowflake support | ✅ Good support |
| **Apache Airflow** | ✅ MWAA (managed) | ✅ Snowflake operators | ✅ Databricks operators |
| **Prefect / Dagster** | ✅ | ✅ | ✅ |
| **Kafka / MSK** | ⚡ Native ecosystem | ✅ Kafka Connector | ⚡ Native Spark |
| **Spark** | ✅ EMR | ⚠️ Via Snowpark (limited) | ⚡ Native runtime |
| **dbt + Orchestration** | Airflow (MWAA) | dbt Cloud + Airflow | Databricks Workflows |

---

## 10.4 Machine Learning & AI

### Decision Factors

```
Question 1: Are you primarily using pre-built LLMs or training custom models?
  Pre-built LLMs → AWS Bedrock (most model choice) or Snowflake Cortex (SQL-native)
  Custom training → Databricks (GPU clusters, MLflow, full Spark pipeline)

Question 2: Who are the primary users?
  Data Scientists (Python, Jupyter) → Databricks (notebooks, MLflow, AutoML)
  Data Analysts (SQL) → Snowflake Cortex (SQL-native LLM functions)
  ML Engineers (MLOps focus) → Databricks (model registry, serving, monitoring)

Question 3: Is feature engineering complex (joins across large tables, time-series)?
  YES → Databricks Feature Store (Spark-native, point-in-time joins)
  NO  → Snowflake or SageMaker Feature Store

Question 4: Is real-time model serving required?
  YES, <100ms latency → AWS SageMaker Endpoints (most mature, auto-scaling)
  YES, seconds → Databricks Model Serving
  NO, batch inference → Any platform

Question 5: Do you need GPU clusters for deep learning?
  YES → AWS SageMaker (most GPU instance types) or Databricks (A100/H100 clusters)
  NO  → Snowflake Snowpark ML is sufficient for classical ML
```

---

## 10.5 Master Decision Matrix

Score each dimension 1-5 based on your requirements, multiply by weight, compare totals:

| Dimension | Weight | AWS | Snowflake | Databricks |
|-----------|--------|-----|-----------|------------|
| **SQL Analytics Performance** | 20% | 4 | 5 | 4 |
| **Concurrent BI Users (>100)** | 15% | 3 | 5 | 4 |
| **Python/Spark Flexibility** | 15% | 4 | 2 | 5 |
| **ML/AI Capability** | 15% | 5 | 3 | 5 |
| **Operational Simplicity** | 10% | 2 | 5 | 3 |
| **Data Sharing** | 10% | 2 | 5 | 4 |
| **Cost at Scale (Batch)** | 10% | 4 | 2 | 4 |
| **Open Format / Vendor Lock-in** | 5% | 4 | 2 | 5 |
| **Streaming Native** | 5% | 5 | 1 | 4 |

**Weighted Score:**

| | AWS | Snowflake | Databricks |
|--|-----|-----------|------------|
| **SQL Analytics** | 0.80 | 1.00 | 0.80 |
| **Concurrency** | 0.45 | 0.75 | 0.60 |
| **Python/Spark** | 0.60 | 0.30 | 0.75 |
| **ML/AI** | 0.75 | 0.45 | 0.75 |
| **Ops Simplicity** | 0.20 | 0.50 | 0.30 |
| **Data Sharing** | 0.20 | 0.50 | 0.40 |
| **Cost (Batch)** | 0.40 | 0.20 | 0.40 |
| **Open Format** | 0.20 | 0.10 | 0.25 |
| **Streaming** | 0.25 | 0.05 | 0.20 |
| **TOTAL** | **3.85** | **3.85** | **4.45** |

*Note: This weighting reflects a data engineering + ML-heavy organisation. For a SQL/BI-heavy org, Snowflake would score highest. Adjust weights to match your context.*

---

## 10.6 Industry-Specific Recommendations

### Financial Services

```
Primary requirements: Security, compliance (SOC2, PCI, HIPAA), audit logs, data governance

Recommended: Snowflake (Business Critical edition) + Databricks (Premium)
  - Snowflake: Data serving, regulatory reporting, RBAC/ABAC, masking policies
  - Databricks: Risk model training, fraud detection ML, Alt-data processing
  - AWS: Infrastructure backbone, DMS for CDC, Kinesis for market data streaming
  - Key feature: Snowflake Tri-Secret Secure for key management compliance
```

### Healthcare & Life Sciences

```
Primary requirements: HIPAA compliance, PHI protection, clinical trial data, genomics compute

Recommended: AWS (HIPAA-eligible services) + Databricks
  - AWS: HIPAA-eligible S3, Redshift (BAA available), VPC isolation
  - Databricks: Genomics pipelines (DRAGEN on EMR), clinical analytics
  - Snowflake: Also HIPAA-eligible, great for clinical reporting
  - Key: Always verify BAA availability for your specific use case
```

### Retail & E-Commerce

```
Primary requirements: Seasonality handling, real-time inventory, 360 customer view, ML recommendations

Recommended: Snowflake + Databricks hybrid
  - Snowflake: BI serving, finance reporting, data sharing with brand partners
  - Databricks: ML recommendations engine, real-time streaming, customer 360
  - Kinesis/MSK → Databricks → Delta Lake → Snowflake (serving)
```

### Media & Advertising

```
Primary requirements: Data marketplace, audience segments, privacy (clean rooms), real-time bidding

Recommended: Snowflake (strong winner for this vertical)
  - Snowflake Clean Rooms for privacy-preserving audience matching
  - Snowflake Marketplace for data monetisation
  - Databricks for ML model training (lookalike models, propensity scoring)
```

### Manufacturing & IoT

```
Primary requirements: Time-series data, predictive maintenance, high-volume sensor data, streaming

Recommended: AWS (streaming) + Databricks (processing)
  - Kinesis / MSK for real-time sensor ingestion
  - AWS IoT Greengrass for edge processing
  - Databricks: Time-series analytics, anomaly detection, predictive maintenance ML
  - Timestream (AWS): Purpose-built time-series DB for operational metrics
  - Snowflake: Business reporting and KPI dashboards
```

---

## 10.7 The "Rightful Role" Framework

Use this to assign each platform its natural role in a multi-platform architecture:

```
┌─────────────────────────────────────────────────────────────┐
│              PLATFORM RIGHTFUL ROLES                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ INGEST & STREAM         │  AWS Kinesis / MSK         │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ STORE (LAKE)             │  AWS S3 (Open, any engine) │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ TRANSFORM & ENRICH       │  Databricks Delta Lake     │   │
│  │                          │  (Complex, Python/Spark)   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ TRAIN MODELS             │  Databricks Mosaic AI      │   │
│  │                          │  (or AWS SageMaker)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SERVE & SHARE            │  Snowflake                 │   │
│  │                          │  (SQL, BI, data sharing)   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

This pattern — **Kinesis/MSK → S3 → Databricks → Snowflake** — is arguably the most common "best-of-breed" architecture in large enterprises today, combining the streaming depth of AWS, the processing power of Databricks, and the serving elegance of Snowflake.
