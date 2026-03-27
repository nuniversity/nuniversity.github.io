---
title: "Dominio 2.2 — Funcionalidades de Gobernanza de Datos"
description: "Aprende cómo Snowflake protege y gobierna los datos: Enmascaramiento Dinámico de Datos, Políticas de Acceso por Fila, etiquetado de objetos, clasificación de datos, políticas de privacidad, Trust Center, gestión de claves de cifrado y linaje de datos."
order: 8
difficulty: intermediate
duration: "70 min"
---

# Dominio 2.2 — Funcionalidades de Gobernanza de Datos

## Peso en el Examen

El **Dominio 2.0** representa aproximadamente el **~20%** del examen. La gobernanza de datos es cada vez más crítica para las organizaciones orientadas al cumplimiento normativo.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 2.2**: *Definir las funcionalidades de gobernanza de datos y cómo se usan*, incluyendo enmascaramiento de datos, seguridad a nivel de fila y columna, etiquetado de objetos, políticas de privacidad, Trust Center, gestión de claves de cifrado, alertas, notificaciones, replicación de datos y linaje de datos.

---

## Seguridad a Nivel de Columna — Enmascaramiento Dinámico de Datos (*Dynamic Data Masking*)

El **Enmascaramiento Dinámico de Datos** oculta u ofusca los valores de columnas sensibles en tiempo de consulta según el rol del usuario — sin cambiar los datos subyacentes:

```sql
-- Crear una política de enmascaramiento
CREATE MASKING POLICY email_mask AS (val STRING) RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ANALYST_PII', 'DATA_OWNER') THEN val
        ELSE REGEXP_REPLACE(val, '.+\@', '*****@')  -- ocultar todo antes de @
    END;

-- Aplicar a una columna
ALTER TABLE customers
    MODIFY COLUMN email SET MASKING POLICY email_mask;

-- Analista con rol completo ve: jane.doe@example.com
-- Analista sin rol ve:          *****@example.com
```

**Hechos clave para el examen:**
- Las políticas de enmascaramiento se aplican a **nivel de columna**
- Se evalúan en **tiempo de consulta** — los datos originales no cambian
- Requiere **edición Enterprise o superior**
- Una columna solo puede tener **una política de enmascaramiento** aplicada a la vez
- La política puede ser **condicional** (diferentes máscaras para diferentes roles)

### Enmascaramiento Condicional

```sql
-- Enmascarar el salario según el acceso por departamento
CREATE MASKING POLICY salary_mask AS (sal NUMBER, dept STRING) RETURNS NUMBER ->
    CASE
        WHEN CURRENT_ROLE() = 'HR_ADMIN' THEN sal
        WHEN CURRENT_ROLE() = 'MANAGER' AND CURRENT_USER() = dept THEN sal
        ELSE -1  -- devolver -1 para usuarios no autorizados
    END;

ALTER TABLE employees
    MODIFY COLUMN salary SET MASKING POLICY salary_mask USING (salary, department);
```

---

## Seguridad a Nivel de Fila — Políticas de Acceso por Fila (*Row Access Policies*)

Las **Políticas de Acceso por Fila** controlan qué **filas** puede ver un usuario en una tabla o vista — sin necesidad de crear vistas separadas por rol:

```sql
-- Crear una política de acceso por fila
CREATE ROW ACCESS POLICY regional_access AS (region STRING) RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() = 'GLOBAL_ADMIN' THEN TRUE
        WHEN CURRENT_ROLE() = 'NA_ANALYST' AND region = 'NORTH_AMERICA' THEN TRUE
        WHEN CURRENT_ROLE() = 'EU_ANALYST' AND region = 'EUROPE' THEN TRUE
        ELSE FALSE
    END;

-- Aplicar a una tabla
ALTER TABLE orders
    ADD ROW ACCESS POLICY regional_access ON (order_region);

-- NA_ANALYST ve solo pedidos de Norteamérica
-- EU_ANALYST ve solo pedidos de Europa
-- GLOBAL_ADMIN ve todas las filas
```

**Hechos clave para el examen:**
- Las Políticas de Acceso por Fila filtran filas de forma **invisible** — las filas no autorizadas simplemente no aparecen
- Requiere **edición Enterprise o superior**
- Se aplican a **nivel de tabla o vista** sobre columnas específicas
- Una tabla puede tener **una política de acceso por fila** aplicada

> [!WARNING]
> Las Políticas de Acceso por Fila se evalúan **en tiempo de consulta** sobre las columnas de filtrado. Usar funciones como `CURRENT_ROLE()`, `CURRENT_USER()` o tablas de mapeo personalizadas es un patrón común.

---

## Etiquetado de Objetos (*Object Tagging*)

El **etiquetado de objetos** permite adjuntar **metadatos de clave-valor** a objetos de Snowflake (tablas, columnas, esquemas, warehouses, etc.) para el seguimiento de gobernanza:

```sql
-- Crear una etiqueta
CREATE TAG sensitivity ALLOWED_VALUES 'public', 'internal', 'confidential', 'restricted';
CREATE TAG pii_type COMMENT = 'Tipo de dato PII';

-- Aplicar etiquetas a objetos
ALTER TABLE customers MODIFY COLUMN email SET TAG pii_type = 'email_address';
ALTER TABLE customers MODIFY COLUMN ssn SET TAG sensitivity = 'restricted';
ALTER TABLE customers SET TAG sensitivity = 'confidential';

-- Consultar etiquetas vía ACCOUNT_USAGE
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.TAG_REFERENCES
WHERE TAG_NAME = 'SENSITIVITY'
AND TAG_VALUE = 'restricted';
```

**Casos de uso para las etiquetas:**
- Rastrear clasificaciones de sensibilidad de datos
- Identificar columnas con PII (Información de Identificación Personal) automáticamente
- Habilitar políticas de enmascaramiento basadas en etiquetas
- Atribución de costos por carga de trabajo/proyecto
- Informes de cumplimiento (p. ej., encontrar todos los datos con PII)

---

## Clasificación de Datos

La **Clasificación de Datos** escanea automáticamente las columnas de las tablas y sugiere **etiquetas definidas por el sistema** para categorías de datos sensibles (PII, financiero, etc.):

```sql
-- Clasificar una tabla (devuelve etiquetas sugeridas)
SELECT SYSTEM$CLASSIFY('analytics.public.customers', {});

-- Aplicar clasificaciones sugeridas
SELECT SYSTEM$CLASSIFY_SCHEMA('analytics.public', {});
```

El motor de clasificación de Snowflake identifica patrones como:
- Direcciones de correo electrónico → `SEMANTIC_CATEGORY:EMAIL`
- Números de teléfono → `SEMANTIC_CATEGORY:PHONE_NUMBER`
- Números de tarjeta de crédito → `PRIVACY_CATEGORY:IDENTIFIER`
- Nombres → `SEMANTIC_CATEGORY:NAME`

---

## Políticas de Privacidad (*Projection Policies*)

Las **políticas de privacidad** (también llamadas **políticas de proyección**) evitan que ciertas columnas sean consultadas directamente — la columna todavía puede usarse en cláusulas WHERE para filtrar, pero no puede devolverse en resultados SELECT:

```sql
CREATE PROJECTION POLICY ssn_protect AS () RETURNS PROJECTION_CONSTRAINT ->
    CASE
        WHEN CURRENT_ROLE() IN ('HR_ADMIN') THEN PROJECTION_CONSTRAINT(ALLOW => TRUE)
        ELSE PROJECTION_CONSTRAINT(ALLOW => FALSE)  -- la columna no puede SELECCIONARse
    END;

ALTER TABLE employees
    MODIFY COLUMN ssn SET PROJECTION POLICY ssn_protect;
```

---

## Trust Center (Centro de Confianza)

**Trust Center** es la herramienta de **gestión de postura de seguridad** integrada de Snowflake — evalúa tu cuenta según las mejores prácticas de seguridad de Snowflake y los estándares de la industria:

```sql
-- Acceder a Trust Center en Snowsight: Admin → Trust Center

-- Alternativamente, consultar vía SQL
SELECT *
FROM SNOWFLAKE.LOCAL.SECURITY_CENTER_FINDINGS
ORDER BY SEVERITY DESC;
```

Trust Center verifica:
- Imposición de MFA para ACCOUNTADMIN
- Políticas de contraseñas
- Cobertura de políticas de red
- Usuarios/roles sin usar
- Roles con exceso de privilegios

> [!NOTE]
> Trust Center es una **herramienta de evaluación de solo lectura** — identifica problemas pero no los soluciona automáticamente. Se alinea con los benchmarks de Snowflake del CIS y marcos de seguridad similares.

---

## Gestión de Claves de Cifrado

### Por Defecto: Claves Gestionadas por Snowflake

Por defecto, Snowflake gestiona todas las claves de cifrado usando un **modelo jerárquico de claves**:
- Clave Maestra de Cuenta → Clave Maestra de Tabla → Clave de Archivo
- Las claves se rotan automáticamente

### Tri-Secret Secure (Claves Gestionadas por el Cliente)

**Tri-Secret Secure** permite a los clientes mantener una **clave maestra compuesta** — la clave de cifrado se deriva tanto de la clave de Snowflake como de la clave del cliente:

- Disponible solo en **edición Business Critical**
- Usa AWS KMS, Azure Key Vault o Google Cloud KMS
- Si el cliente revoca su clave → Snowflake ya no puede descifrar los datos
- Proporciona máxima soberanía de datos

```sql
-- Configurar Tri-Secret Secure (se realiza al momento del aprovisionamiento de la cuenta)
-- Gestionado a través de la integración de gestión de claves del proveedor de nube
```

---

## Alertas y Notificaciones

### Alertas

Las **Alertas** de Snowflake ejecutan una verificación de condición según un horario y disparan una **acción** (enviar notificación, registrar) cuando se cumple la condición:

```sql
-- Crear una alerta que se activa cuando el conteo de errores supera el umbral
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
            'Alta tasa de errores detectada',
            'Más de 100 errores en los últimos 5 minutos'
        );

-- Las alertas deben reanudarse para activarse
ALTER ALERT high_error_rate RESUME;
```

### Notificaciones

Snowflake soporta notificaciones salientes vía:
- **Correo electrónico** (`SYSTEM$SEND_EMAIL`)
- **SNS / Pub/Sub / Event Grid** (servicios de notificación en la nube)
- **Webhooks**

```sql
-- Crear una integración de notificaciones por correo electrónico
CREATE NOTIFICATION INTEGRATION my_email
    TYPE = EMAIL
    ENABLED = TRUE
    ALLOWED_RECIPIENTS = ('alerts@company.com', 'ops@company.com');
```

---

## Replicación de Datos y Conmutación por Error

La **Replicación de Base de Datos** copia bases de datos entre regiones y proveedores de nube para **recuperación ante desastres** y **distribución de datos**:

```sql
-- Habilitar replicación en una base de datos (cuenta primaria)
ALTER DATABASE analytics ENABLE REPLICATION TO ACCOUNTS aws.us_east_replica;

-- Actualizar la réplica (cuenta secundaria)
ALTER DATABASE analytics REFRESH;

-- Conmutación por error: promover réplica a primaria
ALTER DATABASE analytics PRIMARY;
```

**Replication Group** — replica múltiples bases de datos + otros objetos juntos:

```sql
CREATE REPLICATION GROUP my_replication_group
    OBJECT_TYPES = DATABASES, ROLES, USERS
    ALLOWED_DATABASES = analytics, staging
    ALLOWED_ACCOUNTS = 'myorg.disaster_recovery';
```

**Failover Group** — agrega capacidad de conmutación por error automática:

```sql
CREATE FAILOVER GROUP my_failover_group
    OBJECT_TYPES = DATABASES, ROLES
    ALLOWED_DATABASES = analytics
    ALLOWED_ACCOUNTS = 'myorg.dr_account'
    REPLICATION_SCHEDULE = '10 MINUTE';
```

---

## Linaje de Datos (*Data Lineage*)

Snowflake proporciona **linaje de datos** a través de:

### Historial de Acceso

`SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY` — rastrea qué objetos fueron accedidos (lectura/escritura) en cada consulta:

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

### Dependencias de Objetos

```sql
-- Verificar qué vistas dependen de una tabla
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.OBJECT_DEPENDENCIES
WHERE REFERENCED_OBJECT_NAME = 'ORDERS';
```

---

## Preguntas de Práctica

**P1.** Un analista consulta una tabla con una política de Enmascaramiento Dinámico de Datos en la columna `email`. El rol del analista no está listado como autorizado. ¿Qué ve el analista?

- A) Un mensaje de error
- B) La columna está oculta de los resultados
- C) El valor enmascarado (p. ej., *****@dominio.com) ✅
- D) Un valor NULL

**P2.** Una empresa necesita que los analistas de Norteamérica vean solo las filas de Norteamérica en la tabla `orders`. ¿Qué funcionalidad implementa esto sin crear vistas separadas?

- A) Enmascaramiento Dinámico de Datos
- B) Seguridad a nivel de columna
- C) Política de Acceso por Fila ✅
- D) Vista Segura

**P3.** ¿Qué edición de Snowflake es requerida para usar Enmascaramiento Dinámico de Datos y Políticas de Acceso por Fila?

- A) Standard
- B) Enterprise ✅
- C) Business Critical
- D) Virtual Private Snowflake

**P4.** Una empresa quiere tener la capacidad de revocar la capacidad de Snowflake para descifrar sus datos revocando una clave que ellos controlan. ¿Qué funcionalidad lo permite?

- A) Políticas de Red
- B) Enmascaramiento a nivel de columna
- C) Tri-Secret Secure ✅
- D) Imposición de MFA

**P5.** ¿Qué herramienta de Snowflake evalúa una cuenta según las mejores prácticas de seguridad e identifica problemas como roles con exceso de privilegios?

- A) Esquema ACCOUNT_USAGE
- B) Monitor de Recursos
- C) Trust Center ✅
- D) Política de Red

**P6.** Las etiquetas de objetos en Snowflake pueden aplicarse a qué nivel(es)?

- A) Solo columnas de tablas
- B) Solo tablas y esquemas
- C) Tablas, columnas, esquemas, bases de datos, warehouses y más ✅
- D) Solo objetos a nivel de cuenta

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. **Enmascaramiento Dinámico de Datos** = seguridad a nivel de columna, enmascara en tiempo de consulta, datos sin cambios
> 2. **Política de Acceso por Fila** = seguridad a nivel de fila, filtra filas en tiempo de consulta
> 3. Ambas requieren **edición Enterprise o superior**
> 4. **Etiquetado de Objetos** = metadatos clave-valor en cualquier objeto de Snowflake
> 5. **Trust Center** = herramienta de evaluación de postura de seguridad (solo lectura)
> 6. **Tri-Secret Secure** = clave compuesta gestionada por el cliente → solo Business Critical
