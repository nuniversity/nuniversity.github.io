---
title: "Dominio 4.3 — Caché en Snowflake"
description: "Domina el sistema de caché de tres capas de Snowflake: Caché de Resultados de Consulta (capa de Cloud Services), Caché de Metadatos y Caché del Warehouse (disco local). Comprende cuándo se usa cada caché y cómo aprovecharlas."
order: 15
difficulty: intermediate
duration: "45 min"
---

# Dominio 4.3 — Caché en Snowflake

## Peso en el Examen

El **Dominio 4.0** representa aproximadamente el **~21%** del examen. La caché es un tema favorito del examen por sus reglas y comportamientos específicos.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 4.3**: *Usar la caché de Snowflake*, incluyendo la caché de resultados de consulta, la caché de metadatos y la caché del warehouse.

---

## Visión General de las Capas de Caché de Snowflake

Snowflake tiene **tres cachés distintas** que operan en diferentes capas:

```
┌──────────────────────────────────────────────────────┐
│            CAPA DE CLOUD SERVICES                    │
│  ┌─────────────────────────────────────────────────┐ │
│  │     CACHÉ DE RESULTADOS DE CONSULTA             │ │
│  │  Almacena resultados completos por 24 horas     │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │         CACHÉ DE METADATOS                      │ │
│  │  Estadísticas de tablas, MIN/MAX, conteos, info │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│          CAPA DE CÓMPUTO (Virtual Warehouse)         │
│  ┌─────────────────────────────────────────────────┐ │
│  │    CACHÉ DEL WAREHOUSE (DISCO LOCAL SSD)        │ │
│  │  Micro-particiones accedidas recientemente      │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Caché 1: Caché de Resultados de Consulta (*Query Result Cache*)

La **Caché de Resultados de Consulta** almacena el **conjunto de resultados completo** de una consulta y lo devuelve instantáneamente si se vuelve a enviar la misma consulta exacta — **sin ejecutar la consulta en absoluto** y **sin usar el Virtual Warehouse**.

### Cómo Funciona

1. Se ejecuta una consulta → el resultado se computa y almacena en la caché de resultados
2. Se envía la misma consulta por cualquier usuario dentro de 24 horas → el resultado se devuelve instantáneamente
3. No se consumen créditos del warehouse por el resultado en caché

### Reglas para Aciertos de Caché (*Cache Hits*)

Una consulta usa la caché de resultados **solo si SE CUMPLEN TODAS las siguientes condiciones**:

| Condición | Requisito |
|---|---|
| **Texto SQL exactamente igual** | El texto de la consulta debe ser idéntico byte a byte (incluyendo espacios y capitalización) |
| **Mismo rol** | El rol que ejecuta la consulta debe tener los mismos privilegios |
| **Sin cambios en los datos subyacentes** | Las tablas consultadas no deben haber sido modificadas |
| **Mismos parámetros de sesión** | El formato de fecha, zona horaria y otros parámetros deben coincidir |
| **Dentro de las 24 horas** | La entrada de caché debe tener menos de 24 horas de antigüedad |
| **`USE_CACHED_RESULT = TRUE`** | El parámetro debe estar habilitado (predeterminado: TRUE) |

> [!WARNING]
> Incluso un espacio adicional en el texto SQL causará un fallo de caché (*cache miss*). `SELECT count(*) FROM orders;` y `select count(*) from orders;` son consultas diferentes (las mayúsculas/minúsculas importan para la clave de la caché).

### Deshabilitar la Caché de Resultados

```sql
-- Deshabilitar la caché de resultados para una sesión (útil para benchmarking)
ALTER SESSION SET USE_CACHED_RESULT = FALSE;

-- Volver a habilitar
ALTER SESSION SET USE_CACHED_RESULT = TRUE;

-- Verificar la configuración actual
SHOW PARAMETERS LIKE 'USE_CACHED_RESULT';
```

### Identificar Aciertos de Caché en el Historial de Consultas

```sql
-- Encontrar consultas que usaron la caché de resultados
SELECT
    query_id,
    query_text,
    user_name,
    execution_status,
    total_elapsed_time,
    -- execution_time = 0 significa que se usó la caché de resultados
    execution_time
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE execution_time = 0
    AND start_time > DATEADD('hour', -24, CURRENT_TIMESTAMP)
LIMIT 20;
```

En el Historial de Consultas de Snowsight, las consultas en caché muestran el estado `Query Result Reuse` (Reutilización de Resultado de Consulta).

### Implicaciones de Costo

| Escenario | ¿Warehouse Usado? | ¿Créditos Consumidos? |
|---|---|---|
| Primera ejecución | Sí | Sí |
| Acierto de caché de resultados (dentro de 24h, mismo SQL, sin cambios en datos) | **No** | **0 créditos** |

---

## Caché 2: Caché de Metadatos (*Metadata Cache*)

La **Caché de Metadatos** almacena **estadísticas de tablas y metadatos de objetos** recopilados por la capa de Cloud Services de Snowflake. Estos metadatos se usan para:

- Responder **consultas de solo metadatos** sin tocar el warehouse
- Habilitar la **poda de particiones** (min/max por partición por columna)
- Potenciar el **optimizador de consultas** (conteos estimados de filas, cardinalidad)

### Consultas de Solo Metadatos (No Se Necesita Warehouse)

Estas consultas se responden completamente desde la caché de metadatos — no se requiere Virtual Warehouse:

```sql
-- Conteo de filas (solo metadatos)
SELECT COUNT(*) FROM orders;

-- MIN y MAX de una columna (metadatos)
SELECT MIN(order_date), MAX(order_date) FROM orders;

-- Comandos SHOW (metadatos)
SHOW TABLES IN DATABASE analytics;
SHOW COLUMNS IN TABLE orders;

-- Verificaciones de existencia de objetos
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'ORDERS';
```

> [!NOTE]
> `COUNT(*)` sobre una tabla sin cláusula WHERE se responde desde la caché de metadatos — **sin consumo de créditos del warehouse**. Este es un detalle frecuente en el examen: `COUNT(*)` = gratuito; `COUNT(nombre_columna)` con verificaciones de no-nulo puede requerir cómputo.

### Cómo la Caché de Metadatos Potencia la Poda

Para cada micro-partición y columna, los metadatos de Snowflake almacenan:
- Valor mínimo
- Valor máximo
- Número de valores distintos
- Conteo de NULL

En tiempo de consulta, el optimizador usa estos metadatos para **omitir particiones** que no pueden contener filas coincidentes:

```sql
-- El optimizador verifica los metadatos: ¿qué particiones tienen order_date en 2025-01?
SELECT sum(amount) FROM orders WHERE order_date BETWEEN '2025-01-01' AND '2025-01-31';
-- Solo se leen particiones donde MAX(order_date) >= 2025-01-01 Y MIN(order_date) <= 2025-01-31
```

---

## Caché 3: Caché del Warehouse o Disco Local (*Warehouse / Local Disk Cache*)

La **Caché del Warehouse** (también llamada **caché de disco local** o **caché de datos**) almacena **micro-particiones accedidas recientemente** en el **SSD de los nodos del Virtual Warehouse**.

### Cómo Funciona

- Cuando se lee una micro-partición desde el almacenamiento, se almacena en el SSD local del warehouse
- Las consultas posteriores que necesitan la misma micro-partición leen desde la **caché local** en lugar del cloud storage → mucho más rápido
- La caché vive en el warehouse — **cuando el warehouse se suspende, la caché se pierde**

### Implicaciones

| Escenario | Fuente de Datos | Velocidad |
|---|---|---|
| Warehouse frío (primera consulta tras reanudar) | Cloud storage (S3/Blob/GCS) | Más lento |
| Warehouse caliente (consultas repetidas, mismos datos) | Caché SSD local | Más rápido |
| Warehouse suspendido y reanudado | Cloud storage nuevamente | Más lento (caché limpiada) |

> [!WARNING]
> **Suspender un warehouse limpia la caché del warehouse**. Para cargas de trabajo sensibles al rendimiento donde la calidez de la caché importa, considera usar **`INITIALLY_SUSPENDED = FALSE`** o establecer un `AUTO_SUSPEND` más alto para mantener la caché caliente.

### Estrategias de Calentamiento de Caché

```sql
-- Opción 1: Ejecutar la consulta más común después de reanudar para calentar la caché
-- (Esto a veces se hace en flujos de trabajo ETL)
SELECT COUNT(*) FROM large_table;  -- hace que las micro-particiones se almacenen en caché

-- Opción 2: Aumentar la auto-suspensión para retener la caché entre consultas
ALTER WAREHOUSE WH_BI SET AUTO_SUSPEND = 600;  -- 10 minutos

-- Opción 3: Dedicar un warehouse a cargas de trabajo repetidas (la caché se mantiene caliente)
-- No compartas el warehouse de BI con ETL que lee datos diferentes
```

### Multi-Cluster Warehouses y la Caché

> [!NOTE]
> Cada clúster en un multi-cluster warehouse mantiene su **propia caché separada**. Los datos en caché en el Clúster 1 no están disponibles para el Clúster 2. Por eso el enrutamiento de consultas en configuraciones multi-cluster es importante — enrutar consultas similares al mismo clúster maximiza los aciertos de caché.

---

## Resumen de la Jerarquía de Caché

Cuando una consulta se ejecuta, Snowflake verifica las cachés en este orden:

```
1. Caché de Resultados de Consulta (Cloud Services)
   └── ¿Acierto? Devuelve el resultado instantáneamente, cero créditos
   └── ¿Fallo? Continúa...

2. Caché de Disco Local del Warehouse (SSD)
   └── ¿Acierto? Lee desde SSD local, sin E/S remota
   └── ¿Fallo? Continúa...

3. Almacenamiento Remoto (S3/Azure/GCS)
   └── Lee micro-particiones, llena la caché del warehouse
```

---

## Preguntas de Práctica

**P1.** Una consulta ejecutada a las 10:00 AM devuelve resultados y el resultado se almacena en caché. La misma consulta exacta se ejecuta a las 9:00 AM del día siguiente. ¿Qué sucede?

- A) El resultado en caché se devuelve instantáneamente ✅
- B) La consulta se re-ejecuta porque han pasado más de 24 horas — las 10:00 AM es exactamente 23 horas antes a las 9:00 AM del día siguiente
- C) La consulta falla porque la caché expiró
- D) La caché de resultados solo funciona dentro de la misma sesión

**P2.** ¿Qué acción limpia la caché del Warehouse (disco local)?

- A) Ejecutar una nueva consulta que accede a diferentes tablas
- B) Redimensionar el warehouse
- C) Suspender el warehouse ✅
- D) Cambiar a un rol diferente

**P3.** Un desarrollador quiere medir el tiempo de ejecución real de una consulta sin interferencia de la caché. ¿Qué comando evita que se use la caché de resultados?

- A) `ALTER WAREHOUSE WH SET CACHE = FALSE`
- B) `ALTER SESSION SET USE_CACHED_RESULT = FALSE` ✅
- C) `ALTER TABLE my_table DISABLE CACHE`
- D) `SET QUERY_CACHE = NONE`

**P4.** ¿Qué sentencia SQL puede responderse sin un Virtual Warehouse usando la Caché de Metadatos?

- A) `SELECT * FROM orders WHERE amount > 100`
- B) `SELECT region, sum(amount) FROM orders GROUP BY region`
- C) `SELECT COUNT(*) FROM orders` ✅
- D) `SELECT DISTINCT customer_id FROM orders`

**P5.** El Usuario A ejecuta `SELECT sum(amount) FROM orders WHERE region = 'US'` a las 2 PM. El Usuario B ejecuta la misma consulta a las 3 PM con el mismo rol y sin cambios en los datos. ¿Qué sucede?

- A) La consulta del Usuario B se ejecuta nuevamente (usuarios diferentes no comparten la caché)
- B) La consulta del Usuario B acierta la caché de resultados y se devuelve instantáneamente ✅
- C) La consulta del Usuario B acierta la caché del warehouse pero sigue usando el warehouse
- D) La caché solo aplica al usuario que ejecutó la consulta original

**P6.** En un multi-cluster warehouse con 3 clústeres activos, ¿cuál afirmación sobre la caché es VERDADERA?

- A) Los tres clústeres comparten una caché común
- B) Cada clúster mantiene su propia caché de disco local independiente ✅
- C) La caché del warehouse se almacena en la capa de Cloud Services
- D) Los multi-cluster warehouses no soportan caché

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. **Caché de Resultados**: ventana de 24 horas, SQL idéntico, mismo rol, sin cambios en datos → **cero créditos, sin warehouse**
> 2. **Caché de Metadatos**: responde `COUNT(*)`, `MIN()`, `MAX()` en tablas completas → **no se necesita warehouse**
> 3. **Caché del Warehouse**: SSD local, se pierde cuando el warehouse **se suspende**, cada clúster tiene la suya
> 4. Orden de verificación de caché: Resultados → Disco Local del Warehouse → Almacenamiento Remoto
> 5. `ALTER SESSION SET USE_CACHED_RESULT = FALSE` → omitir la caché de resultados
> 6. La caché de resultados es **compartida entre usuarios** con el mismo rol y el mismo SQL
