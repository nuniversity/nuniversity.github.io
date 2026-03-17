---
title: "Domain 1.3 — Data Sharing and the Snowflake Marketplace"
description: "Learn how Snowflake enables live data sharing without data movement, the Snowflake Data Marketplace, data clean rooms, and collaboration features."
order: 3
difficulty: intermediate
duration: "50 min"
---

# Domain 1.3 — Data Sharing and the Snowflake Marketplace

> [!NOTE]
> This lesson maps to **Exam Objective 1.3**: *Outline the Snowflake data sharing capabilities and the Snowflake Marketplace.*

---

## Why Data Sharing Matters

Traditional data sharing requires:

1. Exporting data to files (CSV, Parquet)
2. Transferring files via SFTP, email, or object storage
3. The recipient imports data into their own system
4. Data is now a **stale copy** — it goes out of date

Snowflake's approach eliminates all of this. Data is **never copied or moved**. The recipient queries the provider's live data directly.

---

## 1. Secure Data Sharing

**Secure Data Sharing** allows a Snowflake account (the **provider**) to grant another Snowflake account (the **consumer**) read-only access to specific databases, schemas, tables, views, or UDFs — **without any data leaving the provider's account**.

### How It Works

```
Provider Account (US-EAST-1)          Consumer Account (US-EAST-1)
──────────────────────────────         ──────────────────────────
  PROD_DB.PUBLIC.ORDERS               ← READ-ONLY access via share
      │                                         │
      │  No data copied                         │
      └─────────────────────────────────────────┘
           Live read through micro-partitions
```

- The data **stays physically in the provider's storage**
- The consumer reads from the **same micro-partitions** — always live and up-to-date
- The consumer's virtual warehouse is used for compute — the provider pays nothing for consumer queries

### Creating a Share (Provider Side)

```sql
-- 1. Create a share object
CREATE SHARE SALES_SHARE;

-- 2. Grant privileges on objects to the share
GRANT USAGE ON DATABASE PROD_DB TO SHARE SALES_SHARE;
GRANT USAGE ON SCHEMA PROD_DB.PUBLIC TO SHARE SALES_SHARE;
GRANT SELECT ON TABLE PROD_DB.PUBLIC.ORDERS TO SHARE SALES_SHARE;

-- 3. Add a consumer account to the share
ALTER SHARE SALES_SHARE ADD ACCOUNTS = CONSUMER_ACCOUNT_ID;
```

### Consuming a Share (Consumer Side)

```sql
-- Create a database from the inbound share
CREATE DATABASE SHARED_SALES FROM SHARE PROVIDER_ACCOUNT.SALES_SHARE;

-- Query it like any other database
SELECT * FROM SHARED_SALES.PUBLIC.ORDERS;
```

### What Can Be Shared

| Object | Shareable |
|---|---|
| Tables | ✅ |
| External tables | ✅ |
| Secure views | ✅ |
| Secure materialized views | ✅ |
| Secure UDFs | ✅ |
| Internal stages | ❌ |
| Stored procedures | ❌ |

> [!WARNING]
> Only **secure views** can be shared (not regular views). Secure views hide the view definition from the consumer, protecting proprietary business logic.

### Key Constraints

- Both provider and consumer must be on the **same cloud provider and region** (for direct sharing)
  - Cross-region sharing requires **replication** first
- The consumer needs a **Snowflake account** (free Reader Accounts available for non-Snowflake customers)
- A share can be granted to **multiple consumer accounts**

---

## 2. Reader Accounts

A **Reader Account** is a free, lightweight Snowflake account created by the provider for consumers who **do not have their own Snowflake account**.

```sql
-- Provider creates a Reader Account for a partner
CREATE MANAGED ACCOUNT PARTNER_READER_ACCOUNT
  ADMIN_NAME = 'partner_admin'
  ADMIN_PASSWORD = 'SecurePass123!'
  TYPE = READER;
```

- Reader accounts are **managed and paid for by the provider**
- The reader account can only access data shared by the creating provider — not create its own objects at scale
- Compute used in the reader account is billed to the **provider**
- Limited to reading shared data only — cannot create their own warehouses or databases independently

---

## 3. Data Exchange

A **Private Data Exchange** is a Snowflake-hosted hub where organizations can share data privately with a **defined group of partners**.

- The exchange owner controls which accounts can participate
- Participants can publish and subscribe to data listings
- Useful for industry consortiums, franchises, or multi-subsidiary enterprises

```
                   Private Data Exchange
                   ┌────────────────────┐
                   │                    │
  Publisher A ────▶│ Listing A (Sales)  │◀──── Consumer 1
  Publisher B ────▶│ Listing B (Leads)  │◀──── Consumer 2
  Publisher C ────▶│ Listing C (Geos)   │◀──── Consumer 3
                   │                    │
                   └────────────────────┘
```

---

## 4. Snowflake Marketplace

The **Snowflake Marketplace** (formerly the Data Marketplace) is a **public exchange** where data providers publish data products that any Snowflake customer can discover and access.

### Types of Listings

| Type | Description |
|---|---|
| **Free** | Instantly available at no cost — e.g., COVID-19 data, weather data |
| **Paid** | Requires purchase or contact with provider |
| **Personalized** | Provider curates a custom dataset for your account |

### How to Get Data from the Marketplace

1. Open **Snowsight → Data → Marketplace**
2. Search or browse by category (Finance, Health, Marketing, etc.)
3. Click **Get** on a free listing
4. Choose a database name and assign it to a role
5. Query the data immediately — no download, no ETL

```sql
-- After getting a listing, query it directly
SELECT * FROM WEATHER_DATA.PUBLIC.DAILY_TEMPERATURE
WHERE CITY = 'Sydney'
  AND DATE >= DATEADD('day', -30, CURRENT_DATE());
```

### Popular Marketplace Categories

- **Financial & Economic Data** (stock prices, forex, macroeconomic indicators)
- **Weather & Environmental** (historical weather, climate data)
- **Geospatial & Demographic** (census data, ZIP code data, coordinates)
- **Healthcare & Life Sciences** (clinical trial data, public health datasets)
- **Marketing & Advertising** (audience segments, digital attribution)
- **B2B** (company firmographics, technographics)

> [!NOTE]
> Marketplace data is **live** — just like shares between accounts. When the provider updates the data, consumers see the update immediately. There is no data movement.

---

## 5. Data Clean Rooms

A **Data Clean Room** allows two parties to **collaborate on combined datasets without either party seeing the other's raw data**.

### Use Case Example

- **Company A** (retailer) has transaction data
- **Company B** (advertiser) has ad exposure data
- They want to measure advertising effectiveness (did customers who saw the ad actually buy?)
- Neither party is willing to share their raw customer data

Snowflake's clean room solution uses **secure views and differential privacy** to allow aggregate analysis while keeping individual records private.

```
Company A (Retailer)            Company B (Advertiser)
──────────────────────          ──────────────────────
Customer purchases              Ad impression data
       │                                │
       └────────────┬───────────────────┘
                    │
              Clean Room
              (Secure View / Policy)
                    │
              Only aggregated,
              privacy-safe results
              visible to both parties
```

---

## 6. Collaboration Features Summary

| Feature | Use Case | Data Moved? |
|---|---|---|
| **Secure Data Sharing** | Share live data between Snowflake accounts | ❌ No |
| **Reader Account** | Share with non-Snowflake consumers | ❌ No |
| **Private Data Exchange** | Internal org or partner network sharing | ❌ No |
| **Snowflake Marketplace** | Publish/consume third-party data commercially | ❌ No |
| **Data Clean Room** | Collaborative analysis without exposing raw data | ❌ No |
| **Database Replication** | Copy data to a different region/cloud | ✅ Yes (to replica) |

> [!WARNING]
> A critical exam point: **cross-region and cross-cloud data sharing requires replication**. Secure Data Sharing directly (without replication) only works when provider and consumer are on the **same cloud + region**.

---

## 7. Replication and Failover

**Database Replication** creates a synchronized copy of a Snowflake database in another region or cloud. This enables:

- **Cross-region data sharing** (replicate first, then share from the replica)
- **Disaster recovery** (failover to another region)
- **Cross-Cloud Business Continuity (CCBC)**

```sql
-- Enable replication on a database
ALTER DATABASE PROD_DB ENABLE REPLICATION TO ACCOUNTS AWS_US_WEST_2.SECONDARY_ACCOUNT;

-- On the secondary account, create a replica
CREATE DATABASE PROD_DB_REPLICA
  AS REPLICA OF PRIMARY_ACCOUNT.AWS_US_EAST_1.PROD_DB;

-- Refresh the replica (sync changes from primary)
ALTER DATABASE PROD_DB_REPLICA REFRESH;
```

### Failover Groups

A **Failover Group** is a set of Snowflake objects (databases, shares, roles, warehouses) that can be failed over together to a secondary account:

```sql
-- Create a failover group
CREATE FAILOVER GROUP FG_PROD
  OBJECT_TYPES = DATABASES, SHARES
  ALLOWED_DATABASES = PROD_DB
  ALLOWED_ACCOUNTS = AWS_US_WEST_2.DR_ACCOUNT;

-- Initiate failover (on the secondary)
ALTER FAILOVER GROUP FG_PROD PRIMARY;
```

---

## Practice Questions

**Q1.** When data is shared using Snowflake Secure Data Sharing, where does the data physically reside?

- A) In both the provider and consumer accounts  
- B) In the consumer's account after copying  
- C) In the provider's account only ✅  
- D) In a Snowflake-managed shared storage layer

**Q2.** A company wants to share data with a business partner who does not have a Snowflake account. What is the correct approach?

- A) Export the data to S3 and give the partner access  
- B) Create a Reader Account for the partner ✅  
- C) Create a Private Data Exchange  
- D) Use database replication

**Q3.** Which of the following objects CANNOT be directly included in a Snowflake share?

- A) Secure views  
- B) External tables  
- C) Regular (non-secure) views ✅  
- D) Secure UDFs

**Q4.** A retailer on AWS US-East-1 wants to share data with a consumer on AWS US-West-2. What must they do first?

- A) Create a Reader Account  
- B) Use a Private Data Exchange  
- C) Replicate the database to US-West-2 ✅  
- D) Nothing — cross-region sharing is automatic

**Q5.** How is Snowflake Marketplace data delivered to the consumer?

- A) Downloaded as Parquet files  
- B) Replicated to the consumer's account nightly  
- C) Accessed via live secure data sharing — no data movement ✅  
- D) Transferred via the Kafka Connector

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**  
> 1. Data sharing = **no data movement** — consumer reads provider's live micro-partitions  
> 2. Only **secure views** can be shared (not regular views)  
> 3. **Reader Accounts** are for consumers without a Snowflake account — billed to the provider  
> 4. Cross-region/cross-cloud sharing **requires replication first**  
> 5. Marketplace data is also delivered via live sharing — no ETL required
