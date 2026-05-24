---
title: "Ajuste Avanzado de Consultas"
description: "Domina el análisis avanzado de EXPLAIN, sugerencias de índice, técnicas de reescritura de consultas, gestión de estadísticas y diagnóstico sistemático de consultas lentas"
order: 5
duration: "120 minutos"
difficulty: advanced
---

# Ajuste Avanzado de Consultas

## EXPLAIN en Profundidad

El plan de ejecución del optimizador de consultas revela cada paso que tu base de datos ejecuta.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT e.*, d.name
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE e.salary > 100000;
```

### Nodos Clave del Plan

| Nodo | Significado | Banderas Rojas |
|---|---|---|
| `Seq Scan` | Escaneo completo de tabla | Tablas grandes sin filtro |
| `Index Scan` | Búsqueda por índice por valor | `rows=...` alto vs real |
| `Index Only Scan` | Todos los datos en el índice | Raramente, inflado del índice |
| `Bitmap Heap Scan` | Escaneo de índice bitmap + búsqueda en heap | Bloques `lossy` altos |
| `Nested Loop` | Para cada fila externa, sondear la interna | Malo cuando externo es grande |
| `Hash Join` | Construir tabla hash de un lado | Derrame de memoria a disco |
| `Merge Join` | Ordenar ambos lados + fusionar | Ordenar grandes conjuntos |
| `Sort` | Ordenación explícita | Memoria: `external merge Disk` |

### Leyendo la Salida EXPLAIN

```text
Sort  (cost=184.32..189.45 rows=2050 width=36)
  Sort Key: e.salary DESC
  ->  Hash Join  (cost=45.12..78.23 rows=2050 width=36)
        Hash Cond: (e.department_id = d.id)
        ->  Seq Scan on employees e
              Filter: (salary > 100000)
        ->  Hash  (cost=30.10..30.10 rows=1200 width=18)
              ->  Seq Scan on departments d
```

- **cost**: Primer número = costo de inicio, segundo = costo total (unidades arbitrarias).
- **rows**: Número estimado de filas (comparar con `actual rows` en `ANALYZE`).
- **width**: Ancho promedio de fila en bytes.

[!WARNING]
Siempre usa `ANALYZE` para obtener filas reales vs estimadas. Una gran discrepancia indica estadísticas desactualizadas o una estimación de cardinalidad pobre.

## Gestión de Estadísticas

```sql
-- Actualizar estadísticas
ANALYZE employees;

-- Actualizar estadísticas para una columna específica
ANALYZE employees (salary);

-- Establecer objetivo de estadísticas de columna (más alto = histograma más detallado)
ALTER TABLE employees ALTER COLUMN salary SET STATISTICS 1000;

-- Visualizar estadísticas
SELECT tablename, attname, n_distinct, most_common_vals, histogram_bounds
FROM pg_stats
WHERE tablename = 'employees';
```

### Cuando las Estadísticas se Vuelven Obsoletas

```sql
-- Verificar última vez analizada
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'orders';

-- Forzar análisis en una tabla ocupada
ANALYZE orders;
```

## Estrategias de Índice

### Orden de Columnas en Índice Compuesto

Coloca la columna más selectiva primero, luego la columna de ordenación.

```sql
-- Bueno para: WHERE department_id = ? ORDER BY salary DESC
CREATE INDEX idx_dept_salary ON employees (department_id, salary DESC);

-- Malo: columna de ordenación primero — no puede usar índice para igualdad + ordenación
CREATE INDEX idx_salary_dept ON employees (salary, department_id);
```

### Índices Parciales

```sql
-- Indexar solo pedidos activos
CREATE INDEX idx_active_orders ON orders (order_date)
WHERE status = 'active';

-- Consulta que lo utiliza
SELECT * FROM orders
WHERE status = 'active' AND order_date > '2024-01-01';
```

### Índices de Cobertura (Columnas Include)

```sql
-- Índice cubre la consulta sin tocar la tabla
CREATE INDEX idx_covering ON employees (department_id, salary)
INCLUDE (first_name, last_name);

-- Ahora esta consulta puede usar Index Only Scan:
SELECT first_name, last_name, salary
FROM employees
WHERE department_id = 10;
```

### Índices de Expresión

```sql
-- Acelerar consultas en columnas transformadas
CREATE INDEX idx_lower_email ON users (LOWER(email));

-- Consulta
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';
```

## Técnicas de Reescritura de Consultas

### 1. Convertir Subconsultas a JOINs

```sql
-- Lento
SELECT * FROM products
WHERE category_id IN (
    SELECT id FROM categories WHERE active = true
);

-- Rápido (misma semántica)
SELECT p.*
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.active = true;
```

[!NOTE]
`IN (subconsulta)` puede ser más lento que `JOIN` porque la subconsulta se materializa. Sin embargo, `IN` maneja NULLs de manera diferente — prueba para equivalencia semántica.

### 2. Usa EXISTS en Lugar de COUNT(*)

```sql
-- Lento
SELECT * FROM customers c
WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) > 0;

-- Rápido
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

### 3. Evita Funciones en Cláusulas WHERE

```sql
-- Malo: DATE() en cada fila impide uso de índice
SELECT * FROM orders
WHERE DATE(order_date) = '2024-01-15';

-- Bueno: consulta de rango usa índice
SELECT * FROM orders
WHERE order_date >= '2024-01-15' AND order_date < '2024-01-16';
```

### 4. Usa UNION ALL en Lugar de OR

```sql
-- OR no siempre puede usar índices eficientemente
SELECT * FROM employees
WHERE department_id = 5 OR status = 'active';

-- UNION ALL con índices separados
SELECT * FROM employees WHERE department_id = 5
UNION ALL
SELECT * FROM employees WHERE status = 'active' AND department_id <> 5;
```

## Identificando Consultas Lentas

```sql
-- PostgreSQL: consultas en ejecución actualmente
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Consultas de ejecución más larga (acumuladas)
SELECT queryid, query, calls, mean_exec_time, rows,
       shared_blks_hit, shared_blks_read, shared_blks_dirtied
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Cuellos de Botella Comunes

| Síntoma | Causa Probable | Corrección |
|---|---|---|
| `Seq Scan` en tabla grande | Índice faltante | Agregar índice en columna de filtro |
| `Sort` con `external merge Disk` | Memoria de ordenación excedida | Aumentar `work_mem` |
| `Nested Loop` con muchas iteraciones | Orden de unión incorrecto | Aumentar objetivo de estadísticas, reescribir consulta |
| `Hash Join` derramando a disco | `work_mem` insuficiente | Aumentar `work_mem` o ajustar hash_mem_multiplier |
| `Bitmap Heap Scan` con muchas páginas `lossy` | `work_mem` muy bajo para bitmap | Aumentar `work_mem` |

## Casos de Estudio Prácticos

### Caso 1: Paginación con OFFSET

```sql
-- Lento para offsets altos (OFFSET 100000)
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;

-- Paginación por clave (rápida)
SELECT * FROM orders
WHERE id > 100000
ORDER BY id
FETCH FIRST 20 ROWS ONLY;
```

### Caso 2: Optimización de COUNT

```sql
-- Muy lento en tablas grandes
SELECT COUNT(*) FROM orders;

-- Usar conteos estimados para paneles
-- PostgreSQL: conteo aproximado vía estadísticas
SELECT reltuples::BIGINT AS estimated_count
FROM pg_class WHERE relname = 'orders';
```

### Caso 3: UPDATE con JOIN

```sql
-- Lento: subconsulta correlacionada
UPDATE products p
SET last_sale_date = (
    SELECT MAX(sale_date)
    FROM sales s
    WHERE s.product_id = p.id
);

-- Rápido: usar cláusula FROM
UPDATE products p
SET last_sale_date = t.max_date
FROM (
    SELECT product_id, MAX(sale_date) AS max_date
    FROM sales
    GROUP BY product_id
) t
WHERE t.product_id = p.id;
```

## Ajuste de Configuración

```sql
-- Memoria de trabajo para ordenaciones
SET work_mem = '64MB';

-- Tamaño efectivo del caché (para estimaciones del planificador)
SET effective_cache_size = '4GB';

-- Workers de consulta paralela
SET max_parallel_workers_per_gather = 4;

-- Umbral del optimizador genético de consultas (GEQO)
SET geqo_threshold = 12;
```

[!TIP]
Configuraciones como `work_mem` se aplican por operación, por consulta. Una consulta con 10 operaciones de ordenación usa 10× `work_mem`. Monitorea la presión de memoria.

## Preguntas de Práctica

1. ¿Qué muestra `EXPLAIN (ANALYZE, BUFFERS)` que el `EXPLAIN` simple no muestra?
2. Dada una salida `EXPLAIN ANALYZE` con `rows=1000` pero `actual rows=10`, ¿cuál es el problema probable?
3. Escribe una consulta para encontrar las 10 consultas más lentas en una base de datos PostgreSQL usando `pg_stat_statements`.
4. ¿Cuál es la diferencia entre un índice parcial y un índice de cobertura? Da un ejemplo de cada uno.
5. Reescribe esta consulta lenta para mejor rendimiento: `SELECT * FROM orders WHERE DATE(created_at) = CURRENT_DATE`.
6. ¿Cómo identificarías y corregirías una consulta que usa Seq Scan en una tabla con 10M filas filtrando por `status = 'active'`?
7. Explica los trade-offs del orden de columnas en índices compuestos. Da un ejemplo de orden bueno y malo.
8. Convierte esta consulta lenta usando COUNT a EXISTS: `SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE user_id = users.id) > 5`.
9. ¿Qué es la paginación por clave y por qué es más rápida que la paginación basada en OFFSET?
10. Ves `Sort Method: external merge Disk: 2048kB` en EXPLAIN ANALYZE. ¿Qué significa y cómo se soluciona?
