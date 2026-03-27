---
title: "Dominio 4.2 — Optimización del Rendimiento de Consultas"
description: "Aprende las herramientas de optimización de rendimiento de Snowflake: Query Acceleration Service, Search Optimization Service, claves de clúster y Vistas Materializadas. Conoce cuándo y cómo usar cada una."
order: 14
difficulty: intermediate
duration: "60 min"
---

# Dominio 4.2 — Optimización del Rendimiento de Consultas

## Peso en el Examen

El **Dominio 4.0** representa aproximadamente el **~21%** del examen.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 4.2**: *Optimizar el rendimiento de consultas*, incluyendo el Query Acceleration Service, el Search Optimization Service, las claves de clúster y las Vistas Materializadas.

---

## Resumen de Herramientas de Optimización de Rendimiento

| Herramienta | Qué Resuelve | Modelo de Costo | Edición Requerida |
|---|---|---|---|
| **Claves de Clúster** | Poda de particiones deficiente | Créditos de Clustering Automático | Cualquiera |
| **Search Optimization Service** | Búsquedas puntuales de alta selectividad | Tarifa de servicio por tabla | Enterprise+ |
| **Query Acceleration Service** | Consultas lentas atípicas en WH compartido | Créditos adicionales por consulta | Enterprise+ |
| **Vistas Materializadas** | Agregaciones costosas repetidas | Créditos de actualización en segundo plano | Enterprise+ |

---

## Claves de Clúster (*Cluster Keys*)

### Cuándo Usar Claves de Clúster

El clustering es beneficioso cuando:
- La tabla es **grande** (cientos de GBs o varios TB)
- Las consultas **filtran frecuentemente** por columnas específicas
- El **orden natural de carga** no coincide con las columnas de filtro de las consultas

```sql
-- Verificar la calidad del clustering actual antes de agregar una clave
SELECT SYSTEM$CLUSTERING_INFORMATION(
    'orders',
    '(order_date)'
);
-- Devuelve: average_depth (menor es mejor), average_overlaps, etc.

-- Agregar una clave de clúster
ALTER TABLE orders CLUSTER BY (order_date);

-- Clave de clúster de múltiples columnas
ALTER TABLE events CLUSTER BY (region, event_type);

-- Clustering basado en expresión (agrupar por fecha truncada al mes)
ALTER TABLE orders CLUSTER BY (DATE_TRUNC('MONTH', order_date));

-- Verificar si el Clustering Automático está activo
SHOW TABLES LIKE 'orders';
-- Observa las columnas: cluster_by, automatic_clustering
```

### Elegir Buenas Claves de Clúster

**Buenos candidatos:**
- Columnas de alta cardinalidad usadas en cláusulas WHERE (fechas, regiones, categorías)
- Columnas usadas en consultas ejecutadas con frecuencia
- Columnas de unión para tablas grandes

**Malos candidatos:**
- Cardinalidad muy baja (p. ej., columnas booleanas — solo 2 valores)
- Cardinalidad muy alta con distribución aleatoria (p. ej., claves primarias UUID — poda deficiente)
- Columnas raramente usadas en filtros

> [!WARNING]
> Las claves de clúster activan el **Clustering Automático** — un servicio en segundo plano que consume créditos de forma continua. Solo agrupa tablas donde la ganancia en rendimiento de consultas supera el costo.

### Costo del Re-clustering

```sql
-- Monitorear el consumo de créditos del Clustering Automático
SELECT
    start_time,
    end_time,
    table_name,
    credits_used
FROM SNOWFLAKE.ACCOUNT_USAGE.AUTOMATIC_CLUSTERING_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
ORDER BY credits_used DESC;

-- Suspender el Clustering Automático si es necesario
ALTER TABLE orders SUSPEND RECLUSTER;

-- Reanudar
ALTER TABLE orders RESUME RECLUSTER;
```

---

## Search Optimization Service (Servicio de Optimización de Búsqueda)

El **Search Optimization Service (SOS)** acelera las **búsquedas puntuales de alta selectividad** y las búsquedas por igualdad que de otro modo escanearían muchas particiones:

### Cuándo Usar SOS

| Caso de Uso | ¿Adecuado para SOS? | ¿Usar Clave de Clúster en su lugar? |
|---|---|---|
| `WHERE email = 'usuario@ejemplo.com'` | ✅ Sí | No |
| `WHERE order_id = 12345` | ✅ Sí | No |
| `WHERE region = 'US-EAST'` (consulta de rango, resultado grande) | No | ✅ Sí |
| `WHERE order_date BETWEEN ... AND ...` | No | ✅ Sí |
| `WHERE v:user.id = 123` (semi-estructurado) | ✅ Sí | No |
| `CONTAINS(description, 'snowflake')` (búsqueda de subcadena) | ✅ Sí | No |

```sql
-- Habilitar Search Optimization en una tabla
ALTER TABLE customers ADD SEARCH OPTIMIZATION;

-- Habilitar solo para columnas específicas (más dirigido, menor costo)
ALTER TABLE customers ADD SEARCH OPTIMIZATION ON EQUALITY(email, phone_number);

-- Habilitar para rutas JSON semi-estructuradas
ALTER TABLE events ADD SEARCH OPTIMIZATION ON EQUALITY(v:user.id);

-- Habilitar para búsqueda de subcadenas (LIKE, ILIKE, CONTAINS)
ALTER TABLE products ADD SEARCH OPTIMIZATION ON SUBSTRING(description);

-- Verificar el estado del SOS
SHOW TABLES LIKE 'customers';
-- Observa la columna: search_optimization_progress

-- Monitorear el costo de construcción y mantenimiento del SOS
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.SEARCH_OPTIMIZATION_HISTORY;
```

> [!NOTE]
> El SOS construye un **índice de ruta de acceso** oculto optimizado para búsquedas por igualdad. Tiene un costo inicial de construcción y un costo de mantenimiento continuo. Es más efectivo cuando las consultas apuntan a una pequeña fracción de filas (alta selectividad).

### SOS vs. Claves de Clúster: Comparación

| Aspecto | Clave de Clúster | Search Optimization |
|---|---|---|
| Ideal para | Escaneos por rango, filtros de fecha, GROUP BY | Búsquedas puntuales, igualdad exacta |
| Cómo funciona | Reorganiza el orden de las micro-particiones | Construye un índice de búsqueda separado |
| Patrón de consulta | `BETWEEN`, `>`, `<`, filtros de rango | `= valor`, `IN (...)` |
| Modelo de costo | Créditos de re-clustering (segundo plano) | Tarifa de servicio + créditos de mantenimiento |
| Semi-estructurado | Limitado | Excelente (`v:campo = valor`) |

---

## Query Acceleration Service (Servicio de Aceleración de Consultas — QAS)

El **Query Acceleration Service (QAS)** descarga porciones de **consultas atípicamente lentas** al cómputo sin servidor de Snowflake — útil cuando un pequeño número de consultas tarda desproporcionadamente en un warehouse compartido:

### Cuándo Usar QAS

- El warehouse tiene muchas consultas, la mayoría son rápidas, pero algunas son muy lentas (atípicas)
- Las consultas atípicas son lentas porque procesan grandes cantidades de datos
- No quieres aumentar el tamaño de todo el warehouse por unas pocas consultas lentas

```sql
-- Habilitar QAS en un warehouse
ALTER WAREHOUSE WH_ANALYTICS SET ENABLE_QUERY_ACCELERATION = TRUE;

-- Establecer el factor de escala (limita cuánto cómputo sin servidor puede usarse)
-- Factor de escala de 5 = QAS puede usar hasta 5x los créditos del warehouse
ALTER WAREHOUSE WH_ANALYTICS
    SET ENABLE_QUERY_ACCELERATION = TRUE
    QUERY_ACCELERATION_MAX_SCALE_FACTOR = 5;

-- Verificar si una consulta es elegible para QAS
SELECT SYSTEM$ESTIMATE_QUERY_ACCELERATION('<query_id>');

-- Monitorear el uso de QAS
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_ACCELERATION_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

### Facturación del QAS

- Cuando el QAS está habilitado, las consultas elegibles usan automáticamente cómputo sin servidor
- Se factura a **tarifas de crédito sin servidor** (similar a Snowpipe) por la porción acelerada
- Si el QAS no mejora una consulta, no se usará (sin créditos desperdiciados)

---

## Vistas Materializadas (*Materialized Views*)

Una **Vista Materializada** pre-computa y almacena el resultado de una consulta SELECT. Las consultas contra la vista materializada leen el resultado pre-computado en lugar de re-ejecutar la consulta completa contra la tabla base:

```sql
-- Crear una vista materializada
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT
    date_trunc('day', order_time) AS order_day,
    region,
    sum(amount) AS daily_revenue,
    count(*) AS order_count
FROM orders
WHERE status = 'COMPLETED'
GROUP BY 1, 2;

-- Consultar la vista materializada (lee datos pre-computados)
SELECT * FROM mv_daily_revenue
WHERE order_day >= DATEADD('month', -3, CURRENT_DATE)
ORDER BY daily_revenue DESC;
```

### Cómo Funcionan las Vistas Materializadas

- **Actualización automática**: El servicio en segundo plano de Snowflake mantiene la vista materializada actualizada a medida que los datos de la tabla base cambian
- **No se necesita warehouse**: La actualización es sin servidor
- **Reescritura transparente**: Snowflake puede enrutar automáticamente una consulta a la vista materializada incluso si la consulta referencia la tabla base

```sql
-- Snowflake reescribe automáticamente esta consulta para usar la vista materializada:
SELECT date_trunc('day', order_time), region, sum(amount)
FROM orders
WHERE status = 'COMPLETED'
GROUP BY 1, 2;
-- → Snowflake detecta que mv_daily_revenue puede satisfacer esto y la usa
```

### Limitaciones de las Vistas Materializadas

| Limitación | Notas |
|---|---|
| No puede referenciar otras vistas materializadas | Debe consultar tablas base |
| Sin funciones no deterministas | `CURRENT_TIMESTAMP()`, `RANDOM()` no están permitidas |
| Sin joins en la definición de la vista materializada | Solo agregaciones simples |
| Requiere edición Enterprise | No disponible en Standard |
| Solo una tabla base | No puede agregar entre múltiples tablas |

```sql
-- Monitorear el costo y estado de actualización de la vista materializada
SELECT
    table_name AS nombre_vm,
    last_altered AS ultima_actualizacion,
    credits_used
FROM SNOWFLAKE.ACCOUNT_USAGE.MATERIALIZED_VIEW_REFRESH_HISTORY
WHERE start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

---

## Elegir la Herramienta de Optimización Correcta

Usa este marco de decisión en el examen:

```
La consulta es lenta porque...

→ ¿Se escanean demasiadas micro-particiones? (filtro de rango, fecha, región)
    → CLAVE DE CLÚSTER

→ ¿Búsquedas por igualdad exacta en valores específicos? (email, ID, UUID)
    → SEARCH OPTIMIZATION SERVICE

→ ¿El warehouse tiene consultas atípicamente lentas ocasionales?
    → QUERY ACCELERATION SERVICE

→ ¿La misma agregación costosa se ejecuta repetidamente?
    → VISTA MATERIALIZADA

→ ¿La consulta funciona bien pero el resultado tarda cada vez?
    → CACHÉ DE RESULTADOS DE CONSULTA (lección siguiente)
```

---

## Preguntas de Práctica

**P1.** Una tabla tiene 500 millones de filas. Los analistas frecuentemente ejecutan consultas como `WHERE customer_email = 'usuario@ejemplo.com'`. ¿Qué optimización es MÁS apropiada?

- A) Clave de Clúster en `customer_email`
- B) Search Optimization Service ✅
- C) Query Acceleration Service
- D) Vista Materializada

**P2.** Un warehouse ejecuta 1,000 consultas por día. 980 se completan en menos de 5 segundos, pero 20 tardan más de 10 minutos. ¿Qué optimización aborda las consultas atípicas lentas sin aumentar el tamaño de todo el warehouse?

- A) Clave de Clúster en la columna de filtro
- B) Multi-cluster warehouse
- C) Query Acceleration Service ✅
- D) Search Optimization en todas las tablas

**P3.** Se define una Vista Materializada sobre una tabla. ¿Cuándo se actualizan los datos de la vista materializada?

- A) Solo cuando se activa manualmente con ALTER MATERIALIZED VIEW REFRESH
- B) Automáticamente por el servicio en segundo plano de Snowflake a medida que los datos base cambian ✅
- C) Cada vez que se ejecuta una consulta contra la vista materializada
- D) En un horario fijo definido en el momento de la creación

**P4.** ¿Qué candidato de clave de clúster proporcionaría la PEOR poda para una tabla de pedidos de 1,000 millones de filas?

- A) `(order_date)` — fecha del pedido
- B) `(region)` — región geográfica (20 valores)
- C) `(order_uuid)` — clave primaria UUID generada aleatoriamente ✅
- D) `(product_category)` — 50 categorías

**P5.** ¿Qué funcionalidades de Snowflake requieren edición Enterprise para estas tres capacidades: Vistas Materializadas, Search Optimization y Query Acceleration?

- A) La edición Standard soporta las tres
- B) Estas funcionalidades requieren edición Business Critical
- C) Estas funcionalidades requieren edición Enterprise o superior ✅
- D) Cada funcionalidad requiere un nivel de edición diferente

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. **Clave de Clúster** = corregir poda deficiente en columnas de rango/filtro (BETWEEN, >, <)
> 2. **Search Optimization** = corregir búsquedas por igualdad lentas (`= valor`, rutas semi-estructuradas)
> 3. **Query Acceleration Service** = corregir consultas atípicamente lentas en un warehouse compartido
> 4. **Vista Materializada** = pre-computar agregaciones costosas repetidas
> 5. Search Optimization, QAS y Vistas Materializadas requieren **edición Enterprise o superior**
> 6. Clave de Clúster en una columna UUID/aleatoria = poda deficiente (¡evitar!)
