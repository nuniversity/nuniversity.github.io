---
title: "User Roles, Permissions, and Security"
description: "Master GRANT/REVOKE, role management, row-level security, encryption, SQL injection prevention, and audit logging"
order: 9
duration: "90 minutes"
difficulty: advanced
---

# User Roles, Permissions, and Security

## Role-Based Access Control (RBAC)

Database security follows the principle of **least privilege**: grant only the permissions needed.

### Creating Roles

```sql
-- Create roles (PostgreSQL)
CREATE ROLE readonly;
CREATE ROLE readwrite;
CREATE ROLE admin WITH CREATEDB CREATEROLE;

-- With login capability
CREATE ROLE alice WITH LOGIN PASSWORD 'secure_password' INHERIT;
CREATE ROLE bob WITH LOGIN PASSWORD 'secure_password' VALID UNTIL '2025-01-01';

-- Grant roles to users
GRANT readonly TO alice;
GRANT readwrite TO bob;
```

## GRANT and REVOKE

### Privilege Levels

| Level | Privileges | Example |
|---|---|---|
| Database | `CONNECT`, `CREATE`, `TEMPORARY` | `GRANT CONNECT ON DATABASE db TO readonly` |
| Schema | `USAGE`, `CREATE` | `GRANT USAGE ON SCHEMA public TO readonly` |
| Table | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` | `GRANT SELECT ON orders TO readonly` |
| Column | `SELECT(column)`, `UPDATE(column)` | `GRANT SELECT(name, email) ON users TO support_role` |
| Function | `EXECUTE` | `GRANT EXECUTE ON FUNCTION calculate_tax TO readonly` |

```sql
-- Schema-level grants
GRANT USAGE ON SCHEMA analytics TO readonly;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO readonly;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO readwrite;

-- Default privileges (for future objects)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly;

-- Column-level permissions
GRANT SELECT (id, name, email) ON users TO support_role;
REVOKE SELECT (password_hash, ssn) ON users FROM support_role;
```

[!NOTE]
`ALTER DEFAULT PRIVILEGES` only affects objects created by the user who sets them. Apply it as the object owner for consistent behavior.

### REVOKE

```sql
-- Remove privileges
REVOKE INSERT ON orders FROM readwrite;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM readonly;

-- Cascade: revoke from role and all members
REVOKE ADMIN OPTION FOR readonly FROM alice CASCADE;
```

## Row-Level Security (RLS)

RLS restricts which rows a user can see or modify based on a policy expression.

```sql
-- Enable RLS on a table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own orders
CREATE POLICY user_orders ON orders
    FOR ALL
    USING (customer_id = current_setting('app.current_user_id')::INT)
    WITH CHECK (customer_id = current_setting('app.current_user_id')::INT);

-- Create policy: support team can see all orders
CREATE POLICY support_orders ON orders
    FOR SELECT
    USING (current_user IN (SELECT username FROM support_team));

-- Admin bypass (table owner or superuser)
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE orders NO FORCE ROW LEVEL SECURITY;
```

### RLS Examples

```sql
-- Multi-tenant isolation
CREATE TABLE tenant_data (
    tenant_id INT NOT NULL,
    data JSONB
);

ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_data
    USING (tenant_id = current_setting('app.tenant_id')::INT);

-- Time-based access
CREATE POLICY business_hours ON payroll
    FOR ALL
    USING (EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17);

-- Read-only historical data
CREATE POLICY read_only_history ON orders_archive
    FOR SELECT USING (true)
    WITH CHECK (false);  -- no INSERT/UPDATE/DELETE
```

[!WARNING]
RLS policies are **not** applied to the table owner or superusers. Use `FORCE ROW LEVEL SECURITY` to apply policies to all users.

## Encryption

### Column-Level Encryption (pgcrypto)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt at insert time
INSERT into users (email, ssn)
VALUES (
    'alice@example.com',
    pgp_sym_encrypt('123-45-6789', 'encryption_key')
);

-- Decrypt on read
SELECT
    email,
    pgp_sym_decrypt(ssn, 'encryption_key') AS ssn
FROM users;
```

### Transparent Data Encryption (TDE)

| Database | TDE Support |
|---|---|
| PostgreSQL | Via `pg_tde` extension or filesystem encryption |
| SQL Server | TDE — transparent at storage level |
| Oracle | TDE tablespace encryption |
| MySQL | InnoDB tablespace encryption |

```sql
-- PostgreSQL: using pg_tde extension
CREATE EXTENSION pg_tde;

SELECT pg_tde_add_key_provider_file('my-provider', '/path/to/key/file');
SELECT pg_tde_set_principal_key('my-key', 'my-provider');

CREATE TABLE sensitive_data (
    id SERIAL,
    payload TEXT
) USING tde;
```

### TLS for Connections

```ini
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'
```

## SQL Injection Prevention

### Parameterized Queries (Preferred)

```python
# Python (psycopg2) — NEVER use f-strings or string concatenation
cursor.execute(
    "SELECT * FROM users WHERE email = %s AND status = %s",
    (email, status)
)
```

```java
// Java (JDBC)
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE email = ? AND status = ?"
);
stmt.setString(1, email);
stmt.setString(2, status);
```

### SQL Injection Attack Examples

```sql
-- Innocent query
SELECT * FROM users WHERE email = 'alice@example.com';

-- Injection: email = "' OR '1'='1"
SELECT * FROM users WHERE email = '' OR '1'='1';

-- Injection: email = "'; DROP TABLE users; --"
SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
```

### Defense Techniques

| Technique | Description |
|---|---|
| **Prepared statements** | Most effective — separates code from data |
| **Input validation** | Type checking, length limits, allowlists |
| **Escape functions** | `quote_ident()`, `quote_literal()` in PostgreSQL |
| **Least privilege** | Application user should have minimal permissions |
| **ORMs** | Modern ORMs use parameterized queries by default |

```sql
-- Safe dynamic SQL in functions
EXECUTE 'SELECT * FROM ' || quote_ident(table_name) || ' WHERE id = $1'
USING id_value;
```

[!IMPORTANT]
String concatenation of user input into SQL is the #1 cause of data breaches. Use parameterized queries everywhere.

## Audit Logging

### Trigger-Based Audit

```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_data, new_data, changed_by)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb END,
        current_setting('app.current_user', TRUE)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to tables
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Built-in Audit: PostgreSQL

```ini
# postgresql.conf
log_connections = on
log_disconnections = on
log_statement = 'ddl'  # 'none', 'ddl', 'mod', 'all'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a'
```

## Security Checklist

| Area | Check |
|---|---|
| Authentication | Strong passwords, MFA, certificate auth |
| Network | Firewall rules, SSL/TLS, private network |
| Roles | Minimal permissions, no shared accounts |
| RLS | Enabled for multi-tenant tables |
| Encryption | At rest (TDE/pgcrypto) and in transit (SSL) |
| Injection | Parameterized queries everywhere |
| Audit | Log all schema changes and sensitive DML |
| Secrets | Use vault or environment variables, not code |

## Practice Questions

1. Create a `readonly` role and grant it SELECT on all existing and future tables in the `public` schema.
2. What is the difference between `GRANT` with and without `WITH ADMIN OPTION`?
3. Enable RLS on a `documents` table so users can only see their own documents, but admins can see everything.
4. Write a policy that prevents deleting records from `orders_archive` but allows SELECT.
5. How would you encrypt the `ssn` column in a `employees` table using `pgcrypto`?
6. What are three SQL injection prevention techniques? Give a code example for each.
7. Create an audit trigger that logs all UPDATE operations on the `accounts` table including old and new balances.
8. Explain the principle of least privilege. How would you apply it to a reporting application?
9. Write a `REVOKE` statement that removes INSERT permission on `orders` from the `readwrite` role.
10. How does `FORCE ROW LEVEL SECURITY` differ from enabling RLS without FORCE? When would you use it?
