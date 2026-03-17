---
title: "Domain 1.2 — Snowflake Tools and User Interfaces"
description: "Explore Snowsight, SnowSQL, Snowflake Connectors, Drivers, Snowpark, and SnowCD — the tools you will use to interact with Snowflake."
order: 2
difficulty: intermediate
duration: "45 min"
---

# Domain 1.2 — Snowflake Tools and User Interfaces

> [!NOTE]
> This lesson maps to **Exam Objective 1.2**: *Outline the tools and user interfaces of Snowflake.*

---

## Overview of Snowflake Tools

Snowflake provides a rich set of tools to interact with the platform, from a browser-based UI to programmatic SDKs for data engineers and application developers.

```
┌─────────────────────────────────────────────────────────────┐
│                    HOW USERS INTERACT                       │
│                                                             │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │  Snowsight  │  │ SnowSQL  │  │  Connectors & Drivers  │ │
│  │  (Web UI)   │  │  (CLI)   │  │  (JDBC, ODBC, Python)  │ │
│  └─────────────┘  └──────────┘  └────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────┐  ┌───────────────────────┐   │
│  │       Snowpark           │  │       SnowCD          │   │
│  │ (Python/Java/Scala API)  │  │  (Connectivity Diag.) │   │
│  └──────────────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Snowsight — Web UI

**Snowsight** is Snowflake's browser-based interface. It replaced the older "Classic Console" and is the primary UI for most users.

### Capabilities

| Feature | Description |
|---|---|
| **Worksheets** | Write and execute SQL queries with syntax highlighting and auto-complete |
| **Dashboards** | Visualize query results with charts and tiles |
| **Data Browser** | Explore databases, schemas, tables, and views |
| **Activity** | Monitor query history, compute usage, and credit consumption |
| **Admin** | Manage users, roles, warehouses, and resource monitors |
| **Marketplace** | Access the Snowflake Data Marketplace |
| **Notebooks** | Interactive Python/SQL notebooks powered by Snowpark |

### Key Snowsight Features for the Exam

- **Worksheet sharing** — share queries and results with teammates
- **Multi-statement execution** — run a full script, not just a single query
- **Query profile** — visual execution plan for diagnosing slow queries
- **Context switching** — easily change role, warehouse, database, and schema

> [!NOTE]
> Snowsight is accessed at `https://<account-identifier>.snowflakecomputing.com`

---

## 2. SnowSQL — Command-Line Interface (CLI)

**SnowSQL** is Snowflake's official CLI tool, used to execute SQL commands and manage data from the terminal.

### Installation

SnowSQL is available for Linux, macOS, and Windows. It's downloadable from the Snowflake web interface or directly via the installer URL.

### Connecting

```bash
# Basic connection
snowsql -a <account> -u <username>

# With warehouse and database
snowsql -a myaccount.us-east-1 -u MYUSER -w COMPUTE_WH -d MYDB

# Using a named connection from ~/.snowsql/config
snowsql -c my_connection
```

### Config File (`~/.snowsql/config`)

```ini
[connections]
accountname = myaccount.us-east-1
username = MYUSER
password = ****
dbname = MYDB
schemaname = PUBLIC
warehousename = COMPUTE_WH
```

### Common SnowSQL Commands

```sql
-- Execute a query
SELECT CURRENT_VERSION();

-- Load data from a local file
PUT file:///tmp/data.csv @%ORDERS;
COPY INTO ORDERS FROM @%ORDERS;

-- Run a SQL script file
!source /path/to/script.sql

-- Exit
!quit
```

### SnowSQL Meta-Commands

| Command | Description |
|---|---|
| `!set variable=value` | Set a SnowSQL variable |
| `!print` | Print a message |
| `!source <file>` | Execute a SQL file |
| `!exit` / `!quit` | Exit the CLI |
| `!help` | Show help |

> [!NOTE]
> For the exam: SnowSQL uses `PUT` and `GET` commands to upload/download files to/from **internal stages**. These commands are **only available in SnowSQL** — not in Snowsight or JDBC/ODBC drivers.

---

## 3. Connectors and Drivers

Snowflake provides native connectors and drivers to integrate with popular programming languages, BI tools, and data platforms.

### Official Drivers

| Driver | Use Case | Protocol |
|---|---|---|
| **JDBC** | Java applications, BI tools (Tableau, Power BI) | SQL |
| **ODBC** | C/C++ applications, Excel, SAS | SQL |
| **Python Connector** | Python scripts, pandas, data pipelines | SQL + Cursor API |
| **Node.js Driver** | JavaScript/TypeScript server apps | SQL |
| **Go Driver** | Go applications | SQL |
| **PHP Driver** | PHP web applications | SQL |
| **.NET Driver** | C# and .NET applications | SQL |

### Python Connector Example

```python
import snowflake.connector

conn = snowflake.connector.connect(
    user='MYUSER',
    password='mypassword',
    account='myaccount.us-east-1',
    warehouse='COMPUTE_WH',
    database='MYDB',
    schema='PUBLIC'
)

cur = conn.cursor()
cur.execute("SELECT current_version()")
print(cur.fetchone())

conn.close()
```

### JDBC Connection String

```
jdbc:snowflake://myaccount.us-east-1.snowflakecomputing.com/?user=MYUSER&password=****&db=MYDB&schema=PUBLIC&warehouse=COMPUTE_WH
```

### Native Ecosystem Connectors

| Connector | Integration |
|---|---|
| **Kafka Connector** | Apache Kafka → Snowflake (Snowpipe-based streaming) |
| **Spark Connector** | Apache Spark ↔ Snowflake read/write |
| **dbt** | ELT transformations (via JDBC/Python) |
| **Fivetran / Airbyte** | Third-party ELT tools |

---

## 4. Snowpark

**Snowpark** is Snowflake's developer framework that allows processing data **inside Snowflake using non-SQL languages**.

### Supported Languages

| Language | Notes |
|---|---|
| **Python** | Most widely used — full pandas-like DataFrame API |
| **Java** | JVM-based DataFrame API |
| **Scala** | Functional DataFrame API |

### What Snowpark Does

Instead of extracting data to an external system and processing it there, Snowpark **pushes the computation into Snowflake's virtual warehouse** — the data never leaves the platform.

```
Without Snowpark:            With Snowpark:
────────────────────         ──────────────────────
Data leaves Snowflake        Data stays in Snowflake
     ↓                              ↓
Processed in Spark/Pandas    Processed inside VW
     ↓                              ↓
Results loaded back          Results written directly
```

### Snowpark Python Example

```python
from snowflake.snowpark import Session

session = Session.builder.configs({
    "account": "myaccount.us-east-1",
    "user": "MYUSER",
    "password": "mypassword",
    "warehouse": "COMPUTE_WH",
    "database": "MYDB",
    "schema": "PUBLIC"
}).create()

# Read table as a DataFrame
df = session.table("ORDERS")

# Transform
result = df.filter(df["STATUS"] == "COMPLETED") \
           .group_by("REGION") \
           .agg({"AMOUNT": "sum"})

# Write results
result.write.save_as_table("ORDERS_SUMMARY")
```

### Snowpark Use Cases

- **Data engineering pipelines** — replace Spark jobs with Snowpark DataFrames
- **ML feature engineering** — transform large datasets without leaving Snowflake
- **Python UDFs and UDTFs** — deploy Python functions as Snowflake UDFs
- **Stored Procedures** — Python-based stored procs running inside Snowflake

### Snowpark vs Python Connector

| | Python Connector | Snowpark |
|---|---|---|
| **Purpose** | Execute SQL statements | DataFrame-style data transformation |
| **Computation** | Client-side (after fetching) | Server-side (inside Snowflake VW) |
| **API** | SQL cursor | DataFrame API |
| **Best for** | Simple queries, admin tasks | Heavy data processing, ELT |

---

## 5. SnowCD — Connectivity Diagnostic Tool

**SnowCD** (Snowflake Connectivity Diagnostic) is a standalone tool to **diagnose and troubleshoot network connectivity** between a client machine and Snowflake.

### What SnowCD Checks

- DNS resolution to Snowflake endpoints
- TCP port connectivity (443)
- HTTPS/TLS handshake
- OCSP (certificate validation) — important for Fail-Open vs Fail-Close modes
- Proxy settings

### When to Use SnowCD

- A user cannot connect from their laptop or server
- Network team needs a report of which ports/endpoints must be whitelisted
- Validating connectivity through a corporate proxy or firewall

```bash
# Run the diagnostic
./snowcd

# Output example
[✓] DNS Resolution: myaccount.us-east-1.snowflakecomputing.com → 52.xx.xx.xx
[✓] Port 443 (HTTPS): Open
[✓] TLS Handshake: Successful
[✓] OCSP Validation: Passed
[✓] Overall: Connection to Snowflake is available
```

> [!NOTE]
> For the exam: SnowCD is a **separate downloadable diagnostic tool**, not part of SnowSQL or Snowsight. Its sole purpose is **network connectivity testing**.

---

## 6. Other Interfaces

### Snowflake REST API

Snowflake provides a REST API for:
- Submitting SQL statements programmatically
- Managing objects (warehouses, users, roles)
- Integrating Snowflake into CI/CD pipelines

```bash
# Example: submit a SQL statement via REST API
curl -X POST \
  'https://myaccount.snowflakecomputing.com/api/v2/statements' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"statement": "SELECT CURRENT_VERSION()", "warehouse": "COMPUTE_WH"}'
```

### Terraform Provider

Snowflake has an official Terraform provider for **infrastructure-as-code** management of Snowflake resources:

```hcl
resource "snowflake_warehouse" "compute_wh" {
  name           = "COMPUTE_WH"
  warehouse_size = "X-SMALL"
  auto_suspend   = 60
  auto_resume    = true
}
```

---

## Summary: Tool Selection Guide

| Scenario | Best Tool |
|---|---|
| Ad-hoc SQL queries | Snowsight (Web UI) |
| Automating SQL scripts in CI/CD | SnowSQL CLI |
| Connecting BI tools (Tableau, Power BI) | JDBC / ODBC Driver |
| Python data engineering pipelines | Snowpark Python or Python Connector |
| Uploading local files to internal stage | SnowSQL (`PUT` command) |
| Diagnosing network connectivity issues | SnowCD |
| Streaming data from Kafka | Kafka Connector |
| IaC / managing Snowflake objects in code | Terraform Provider |

---

## Practice Questions

**Q1.** Which tool is the ONLY way to use the `PUT` and `GET` commands to transfer files to/from internal stages?

- A) Snowsight  
- B) Python Connector  
- C) SnowSQL ✅  
- D) Snowpark

**Q2.** A data engineer wants to process a 10-billion-row dataset using Python without moving data out of Snowflake. Which tool should they use?

- A) Python Connector  
- B) Snowpark ✅  
- C) SnowSQL  
- D) ODBC Driver

**Q3.** What is the primary purpose of SnowCD?

- A) Running SQL queries from the command line  
- B) Diagnosing network connectivity to Snowflake ✅  
- C) Loading data from CSV files  
- D) Managing Snowflake users and roles

**Q4.** Which Snowflake connector would a Kafka administrator use to stream real-time events into Snowflake?

- A) JDBC Driver  
- B) Snowpark  
- C) Kafka Connector ✅  
- D) Python Connector

**Q5.** Snowpark processes data:

- A) On the client machine  
- B) In an external Spark cluster  
- C) Inside Snowflake's virtual warehouse ✅  
- D) In a separate cloud function

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**  
> 1. `PUT`/`GET` commands = SnowSQL only  
> 2. Snowpark = server-side Python/Java/Scala (data stays in Snowflake)  
> 3. SnowCD = network connectivity diagnostics only  
> 4. JDBC/ODBC = BI tools and legacy system integrations  
> 5. Kafka Connector = real-time streaming into Snowflake via Snowpipe
