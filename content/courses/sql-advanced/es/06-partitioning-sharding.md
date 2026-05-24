---
title: "Particionamiento de Tablas y Sharding"
description: "Domina el particionamiento de tablas (RANGE, LIST, HASH), poda de particiones, estrategias de sharding y métodos de distribución de datos a escala"
order: 6
duration: "120 minutos"
difficulty: advanced
---

# Particionamiento de Tablas y Sharding

## Particionamiento vs Sharding

| Aspecto | Particionamiento | Sharding |
|---|---|---|
| Alcance | Base de datos única | Múltiples bases de datos/nodos |
| Transparencia | Transparente para la aplicación | App puede necesitar conocimiento |
| Complejidad | Baja (gestionado por la BD) | Alta (enrutamiento, re-sharding) |
| Escalabilidad | Limitada por un servidor | Horizontal (agregar más nodos) |
| Consultas entre particiones | Soportadas | Complejas (joins distribuidos) |

## Particionamiento de Tablas

Divide una tabla grande en partes físicas más pequeñas mientras expone una única tabla lógica.

### Cuándo Particionar

| Criterio | Umbral |
|---|---|
| Tamaño de tabla | > 100 GB o > 100M filas |
| Ventana de mantenimiento | No puede completarse en el tiempo disponible |
| Limpieza de datos antiguos | `DELETE` regular de datos históricos |
| Patrón de consulta | Filtros en una clave de partición |

## Particionamiento RANGE

Los datos se dividen en rangos basados en un valor de columna.

```sql
CREATE TABLE orders (
    order_id BIGSERIAL,
    order_date DATE NOT NULL,
    customer_id INT,
    total NUMERIC(10,2)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2023_q1 PARTITION OF orders
    FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');

CREATE TABLE orders_2023_q2 PARTITION OF orders
    FOR VALUES FROM ('2023-04-01') TO ('2023-07-01');

CREATE TABLE orders_2023_q3 PARTITION OF orders
    FOR VALUES FROM ('2023-07-01') TO ('2023-10-01');

CREATE TABLE orders_2023_q4 PARTITION OF orders
    FOR VALUES FROM ('2023-10-01') TO ('2024-01-01');

CREATE TABLE orders_future PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('9999-01-01');
```

### Partición por Fecha (Mensual)

```sql
CREATE TABLE logs (
    log_id BIGSERIAL,
    created_at TIMESTAMPTZ NOT NULL,
    message TEXT
) PARTITION BY RANGE (created_at);

-- Generar particiones mensualmente (usa un script o pg_partman)
SELECT create_range_partition('logs', '2024-01-01', '2024-02-01');
```

## Particionamiento LIST

Los datos se dividen por valores discretos.

```sql
CREATE TABLE sales (
    sale_id BIGSERIAL,
    region TEXT NOT NULL,
    amount NUMERIC
) PARTITION BY LIST (region);

CREATE TABLE sales_na PARTITION OF sales
    FOR VALUES IN ('US', 'CA', 'MX');

CREATE TABLE sales_eu PARTITION OF sales
    FOR VALUES IN ('UK', 'DE', 'FR', 'IT', 'ES');

CREATE TABLE sales_apac PARTITION OF sales
    FOR VALUES IN ('JP', 'CN', 'KR', 'AU', 'IN');

CREATE TABLE sales_other PARTITION OF sales
    DEFAULT;
```

## Particionamiento HASH

Distribuye filas uniformemente entre las particiones usando una función hash.

```sql
CREATE TABLE user_sessions (
    session_id UUID NOT NULL,
    user_id BIGINT,
    payload JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE user_sessions_p0 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE user_sessions_p1 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE user_sessions_p2 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE user_sessions_p3 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

[!NOTE]
El particionamiento HASH es ideal para distribuir uniformemente la carga de escritura en el almacenamiento. Es malo para consultas de rango — una consulta filtrando `user_id BETWEEN 1000 AND 2000` examinará todas las particiones.

## Subparticionamiento

Particiones dentro de particiones.

```sql
CREATE TABLE measurements (
    sensor_id INT,
    recorded_at DATE,
    value NUMERIC
) PARTITION BY RANGE (recorded_at);

-- Primer nivel: trimestral
CREATE TABLE measurements_2024_q1 PARTITION OF measurements
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01')
    PARTITION BY LIST (sensor_id);

-- Segundo nivel: por grupo de sensor
CREATE TABLE measurements_2024_q1_sensors_1_100 PARTITION OF measurements_2024_q1
    FOR VALUES IN (1, 2, 3, /* ... */ 100);

CREATE TABLE measurements_2024_q1_sensors_101_200 PARTITION OF measurements_2024_q1
    FOR VALUES IN (101, 102, /* ... */ 200);
```

## Poda de Particiones

El planificador de consultas ignora particiones irrelevantes automáticamente.

```sql
-- Examina solo orders_2023_q4 y orders_future
EXPLAIN SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-02-01';
```

```text
Append
  Subplans Removed: 4
  ->  Seq Scan on orders_future
        Filter: ((order_date >= '2024-01-01') AND (order_date <= '2024-02-01'))
```

### Cuando la Poda Falla

```sql
-- SIN poda: función en la clave de partición
EXPLAIN SELECT * FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024;

-- Con poda: comparación directa
EXPLAIN SELECT * FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';
```

## Gestión de Particiones

### Agregando Particiones

```sql
-- Agregar nueva partición para datos futuros
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### Desadjuntando y Archivando

```sql
-- Desadjuntar partición antigua (sin pérdida de datos)
ALTER TABLE orders DETACH PARTITION orders_2023_q1;

-- Adjuntar a una tabla diferente o archivar
CREATE TABLE orders_archive (LIKE orders INCLUDING DEFAULTS);
ALTER TABLE orders_archive ATTACH PARTITION orders_2023_q1
    FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');
```

### Eliminando Particiones

```sql
-- Mucho más rápido que DELETE
DROP TABLE orders_2023_q1;
```

### Dividiendo una Partición

```sql
-- PostgreSQL: dividir vía DETACH + nuevas particiones
ALTER TABLE orders DETACH PARTITION orders_2023_q2;

CREATE TABLE orders_2023_apr PARTITION OF orders
    FOR VALUES FROM ('2023-04-01') TO ('2023-05-01');
CREATE TABLE orders_2023_may PARTITION OF orders
    FOR VALUES FROM ('2023-05-01') TO ('2023-06-01');
CREATE TABLE orders_2023_jun PARTITION OF orders
    FOR VALUES FROM ('2023-06-01') TO ('2023-07-01');

INSERT INTO orders_2023_apr SELECT * FROM orders_2023_q2
    WHERE order_date >= '2023-04-01' AND order_date < '2023-05-01';
-- ... repetir para may, jun
DROP TABLE orders_2023_q2;
```

## Estrategias de Sharding

### Sharding Vertical

Dividir tablas por dominio entre bases de datos.

```sql
-- Base de datos 1: user_db
CREATE TABLE users (user_id SERIAL, name TEXT, email TEXT);
CREATE TABLE profiles (user_id INT, bio TEXT);

-- Base de datos 2: order_db
CREATE TABLE orders (order_id SERIAL, user_id INT, total NUMERIC);
```

### Sharding Horizontal

Dividir filas de la misma tabla entre bases de datos.

### Sharding a Nivel de Aplicación

```python
def get_shard(user_id):
    shard_id = user_id % SHARD_COUNT
    return connections[shard_id]

# Uso
conn = get_shard(user_id)
conn.execute("SELECT * FROM orders WHERE user_id = ?", (user_id,))
```

### Sharding Basado en Proxy (ej: Vitess, Citus)

```sql
-- Citus: distribuir tabla entre nodos workers
SELECT create_distributed_table('orders', 'user_id');

-- Consultas se enrutan transparentemente
SELECT * FROM orders WHERE user_id = 42;  -- alcanza un shard
```

## Métodos de Distribución

| Método | Algoritmo | Pros | Contras |
|---|---|---|---|
| Módulo | `id % N` | Simple, uniforme si N es potencia de 2 | Re-sharding mueve todos los datos |
| Hashing Consistente | Basado en anillo | Movimiento mínimo de datos en re-shard | Implementación compleja |
| Basado en rango | Rangos de valor | Natural para series temporales | Puntos calientes posibles |
| Basado en directorio | Tabla de consulta | Flexible, re-shard fácil | Punto único de fallo |

## Ejemplos Prácticos

### Ejemplo 1: Sistema de Archivo Basado en Tiempo

```sql
-- Particiones mensuales con creación automática vía pg_partman
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
    p_parent_table := 'public.logs',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := '1 month',
    p_start_partition := '2024-01-01'
);

-- Crea automáticamente particiones:
-- logs_202401, logs_202402, logs_202403, ...
```

### Ejemplo 2: Sharding Multi-Tenant

```sql
-- Bases de datos por inquilino
-- tenant_1.orders, tenant_2.orders, etc.

-- O: sharding por tenant_id
CREATE TABLE orders (
    order_id BIGSERIAL,
    tenant_id INT NOT NULL,
    data JSONB
) PARTITION BY LIST (tenant_id);

-- Cada inquilino recibe una partición dedicada
CREATE TABLE orders_tenant_42 PARTITION OF orders FOR VALUES IN (42);
```

## Particionamiento vs Indexación

| Característica | Particionamiento | Indexación |
|---|---|---|
| Agrupación de filas | Físico | Lógico |
| Aceleración de consultas | Vía poda | Vía escaneo de índice |
| Sobrecarga de mantenimiento | Media | Baja |
| DELETE en masa | Trivialmente rápido | Lento (VACUUM) |
| Consultas entre particiones | Soportadas | N/A |

[!TIP]
Usa particionamiento con índices. Cada partición recibe sus propios índices, y la poda de particiones + escaneo de índice ofrece el mejor rendimiento.

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre particionamiento y sharding? ¿Cuándo usarías cada uno?
2. Crea una tabla particionada por RANGE en `sale_date` con particiones trimestrales para 2024.
3. Escribe una consulta que verifique si la poda de particiones está funcionando revisando el plan `EXPLAIN`.
4. Dado `users` con 100M filas, ¿cómo particionarías por `region` (NA, EU, APAC)?
5. ¿Qué sucede cuando una consulta usa una función en la clave de partición (ej: `YEAR(order_date)`) — la poda aún funciona?
6. ¿Cómo agregar una nueva partición para los datos del próximo mes en una tabla particionada mensualmente?
7. Explica hashing consistente y por qué es mejor que módulo simple para sharding.
8. Escribe una consulta para desadjuntar y archivar una partición que contenga datos de 2023.
9. ¿Cuáles son los trade-offs del particionamiento HASH vs RANGE para una tabla de series temporales?
10. Diseña una estrategia de sharding para una aplicación SaaS multi-inquilino con 500 inquilinos, cada uno con hasta 10M filas.
