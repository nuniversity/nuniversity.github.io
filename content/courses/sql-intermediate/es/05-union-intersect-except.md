---
title: "UNION, INTERSECT y EXCEPT"
description: "Domina UNION, UNION ALL, INTERSECT, EXCEPT/MINUS y ordenación de operaciones de conjunto en SQL"
order: 5
duration: "40 minutos"
difficulty: "intermedio"
---

# UNION, INTERSECT y EXCEPT

Las operaciones de conjunto combinan resultados de múltiples declaraciones SELECT. A diferencia de los JOINs que combinan columnas horizontalmente, las operaciones de conjunto apilan o comparan filas verticalmente.

## Reglas para Operaciones de Conjunto

Toda operación de conjunto sigue las mismas reglas:

1. Mismo número de columnas en todas las declaraciones SELECT.
2. Las columnas correspondientes deben tener tipos de datos compatibles.
3. Los nombres de columna provienen del primer SELECT.
4. ORDER BY se aplica solo al resultado final.

```sql
SELECT column1, column2, column3 FROM table1
UNION
SELECT col_a, col_b, col_c FROM table2
ORDER BY column1;
```

> [!WARNING]
> Los nombres de columna y alias en la segunda declaración SELECT y siguientes se ignoran. El resultado usa los nombres de columna del primer SELECT.

## UNION

UNION combina resultados de dos o más consultas y elimina duplicados.

```sql
-- Clientes y empleados en una sola lista de correo
SELECT name, email, 'Cliente' AS source
FROM customers
UNION
SELECT name, email, 'Empleado' AS source
FROM employees
ORDER BY name;
```

| name | email | source |
|------|-------|--------|
| Alice | alice@example.com | Cliente |
| Bob | bob@work.com | Empleado |
| Carol | carol@example.com | Cliente |

Si una persona es tanto cliente como empleado, aparece una vez.

## UNION ALL

UNION ALL combina resultados sin eliminar duplicados. Es más rápido que UNION porque omite el paso de deduplicación.

```sql
-- Registro de eventos total (duplicados preservados)
SELECT event_type, event_time, 'web' AS source
FROM web_events
WHERE event_time >= '2024-01-01'
UNION ALL
SELECT event_type, event_time, 'mobile' AS source
FROM mobile_events
WHERE event_time >= '2024-01-01'
ORDER BY event_time;
```

> [!NOTE]
| UNION | UNION ALL |
|-------|-----------|
| Elimina duplicados | Preserva duplicados |
| Ordena internamente (dedup) | Solo anexa |
| Más lento en conjuntos grandes | Más rápido — sin overhead de ordenación |
| Úsalo cuando quieras filas distintas | Úsalo cuando los duplicados sean aceptables o deseados |

### UNION vs UNION ALL: Rendimiento

```sql
-- 1M filas cada una de dos tablas
-- UNION: 1.8s (paso de dedup requiere ordenación/hash)
-- UNION ALL: 0.3s (concatenación simple)

EXPLAIN ANALYZE
SELECT * FROM large_table_1
UNION
SELECT * FROM large_table_2;
-- vs
EXPLAIN ANALYZE
SELECT * FROM large_table_1
UNION ALL
SELECT * FROM large_table_2;
```

## INTERSECT

INTERSECT devuelve solo las filas que aparecen en ambos conjuntos de resultados (con duplicados eliminados).

```sql
-- Productos que han sido tanto vistos COMO comprados
SELECT product_id
FROM page_views
WHERE view_date >= '2024-01-01'
INTERSECT
SELECT product_id
FROM purchases
WHERE purchase_date >= '2024-01-01';
```

```sql
-- Clientes que han pedido ambas categorías
SELECT customer_id
FROM orders
WHERE category = 'Electronics'
INTERSECT
SELECT customer_id
FROM orders
WHERE category = 'Books';
```

> [!NOTE]
> INTERSECT es equivalente a un INNER JOIN con DISTINCT en la columna de unión. Usa el que sea más legible para tu caso de uso.

## EXCEPT / MINUS

EXCEPT devuelve filas de la primera consulta que **no** aparecen en la segunda consulta (con duplicados eliminados).

```sql
-- Productos que nunca se han vendido
SELECT product_id
FROM products
EXCEPT
SELECT product_id
FROM order_items;
```

```sql
-- Clientes con cuentas pero sin pedidos en los últimos 90 días
SELECT customer_id
FROM customers
WHERE status = 'active'
EXCEPT
SELECT customer_id
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days';
```

> [!NOTE]
> Oracle usa `MINUS` en lugar de `EXCEPT`. PostgreSQL, SQL Server, Snowflake y DuckDB usan `EXCEPT`. Ambos significan lo mismo.

## Orden de Operaciones de Conjunto y Paréntesis

Sin paréntesis, las operaciones de conjunto se evalúan de arriba a abajo. Usa paréntesis para controlar el orden de evaluación.

```sql
-- UNION de dos resultados de INTERSECT
(
    SELECT product_id FROM electronics_products
    INTERSECT
    SELECT product_id FROM top_selling_products
)
UNION
(
    SELECT product_id FROM clothing_products
    INTERSECT
    SELECT product_id FROM top_selling_products
);
```

```sql
-- Sin paréntesis: los tres se unen, luego se intersectan
SELECT product_id FROM electronics_products
UNION
SELECT product_id FROM clothing_products
INTERSECT
SELECT product_id FROM top_selling_products;
```

| Expresión | Significado |
|------------|---------|
| `A UNION B INTERSECT C` | `A UNION (B INTERSECT C)` — INTERSECT tiene precedencia |
| `(A UNION B) INTERSECT C` | Union primero, luego intersect (sobrescribir con paréntesis) |

> [!WARNING]
> INTERSECT tiene precedencia sobre UNION en el estándar SQL. Usa siempre paréntesis para hacer tu intención explícita — esta es un área donde la claridad importa más que la brevedad.

## Patrones Prácticos

### Combinando Datos Históricos y Actuales

```sql
-- Datos maestros de clientes de sistemas legado y actual
SELECT id, name, email, 'legado' AS system
FROM customers_archive
WHERE status = 'active'
UNION ALL
SELECT id, name, email, 'actual' AS system
FROM customers
WHERE status = 'active'
ORDER BY name;
```

### Encontrando Vacíos

```sql
-- IDs de empleados faltantes (ej.: empleados despedidos cuyos registros fueron eliminados)
SELECT generate_series(1, 1000) AS employee_id
EXCEPT
SELECT employee_id FROM employees;
```

### Informes entre Bases de Datos

```sql
-- Combinar datos de ventas de múltiples regiones (bases de datos separadas)
SELECT 'América del Norte' AS region, SUM(amount) AS total_sales
FROM na_sales
WHERE year = 2024
UNION ALL
SELECT 'Europa', SUM(amount)
FROM eu_sales
WHERE year = 2024
UNION ALL
SELECT 'Asia Pacífico', SUM(amount)
FROM apac_sales
WHERE year = 2024
ORDER BY total_sales DESC;
```

## Ejemplo Real: Informe de Participación de Usuario

```sql
WITH
-- Usuarios que visitaron el sitio
visitors AS (
    SELECT DISTINCT user_id
    FROM sessions
    WHERE session_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Usuarios que agregaron al carrito
cart_adders AS (
    SELECT DISTINCT user_id
    FROM cart_events
    WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Usuarios que compraron
purchasers AS (
    SELECT DISTINCT user_id
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Usuarios que visitaron Y agregaron al carrito (pero no compraron)
abandoned_cart AS (
    SELECT user_id FROM visitors
    INTERSECT
    SELECT user_id FROM cart_adders
    EXCEPT
    SELECT user_id FROM purchasers
)
SELECT COUNT(*) AS abandoned_cart_users
FROM abandoned_cart;
```

| Operación de Conjunto | Comportamiento | Duplicados | Costo de Rendimiento |
|---------------|----------|------------|-----------------|
| UNION | Combina, deduplica | Eliminados | Más alto |
| UNION ALL | Combina, anexa bruto | Preservados | Más bajo |
| INTERSECT | Solo filas comunes | Eliminados | Más alto |
| EXCEPT | Primera menos segunda | Eliminados | Más alto |

> [!SUCCESS]
> UNION ALL es tu aliado para combinar datos similares (registros, datos multirregionales). Usa UNION, INTERSECT y EXCEPT para lógica basada en conjuntos. Cuando tengas dudas sobre el orden de evaluación, usa paréntesis.

## Preguntas de Práctica

1. ¿Cuáles son las tres reglas que toda consulta de operación de conjunto debe seguir?
2. ¿Cuál es la diferencia entre UNION y UNION ALL? ¿Cuál es más rápido?
3. Escribe una consulta usando UNION ALL para combinar las tablas `sales_2023` y `sales_2024`. Añade una columna `year` para distinguirlas.
4. ¿Qué hace INTERSECT? ¿En qué se diferencia de un INNER JOIN?
5. Escribe una consulta que encuentre IDs de productos que fueron pedidos en el T1 pero NO en el T2.
6. ¿`A UNION B INTERSECT C` significa lo mismo que `(A UNION B) INTERSECT C`? Explica.
7. Escribe una consulta que use tanto INTERSECT como UNION para encontrar clientes que compraron de las categorías Electrónicos y Ropa, combinados con clientes que compraron de las categorías Libros y Hogar.
8. ¿Cuál es el equivalente Oracle de EXCEPT?
9. Escribe una consulta que encuentre todos los IDs de clientes de `customers` menos aquellos de `inactive_customers`.
10. ¿Cómo funciona ORDER BY con las operaciones de conjunto? ¿Dónde deberías colocarlo?
