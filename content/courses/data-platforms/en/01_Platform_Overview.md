---
title: "Platform Overview & Philosophy"
description: "Compare the origins, design philosophies, and market positioning of AWS, Snowflake, and Databricks to understand their trade-offs and natural roles in hybrid architectures."
order: 1
difficulty: advanced
duration: "45 min"
---

# Platform Overview & Philosophy

> **Bottom Line:** AWS is a comprehensive ecosystem of composable services, Snowflake is an opinionated SQL warehouse optimised for ease and sharing, and Databricks is a unified lakehouse for data engineers and ML practitioners. Understanding their *origins* is key to understanding their trade-offs.

---

## 1.1 Origins & Design Philosophies

### AWS Data Services

AWS does not have a single "data platform." It is an **ecosystem of purpose-built, composable services** that you assemble into a data architecture. This is both its greatest strength (flexibility, best-of-breed choices) and its most significant challenge (operational complexity, integration burden).

**Core Philosophy:** *"Build what you need from primitive services. You control everything."*

| Service | Purpose | Launch Year |
|---------|---------|-------------|
| Amazon S3 | Durable object storage (the universal data lake) | 2006 |
| Amazon Redshift | Cloud-native MPP data warehouse | 2012 |
| AWS Glue | Serverless ETL and Data Catalog | 2017 |
| Amazon Athena | Serverless SQL over S3 | 2016 |
| Amazon EMR | Managed Hadoop/Spark clusters | 2009 |
| AWS Lake Formation | Fine-grained data lake governance | 2019 |
| Amazon Kinesis | Real-time data streaming | 2013 |
| Amazon Bedrock | Foundation models as a service | 2023 |

**Key Implication:** An AWS data solution is typically an *architecture pattern*, not a product. Expect to wire 5-10 services together using IAM, VPCs, Glue Catalog, and custom orchestration.

---

### Snowflake

Snowflake was founded in 2012 by former Oracle engineers with a singular vision: rebuild the data warehouse from scratch, *natively* for the cloud, with a clean separation of storage and compute.

**Core Philosophy:** *"Make SQL analytics accessible to everyone, manage nothing yourself."*

Key architectural decisions that define Snowflake:
- **Multi-cluster Shared Data Architecture:** All compute nodes share a single, centrally managed storage layer (not HDFS or local disks).
- **The Cloud Services Layer:** A globally distributed, always-on layer handling query optimisation, metadata, authentication, and transaction management — a single control plane for everything.
- **Time Travel & Zero-Copy Cloning:** First-class features, not afterthoughts, enabling instant snapshots and data sharing without data movement.

**Key Implication:** Snowflake is deliberately opinionated. You cannot (easily) run arbitrary Python, tune buffer pool sizes, or control the physical execution plan. That's the point — operational simplicity at the cost of deep configurability.

---

### Databricks

Databricks was founded in 2013 by the original creators of Apache Spark at UC Berkeley. It started as a managed Spark service and has evolved into a unified **Lakehouse Platform**, seeking to converge data warehousing, data engineering, and ML into one runtime.

**Core Philosophy:** *"The data warehouse and the data lake are better together. Code-first, governed, open."*

Key architectural bets:
- **Delta Lake:** An open-source, ACID-compliant storage layer on top of Parquet files — bringing warehouse reliability to the data lake.
- **Unity Catalog:** A single governance layer spanning tables, files, ML models, dashboards, and notebooks.
- **Mosaic AI:** The end-to-end ML/AI stack from data prep to model serving, integrated into the same platform.
- **Openness:** Delta Lake is open source (Linux Foundation). Databricks avoids proprietary formats where possible, reducing lock-in compared to Snowflake.

**Key Implication:** Databricks rewards engineers and data scientists who think in code. It is dramatically more powerful for ML and complex transformations than Snowflake, but carries more operational overhead.

---

## 1.2 Market Positioning Summary

```
                  ◄─── SQL-First ────────────────── Code-First ───►

   Snowflake ●────────────────────────────────────────────────────────
                                           ●  Databricks
                                                     ●  AWS EMR (raw Spark)

   ◄─── Managed/Opinionated ────────────────────────── DIY/Flexible ───►
```

| Dimension | AWS Data Services | Snowflake | Databricks |
|-----------|-------------------|-----------|------------|
| **Primary Persona** | Cloud Architect / DevOps | SQL Analyst / Data Engineer | Data Engineer / ML Engineer |
| **Design Principle** | Composable primitives | Opinionated SaaS | Unified lakehouse |
| **Data Format** | Open (Parquet, ORC, CSV) | Proprietary internal + external tables | Open (Delta/Parquet) |
| **Execution Model** | Multiple (Spark, MPP, serverless) | Proprietary MPP engine | Apache Spark + Photon |
| **Control Plane** | AWS IAM + multiple service consoles | Single Snowflake UI / SQL | Databricks workspace + Unity Catalog |
| **Minimum Viable Architecture** | High complexity (many services) | Very low (one product) | Medium complexity |
| **Lock-in Risk** | Medium (IAM, proprietary formats vary) | High (proprietary storage format) | Low-Medium (Delta is open source) |

---

## 1.3 The Honest Trade-Off Triangle

Every platform makes trade-offs across three axes. You can optimise for two, but not all three simultaneously:

```
                        ⚡ Performance
                           /\
                          /  \
                         /    \
                        /      \
                       /        \
                      /──────────\
              🧩 Flexibility   🎯 Simplicity
```

| Platform | Optimises For | Trades Away |
|----------|--------------|-------------|
| **AWS** | Flexibility + Performance | Simplicity |
| **Snowflake** | Simplicity + Performance (SQL) | Flexibility |
| **Databricks** | Performance + Flexibility | Some Simplicity |

---

## 1.4 When Each Platform Wins by Default

### Choose AWS Data Services When:
- You are already deeply invested in the AWS ecosystem (IAM, VPC, networking, Lambda).
- Your workload spans many different compute paradigms (streaming, batch, ad-hoc, graph, ML).
- Your team has strong DevOps and cloud engineering capability.
- You need fine-grained control over compute, networking, and cost at each layer.
- Regulatory requirements mandate specific infrastructure configuration (e.g., FedRAMP GovCloud).

### Choose Snowflake When:
- Your primary consumers are SQL analysts, BI tools, and business users.
- You need frictionless, cross-cloud, and cross-organisation data sharing.
- You want to minimise infrastructure management overhead dramatically.
- Your workload is dominated by concurrent ad-hoc queries and dashboards.
- You need to stand up a production data warehouse in days, not months.

### Choose Databricks When:
- Your team is Python/Scala-native and builds complex data pipelines.
- ML model training, feature engineering, and MLOps are first-class concerns.
- You need the cost economics of open object storage with warehouse reliability (Delta Lake).
- You are building a streaming + batch unified pipeline (e.g., Structured Streaming).
- Open standards and avoiding format lock-in is a strategic priority.

---

## 1.5 The Hybrid Reality

In practice, large enterprises run **multiple platforms simultaneously**:

```
Common Pattern: Databricks (transformation/ML) → Snowflake (serving/BI) → AWS (infrastructure)

                ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
  Raw Data ──►  │  S3 / ADLS  │──► │  Databricks  │──► │    Snowflake     │──► BI Tools
                │  (Storage)  │    │  (Process)   │    │  (Serve/Share)   │
                └─────────────┘    └──────────────┘    └──────────────────┘
                      AWS                                       SaaS
```

Understanding each platform's *natural role* in a hybrid architecture is as important as understanding each platform in isolation.
