# Multi-Cloud Data Platform Comparative Documentation
## AWS · Snowflake · Databricks

> **Scope:** This documentation series provides an authoritative, architecture-first comparison of the three dominant enterprise data platforms: **AWS Data Services**, **Snowflake**, and **Databricks**. Each file is self-contained but cross-referenced for deep dives.

---

## Document Index

| # | File | Topics Covered |
|---|------|----------------|
| 01 | [Platform Overview & Philosophy](./01_Platform_Overview.md) | Origins, design philosophies, market positioning |
| 02 | [Core Architecture Deep Dive](./02_Core_Architecture.md) | Storage/compute separation, scaling models, query engines |
| 03 | [Storage & Data Lake](./03_Storage_and_Data_Lake.md) | S3 + Lake Formation, Snowflake Storage, Delta Lake |
| 04 | [Compute & Processing](./04_Compute_and_Processing.md) | Redshift, Virtual Warehouses, Spark/Photon |
| 05 | [Data Ingestion & Integration](./05_Data_Ingestion.md) | Kinesis/MSK, Snowpipe, Auto Loader, ETL tooling |
| 06 | [Governance, Security & Compliance](./06_Governance_and_Security.md) | Lake Formation, RBAC/ABAC, Unity Catalog |
| 07 | [AI & Machine Learning Capabilities](./07_AI_and_ML.md) | Bedrock, Cortex, Mosaic AI, MLflow |
| 08 | [Data Sharing & Collaboration](./08_Data_Sharing.md) | Clean Rooms, Marketplace, Delta Sharing |
| 09 | [Cost Structure & Optimization](./09_Cost_Structure.md) | Credits, DBUs, pay-per-query, cost gotchas |
| 10 | [Use Case Decision Framework](./10_Decision_Framework.md) | Scenario-based platform selection guide |
| 11 | [Migration Strategies](./11_Migration_Strategies.md) | Lift-and-shift, re-platforming, hybrid patterns |
| 12 | [Reference Architecture Patterns](./12_Reference_Architectures.md) | Medallion, Lambda, Kappa, real-time patterns |

---

## How to Use This Documentation

```
Quick platform selection? → Start at 10_Decision_Framework.md
Evaluating architecture?  → Start at 02_Core_Architecture.md
Planning a migration?     → Start at 11_Migration_Strategies.md
Comparing costs?          → Start at 09_Cost_Structure.md
```

---

## Versioning & Accuracy

| Attribute | Detail |
|-----------|--------|
| **Last Updated** | June 2025 |
| **AWS Services Covered** | S3, Glue, Redshift, Athena, EMR, Lake Formation, Bedrock, Kinesis, MSK, AppFlow |
| **Snowflake Version** | Generally Available features as of Snowflake 8.x |
| **Databricks Runtime** | DBR 14.x / Unity Catalog GA |
| **Features in Preview** | Labeled `[Preview]` throughout |

> ⚠️ **Disclaimer:** Cloud services evolve rapidly. Pricing figures used are illustrative. Always consult official vendor documentation and a FinOps specialist for production cost planning.

---

## Conventions Used

| Symbol | Meaning |
|--------|---------|
| ✅ | Native, fully managed capability |
| ⚡ | Best-in-class for this dimension |
| ⚠️ | Requires significant configuration or has notable caveats |
| 🔧 | Requires third-party tooling or custom engineering |
| 🔬 | Feature in Public/Private Preview |
| 💰 | Significant cost driver — read carefully |
