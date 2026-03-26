---
title: "Core Architecture Deep Dive"
description: "Dive deep into the architectural differences between AWS's service mesh, Snowflake's three-layer model, and Databricks' Lakehouse to see how each implements storage and compute separation."
order: 2
difficulty: advanced
duration: "60 min"
---

# Core Architecture Deep Dive

> **Bottom Line:** All three platforms embrace storage/compute separation, but the *implementation* of that separation — and what sits in between — defines their entire character. Snowflake's Cloud Services layer, Databricks' Delta Lake + Photon stack, and AWS's disaggregated service mesh are fundamentally different solutions to the same distributed systems problems.

---

## 2.1 The Universal Starting Point: Storage/Compute Separation

Before cloud data warehouses, compute and storage were co-located on the same physical servers (think: traditional MPP appliances like Teradata or Netezza). Cloud-native platforms broke this coupling. The principle:

```
 Traditional MPP (On-Prem):               Cloud-Native (All Three):
 ┌──────────────────────────┐             ┌──────────────────────────┐
 │  Node 1: CPU + Local SSD │             │       Compute Layer       │
 │  Node 2: CPU + Local SSD │             │  (Scales independently)  │
 │  Node 3: CPU + Local SSD │             └────────────┬─────────────┘
 └──────────────────────────┘                          │ High-speed network
 Storage CANNOT scale without compute.   ┌────────────▼─────────────┐
                                         │       Storage Layer       │
                                         │  (S3 / GCS / ADLS Gen2)  │
                                         └──────────────────────────┘
                                         Storage scales independently.
```

The *critical difference* between the three platforms is what happens in between.

---

## 2.2 AWS Architecture: The Service Mesh Model

AWS provides storage (S3) and then offers a **menu of compute engines** that query it. There is no single "AWS data platform architecture" — you compose one.

### The Typical AWS Data Lake Architecture

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                         Data Sources                             │
 │  (RDS, DynamoDB, SaaS Apps, IoT, Clickstreams)                  │
 └──────────────────────────┬───────────────────────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │       Ingestion Layer       │
              │  Kinesis / MSK / AppFlow /  │
              │  AWS DMS / S3 Transfer      │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │     S3 Data Lake            │
              │  ┌──────┐ ┌──────┐ ┌──────┐│
              │  │ Raw  │ │ Cur- │ │ Agg  ││
              │  │(Land)│ │ated  │ │(Gold)││  ← Medallion zones (optional)
              │  └──────┘ └──────┘ └──────┘│
              └─────────────┬──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼──────┐    ┌───────▼──────┐    ┌───────▼──────┐
  │ AWS Glue   │    │  Amazon EMR   │    │   Redshift   │
  │ (ETL/ELT)  │    │  (Spark/Hive) │    │   Spectrum   │
  └─────┬──────┘    └───────┬───────┘    └───────┬──────┘
        │                   │                    │
  ┌─────▼──────────────────────────────────────▼──────┐
  │              AWS Glue Data Catalog                  │
  │         (Hive Metastore compatible)                 │
  └────────────────────────────────────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │      Serving Layer          │
              │  Athena / Redshift /        │
              │  QuickSight / SageMaker     │
              └────────────────────────────┘
              │
  ┌───────────▼──────────────┐
  │   AWS Lake Formation      │
  │  (Governance & Security)  │
  └──────────────────────────┘
```

### AWS Key Architectural Entities

| Component | Role | Scaling Model |
|-----------|------|--------------|
| **Amazon S3** | Universal storage layer | Infinite, automatic |
| **AWS Glue Catalog** | Metadata and schema registry | Managed, serverless |
| **AWS Glue ETL** | Serverless Spark ETL jobs | Job-level auto-scaling |
| **Amazon EMR** | Long-running Spark/Hive clusters | Cluster auto-scaling (EC2/EKS) |
| **Amazon Redshift** | MPP SQL data warehouse | Provisioned nodes OR serverless RPUs |
| **Amazon Athena** | Serverless ad-hoc SQL on S3 | Pay-per-query, fully automatic |
| **AWS Lake Formation** | Governance layer | Tag-based, across services |

**⚠️ Gotcha:** The Glue Catalog, Redshift, and EMR all have slightly different security models and may require explicit Lake Formation grants to interoperate. Integration is not automatic.

---

## 2.3 Snowflake Architecture: The Three-Layer Model

Snowflake's architecture is its most distinctive feature and the source of almost all of its advantages in simplicity and concurrency.

```
 ┌──────────────────────────────────────────────────────────────┐
 │                   CLOUD SERVICES LAYER                        │
 │                                                               │
 │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐   │
 │  │   Query      │ │ Transaction  │ │  Security &        │   │
 │  │ Optimizer    │ │  Manager     │ │  Authentication    │   │
 │  └──────────────┘ └──────────────┘ └────────────────────┘   │
 │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐   │
 │  │  Metadata    │ │  Result      │ │  Infrastructure    │   │
 │  │  Manager     │ │  Cache       │ │  Manager           │   │
 │  └──────────────┘ └──────────────┘ └────────────────────┘   │
 └──────────────────────────┬───────────────────────────────────┘
                            │  (Always on, shared, no user cost)
 ┌──────────────────────────▼───────────────────────────────────┐
 │                   COMPUTE LAYER (Virtual Warehouses)          │
 │                                                               │
 │  ┌──────────────────┐  ┌──────────────────┐                  │
 │  │  VW: ANALYTICS   │  │  VW: LOADING     │   ← Independent  │
 │  │  (XL, Auto-susp) │  │  (M, always-on)  │   scaling per    │
 │  └──────────────────┘  └──────────────────┘   workload       │
 │  ┌──────────────────┐  ┌──────────────────┐                  │
 │  │  VW: ML_FEATURE  │  │  VW: FINANCE     │                  │
 │  │  (Snowpark)      │  │  (Multi-cluster) │                  │
 │  └──────────────────┘  └──────────────────┘                  │
 └──────────────────────────┬───────────────────────────────────┘
                            │  (All VWs read from the same storage)
 ┌──────────────────────────▼───────────────────────────────────┐
 │                   STORAGE LAYER                               │
 │                                                               │
 │   Internally managed columnar format (FDN)                    │
 │   Hosted on S3 / GCS / Azure Blob (customer-transparent)     │
 │   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │
 │   │Micro-  │  │Micro-  │  │Micro-  │  │Micro-  │            │
 │   │partition│  │partition│  │partition│  │partition│           │
 │   └────────┘  └────────┘  └────────┘  └────────┘            │
 │   (Immutable, compressed, columnar blocks — ~16MB each)       │
 └──────────────────────────────────────────────────────────────┘
```

### Snowflake's Secret Weapon: Micro-Partitioning

Snowflake automatically divides data into **micro-partitions** of 50–500MB (uncompressed), storing them in a proprietary columnar format. Critically:
- **Automatic clustering metadata** is maintained, enabling partition pruning without manual index management.
- **Immutability** means DML operations create new micro-partitions; Time Travel accesses old ones.
- **Result cache** at the Cloud Services layer means identical queries re-execute for free (within 24 hours).

```sql
-- This is Snowflake's caching hierarchy:
-- 1. Result Cache (Cloud Services Layer) — instant, 24hr TTL
-- 2. Remote Disk Cache (per Virtual Warehouse local SSD) — warm queries
-- 3. Full S3 read — cold queries (still fast due to micro-partition pruning)

SELECT region, SUM(revenue)
FROM sales
WHERE sale_date BETWEEN '2024-01-01' AND '2024-03-31'
GROUP BY region;
-- Second run of this exact query: ~0ms (result cache hit)
```

---

## 2.4 Databricks Architecture: The Lakehouse Model

Databricks' architecture is built on the conviction that Delta Lake can make object storage behave like a reliable warehouse, collapsing the traditional two-tier (lake + warehouse) architecture.

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                     UNITY CATALOG (Control Plane)                │
 │                                                                   │
 │   Metastore → Catalogs → Schemas → Tables/Views/Functions        │
 │   Covers: Tables, Files, ML Models, Dashboards, Notebooks        │
 └────────────────────────────┬──────────────────────────────────────┘
                              │
 ┌────────────────────────────▼──────────────────────────────────────┐
 │                     DATABRICKS WORKSPACE (Data Plane)             │
 │                                                                   │
 │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
 │  │ SQL Warehouses  │  │ All-Purpose       │  │ Job Clusters    │ │
 │  │ (Serverless /   │  │ Clusters          │  │ (Automated      │ │
 │  │  Classic)       │  │ (Interactive)     │  │  Pipelines)     │ │
 │  └────────┬────────┘  └────────┬──────────┘  └────────┬────────┘ │
 │           │                   │                        │          │
 │  ┌────────▼───────────────────▼────────────────────────▼────────┐│
 │  │                 PHOTON ENGINE (C++ Vectorized)                ││
 │  │         Accelerates SQL workloads on Spark clusters           ││
 │  └────────────────────────────┬──────────────────────────────────┘│
 │                               │                                   │
 │  ┌────────────────────────────▼──────────────────────────────────┐│
 │  │                      DELTA LAKE LAYER                         ││
 │  │                                                               ││
 │  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         ││
 │  │   │  Bronze     │  │  Silver     │  │  Gold       │         ││
 │  │   │  (Raw)      │  │  (Cleaned)  │  │  (Aggregated│         ││
 │  │   └─────────────┘  └─────────────┘  └─────────────┘         ││
 │  │                                                               ││
 │  │   Delta Log (_delta_log/) — Transaction log (JSON)           ││
 │  │   Parquet Data Files — Actual column data                    ││
 │  └────────────────────────────┬──────────────────────────────────┘│
 └────────────────────────────────────────────────────────────────────┘
                                 │
 ┌───────────────────────────────▼──────────────────────────────────┐
 │         OBJECT STORAGE (Customer-Managed)                         │
 │         S3 / ADLS Gen2 / GCS — Open Parquet format               │
 └──────────────────────────────────────────────────────────────────┘
```

### The Delta Log: How Lakehouse Reliability Works

The Delta Log is a transaction journal stored as JSON files alongside the Parquet data. Every write, delete, or schema change appends an entry. This is what makes Delta Lake ACID-compliant on eventually-consistent object storage:

```
s3://my-bucket/delta-table/
├── _delta_log/
│   ├── 00000000000000000000.json   ← Initial table creation
│   ├── 00000000000000000001.json   ← First INSERT
│   ├── 00000000000000000002.json   ← UPDATE (marks old files as removed)
│   ├── 00000000000000000010.checkpoint.parquet ← Checkpoint (every N commits)
│   └── _last_checkpoint             ← Points to latest checkpoint
├── part-00001-abc.snappy.parquet
├── part-00002-def.snappy.parquet
└── part-00003-ghi.snappy.parquet   ← New file from UPDATE
```

---

## 2.5 Scaling Model Comparison

### Scaling Axes

| Platform | Scale-Out (More Nodes) | Scale-Up (Bigger Nodes) | Concurrency Scaling |
|----------|----------------------|------------------------|---------------------|
| **AWS Redshift Serverless** | Automatic (RPUs) | Automatic (RPUs) | Manual via WLM config |
| **AWS Redshift Provisioned** | Manual node addition | Manual node type change | Manual workload groups |
| **AWS EMR** | Auto Scaling (EC2) | Instance type selection | Queue-based (YARN) |
| **AWS Athena** | Fully managed | N/A (serverless) | Per-query parallelism |
| **Snowflake** | Multi-cluster VW (automatic) | VW T-shirt size | ⚡ Automatic, seamless |
| **Databricks SQL Warehouse** | Auto-scale worker nodes | Driver/worker instance type | Queue-based |
| **Databricks All-Purpose** | Manual or auto-scale | Instance type / DBU | Per-cluster isolation |

### Snowflake's Multi-Cluster Concurrency Model

This is Snowflake's most powerful concurrency feature and is often misunderstood:

```sql
-- Standard Virtual Warehouse: 1 cluster handles all queries sequentially (or limited parallel)
-- Multi-cluster Virtual Warehouse: Snowflake SPINS UP NEW CLUSTERS automatically when queued

CREATE WAREHOUSE analytics_wh
  WAREHOUSE_SIZE = 'LARGE'
  MIN_CLUSTER_COUNT = 1      -- Starts with 1 cluster
  MAX_CLUSTER_COUNT = 5      -- Can scale to 5 identical clusters under load
  SCALING_POLICY = 'STANDARD'; -- 'ECONOMY' waits longer before scaling out
```

This means 500 concurrent BI users can all get sub-second responses without any manual tuning — each cluster independently serves a subset of queries. The cost: you pay for all active clusters simultaneously. 💰

---

## 2.6 Query Execution Architecture

### How a Query Executes: Platform Internals

```
AWS Redshift (Provisioned):
 User Query → Leader Node (query planning) → Compute Nodes (parallel execution)
              ↓ Result Cache check ↓ Compile to C++ machine code
              ↓ Distribute slices to nodes ↓ Reduce to leader ↓ Return

Snowflake:
 User Query → Cloud Services (parse, plan, optimize, result cache check)
            → Virtual Warehouse (local disk cache check, read from S3 if miss)
            → MPP execution within VW nodes
            → Result returned AND cached

Databricks (Photon):
 User Query → Spark SQL parser → Catalyst Optimizer (logical + physical plan)
            → Photon Engine (if SQL/DataFrame) or JVM Spark (complex UDFs)
            → Distributed execution across worker nodes
            → Result cache (Delta caching on worker local SSDs)
```

### Query Optimizer Comparison

| Feature | AWS Redshift | Snowflake | Databricks |
|---------|-------------|-----------|------------|
| **Optimizer Type** | Cost-based | Cost-based + ML-assisted | Catalyst (cost-based) |
| **Statistics** | Manual `ANALYZE` or auto | Fully automatic | Automatic (with delta stats) |
| **Join Reordering** | Yes | Yes | Yes (Adaptive Query Execution) |
| **Adaptive Execution** | Limited | Yes (automatic) | ⚡ Yes (Spark AQE — runtime plan changes) |
| **User Hints** | Limited | Yes (`/*+ ... */`) | Yes (Spark hints) |
| **Result Caching** | Yes (result cache node) | ⚡ Yes (24hr, Cloud Services) | Yes (Delta cache, local SSD) |

---

## 2.7 Storage Format Deep Dive

| Attribute | AWS (S3 + Glue) | Snowflake | Databricks (Delta Lake) |
|-----------|-----------------|-----------|-------------------------|
| **Internal Format** | Parquet / ORC / Iceberg | Proprietary FDN columnar | Apache Parquet |
| **External Table Support** | Yes (Athena, Spectrum) | Yes (S3, ADLS, GCS) | Yes (any object storage) |
| **ACID Transactions** | Via Iceberg / LF Governed | ✅ Native (micro-partition immutability) | ✅ Native (Delta Log) |
| **Time Travel** | Via S3 Versioning (expensive) | ✅ 0–90 days (Fail-safe + Time Travel) | ✅ 30 days default (configurable) |
| **Schema Evolution** | Manual Glue Catalog update | ✅ Automatic with EVOLVE_SCHEMA | ✅ MERGE schema evolution |
| **Partition Strategy** | Manual (Hive-style) | Automatic (micro-partitions) | Manual + OPTIMIZE + ZORDER |
| **Compaction** | Manual (Glue job or EMR) | Automatic (transparent) | ✅ `OPTIMIZE` command + Auto Optimize |
| **Open Format** | ✅ Yes | ❌ No (proprietary; External Tables use open formats) | ✅ Yes (Parquet + open Delta spec) |

---

## 2.8 The Data Plane vs. Control Plane Distinction (Databricks)

Databricks has a unique security model worth understanding deeply:

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROL PLANE (Databricks-managed)        │
│                                                              │
│  Workspace UI, Notebooks, Job Scheduler, Unity Catalog       │
│  APIs, Cluster Manager, MLflow Tracking Server               │
│  (Hosted on Databricks' cloud account)                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Encrypted channels only
┌──────────────────────────────▼──────────────────────────────┐
│                    DATA PLANE (Customer-managed)              │
│                                                              │
│  Actual Spark Clusters (EC2/AKS/GCE VMs in YOUR VPC)        │
│  S3 / ADLS / GCS (YOUR storage accounts)                    │
│  Delta Lake tables (YOUR data, YOUR encryption keys)         │
│  (Customer controls IAM, network, KMS keys)                  │
└─────────────────────────────────────────────────────────────┘
```

This separation means customer data **never leaves the customer's cloud account**, addressing a common enterprise security concern. Snowflake's model is different — the storage layer is managed by Snowflake on their cloud tenant (though customers can use Snowflake on their own cloud account with **Snowflake on AWS PrivateLink** or **Bring Your Own Storage** patterns).
