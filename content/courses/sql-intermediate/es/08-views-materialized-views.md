---
title: "Vistas y Vistas Materializadas"
description: "Domina CREATE VIEW, vistas actualizables, WITH CHECK OPTION, vistas materializadas y estrategias de actualización"
order: 8
duration: "45 minutos"
difficulty: "intermedio"
---

# Vistas y Vistas Materializadas

Una vista es una consulta guardada que se comporta como una tabla virtual. Una vista materializada almacena el resultado de la consulta físicamente. Ambas simplifican consultas complejas y añaden una capa de abstracción.

## Creando Vistas

```sql
CREATE VIEW active_customers AS
SELECT
    customer_id,
    first_name,
    last_name,
    email,
    created_at
FROM customers
WHERE status = 'active'
  AND deleted_at IS NULL;
```

Una vez creada, consúltala como una tabla:

```sql
SELECT * FROM active_customers
WHERE created_at >= '2024-01-01'
ORDER BY last_name;
```

> [!NOTE]
> Una vista es solo una consulta almacenada. No tiene datos propios — cada consulta contra una vista ejecuta el SELECT subyacente. Las tablas referenciadas en una vista se llaman tablas base.

### ¿Por Qué Usar Vistas?

| Beneficio | Descripción |
|---------|-------------|
| Simplificación | Encapsula JOINs y agregaciones complejas |
| Seguridad | Restringe acceso a columnas o filas específicas |
| Consistencia | Estandariza consultas en toda la organización |
| Abstracción | Protege usuarios de cambios en el esquema |
| Reutilización | Escribe una vez, consulta muchas veces |

```sql
-- Vista amigable para negocios
CREATE VIEW monthly_sales_report AS
SELECT
    d.department_name,
    EXTRACT(YEAR FROM o.order_date) AS year,
    EXTRACT(MONTH FROM o.order_date) AS month,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(oi.quantity * oi.unit_price) AS total_revenue
FROM departments d
INNER JOIN employees e ON d.department_id = e.department_id
INNER JOIN orders o ON e.employee_id = o.sales_rep_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY d.department_name, year, month;
```

## Vistas Actualizables

Las vistas simples pueden soportar INSERT, UPDATE y DELETE. La vista debe cumplir ciertas condiciones:

```sql
-- Vista actualizable: tabla única, sin agregación
CREATE VIEW active_products AS
SELECT product_id, product_name, price, category_id
FROM products
WHERE discontinued = false;

-- Estas modifican la tabla products subyacente
INSERT INTO active_products (product_name, price, category_id)
VALUES ('Widget Pro', 29.99, 1);

UPDATE active_products
SET price = 24.99
WHERE product_id = 101;

DELETE FROM active_products
WHERE product_id = 101;
```

Una vista es actualizable cuando:
- Referencia una sola tabla base (sin JOINs)
- No usa DISTINCT, GROUP BY, HAVING o funciones de ventana
- No usa operaciones de conjunto (UNION, INTERSECT, EXCEPT)
- No usa funciones de agregación

> [!WARNING]
| Patrón No Actualizable | Motivo |
|-----------------------|--------|
| `CREATE VIEW v AS SELECT ... FROM a JOIN b` | Múltiples tablas base |
| `CREATE VIEW v AS SELECT DISTINCT ...` | No puede mapear de vuelta a una sola fila |
| `CREATE VIEW v AS SELECT SUM(...)` | Agregación — sin identidad de fila |
| `CREATE VIEW v AS SELECT ... UNION ...` | Múltiples fuentes |

## WITH CHECK OPTION

WITH CHECK OPTION previene INSERTs y UPDATEs que harían desaparecer filas de la vista.

```sql
CREATE VIEW high_value_orders AS
SELECT order_id, customer_id, total, order_date
FROM orders
WHERE total >= 1000
WITH CHECK OPTION;

-- Esto funciona:
INSERT INTO high_value_orders (order_id, customer_id, total, order_date)
VALUES (1001, 42, 1500.00, '2024-01-15');

-- Esto FALLA (total < 1000 haría la fila invisible):
INSERT INTO high_value_orders (order_id, customer_id, total, order_date)
VALUES (1002, 42, 500.00, '2024-01-15');
-- ERROR: new row violates WITH CHECK OPTION for view "high_value_orders"
```

| Opción | Comportamiento |
|--------|----------|
| `WITH CHECK OPTION` | Rechaza cambios que violan la cláusula WHERE de la vista |
| `WITH CASCADED CHECK OPTION` | Se aplica a todas las vistas subyacentes (predeterminado) |
| `WITH LOCAL CHECK OPTION` | Se aplica solo a la vista actual |

## Vistas Materializadas

Las vistas materializadas almacenan el resultado de la consulta físicamente. Intercambian frescura por velocidad.

```sql
-- PostgreSQL / Oracle / Snowflake
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT
    order_date,
    product_id,
    SUM(quantity) AS units_sold,
    SUM(quantity * unit_price) AS revenue
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
GROUP BY order_date, product_id
WITH DATA;
```

```sql
-- Consultar una vista materializada (rápido — datos precomputados)
SELECT * FROM daily_sales_summary
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';
```

### Actualizando Vistas Materializadas

A diferencia de las vistas regulares, las vistas materializadas se desactualizan y deben actualizarse.

```sql
-- PostgreSQL: reemplazar todos los datos
REFRESH MATERIALIZED VIEW daily_sales_summary;

-- PostgreSQL: actualización concurrente (no bloquea lectores)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
```

| Estrategia de Actualización | Comportamiento | Bloqueo de Tabla | Requiere Índice Único |
|-----------------|----------|--------------|----------------------|
| Estándar | Reemplaza todos los datos | Bloquea lecturas | No |
| Concurrente | Reemplaza incrementalmente | No bloquea | Sí |
| Programada (cron) | Actualiza en intervalos | Depende | Depende |
| Basada en disparador | Actualiza en cambio de datos | Variable | No |

> [!NOTE]
> `REFRESH MATERIALIZED VIEW CONCURRENTLY` requiere un índice único en la vista materializada. Crea una versión temporal y la intercambia, permitiendo lecturas durante la actualización.

### Estrategias de Actualización

```sql
-- 1. Programada con cron/pg_cron
SELECT cron.schedule('refresh-sales', '0 6 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary'
);

-- 2. Actualización manual después de ETL
-- (en tu script de pipeline)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;

-- 3. Basada en disparador (función PostgreSQL)
CREATE FUNCTION refresh_sales_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_sales
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT EXECUTE FUNCTION refresh_sales_view();
```

> [!WARNING]
> Las actualizaciones basadas en disparador en cada escritura pueden destruir el rendimiento. Usa actualizaciones programadas a menos que necesites datos casi en tiempo real y tengas bajo volumen de escritura.

## Vistas vs Vistas Materializadas

| Aspecto | Vista | Vista Materializada |
|--------|------|-------------------|
| Almacenamiento | Ninguno (solo consulta) | Almacena datos en disco |
| Velocidad | Más lenta (ejecuta consulta cada vez) | Rápida (precomputada) |
| Actualización | Siempre actual | Desactualizada hasta refrescar |
| Indexable | No | Sí |
| Espacio | Ninguno | Usa espacio en disco |
| Actualizable | A veces | No (solo refresh) |

```sql
-- Cuándo usar cada una

-- Vista regular: siempre actual, abstracción simple
CREATE VIEW current_employee_details AS
SELECT e.*, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- Vista materializada: agregación compleja, rendimiento de consulta crítico
CREATE MATERIALIZED VIEW monthly_category_revenue AS
SELECT
    c.category_name,
    DATE_TRUNC('month', o.order_date) AS month,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM categories c
INNER JOIN products p ON c.category_id = p.category_id
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
GROUP BY c.category_name, month;
```

## Ejemplo Real: Capa de Informes

```sql
-- 1. Vistas base para seguridad
CREATE VIEW customer_safe AS
SELECT customer_id, first_name, last_name, country
FROM customers;  -- excluye email, phone, ssn

-- 2. Vistas materializadas agregadas para dashboards
CREATE MATERIALIZED VIEW dashboard_kpi AS
SELECT
    COUNT(DISTINCT o.customer_id) AS active_customers,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total) AS total_revenue,
    AVG(o.total) AS avg_order_value,
    MAX(o.order_date) AS last_order_date
FROM orders o
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
WITH DATA;

-- 3. Actualizar en horas de baja demanda
-- Programar: REFRESH MATERIALIZED VIEW dashboard_kpi a las 3 AM diariamente
```

> [!SUCCESS]
> Las vistas son para abstracción y seguridad. Las vistas materializadas son para rendimiento. Usa vistas regulares para simplificar código y ocultar complejidad. Usa vistas materializadas cuando necesites acceso rápido a datos precomputados y puedas tolerar cierta desactualización.

## Preguntas de Práctica

1. ¿Qué es una vista? ¿Almacena datos?
2. Escribe una declaración CREATE VIEW para `recent_orders` mostrando pedidos de los últimos 7 días.
3. ¿Cuándo es actualizable una vista? ¿Qué operaciones se soportan?
4. ¿Qué hace WITH CHECK OPTION? Escribe una consulta que fallaría por su causa.
5. ¿Qué es una vista materializada y en qué se diferencia de una vista regular?
6. Escribe una consulta que cree una vista materializada resumiendo ventas totales por categoría de producto.
7. ¿Qué hace `REFRESH MATERIALIZED VIEW CONCURRENTLY`? ¿Cuándo lo usarías?
8. ¿Cuál es el compromiso entre las vistas regulares y las vistas materializadas?
9. Escribe una vista regular que oculte columnas sensibles (ej.: `salary`, `ssn`) de los usuarios.
10. Describe tres estrategias para actualizar vistas materializadas. ¿Cuál es mejor para datos casi en tiempo real?
