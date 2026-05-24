---
title: "Roles de Usuario, Permisos y Seguridad"
description: "Domina GRANT/REVOKE, gestión de roles, seguridad a nivel de fila, cifrado, prevención de inyección SQL y auditoría"
order: 9
duration: "90 minutos"
difficulty: advanced
---

# Roles de Usuario, Permisos y Seguridad

## Control de Acceso Basado en Roles (RBAC)

La seguridad de la base de datos sigue el principio del **menor privilegio**: concede solo los permisos necesarios.

### Creando Roles

```sql
-- Crear roles (PostgreSQL)
CREATE ROLE readonly;
CREATE ROLE readwrite;
CREATE ROLE admin WITH CREATEDB CREATEROLE;

-- Con capacidad de inicio de sesión
CREATE ROLE alice WITH LOGIN PASSWORD 'secure_password' INHERIT;
CREATE ROLE bob WITH LOGIN PASSWORD 'secure_password' VALID UNTIL '2025-01-01';

-- Conceder roles a usuarios
GRANT readonly TO alice;
GRANT readwrite TO bob;
```

## GRANT y REVOKE

### Niveles de Privilegio

| Nivel | Privilegios | Ejemplo |
|---|---|---|
| Base de datos | `CONNECT`, `CREATE`, `TEMPORARY` | `GRANT CONNECT ON DATABASE db TO readonly` |
| Esquema | `USAGE`, `CREATE` | `GRANT USAGE ON SCHEMA public TO readonly` |
| Tabla | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` | `GRANT SELECT ON orders TO readonly` |
| Columna | `SELECT(columna)`, `UPDATE(columna)` | `GRANT SELECT(name, email) ON users TO support_role` |
| Función | `EXECUTE` | `GRANT EXECUTE ON FUNCTION calculate_tax TO readonly` |

```sql
-- Concesiones a nivel de esquema
GRANT USAGE ON SCHEMA analytics TO readonly;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO readonly;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO readwrite;

-- Privilegios predeterminados (para objetos futuros)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly;

-- Permisos a nivel de columna
GRANT SELECT (id, name, email) ON users TO support_role;
REVOKE SELECT (password_hash, ssn) ON users FROM support_role;
```

[!NOTE]
`ALTER DEFAULT PRIVILEGES` solo afecta objetos creados por el usuario que los establece. Aplícalo como propietario del objeto para un comportamiento consistente.

### REVOKE

```sql
-- Eliminar privilegios
REVOKE INSERT ON orders FROM readwrite;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM readonly;

-- Cascada: revocar del rol y de todos los miembros
REVOKE ADMIN OPTION FOR readonly FROM alice CASCADE;
```

## Seguridad a Nivel de Fila (RLS)

RLS restringe qué filas un usuario puede ver o modificar basado en una expresión de política.

```sql
-- Habilitar RLS en una tabla
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Crear política: usuarios solo pueden ver sus propios pedidos
CREATE POLICY user_orders ON orders
    FOR ALL
    USING (customer_id = current_setting('app.current_user_id')::INT)
    WITH CHECK (customer_id = current_setting('app.current_user_id')::INT);

-- Crear política: equipo de soporte puede ver todos los pedidos
CREATE POLICY support_orders ON orders
    FOR SELECT
    USING (current_user IN (SELECT username FROM support_team));

-- Bypass de administrador (propietario de tabla o superusuario)
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE orders NO FORCE ROW LEVEL SECURITY;
```

### Ejemplos de RLS

```sql
-- Aislamiento multi-inquilino
CREATE TABLE tenant_data (
    tenant_id INT NOT NULL,
    data JSONB
);

ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_data
    USING (tenant_id = current_setting('app.tenant_id')::INT);

-- Acceso basado en horario
CREATE POLICY business_hours ON payroll
    FOR ALL
    USING (EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17);

-- Datos históricos solo lectura
CREATE POLICY read_only_history ON orders_archive
    FOR SELECT USING (true)
    WITH CHECK (false);  -- sin INSERT/UPDATE/DELETE
```

[!WARNING]
Las políticas RLS **no** se aplican al propietario de la tabla o superusuarios. Usa `FORCE ROW LEVEL SECURITY` para aplicar políticas a todos los usuarios.

## Cifrado

### Cifrado a Nivel de Columna (pgcrypto)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cifrar al momento de la inserción
INSERT into users (email, ssn)
VALUES (
    'alice@example.com',
    pgp_sym_encrypt('123-45-6789', 'encryption_key')
);

-- Descifrar en la lectura
SELECT
    email,
    pgp_sym_decrypt(ssn, 'encryption_key') AS ssn
FROM users;
```

### Transparent Data Encryption (TDE)

| Base de datos | Soporte TDE |
|---|---|
| PostgreSQL | Vía extensión `pg_tde` o cifrado de sistema de archivos |
| SQL Server | TDE — transparente a nivel de almacenamiento |
| Oracle | Cifrado de tablespace TDE |
| MySQL | Cifrado de tablespace InnoDB |

```sql
-- PostgreSQL: usando extensión pg_tde
CREATE EXTENSION pg_tde;

SELECT pg_tde_add_key_provider_file('my-provider', '/path/to/key/file');
SELECT pg_tde_set_principal_key('my-key', 'my-provider');

CREATE TABLE sensitive_data (
    id SERIAL,
    payload TEXT
) USING tde;
```

### TLS para Conexiones

```ini
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'
```

## Prevención de Inyección SQL

### Consultas Parametrizadas (Preferido)

```python
# Python (psycopg2) — NUNCA uses f-strings o concatenación de cadenas
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

### Ejemplos de Ataque de Inyección SQL

```sql
-- Consulta inocente
SELECT * FROM users WHERE email = 'alice@example.com';

-- Inyección: email = "' OR '1'='1"
SELECT * FROM users WHERE email = '' OR '1'='1';

-- Inyección: email = "'; DROP TABLE users; --"
SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
```

### Técnicas de Defensa

| Técnica | Descripción |
|---|---|
| **Prepared statements** | Más efectivo — separa código de datos |
| **Validación de entrada** | Verificación de tipo, límites de tamaño, listas permitidas |
| **Funciones de escape** | `quote_ident()`, `quote_literal()` en PostgreSQL |
| **Menor privilegio** | Usuario de la aplicación debe tener permisos mínimos |
| **ORMs** | ORMs modernos usan consultas parametrizadas por defecto |

```sql
-- SQL dinámico seguro en funciones
EXECUTE 'SELECT * FROM ' || quote_ident(table_name) || ' WHERE id = $1'
USING id_value;
```

[!IMPORTANT]
La concatenación de cadenas de entrada del usuario en SQL es la causa #1 de violaciones de datos. Usa consultas parametrizadas en todas partes.

## Auditoría

### Auditoría Basada en Trigger

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

-- Adjuntar a tablas
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Auditoría Integrada: PostgreSQL

```ini
# postgresql.conf
log_connections = on
log_disconnections = on
log_statement = 'ddl'  # 'none', 'ddl', 'mod', 'all'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a'
```

## Lista de Verificación de Seguridad

| Área | Verificación |
|---|---|
| Autenticación | Contraseñas fuertes, MFA, autenticación por certificado |
| Red | Reglas de firewall, SSL/TLS, red privada |
| Roles | Permisos mínimos, sin cuentas compartidas |
| RLS | Habilitado para tablas multi-inquilino |
| Cifrado | En reposo (TDE/pgcrypto) y en tránsito (SSL) |
| Inyección | Consultas parametrizadas en todas partes |
| Auditoría | Registrar todos los cambios de esquema y DML sensible |
| Secretos | Usa bóveda o variables de entorno, no código |

## Preguntas de Práctica

1. Crea un rol `readonly` y concédele SELECT en todas las tablas existentes y futuras en el esquema `public`.
2. ¿Cuál es la diferencia entre `GRANT` con y sin `WITH ADMIN OPTION`?
3. Habilita RLS en una tabla `documents` para que los usuarios solo puedan ver sus propios documentos, pero los administradores puedan ver todo.
4. Escribe una política que impida eliminar registros de `orders_archive` pero permita SELECT.
5. ¿Cómo cifrarías la columna `ssn` en una tabla `employees` usando `pgcrypto`?
6. ¿Cuáles son tres técnicas de prevención de inyección SQL? Da un ejemplo de código para cada una.
7. Crea un trigger de auditoría que registre todas las operaciones UPDATE en la tabla `accounts` incluyendo saldos antiguos y nuevos.
8. Explica el principio del menor privilegio. ¿Cómo lo aplicarías a una aplicación de informes?
9. Escribe una declaración `REVOKE` que elimine el permiso INSERT en `orders` del rol `readwrite`.
10. ¿Cómo difiere `FORCE ROW LEVEL SECURITY` de habilitar RLS sin FORCE? ¿Cuándo lo usarías?
