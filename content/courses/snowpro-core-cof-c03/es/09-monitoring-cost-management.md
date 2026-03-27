---
title: "Dominio 2.3 — Monitoreo y Gestión de Costos"
description: "Aprende a monitorear y controlar los costos de Snowflake usando Monitores de Recursos, vistas de ACCOUNT_USAGE, cálculo de créditos, monitoreo de warehouses y estrategias de atribución de costos."
order: 9
difficulty: intermediate
duration: "55 min"
---

# Dominio 2.3 — Monitoreo y Gestión de Costos

## Peso en el Examen

El **Dominio 2.0** representa aproximadamente el **~20%** del examen. La gestión de costos es un área práctica que se evalúa con frecuencia.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 2.3**: *Explicar el monitoreo y la gestión de costos*, incluyendo Monitores de Recursos, cálculo del uso de créditos por Virtual Warehouse y el esquema ACCOUNT_USAGE.

---

## Componentes de Costo de Snowflake

La facturación de Snowflake tiene tres componentes principales:

| Componente | Facturado Por | Cómo Controlarlo |
|---|---|---|
| **Cómputo** | Créditos consumidos por Virtual Warehouses | Auto-suspensión, dimensionamiento correcto, Monitores de Recursos |
| **Almacenamiento** | Por TB por mes (comprimido) | Eliminar datos sin usar, reducir Time Travel |
| **Cloud Services** | Créditos por Cloud Services > 10% del cómputo | Minimizar operaciones innecesarias de metadatos |
| **Funcionalidades sin servidor** | Créditos (Clustering Automático, Snowpipe, etc.) | Configurar apropiadamente |

---

## Monitores de Recursos (*Resource Monitors*)

Un **Monitor de Recursos** impone un **presupuesto de créditos** en Virtual Warehouses a nivel de cuenta o de warehouse. Cuando se alcanza un umbral, puede **notificar** a los administradores o **suspender** los warehouses.

### Crear un Monitor de Recursos

```sql
CREATE RESOURCE MONITOR quarterly_budget
    CREDIT_QUOTA = 5000          -- límite de créditos para el período
    FREQUENCY = MONTHLY          -- MONTHLY, DAILY, WEEKLY, YEARLY, NEVER
    START_TIMESTAMP = '2025-01-01 00:00:00'
    TRIGGERS
        ON 75 PERCENT DO NOTIFY           -- enviar alerta por correo al 75%
        ON 90 PERCENT DO NOTIFY           -- enviar otra alerta al 90%
        ON 100 PERCENT DO SUSPEND         -- suspender warehouse al 100%
        ON 110 PERCENT DO SUSPEND_IMMEDIATE; -- forzar suspensión inmediata al 110%
```

### Acciones de los Disparadores

| Acción | Comportamiento |
|---|---|
| `NOTIFY` | Enviar correo a los administradores de la cuenta |
| `SUSPEND` | Poner en cola las nuevas consultas; dejar terminar las consultas en ejecución, luego suspender |
| `SUSPEND_IMMEDIATE` | Cancelar todas las consultas en ejecución y suspender inmediatamente |

### Asignar un Monitor de Recursos

```sql
-- Asignar a la cuenta (aplica a todos los warehouses)
ALTER ACCOUNT SET RESOURCE_MONITOR = quarterly_budget;

-- Asignar a warehouses específicos
ALTER WAREHOUSE WH_ANALYTICS SET RESOURCE_MONITOR = quarterly_budget;
ALTER WAREHOUSE WH_INGEST SET RESOURCE_MONITOR = quarterly_budget;
```

> [!WARNING]
> Los Monitores de Recursos rastrean **solo los créditos de cómputo de Virtual Warehouses**. **No** rastrean costos de almacenamiento, créditos de Snowpipe ni créditos de Cloud Services por separado. Además, los Monitores de Recursos operan **sin costo adicional de créditos**.

### Alcance del Monitor de Recursos

| Nivel | Alcance |
|---|---|
| **Nivel de cuenta** | Rastrea todo el uso de créditos en todos los warehouses |
| **Nivel de warehouse** | Rastrea el uso solo de warehouses específicos |

> [!NOTE]
> Un warehouse puede tener **un Monitor de Recursos** asignado. Si un warehouse tiene un monitor a nivel de warehouse Y la cuenta tiene un monitor a nivel de cuenta, **ambos** aplican de forma independiente.

---

## Cálculo del Uso de Créditos por Virtual Warehouse

Los créditos se consumen **por segundo** mientras el warehouse está en ejecución (con un mínimo de 60 segundos por inicio):

```
Créditos Consumidos = Tamaño del Warehouse (créditos/hora) × Tiempo en Ejecución (horas)

Ejemplo:
  Warehouse Large (8 créditos/hora)
  Se ejecuta durante 45 minutos = 0.75 horas
  
  Créditos = 8 × 0.75 = 6 créditos
  
Pero si inicia, se ejecuta por 30 segundos y luego se suspende:
  Mínimo = 1 minuto = 8 × (1/60) = 0.133 créditos
```

### Uso de Créditos por Tamaño

| Tamaño | Créditos/Hora |
|---|---|
| X-Small | 1 |
| Small | 2 |
| Medium | 4 |
| Large | 8 |
| X-Large | 16 |
| 2X-Large | 32 |
| 3X-Large | 64 |
| 4X-Large | 128 |

Para **multi-cluster warehouses**:
```
Créditos Totales = Créditos/Hora por clúster × Número de clústeres activos × Tiempo
```

---

## El Esquema ACCOUNT_USAGE

`SNOWFLAKE.ACCOUNT_USAGE` es un esquema dentro de la base de datos compartida `SNOWFLAKE` que proporciona **metadatos históricos y datos de uso a nivel de cuenta**:

- Latencia de datos: hasta **45 minutos** (casi en tiempo real)
- Retención histórica: **1 año** para la mayoría de las vistas
- Requiere el rol `ACCOUNTADMIN` (o un rol con los privilegios apropiados otorgados por ACCOUNTADMIN)

### Vistas Clave de ACCOUNT_USAGE

| Vista | Propósito |
|---|---|
| `QUERY_HISTORY` | Todas las consultas ejecutadas en los últimos 365 días |
| `WAREHOUSE_METERING_HISTORY` | Consumo de créditos por warehouse por hora |
| `STORAGE_USAGE` | Uso diario de almacenamiento (TB) por base de datos |
| `TABLE_STORAGE_METRICS` | Almacenamiento por tabla incluyendo Time Travel y Fail-Safe |
| `LOGIN_HISTORY` | Todos los intentos de inicio de sesión (éxito y fallo) |
| `ACCESS_HISTORY` | Registro de auditoría de acceso a datos (lectura/escritura por consulta) |
| `COPY_HISTORY` | Historial de ejecución de COPY INTO |
| `PIPE_USAGE_HISTORY` | Consumo de créditos de Snowpipe |
| `METERING_DAILY_HISTORY` | Resumen diario de créditos en todos los servicios |
| `RESOURCE_MONITORS` | Todas las definiciones de Monitores de Recursos |
| `OBJECT_DEPENDENCIES` | Linaje de objetos (qué depende de qué) |

### Consultas de Monitoreo Comunes

```sql
-- Las 10 consultas más costosas en los últimos 7 días
SELECT
    query_id,
    user_name,
    warehouse_name,
    total_elapsed_time / 1000 AS segundos_transcurridos,
    credits_used_cloud_services,
    query_text
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
    AND execution_status = 'SUCCESS'
ORDER BY total_elapsed_time DESC
LIMIT 10;

-- Consumo de créditos por warehouse (últimos 30 días)
SELECT
    warehouse_name,
    sum(credits_used) AS creditos_totales,
    round(sum(credits_used) * 3.0, 2) AS costo_estimado_usd  -- $3/crédito ejemplo
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE start_time > DATEADD('day', -30, CURRENT_TIMESTAMP)
GROUP BY 1
ORDER BY 2 DESC;

-- Tendencia de uso de almacenamiento
SELECT
    usage_date,
    round(average_database_bytes / POWER(1024, 3), 2) AS almacenamiento_bd_gb,
    round(average_stage_bytes / POWER(1024, 3), 2) AS almacenamiento_stage_gb
FROM SNOWFLAKE.ACCOUNT_USAGE.STORAGE_USAGE
ORDER BY usage_date DESC
LIMIT 30;

-- Inicios de sesión fallidos en las últimas 24 horas
SELECT
    event_timestamp,
    user_name,
    client_ip,
    error_message
FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY
WHERE event_timestamp > DATEADD('hour', -24, CURRENT_TIMESTAMP)
    AND is_success = 'NO'
ORDER BY event_timestamp DESC;

-- Tablas que consumen más almacenamiento de Time Travel
SELECT
    table_catalog,
    table_schema,
    table_name,
    round(time_travel_bytes / POWER(1024, 3), 2) AS time_travel_gb,
    round(failsafe_bytes / POWER(1024, 3), 2) AS failsafe_gb
FROM SNOWFLAKE.ACCOUNT_USAGE.TABLE_STORAGE_METRICS
WHERE time_travel_bytes > 0
ORDER BY time_travel_bytes DESC
LIMIT 20;
```

---

## INFORMATION_SCHEMA vs. ACCOUNT_USAGE

Ambos proporcionan metadatos, pero con diferentes alcances:

| Aspecto | INFORMATION_SCHEMA | ACCOUNT_USAGE |
|---|---|---|
| Alcance | Solo la base de datos actual | Toda la cuenta |
| Latencia | Tiempo real | Hasta 45 minutos |
| Retención | Limitada (7–14 días para histórico) | 1 año |
| Acceso | Cualquier usuario con acceso a la BD | Requiere ACCOUNTADMIN |
| Objetos eliminados | No incluidos | Incluidos |
| Caso de uso | Consultas inmediatas del estado actual | Análisis histórico, auditoría |

```sql
-- INFORMATION_SCHEMA: base de datos actual, tiempo real
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'PUBLIC';

-- ACCOUNT_USAGE: historial completo de la cuenta
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.TABLES WHERE TABLE_CATALOG = 'ANALYTICS';
```

---

## Mejores Prácticas de Optimización de Costos

### Optimización de Cómputo

```sql
-- 1. Usar valores apropiados de auto-suspensión
ALTER WAREHOUSE WH_DEV SET AUTO_SUSPEND = 60;    -- desarrollo: suspender rápido
ALTER WAREHOUSE WH_PROD SET AUTO_SUSPEND = 300;  -- producción: suspender tras 5 min

-- 2. Dimensionar correctamente los warehouses (empezar pequeño, escalar si es necesario)
-- Ejecutar consultas de prueba en XS → S → M hasta que el rendimiento cumpla el SLA

-- 3. Usar etiquetas de consulta para atribución de costos
ALTER SESSION SET QUERY_TAG = 'proyecto:actualizacion_crm equipo:datos-ingenieria';

-- 4. Prevenir consultas fuera de control con tiempo de espera
ALTER WAREHOUSE WH_ADHOC SET STATEMENT_TIMEOUT_IN_SECONDS = 3600;
```

### Optimización de Almacenamiento

```sql
-- Reducir Time Travel en tablas de staging (ahorra costo de almacenamiento)
ALTER TABLE staging.raw_events SET DATA_RETENTION_TIME_IN_DAYS = 1;

-- Usar tablas Transitorias para resultados intermedios (sin Fail-Safe)
CREATE TRANSIENT TABLE staging.work_table AS SELECT ...;

-- Eliminar stages sin usar
REMOVE @old_stage/;
DROP STAGE old_stage;
```

### Costos de Funcionalidades Sin Servidor

| Funcionalidad Sin Servidor | Cómo Se Factura |
|---|---|
| Snowpipe | Por archivo cargado (cómputo sin servidor) |
| Clustering Automático | Créditos del servicio en segundo plano |
| Vistas Materializadas | Créditos de actualización en segundo plano |
| Actualización de Tablas Dinámicas | Créditos del servicio en segundo plano |
| Replicación | Créditos por transferencia de datos y cómputo |
| Search Optimization | Almacenamiento + créditos para la construcción |

---

## Preguntas de Práctica

**P1.** Un Monitor de Recursos está configurado con `ON 100 PERCENT DO SUSPEND`. ¿Qué sucede cuando se alcanza este umbral?

- A) Todas las consultas en ejecución se cancelan inmediatamente
- B) Las nuevas consultas se ponen en cola; las consultas en ejecución terminan, luego el warehouse se suspende ✅
- C) Se envía una notificación por correo y nada más cambia
- D) El warehouse se elimina

**P2.** ¿Cuál es el tiempo mínimo facturable cada vez que un Virtual Warehouse empieza a ejecutarse?

- A) 30 segundos
- B) 60 segundos ✅
- C) 5 minutos
- D) 1 hora

**P3.** ¿Qué vista de ACCOUNT_USAGE proporciona información sobre el consumo de créditos por warehouse por hora?

- A) QUERY_HISTORY
- B) STORAGE_USAGE
- C) WAREHOUSE_METERING_HISTORY ✅
- D) METERING_DAILY_HISTORY

**P4.** ¿Cuál es la latencia aproximada de los datos en las vistas del esquema ACCOUNT_USAGE?

- A) Tiempo real
- B) Hasta 45 minutos ✅
- C) Hasta 24 horas
- D) 7 días

**P5.** Un Monitor de Recursos está establecido tanto a nivel de cuenta como a nivel de warehouse para `WH_ANALYTICS`. ¿Qué sucede?

- A) Solo aplica el monitor a nivel de warehouse
- B) Solo aplica el monitor a nivel de cuenta
- C) Ambos monitores aplican de forma independiente ✅
- D) El monitor más restrictivo tiene prioridad

**P6.** Los Monitores de Recursos rastrean qué tipo de consumo de créditos?

- A) Almacenamiento + cómputo + Cloud Services
- B) Solo créditos de cómputo de Virtual Warehouse ✅
- C) Créditos de Snowpipe y funcionalidades sin servidor
- D) Todos los tipos de créditos de Snowflake por igual

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. **Monitor de Recursos** = ejecutor de presupuesto de créditos para warehouses; opera **sin costo adicional**
> 2. `SUSPEND` = dejar terminar las consultas en ejecución | `SUSPEND_IMMEDIATE` = cancelar todas las consultas ahora
> 3. Facturación: **por segundo, mínimo 60 segundos** por inicio de warehouse
> 4. **ACCOUNT_USAGE** = historial de 1 año, hasta 45 min de latencia, toda la cuenta, requiere ACCOUNTADMIN
> 5. **INFORMATION_SCHEMA** = tiempo real, solo la base de datos actual, retención limitada
> 6. Los Monitores de Recursos a nivel de cuenta y de warehouse aplican **de forma independiente**
