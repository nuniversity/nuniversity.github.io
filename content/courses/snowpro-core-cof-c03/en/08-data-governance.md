---
title: "Domain 2.2 — Data Governance Features"
description: "Learn how Snowflake protects and governs data: Dynamic Data Masking, Row Access Policies, object tagging, data classification, privacy policies, Trust Center, encryption key management, and data lineage."
order: 8
difficulty: intermediate
duration: "70 min"
---

# Domain 2.2 — Data Governance Features

## Exam Weight

**Domain 2.0** accounts for **~20%** of the exam. Data governance is increasingly critical for compliance-driven organizations.

> [!NOTE]
> This lesson maps to **Exam Objective 2.2**: *Define data governance features and how they are used*, including data masking, row-level and column-level security, object tagging, privacy policies, Trust Center, encryption key management, alerts, notifications, data replication, and data lineage.

---

## Column-Level Security — Dynamic Data Masking

**Dynamic Data Masking** hides or obfuscates sensitive column values at query time based on the user's role — without changing the underlying data:

```sql
-- Create a masking policy
CREATE MASKING POLICY email_mask AS (val STRING) RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ANALYST_PII', 'DATA_OWNER') THEN val
        ELSE REGEXP_REPLACE(val, '.+\@', '*****@')  -- hide everything before @
    END;

-- Apply to a column
ALTER TABLE customers
    MODIFY COLUMN email SET MASKING POLICY email_mask;

-- Analyst with full role sees: jane.doe@example.com
-- Analyst without role sees:  *****@example.com
```

**Key facts for the exam:**
- Masking policies are applied at the **column level**
- They evaluate at **query time** — original data is unchanged
- Requires **Enterprise edition or higher**
- A column can have only **one masking policy** applied at a time
- The policy can be **conditional** (different masks for different roles)

### Conditional Masking

```sql
-- Mask salary based on department access
CREATE MASKING POLICY salary_mask AS (sal NUMBER, dept STRING) RETURNS NUMBER ->
    CASE
        WHEN CURRENT_ROLE() = 'HR_ADMIN' THEN sal
        WHEN CURRENT_ROLE() = 'MANAGER' AND CURRENT_USER() = dept THEN sal
        ELSE -1  -- return -1 for unauthorized users
    END;

ALTER TABLE employees
    MODIFY COLUMN salary SET MASKING POLICY salary_mask USING (salary, department);
```

---

## Row-Level Security — Row Access Policies

**Row Access Policies** control which **rows** a user can see in a table or view — without creating separate views per role:

```sql
-- Create a row access policy
CREATE ROW ACCESS POLICY regional_access AS (region STRING) RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() = 'GLOBAL_ADMIN' THEN TRUE
        WHEN CURRENT_ROLE() = 'NA_ANALYST' AND region = 'NORTH_AMERICA' THEN TRUE
        WHEN CURRENT_ROLE() = 'EU_ANALYST' AND region = 'EUROPE' THEN TRUE
        ELSE FALSE
    END;

-- Apply to a table
ALTER TABLE orders
    ADD ROW ACCESS POLICY regional_access ON (order_region);

-- NA_ANALYST sees only North America orders
-- EU_ANALYST sees only Europe orders
-- GLOBAL_ADMIN sees all rows
```

**Key facts for the exam:**
- Row Access Policies filter rows **invisibly** — unauthorized rows simply don't appear
- Requires **Enterprise edition or higher**
- Applied at the **table or view level** on specific columns
- A table can have **one row access policy** applied

> [!WARNING]
> Row Access Policies are evaluated **at query time** on the filtering columns. Using functions like `CURRENT_ROLE()`, `CURRENT_USER()`, or custom mapping tables is a common pattern.

---

## Object Tagging

**Object tagging** allows you to attach **key-value metadata** to Snowflake objects (tables, columns, schemas, warehouses, etc.) for governance tracking:

```sql
-- Create a tag
CREATE TAG sensitivity ALLOWED_VALUES 'public', 'internal', 'confidential', 'restricted';
CREATE TAG pii_type COMMENT = 'Type of PII data';

-- Apply tags to objects
ALTER TABLE customers MODIFY COLUMN email SET TAG pii_type = 'email_address';
ALTER TABLE customers MODIFY COLUMN ssn SET TAG sensitivity = 'restricted';
ALTER TABLE customers SET TAG sensitivity = 'confidential';

-- Query tags via ACCOUNT_USAGE
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.TAG_REFERENCES
WHERE TAG_NAME = 'SENSITIVITY'
AND TAG_VALUE = 'restricted';
```

**Use cases for tags:**
- Track data sensitivity classifications
- Identify PII columns automatically
- Enable tag-based masking policies
- Cost attribution by workload/project
- Compliance reporting (e.g., find all PII data)

---

## Data Classification

**Data Classification** automatically scans table columns and suggests **system-defined tags** for sensitive data categories (PII, financial, etc.):

```sql
-- Classify a table (returns suggested tags)
SELECT SYSTEM$CLASSIFY('analytics.public.customers', {});

-- Apply suggested classifications
SELECT SYSTEM$CLASSIFY_SCHEMA('analytics.public', {});
```

Snowflake's classification engine identifies patterns like:
- Email addresses → `SEMANTIC_CATEGORY:EMAIL`
- Phone numbers → `SEMANTIC_CATEGORY:PHONE_NUMBER`
- Credit card numbers → `PRIVACY_CATEGORY:IDENTIFIER`
- Names → `SEMANTIC_CATEGORY:NAME`

---

## Privacy Policies

**Privacy policies** (also called **projection policies**) prevent certain columns from being queried directly — the column can still be used in WHERE clauses for filtering but cannot be returned in SELECT results:

```sql
CREATE PROJECTION POLICY ssn_protect AS () RETURNS PROJECTION_CONSTRAINT ->
    CASE
        WHEN CURRENT_ROLE() IN ('HR_ADMIN') THEN PROJECTION_CONSTRAINT(ALLOW => TRUE)
        ELSE PROJECTION_CONSTRAINT(ALLOW => FALSE)  -- column cannot be SELECTed
    END;

ALTER TABLE employees
    MODIFY COLUMN ssn SET PROJECTION POLICY ssn_protect;
```

---

## Trust Center

**Trust Center** is Snowflake's built-in **security posture management** tool — it evaluates your account against Snowflake's security best practices and industry standards:

```sql
-- Access Trust Center in Snowsight: Admin → Trust Center

-- Alternatively, query via SQL
SELECT *
FROM SNOWFLAKE.LOCAL.SECURITY_CENTER_FINDINGS
ORDER BY SEVERITY DESC;
```

Trust Center checks include:
- ACCOUNTADMIN MFA enforcement
- Password policies
- Network policy coverage
- Unused users/roles
- Over-privileged roles

> [!NOTE]
> Trust Center is a **read-only assessment tool** — it identifies issues but doesn't automatically fix them. It aligns with CIS Snowflake benchmarks and similar security frameworks.

---

## Encryption Key Management

### Default: Snowflake-Managed Keys

By default, Snowflake manages all encryption keys using a **hierarchical key model**:
- Account Master Key → Table Master Key → File Key
- Keys are rotated automatically

### Tri-Secret Secure (Customer-Managed Keys)

**Tri-Secret Secure** allows customers to maintain a **composite master key** — the encryption key is derived from both Snowflake's key AND the customer's key:

- Available on **Business Critical edition only**
- Uses AWS KMS, Azure Key Vault, or Google Cloud KMS
- If the customer revokes their key → Snowflake can no longer decrypt data
- Provides maximum data sovereignty

```sql
-- Configure Tri-Secret Secure (done at account provisioning time)
-- Managed through cloud provider key management integration
```

---

## Alerts and Notifications

### Alerts

Snowflake **Alerts** run a condition check on a schedule and fire an **action** (send notification, log) when the condition is met:

```sql
-- Create an alert that fires when error count exceeds threshold
CREATE ALERT high_error_rate
    WAREHOUSE = WH_MONITOR
    SCHEDULE = '5 MINUTE'
    IF (EXISTS (
        SELECT 1 FROM error_log
        WHERE error_time > DATEADD('minute', -5, CURRENT_TIMESTAMP)
        HAVING count(*) > 100
    ))
    THEN
        CALL SYSTEM$SEND_EMAIL(
            'my_email_integration',
            'alerts@company.com',
            'High error rate detected',
            'More than 100 errors in the last 5 minutes'
        );

-- Alerts must be resumed to activate
ALTER ALERT high_error_rate RESUME;
```

### Notifications

Snowflake supports outbound notifications via:
- **Email** (`SYSTEM$SEND_EMAIL`)
- **SNS / Pub/Sub / Event Grid** (cloud notification services)
- **Webhooks**

```sql
-- Create an email notification integration
CREATE NOTIFICATION INTEGRATION my_email
    TYPE = EMAIL
    ENABLED = TRUE
    ALLOWED_RECIPIENTS = ('alerts@company.com', 'ops@company.com');
```

---

## Data Replication and Failover

**Database Replication** copies databases across regions and cloud providers for **disaster recovery** and **data distribution**:

```sql
-- Enable replication on a database (primary account)
ALTER DATABASE analytics ENABLE REPLICATION TO ACCOUNTS aws.us_east_replica;

-- Refresh the replica (secondary account)
ALTER DATABASE analytics REFRESH;

-- Failover: promote replica to primary
ALTER DATABASE analytics PRIMARY;
```

**Replication Group** — replicate multiple databases + other objects together:

```sql
CREATE REPLICATION GROUP my_replication_group
    OBJECT_TYPES = DATABASES, ROLES, USERS
    ALLOWED_DATABASES = analytics, staging
    ALLOWED_ACCOUNTS = 'myorg.disaster_recovery';
```

**Failover Group** — adds automatic failover capability:

```sql
CREATE FAILOVER GROUP my_failover_group
    OBJECT_TYPES = DATABASES, ROLES
    ALLOWED_DATABASES = analytics
    ALLOWED_ACCOUNTS = 'myorg.dr_account'
    REPLICATION_SCHEDULE = '10 MINUTE';
```

---

## Data Lineage

Snowflake provides **data lineage** through:

### Access History

`SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY` — tracks which objects were accessed (read/write) in each query:

```sql
SELECT
    query_start_time,
    user_name,
    query_text,
    base_objects_accessed,
    direct_objects_accessed,
    objects_modified
FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY
WHERE query_start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

### Object Dependencies

```sql
-- Check what views depend on a table
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.OBJECT_DEPENDENCIES
WHERE REFERENCED_OBJECT_NAME = 'ORDERS';
```

---

## Practice Questions

**Q1.** An analyst queries a table with a Dynamic Data Masking policy on the `email` column. The analyst's role is not listed as authorized. What does the analyst see?

- A) An error message
- B) The column is hidden from the results
- C) The masked value (e.g., *****@domain.com) ✅
- D) A NULL value

**Q2.** A company needs North America analysts to see only North America rows in the `orders` table. Which feature implements this without creating separate views?

- A) Dynamic Data Masking
- B) Column-level security
- C) Row Access Policy ✅
- D) Secure View

**Q3.** Which Snowflake edition is required to use Dynamic Data Masking and Row Access Policies?

- A) Standard
- B) Enterprise ✅
- C) Business Critical
- D) Virtual Private Snowflake

**Q4.** A company wants the ability to revoke Snowflake's ability to decrypt their data by revoking a key they control. Which feature enables this?

- A) Network Policies
- B) Column-level Masking
- C) Tri-Secret Secure ✅
- D) MFA Enforcement

**Q5.** Which Snowflake tool evaluates an account against security best practices and identifies issues like over-privileged roles?

- A) ACCOUNT_USAGE schema
- B) Resource Monitor
- C) Trust Center ✅
- D) Network Policy

**Q6.** Object tags in Snowflake can be applied to which level(s)?

- A) Only table columns
- B) Only tables and schemas
- C) Tables, columns, schemas, databases, warehouses, and more ✅
- D) Only account-level objects

---

> [!SUCCESS]
> **Key Takeaways for Exam Day:**
> 1. **Dynamic Data Masking** = column-level security, masks at query time, data unchanged
> 2. **Row Access Policy** = row-level security, filters rows at query time
> 3. Both require **Enterprise edition or higher**
> 4. **Object Tagging** = key-value metadata on any Snowflake object
> 5. **Trust Center** = security posture assessment tool (read-only)
> 6. **Tri-Secret Secure** = customer-managed composite key → Business Critical only