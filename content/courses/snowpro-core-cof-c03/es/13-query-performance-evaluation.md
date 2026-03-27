---
title: "Dominio 4.1 — Evaluación del Rendimiento de Consultas"
description: "Aprende a diagnosticar problemas de rendimiento en Snowflake usando Query Profile, Query History, vistas de ACCOUNT_USAGE, y comprende los principales cuellos de botella: desbordamiento de datos, poda ineficiente, uniones explosivas y colas."
order: 13
difficulty: intermediate
duration: "65 min"
---

# Dominio 4.1 — Evaluación del Rendimiento de Consultas

## Peso en el Examen

El **Dominio 4.0 — Optimización de Rendimiento, Consultas y Transformación** representa aproximadamente el **~21%** del examen — el segundo dominio más grande.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 4.1**: *Evaluar el rendimiento de consultas*, incluyendo Query Profile, Query Insights, vistas de ACCOUNT_USAGE y mejores prácticas de gestión de cargas de trabajo.

---

## El Flujo de Trabajo de Evaluación de Rendimiento

Cuando una consulta es lenta, sigue esta secuencia de diagnóstico:

```
1. Encontrar la consulta lenta → QUERY_HISTORY o Historial de Consultas en Snowsight
2. Abrir Query Profile → identificar el cuello de botella
3. Leer las estadísticas del operador → bytes desbordados, filas procesadas, poda
4. Resolver el cuello de botella → redimensionar, clustering, reescribir, caché
```

---

## Historial de Consultas (*Query History*)

### Vía Snowsight

En Snowsight: **Activity (Actividad) → Query History (Historial de Consultas)**

Filtra por: usuario, warehouse, rango de tiempo, duración, estado, tipo de consulta.

Haz clic en cualquier consulta para abrir su **Query Profile**.

### Vía SQL

```sql
-- Consultas lentas recientes (> 60 segundos) en las últimas 24 horas
SELECT
    query_id,
    query_text,
    user_name,
    warehouse_name,
    total_elapsed_time / 1000 AS segundos_transcurridos,
    bytes_spilled_to_local_storage,
    bytes_spilled_to_remote_storage,
    partitions_scanned,
    partitions_total,
    ROUND(partitions_scanned / NULLIF(partitions_total, 0) * 100, 1) AS pct_particiones_escaneadas
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('hour', -24, CURRENT_TIMESTAMP)
    AND total_elapsed_time > 60000  -- > 60 segundos
    AND execution_status = 'SUCCESS'
ORDER BY total_elapsed_time DESC
LIMIT 20;
```

---

## Query Profile (Perfil de Consulta)

El **Query Profile** es la herramienta principal para diagnosticar el rendimiento de consultas. Accede a él en Snowsight haciendo clic en cualquier consulta del Historial de Consultas.

### Qué Muestra el Query Profile

El Query Profile muestra el **plan de ejecución de la consulta** como un árbol de nodos de operadores. Cada nodo de operador muestra:

- **Filas procesadas** — conteos de filas de entrada y salida
- **Tiempo** — cuánto tiempo estuvo en ejecución el operador
- **Bytes** — datos leídos/procesados/escritos
- **Estadísticas del paso** — consumo de recursos por nodo

### Nodos de Operadores Clave

| Tipo de Nodo | Descripción |
|---|---|
| **TableScan** | Lee micro-particiones; muestra estadísticas de poda |
| **Filter** | Aplica condiciones WHERE |
| **Join** | Combina dos conjuntos de datos |
| **Aggregate** | Cómputos GROUP BY |
| **Sort** | Operaciones ORDER BY |
| **ResultSet** | Salida final enviada al cliente |
| **ExchangeDistribute** | Movimiento de datos entre nodos del warehouse |

---

## Cuellos de Botella Comunes de Rendimiento

### 1. Desbordamiento de Datos al Almacenamiento (*Data Spilling*)

**Qué es:** Cuando los datos de una consulta superan la memoria y el disco local del warehouse, se desbordan (*spill*) al almacenamiento remoto — aumentando masivamente la E/S y la latencia.

**Cómo detectarlo:**
- En Query Profile: `Bytes spilled to local storage` o `Bytes spilled to remote storage` > 0
- En QUERY_HISTORY: `BYTES_SPILLED_TO_LOCAL_STORAGE` o `BYTES_SPILLED_TO_REMOTE_STORAGE`

**Gravedad del desbordamiento:**

| Tipo de Desbordamiento | Gravedad | Causa |
|---|---|---|
| Desbordamiento a disco local | Moderada | La consulta supera la memoria del nodo |
| Desbordamiento a almacenamiento remoto | Grave | La consulta supera la memoria del nodo + el disco local |

```sql
-- Encontrar consultas con desbordamiento significativo
SELECT
    query_id,
    query_text,
    warehouse_name,
    bytes_spilled_to_local_storage / POWER(1024,3) AS gb_desbordados_local,
    bytes_spilled_to_remote_storage / POWER(1024,3) AS gb_desbordados_remoto,
    total_elapsed_time / 1000 AS segundos_transcurridos
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE bytes_spilled_to_remote_storage > 0
    AND start_time > DATEADD('day', -7, CURRENT_TIMESTAMP)
ORDER BY bytes_spilled_to_remote_storage DESC;
```

**Solución:** Escalar **verticalmente** el warehouse (tamaño mayor = más memoria por nodo).

---

### 2. Poda Ineficiente (*Inefficient Pruning*)

**Qué es:** Snowflake no puede omitir micro-particiones porque los valores de la columna de filtro están dispersos en muchas particiones — la consulta lee más datos de los necesarios.

**Cómo detectarlo en Query Profile:**
- El nodo `TableScan` muestra `Partitions scanned` cercano a `Partitions total`
- El ratio `Partitions scanned / Partitions total` es alto (> 80% es deficiente)

```sql
-- Ejemplo de poda deficiente: sin clustering en 'status'
SELECT sum(amount) FROM orders WHERE status = 'COMPLETED';
-- Escanea 9,800 de 10,000 particiones

-- Después de agregar clustering en 'status':
-- Escanea 1,200 de 10,000 particiones
```

**Soluciones:**
- Agregar una **Clave de Clúster** (*Cluster Key*) en la columna filtrada
- Asegurar que las consultas incluyan columnas de filtro de alta cardinalidad que coincidan con el orden natural de carga
- Usar el **Search Optimization Service** para búsquedas puntuales de alta selectividad

---

### 3. Uniones Explosivas (*Exploding Joins*)

**Qué es:** Un JOIN que produce **muchas más filas de las esperadas** — frecuentemente porque las claves de unión no son únicas (unión muchos-a-muchos que crea un producto cartesiano).

**Cómo detectarlo en Query Profile:**
- Un nodo `Join` muestra filas de salida >> filas de entrada
- El resultado de la unión es mucho mayor que cualquiera de las entradas

```sql
-- Ejemplo: unión explosiva (clave no única)
SELECT o.*, c.name
FROM orders o
JOIN customers c ON o.customer_segment = c.segment;
-- Si orders tiene 10M de filas y customers tiene 1000 filas con valores de segmento no únicos
-- → ¡Puede producir miles de millones de filas intermedias!

-- Solución: asegurar unicidad de la clave, o agregar primero
SELECT o.*, c.name
FROM orders o
JOIN (SELECT DISTINCT segment, name FROM customers) c
ON o.customer_segment = c.segment;
```

**Soluciones:**
- Verificar la unicidad de la clave de unión antes de escribir la consulta
- Pre-agregar antes de unir
- Usar `DISTINCT` o deduplicar el lado más pequeño

---

### 4. Colas (*Queuing*)

**Qué es:** Las consultas esperan en una cola porque todos los slots de cómputo del warehouse están ocupados por otras consultas en ejecución.

**Cómo detectarlo:**
- En Query Profile: la consulta muestra un largo tiempo en estado `Queued` (en cola) antes de ejecutarse
- En QUERY_HISTORY: `QUEUED_OVERLOAD_TIME` es alto

```sql
-- Encontrar consultas que estuvieron significativamente en cola
SELECT
    query_id,
    query_text,
    warehouse_name,
    queued_overload_time / 1000 AS segundos_en_cola,
    total_elapsed_time / 1000 AS segundos_totales
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE queued_overload_time > 10000  -- en cola más de 10 segundos
    AND start_time > DATEADD('day', -1, CURRENT_TIMESTAMP)
ORDER BY queued_overload_time DESC;
```

**Soluciones:**
- Habilitar **multi-cluster warehouse** (escalar horizontalmente) para cargas de trabajo concurrentes
- Crear **warehouses separados** por equipo/carga de trabajo
- Priorizar consultas usando warehouses separados para diferentes SLAs

---

## Vistas de ACCOUNT_USAGE para Análisis de Rendimiento

### Vistas de Rendimiento Clave

```sql
-- Atribución de consultas: qué usuarios/roles consumen más recursos
SELECT
    user_name,
    role_name,
    count(*) AS total_consultas,
    sum(total_elapsed_time) / 1000 / 3600 AS horas_totales,
    avg(total_elapsed_time) / 1000 AS segundos_promedio,
    sum(credits_used_cloud_services) AS creditos_cloud_services
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE start_time > DATEADD('month', -1, CURRENT_TIMESTAMP)
GROUP BY 1, 2
ORDER BY horas_totales DESC;

-- Utilización del warehouse (profundidad promedio de cola)
SELECT
    start_time::DATE AS fecha_uso,
    warehouse_name,
    avg(avg_running) AS consultas_concurrentes_promedio,
    avg(avg_queued_load) AS consultas_en_cola_promedio,
    avg(avg_blocked) AS consultas_bloqueadas_promedio
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_LOAD_HISTORY
WHERE start_time > DATEADD('week', -4, CURRENT_TIMESTAMP)
GROUP BY 1, 2
ORDER BY consultas_en_cola_promedio DESC;

-- Tablas más escaneadas (candidatas para clustering)
SELECT
    table_name,
    count(*) AS veces_escaneada,
    avg(partitions_scanned) AS particiones_escaneadas_promedio,
    avg(partitions_total) AS particiones_totales_promedio,
    round(avg(partitions_scanned) / NULLIF(avg(partitions_total), 0) * 100, 1) AS pct_escaneo_promedio
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE partitions_total > 0
    AND start_time > DATEADD('day', -30, CURRENT_TIMESTAMP)
GROUP BY 1
HAVING pct_escaneo_promedio > 50  -- poda deficiente
ORDER BY veces_escaneada DESC;
```

---

## Mejores Prácticas de Gestión de Cargas de Trabajo

### Agrupar Cargas de Trabajo Similares

Aislar las cargas de trabajo por tipo para evitar la contaminación cruzada:

```sql
-- Warehouses dedicados por tipo de carga de trabajo
CREATE WAREHOUSE WH_ETL      WAREHOUSE_SIZE = LARGE;   -- ingesta por lotes
CREATE WAREHOUSE WH_BI       WAREHOUSE_SIZE = SMALL     -- dashboards BI
                             MAX_CLUSTER_COUNT = 5;     -- manejar concurrencia
CREATE WAREHOUSE WH_DS       WAREHOUSE_SIZE = MEDIUM;   -- ciencia de datos
CREATE WAREHOUSE WH_ADHOC    WAREHOUSE_SIZE = MEDIUM;   -- consultas ad-hoc de analistas
```

### Etiquetado de Consultas para Atribución

```sql
-- Etiquetar consultas para atribución de costos
ALTER SESSION SET QUERY_TAG = 'equipo:analitica proyecto:reporte-q4';

-- Consultar por etiqueta en ACCOUNT_USAGE
SELECT query_tag, count(*), sum(total_elapsed_time)
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE query_tag LIKE '%analitica%'
GROUP BY 1;
```

---

## Guía Rápida de Resolución de Problemas de Rendimiento

| Síntoma | Causa Raíz | Solución |
|---|---|---|
| Consulta lenta, gran desbordamiento | Memoria/disco insuficiente | Escalar verticalmente el warehouse |
| Consulta escanea demasiadas particiones | Clustering de datos deficiente | Agregar Clave de Clúster |
| Join produce un conjunto de resultados enorme | Claves de unión no únicas (cartesiano) | Deduplicar, verificar claves |
| Las consultas esperan antes de iniciar | Concurrencia del warehouse llena | Multi-cluster o WH separado |
| Consulta rápida pero lenta con el tiempo | Tabla creció, clustering degradado | Habilitar Clustering Automático |
| Un warehouse acapara los recursos | Mezcla de cargas de trabajo | Crear warehouses dedicados |

---

## Preguntas de Práctica

**P1.** Un Query Profile muestra `Bytes spilled to remote storage = 45 GB`. ¿Cuál es la MEJOR solución?

- A) Agregar una clave de clúster en la columna de filtro
- B) Aumentar el tamaño del warehouse ✅
- C) Habilitar multi-cluster warehouse
- D) Usar la caché de resultados de consultas

**P2.** Una consulta escanea 9,500 de 10,000 micro-particiones en la tabla `orders`. ¿Qué métrica del Query Profile revela esto?

- A) Bytes desbordados al almacenamiento local
- B) Filas producidas por el join
- C) Partitions scanned vs Partitions total ✅
- D) Queued overload time

**P3.** Una consulta inesperadamente une y produce 10 mil millones de filas de dos tablas de 1 millón de filas cada una. ¿Cuál es la causa más probable?

- A) Los datos se están desbordando al almacenamiento remoto
- B) La condición de join crea una unión muchos-a-muchos (producto cartesiano) ✅
- C) El warehouse es demasiado pequeño
- D) La caché de resultados está deshabilitada

**P4.** ¿Qué vista de ACCOUNT_USAGE proporciona información sobre la carga de consultas concurrentes y las colas en los warehouses?

- A) QUERY_HISTORY
- B) WAREHOUSE_METERING_HISTORY
- C) WAREHOUSE_LOAD_HISTORY ✅
- D) TABLE_STORAGE_METRICS

**P5.** Las consultas ad-hoc de un equipo se están ralentizando porque las consultas de su dashboard BI están consumiendo todos los slots del warehouse. ¿Cuál es la MEJOR solución?

- A) Aumentar el tamaño del warehouse a 4X-Large
- B) Crear warehouses separados para las cargas de trabajo de BI y ad-hoc ✅
- C) Habilitar la caché de resultados de consultas
- D) Agregar una clave de clúster en todas las tablas

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. **Query Profile** = herramienta de diagnóstico principal — encuéntralo en Snowsight Activity → Query History
> 2. **Desbordamiento** = warehouse demasiado pequeño → escalar verticalmente | **Colas** = demasiadas consultas concurrentes → escalar horizontalmente
> 3. **Poda ineficiente** = alto ratio `partitions_scanned / partitions_total` → agregar clave de clúster
> 4. **Unión explosiva** = salida del nodo join >> entrada → verificar claves no únicas
> 5. `WAREHOUSE_LOAD_HISTORY` = métricas de colas/concurrencia
> 6. Usar `QUERY_TAG` para atribución de cargas de trabajo y seguimiento de costos
