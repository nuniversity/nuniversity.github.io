---
title: "Estrategias de Indexación"
description: "Domina CREATE INDEX, índices compuestos, índices de cobertura, B-tree vs hash y fundamentos de EXPLAIN"
order: 6
duration: "50 minutos"
difficulty: "intermedio"
---

# Estrategias de Indexación

Los índices son estructuras de datos que aceleran la recuperación de datos a costa de escrituras más lentas y mayor almacenamiento. Entender la indexación es esencial para construir aplicaciones de base de datos con buen rendimiento.

## Cómo Funcionan los Índices

Sin un índice, la base de datos realiza un escaneo secuencial — leyendo cada fila de la tabla. Con un índice, la base de datos navega en un árbol (típicamente B+Tree) para encontrar filas en tiempo logarítmico.

```
Escaneo Completo:  [Fila 1] [Fila 2] [Fila 3] ... [Fila 1,000,000]
                   └── Leer todas las filas ──┘

Búsqueda por Índice: Raíz ──> Rama ──> Hoja ──> Heap (datos de la fila)
                     4 I/Os vs 1,000,000 I/Os
```

> [!NOTE]
> Un índice en una tabla de 1M filas típicamente requiere ~3-5 niveles de B+Tree, significando 3-5 lecturas de disco para encontrar cualquier fila. Un escaneo completo leería 1M filas.

## CREATE INDEX

```sql
-- Índice básico en una sola columna
CREATE INDEX idx_employees_last_name
ON employees(last_name);

-- Índice único (impone unicidad, actúa como restricción)
CREATE UNIQUE INDEX idx_employees_email
ON employees(email);

-- Índice en una expresión
CREATE INDEX idx_customers_lower_email
ON customers(LOWER(email));

-- Índice parcial (solo indexa filas relevantes)
CREATE INDEX idx_orders_active
ON orders(order_date)
WHERE status = 'active';
```

| Tipo de Índice | Caso de Uso |
|------------|----------|
| B-tree (predeterminado) | Consultas de igualdad y rango |
| Hash | Solo igualdad (más rápido para coincidencia exacta) |
| GiST | Búsqueda de texto completo, datos geométricos |
| GIN | Arrays, JSONB, búsqueda de texto completo |
| BRIN | Tablas grandes físicamente ordenadas |

> [!NOTE]
> La mayoría de las bases de datos usan B-tree como predeterminado, que es adecuado para igualdad (`=`), rango (`>`, `<`, `BETWEEN`) y consultas `ORDER BY`.

## Índices Compuestos

Un índice compuesto cubre múltiples columnas. El orden de las columnas importa enormemente.

```sql
-- Índice compuesto en (country, city)
CREATE INDEX idx_customers_country_city
ON customers(country, city);
```

### Mejores Prácticas de Orden de Columnas

```sql
-- Consulta: Encontrar clientes en EE.UU. de Nueva York
SELECT * FROM customers
WHERE country = 'USA' AND city = 'New York';
--  Funciona: ambas columnas en el índice, igualdad en ambas

-- Consulta: Encontrar todos los clientes en EE.UU.
SELECT * FROM customers
WHERE country = 'USA';
--  Funciona: la columna más a la izquierda está filtrada

-- Consulta: Encontrar clientes llamados 'New York' en cualquier país
SELECT * FROM customers
WHERE city = 'New York';
--  Falla: la columna más a la izquierda (country) no está filtrada
```

| Regla | Ejemplo |
|------|---------|
| Coloca columnas de igualdad primero | `WHERE country = 'USA' AND city = 'NY'` → índice en `(country, city)` |
| Coloca columnas de rango al final | `WHERE country = 'USA' AND age > 21` → índice en `(country, age)` |
| Columna más selectiva primero | Columna con más valores distintos primero |

```sql
-- Bueno: la selectividad guía el orden
CREATE INDEX idx_orders_customer_date
ON orders(customer_id, order_date);
--  customer_id tiene 10K valores distintos, order_date tiene 365

-- Malo: orden invertido
CREATE INDEX idx_orders_date_customer
ON orders(order_date, customer_id);
--  El rango en date no puede restringir efectivamente antes de customer_id
```

## Índices de Cobertura

Un índice de cobertura contiene todas las columnas necesarias para una consulta, eliminando la necesidad de leer la tabla (heap) por completo.

```sql
-- Sin cobertura: leer índice + leer fila de la tabla
EXPLAIN SELECT name, email FROM employees WHERE department_id = 5;
-- Index Scan on idx_emp_dept → Búsqueda en Heap para name, email

-- Índice de cobertura: todo en el índice
CREATE INDEX idx_emp_dept_covering
ON employees(department_id) INCLUDE (name, email);

EXPLAIN SELECT name, email FROM employees WHERE department_id = 5;
-- Index Only Scan — sin acceso al heap necesario
```

> [!SUCCESS]
| Escenario | Índice Regular | Índice de Cobertura |
|----------|--------------|----------------|
| `SELECT *` | Debe buscar heap | Debe buscar heap |
| `SELECT columnas_indexadas` | Búsqueda heap | Index-only |
| Rendimiento de escritura | Ligero overhead | Más overhead |
| Espacio en disco | Menos | Más |

Usa `INCLUDE` para columnas que se devuelven pero no se usan en condiciones de búsqueda/filtro.

## Índices B-Tree vs Hash

```sql
-- B-tree (predeterminado para la mayoría de bases de datos)
CREATE INDEX idx_btree ON products(price);
-- Soporta: =, >, <, >=, <=, BETWEEN, LIKE (prefijo sin comodín)

-- Hash (solo coincidencia exacta, pero más rápido para eso)
CREATE INDEX idx_hash ON products(price) USING HASH;
-- Soporta: = solamente
```

| Característica | B-Tree | Hash |
|---------|--------|------|
| Igualdad | Rápido | Más rápido |
| Consultas de rango | Soportadas | No soportadas |
| ORDER BY | Puede devolver ordenado | Sin ordenación |
| LIKE 'prefijo%' | Soportado | No soportado |
| Uso de disco | Moderado | Generalmente menor |
| Tiempo de construcción | Moderado | Más rápido |

> [!WARNING]
> Los índices Hash no eran seguros contra fallos en versiones antiguas de PostgreSQL. Ahora tienen WAL logging y son seguros. Verifica siempre la implementación específica de tu base de datos antes de usar índices hash en producción.

## Fundamentos de EXPLAIN

EXPLAIN muestra cómo la base de datos planea ejecutar una consulta.

```sql
EXPLAIN SELECT * FROM employees WHERE department_id = 5;

-- Ejemplo de salida:
-- Seq Scan on employees  (cost=0.00..1834.00 rows=1 width=36)
--   Filter: (department_id = 5)
```

Con un índice:

```sql
CREATE INDEX idx_emp_dept ON employees(department_id);

EXPLAIN SELECT * FROM employees WHERE department_id = 5;

-- Salida:
-- Index Scan using idx_emp_dept on employees  (cost=0.28..4.29 rows=1 width=36)
--   Index Cond: (department_id = 5)
```

### EXPLAIN ANALYZE

EXPLAIN ANALYZE realmente ejecuta la consulta y muestra tiempos reales.

```sql
EXPLAIN ANALYZE SELECT * FROM employees WHERE department_id = 5;

-- Salida:
-- Index Scan using idx_emp_dept on employees
--   (cost=0.28..4.29 rows=1 width=36)
--   (actual time=0.015..0.016 rows=1 loops=1)
--   Index Cond: (department_id = 5)
-- Planning Time: 0.068 ms
-- Execution Time: 0.030 ms
```

| Término | Significado |
|------|---------|
| `cost=0.28..4.29` | Costo estimado (inicio..total) |
| `rows=1` | Filas estimadas devueltas |
| `width=36` | Ancho estimado de la fila en bytes |
| `actual time=0.015..0.016` | Tiempo real de ejecución |
| `loops=1` | Veces que el nodo se ejecutó |

## Cuándo NO Indexar

| Escenario | Motivo |
|----------|--------|
| Tablas pequeñas (< 1000 filas) | Escaneo completo es más rápido que overhead de índice |
| Columnas de baja cardinalidad (gender, boolean) | El índice no filtra lo suficiente |
| Columnas raramente usadas en WHERE/JOIN | El índice no se usa, desperdicia espacio |
| Tablas con muchas escrituras | Mantenimiento del índice ralentiza INSERT/UPDATE/DELETE |
| Consultas `LIKE '%texto%'` (prefijo comodín) | B-tree no puede ayudar |

```sql
-- Índice malo: baja cardinalidad
CREATE INDEX idx_employees_gender ON employees(gender);
-- Solo 2 valores distintos — la base de datos seguirá escaneando

-- Índice bueno: alta cardinalidad
CREATE INDEX idx_employees_ssn ON employees(ssn);
-- Millones de valores distintos — altamente selectivo
```

## Ejemplo Real: Optimización de Consulta de E-Commerce

```sql
-- Consulta lenta (sin índice útil)
SELECT order_id, customer_id, total, order_date
FROM orders
WHERE status = 'pending'
  AND order_date >= '2024-01-01'
  AND order_date < '2024-02-01'
ORDER BY total DESC;

-- Escaneo secuencial en orders (lento)

-- Índice optimizado
CREATE INDEX idx_orders_status_date_total
ON orders(status, order_date DESC, total DESC)
INCLUDE (customer_id);

-- Ahora: Index Only Scan, rápido
```

> [!SUCCESS]
> Los índices son compromisos. Cada índice acelera lecturas pero ralentiza escrituras. Comienza con índices en claves primarias y claves foráneas usadas en JOINs, luego añade índices basándote en tus consultas más lentas. Mide antes y después.

## Preguntas de Práctica

1. ¿Qué es un índice B-tree y qué operaciones soporta?
2. Escribe una declaración CREATE INDEX para una tabla `employees` en la columna `last_name`.
3. ¿Qué es un índice compuesto? ¿Por qué importa el orden de las columnas?
4. Dado `WHERE country = 'Canada' AND status = 'active' AND created_at > '2024-01-01'`, ¿qué índice compuesto crearías?
5. ¿Qué es un índice de cobertura? ¿En qué se diferencia de un índice regular?
6. ¿Cuándo usarías un índice hash en lugar de un índice B-tree?
7. ¿Cuál es la diferencia entre EXPLAIN y EXPLAIN ANALYZE?
8. ¿Qué significa `Index Only Scan` en una salida de EXPLAIN?
9. Enumera tres situaciones donde NO debes crear un índice.
10. Escribe un índice de cobertura para la consulta `SELECT first_name, last_name FROM employees WHERE department_id = 10`.
