---
title: "Planes de Ejecución de Consultas"
description: "Lee planes EXPLAIN, entiende escaneos secuenciales vs de índice, algoritmos de unión (NLJ, HASH, MERGE) e interpreta costos de consulta"
order: 7
duration: "55 minutos"
difficulty: "intermedio"
---

# Planes de Ejecución de Consultas

Un plan de ejecución de consulta muestra exactamente cómo la base de datos ejecutará tu SQL. Aprender a leer planes de ejecución es la habilidad más importante para la optimización de consultas.

## Leyendo la Salida EXPLAIN

EXPLAIN muestra un árbol de nodos del plan. Cada nodo tiene un costo, filas estimadas y ancho de fila.

```sql
EXPLAIN
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE e.salary > 80000;
```

```
                                 QUERY PLAN
---------------------------------------------------------------------------
 Hash Join  (cost=12.50..45.20 rows=150 width=58)
   Hash Cond: (e.department_id = d.department_id)
   ->  Seq Scan on employees e  (cost=0.00..30.40 rows=150 width=34)
         Filter: (salary > 80000)
   ->  Hash  (cost=10.00..10.00 rows=200 width=32)
         ->  Seq Scan on departments d  (cost=0.00..10.00 rows=200 width=32)
```

Lee los planes de ejecución **de adentro hacia afuera y de abajo hacia arriba**:

1. Escanear employees (filtrar salary > 80000) → 150 filas
2. Escanear departments → 200 filas, construir tabla hash
3. Hash Join de los dos resultados en department_id → 150 filas

> [!NOTE]
> Lee los planes de ejecución de adentro hacia afuera, de abajo hacia arriba. El nodo más externo (primera línea) es el paso final que produce el resultado de la consulta.

## Terminología de Costo

| Término | Significado | Rango Típico |
|------|---------|---------------|
| `cost=0.00..30.40` | Costo estimado (inicio..total) | Unidades arbitrarias |
| `rows=150` | Recuento estimado de filas | Depende del tamaño de la tabla |
| `width=34` | Ancho promedio de fila en bytes | Depende de las columnas |
| `actual time=0.015..0.030` | Tiempo real (ms) | De EXPLAIN ANALYZE |
| `loops=1` | Veces que el nodo se ejecutó | >1 para nested loop interno |

El costo es una unidad arbitraria que combina:
- **Costo de E/S**: páginas de disco leídas
- **Costo de CPU**: procesamiento de filas, formato de tuplas
- **Costo de memoria**: tablas hash, buffers de ordenación

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE order_date >= '2024-01-01'
  AND order_date < '2024-02-01';
```

```
Index Scan using idx_orders_date on orders
  (cost=0.28..12.50 rows=50 width=40)
  (actual time=0.018..0.042 rows=45 loops=1)
  Index Cond: (order_date >= '2024-01-01'::date)
  Planning Time: 0.058 ms
  Execution Time: 0.064 ms
```

La estimación dice 50 filas; el real fue 45 — una buena estimación. Grandes discrepancias sugieren estadísticas desactualizadas.

## Escaneos Secuenciales vs Escaneos de Índice

### Escaneo Secuencial (Seq Scan)

```
Seq Scan on large_table  (cost=0.00..1000.00 rows=50000 width=100)
```

Lee la tabla completa del disco secuencialmente. Mejor cuando:
- Leyendo un gran porcentaje de filas (> 10-20%)
- La tabla es muy pequeña
- No existe un índice adecuado

### Escaneo de Índice (Index Scan)

```
Index Scan using idx_last_name on employees  (cost=0.28..4.29 rows=1 width=36)
  Index Cond: (last_name = 'Smith')
```

Navega el árbol B-tree, luego busca filas coincidentes del heap. Mejor cuando:
- Leyendo un pequeño porcentaje de filas
- Alta selectividad en la columna de filtro

### Escaneo de Índice Bitmap (Bitmap Index Scan)

```
Bitmap Heap Scan on orders  (cost=12.50..45.20 rows=500 width=40)
  Recheck Cond: (status = 'shipped')
  ->  Bitmap Index Scan on idx_orders_status  (cost=0.00..10.00 rows=500 width=0)
        Index Cond: (status = 'shipped')
```

Combina múltiples escaneos de índice en un bitmap en memoria, luego busca filas del heap en orden físico. Mejor cuando:
- Filtrando en múltiples columnas indexadas
- Obteniendo 5-20% de las filas (término medio entre Index Scan y Seq Scan)

> [!SUCCESS]
| Tipo de Escaneo | % Acceso a Filas | Uso Típico |
|-----------|-------------|-------------|
| Index Scan | < 5% | Búsquedas puntuales, alta selectividad |
| Bitmap Scan | 5-20% | Múltiples filtros, selectividad moderada |
| Seq Scan | > 20% | Grandes porciones de la tabla, sin índice |

## Algoritmos de Unión

### Nested Loop Join (NLJ)

```sql
EXPLAIN SELECT * FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE c.country = 'USA';
```

```
Nested Loop  (cost=0.28..15.50 rows=10 width=80)
   ->  Seq Scan on customers c  (cost=0.00..5.00 rows=2 width=50)
         Filter: (country = 'USA')
   ->  Index Scan using idx_orders_customer on orders o
         (cost=0.28..5.25 rows=5 width=40)
         Index Cond: (customer_id = c.customer_id)
```

Para cada fila en la tabla externa, escanea la tabla interna. Complejidad: **O(N × M)**.

Mejor cuando:
- Un lado es muy pequeño
- El lado interno tiene un índice
- Uniendo un pequeño número de filas

### Hash Join

```
Hash Join  (cost=10.50..35.20 rows=1000 width=80)
   Hash Cond: (c.customer_id = o.customer_id)
   ->  Seq Scan on orders o  (cost=0.00..18.00 rows=1000 width=40)
   ->  Hash  (cost=8.00..8.00 rows=200 width=50)
         ->  Seq Scan on customers c  (cost=0.00..8.00 rows=200 width=50)
```

Construye una tabla hash en la tabla más pequeña, luego consulta con la tabla más grande. Complejidad: **O(N + M)**.

| Fase | Operación | Memoria |
|-------|-----------|--------|
| Construcción | Hash de la tabla pequeña en memoria | O(tabla pequeña) |
| Consulta | Escanea tabla grande, consulta hash | O(tabla grande) |

Mejor cuando:
- Uniendo tablas grandes y no indexadas
- Solo condiciones de igualdad
- Un lado cabe en memoria

### Merge Join

```
Merge Join  (cost=15.50..45.30 rows=1000 width=80)
   Merge Cond: (c.customer_id = o.customer_id)
   ->  Index Scan using customers_pkey on customers c
   ->  Index Scan using idx_orders_customer on orders o
```

Ambas entradas deben estar ordenadas por la clave de unión. Complejidad: **O(N + M)**.

Mejor cuando:
- Ambas entradas ya están ordenadas (ej.: de escaneos de índice)
- Uniendo en condiciones de no igualdad (`<`, `>`, `<=`)
- Tablas grandes donde la tabla hash no cabe en memoria

| Algoritmo | Condición | Prefiere Índices | Memoria |
|-----------|-----------|-----------------|--------|
| Nested Loop | Cualquiera | Sí (interno) | Baja |
| Hash Join | Solo igualdad | No | Alta |
| Merge Join | Igualdad + rango | Sí (ordenado) | Baja |

## Analizando Consultas Lentas

```sql
-- Paso 1: EXPLAIN ANALYZE la consulta
EXPLAIN ANALYZE
SELECT o.order_id, c.name, p.product_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '7 days';
```

Señales de alerta en planes de ejecución:

| Señal Roja | Qué Significa | Corrección |
|----------|---------------|-----|
| `Seq Scan` en tabla grande | Índice faltante o no usado | Crear índice apropiado |
| `Sort` en conjunto grande de resultados | Sin índice para ORDER BY | Añadir índice en columnas de ordenación |
| Nested Loop con `Seq Scan` interno | Tabla interna no indexada | Indexar la columna de unión |
| `Rows Removed by Filter` >> filas devueltas | Selectividad pobre | Mejor índice o reescritura de consulta |
| Gran discrepancia: `rows=` vs `actual` | Estadísticas desactualizadas | Ejecutar `ANALYZE` / `VACUUM` |

## Ejemplo Real: Sesión de Ajuste de Consulta

```sql
-- Consulta lenta: 5 segundos
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.name
ORDER BY order_count DESC;

-- EXPLAIN muestra: Seq Scan en orders (100K filas), Hash Join
-- Corrección: añadir índice
CREATE INDEX idx_orders_customer_date
ON orders(customer_id, created_at);

-- Después del índice: 50ms — 100x más rápido
```

```sql
-- Otro patrón: subconsulta repetida
SELECT * FROM products
WHERE price > (SELECT AVG(price) FROM products)
  AND category_id IN (SELECT id FROM categories WHERE active = true);

-- Mejor: reescribir con JOIN
SELECT p.*
FROM products p
INNER JOIN categories c ON p.category_id = c.id
CROSS JOIN (SELECT AVG(price) AS avg_price FROM products) stats
WHERE p.price > stats.avg_price AND c.active = true;
```

## Usando pg_stat_statements (PostgreSQL)

```sql
-- Encontrar las consultas más costosas
SELECT
    queryid,
    calls,
    total_exec_time / calls AS avg_time_ms,
    rows / calls AS avg_rows,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

> [!SUCCESS]
| Prioridad de Optimización | Impacto | Esfuerzo |
|----------------------|--------|--------|
| Seq → Index scan en tablas grandes | Alto | Bajo |
| Eliminar ordenaciones innecesarias | Medio | Medio |
| Nested Loop → Hash Join | Alto | Bajo (añadir índice) |
| Reescribir subconsultas complejas | Medio | Medio |
| Añadir índices de cobertura | Alto | Medio |

Comienza con las consultas que tu aplicación ejecuta más a menudo y optimízalas. Una consulta que se ejecuta una vez por noche importa menos que una que se ejecuta 1000 veces por segundo.

## Preguntas de Práctica

1. ¿Cómo se lee un plan EXPLAIN? ¿En qué dirección (arriba-abajo o abajo-arriba)?
2. ¿Qué significa `cost=0.28..12.50` en una salida EXPLAIN?
3. ¿Cuándo elige la base de datos un escaneo secuencial sobre un escaneo de índice?
4. ¿Qué es un Bitmap Index Scan? ¿Cuándo se usa?
5. Describe los tres algoritmos de unión principales y cuándo se prefiere cada uno.
6. ¿Cuáles son las señales de alerta a buscar en un plan de ejecución?
7. Escribe una consulta EXPLAIN ANALYZE y explica cada parte de la salida.
8. ¿Qué significa `Rows Removed by Filter`? ¿Por qué es problemático un valor alto?
9. ¿Cómo identificas una consulta que se beneficiaría de un nuevo índice usando EXPLAIN?
10. ¿Cuál es la diferencia entre `planning time` y `execution time` en EXPLAIN ANALYZE?
