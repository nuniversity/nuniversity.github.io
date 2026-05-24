---
title: "Proyecto Final Intermedio: Análisis de E-Commerce"
description: "Construye y consulta una base de datos de e-commerce con pedidos, productos y clientes; escribe consultas de informes complejas usando JOINs, CTEs, subconsultas, vistas y transacciones"
order: 10
duration: "90 minutos"
difficulty: "intermedio"
---

# Proyecto Final Intermedio: Análisis de E-Commerce

En este proyecto final, construirás una capa de informes de e-commerce usando todas las habilidades de este curso: JOINs, subconsultas, CTEs, operaciones de conjunto, vistas y transacciones.

## Configuración del Esquema

```sql
-- Ejecuta para crear la base de datos del proyecto
CREATE SCHEMA IF NOT EXISTS capstone;
SET search_path TO capstone;

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    cost NUMERIC(10, 2) NOT NULL CHECK (cost > 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reorder_level INTEGER DEFAULT 10,
    discontinued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100),
    signup_date DATE DEFAULT CURRENT_DATE,
    loyalty_tier VARCHAR(20) DEFAULT 'bronze'
        CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    shipping_country VARCHAR(100),
    total_amount NUMERIC(12, 2) DEFAULT 0
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(4, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100)
);
```

### Datos de Ejemplo

```sql
INSERT INTO products (product_name, category, unit_price, cost, stock_quantity) VALUES
('Wireless Mouse', 'Electronics', 29.99, 12.00, 150),
('Mechanical Keyboard', 'Electronics', 89.99, 35.00, 80),
('USB-C Hub', 'Electronics', 49.99, 20.00, 200),
('Running Shoes', 'Sports', 120.00, 55.00, 60),
('Yoga Mat', 'Sports', 25.00, 8.00, 300),
('Resistance Bands', 'Sports', 15.00, 4.50, 500),
('Coffee Maker', 'Home', 79.99, 30.00, 45),
('Desk Lamp', 'Home', 34.99, 12.00, 120),
('Bluetooth Speaker', 'Electronics', 59.99, 22.00, 90),
('Water Bottle', 'Sports', 12.00, 3.50, 400);

INSERT INTO customers (first_name, last_name, email, country, loyalty_tier) VALUES
('Alice', 'Johnson', 'alice@email.com', 'USA', 'platinum'),
('Bob', 'Smith', 'bob@email.com', 'Canada', 'gold'),
('Carol', 'Martinez', 'carol@email.com', 'USA', 'silver'),
('Dave', 'Chen', 'dave@email.com', 'USA', 'bronze'),
('Eve', 'Wilson', 'eve@email.com', 'UK', 'gold'),
('Frank', 'Brown', 'frank@email.com', 'Canada', 'silver'),
('Grace', 'Lee', 'grace@email.com', 'Australia', 'bronze'),
('Henry', 'Kim', 'henry@email.com', 'USA', 'platinum');

INSERT INTO orders (customer_id, order_date, status, shipping_country, total_amount) VALUES
(1, '2024-01-15', 'delivered', 'USA', 179.97),
(2, '2024-01-20', 'delivered', 'Canada', 89.99),
(1, '2024-02-10', 'delivered', 'USA', 59.99),
(3, '2024-02-15', 'shipped', 'USA', 159.98),
(4, '2024-03-01', 'pending', 'USA', 29.99),
(5, '2024-03-05', 'delivered', 'UK', 145.00),
(6, '2024-03-10', 'shipped', 'Canada', 34.99),
(2, '2024-03-20', 'pending', 'Canada', 120.00),
(7, '2024-04-01', 'cancelled', 'Australia', 79.99),
(8, '2024-04-05', 'delivered', 'USA', 179.97),
(1, '2024-04-15', 'shipped', 'USA', 25.00),
(3, '2024-05-01', 'pending', 'USA', 49.99);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount) VALUES
(1, 1, 2, 29.99, 0),    (1, 4, 1, 120.00, 0),
(2, 2, 1, 89.99, 0),
(3, 9, 1, 59.99, 0),
(4, 3, 2, 49.99, 20),   (4, 5, 2, 25.00, 0),
(5, 1, 1, 29.99, 0),
(6, 4, 1, 120.00, 0),   (6, 5, 1, 25.00, 0),
(7, 8, 1, 34.99, 0),
(8, 4, 1, 120.00, 0),
(9, 7, 1, 79.99, 0),
(10, 1, 2, 29.99, 0),   (10, 5, 2, 25.00, 0),  (10, 10, 4, 12.00, 0),
(11, 5, 1, 25.00, 0),
(12, 3, 1, 49.99, 0);
```

> [!NOTE]
> Copia el esquema y los datos de ejemplo anteriores en tu entorno SQL. Todos los ejercicios del proyecto asumen que estos datos están cargados.

## Desafío 1: Resumen de Pedidos del Cliente (JOINs + Agregación)

Escribe una consulta que muestre el nombre completo de cada cliente, total de pedidos, valor vitalicio, valor medio del pedido y fecha del pedido más reciente. Incluye clientes que nunca han pedido.

```sql
-- Tu solución aquí
SELECT
    c.first_name || ' ' || c.last_name AS full_name,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS lifetime_value,
    COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
    MAX(o.order_date) AS last_order_date,
    c.loyalty_tier
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.loyalty_tier
ORDER BY lifetime_value DESC;
```

## Desafío 2: Informe de Rendimiento de Productos (Múltiples JOINs)

Muestra nombre del producto, categoría, total de unidades vendidas, ingresos totales, beneficio total (ingresos - costo * cantidad) y stock actual. Ordena por beneficio descendente.

```sql
WITH product_sales AS (
    SELECT
        p.product_id,
        p.product_name,
        p.category,
        p.stock_quantity,
        p.cost,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.quantity * oi.unit_price * (1 - oi.discount / 100)) AS revenue
    FROM products p
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id
        AND o.status != 'cancelled'
    GROUP BY p.product_id, p.product_name, p.category, p.stock_quantity, p.cost
)
SELECT
    product_name,
    category,
    units_sold,
    ROUND(revenue, 2) AS total_revenue,
    ROUND(revenue - (units_sold * cost), 2) AS total_profit,
    stock_quantity,
    CASE
        WHEN stock_quantity <= 0 THEN 'Sin Stock'
        WHEN stock_quantity < 10 THEN 'Stock Bajo'
        ELSE 'En Stock'
    END AS stock_status
FROM product_sales
ORDER BY total_profit DESC;
```

## Desafío 3: Clientes de Alto Valor (CTEs + Subconsultas)

Usa una CTE para encontrar clientes cuyo valor vitalicio excede el valor vitalicio medio de todos los clientes. Muestra su nombre, valor vitalicio y cuánto por encima de la media están.

```sql
WITH customer_ltv AS (
    SELECT
        c.customer_id,
        c.first_name || ' ' || c.last_name AS full_name,
        COALESCE(SUM(o.total_amount), 0) AS lifetime_value
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.first_name, c.last_name
),
avg_ltv AS (
    SELECT AVG(lifetime_value) AS avg_value FROM customer_ltv
)
SELECT
    cl.full_name,
    cl.lifetime_value,
    ROUND(cl.lifetime_value - al.avg_value, 2) AS por_encima_media
FROM customer_ltv cl
CROSS JOIN avg_ltv al
WHERE cl.lifetime_value > al.avg_value
ORDER BY cl.lifetime_value DESC;
```

## Desafío 4: Tendencia Mensual de Ventas (CTEs + Funciones de Ventana)

Muestra ingresos mensuales, los ingresos del mes anterior y el cambio porcentual mes a mes.

```sql
WITH monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', o.order_date)::date AS month,
        SUM(oi.quantity * oi.unit_price * (1 - oi.discount / 100)) AS revenue
    FROM orders o
    INNER JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.status != 'cancelled'
    GROUP BY DATE_TRUNC('month', o.order_date)
)
SELECT
    month,
    ROUND(revenue, 2) AS revenue,
    ROUND(LAG(revenue) OVER (ORDER BY month), 2) AS prev_month_revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY month))
        / NULLIF(LAG(revenue) OVER (ORDER BY month), 0) * 100,
        2
    ) AS mom_change_pct
FROM monthly_revenue
ORDER BY month;
```

## Desafío 5: Cross-Selling de Productos (Self-Join)

Encuentra pares de productos que se compran frecuentemente juntos en el mismo pedido. Muestra los nombres de los productos, cuántas veces aparecen juntos y ordena por frecuencia.

```sql
SELECT
    p1.product_name AS product_a,
    p2.product_name AS product_b,
    COUNT(*) AS veces_comprados_juntos
FROM order_items oi1
INNER JOIN order_items oi2
    ON oi1.order_id = oi2.order_id
    AND oi1.product_id < oi2.product_id
INNER JOIN products p1 ON oi1.product_id = p1.product_id
INNER JOIN products p2 ON oi2.product_id = p2.product_id
GROUP BY p1.product_name, p2.product_name
ORDER BY veces_comprados_juntos DESC;
```

## Desafío 6: Vista de Rendimiento por Categoría

Crea una vista que muestre ventas totales, descuento medio y número de pedidos por categoría.

```sql
CREATE OR REPLACE VIEW category_performance AS
SELECT
    p.category,
    COUNT(DISTINCT o.order_id) AS order_count,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(oi.quantity) AS units_sold,
    ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount / 100)), 2) AS revenue,
    ROUND(AVG(oi.discount), 2) AS avg_discount_pct
FROM products p
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.status != 'cancelled'
GROUP BY p.category;

-- Consultar la vista
SELECT * FROM category_performance ORDER BY revenue DESC;
```

## Desafío 7: Cumplimiento de Pedidos (Operaciones de Conjunto)

Encuentra productos que están entre los 5 primeros en unidades vendidas pero también entre los 5 últimos en stock actual (estos necesitan reabastecimiento urgente). Usa operaciones de conjunto.

```sql
WITH sales_rank AS (
    SELECT
        p.product_id,
        p.product_name,
        SUM(oi.quantity) AS units_sold,
        RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS sales_rank
    FROM products p
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY p.product_id, p.product_name
),
stock_rank AS (
    SELECT
        product_id,
        product_name,
        stock_quantity,
        RANK() OVER (ORDER BY stock_quantity ASC) AS stock_rank_asc
    FROM products
)
SELECT sr.product_name, sr.units_sold, st.stock_quantity
FROM sales_rank sr
INNER JOIN stock_rank st ON sr.product_id = st.product_id
WHERE sr.sales_rank <= 5
  AND st.stock_rank_asc <= 5
ORDER BY sr.sales_rank;
```

## Desafío 8: Actualización de Nivel de Fidelidad (Transacción)

Escribe una transacción que actualice clientes al siguiente nivel de fidelidad basado en su valor vitalicio:
- Bronze → Silver (> $100)
- Silver → Gold (> $300)
- Gold → Platinum (> $500)

```sql
BEGIN;

WITH customer_ltv AS (
    SELECT
        c.customer_id,
        c.loyalty_tier,
        COALESCE(SUM(o.total_amount), 0) AS lifetime_value
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.loyalty_tier
)
UPDATE customers c
SET loyalty_tier = CASE
    WHEN cl.lifetime_value > 500 AND cl.loyalty_tier = 'gold' THEN 'platinum'
    WHEN cl.lifetime_value > 300 AND cl.loyalty_tier = 'silver' THEN 'gold'
    WHEN cl.lifetime_value > 100 AND cl.loyalty_tier = 'bronze' THEN 'silver'
    ELSE cl.loyalty_tier
END
FROM customer_ltv cl
WHERE c.customer_id = cl.customer_id
  AND c.loyalty_tier != CASE
    WHEN cl.lifetime_value > 500 AND cl.loyalty_tier = 'gold' THEN 'platinum'
    WHEN cl.lifetime_value > 300 AND cl.loyalty_tier = 'silver' THEN 'gold'
    WHEN cl.lifetime_value > 100 AND cl.loyalty_tier = 'bronze' THEN 'silver'
    ELSE cl.loyalty_tier
  END;

-- Verificar
SELECT first_name, last_name, loyalty_tier FROM customers ORDER BY loyalty_tier;

COMMIT;
```

## Desafío 9: Análisis de Carrito Abandonado (Anti-Join + CTE)

Encuentra clientes que tienen un pedido con estado 'pending' pero ningún pedido 'delivered'. También encuentra productos que han sido pedidos pero nunca entregados.

```sql
WITH customers_with_delivery AS (
    SELECT DISTINCT customer_id
    FROM orders
    WHERE status = 'delivered'
),
pending_only_customers AS (
    SELECT DISTINCT o.customer_id
    FROM orders o
    WHERE o.status = 'pending'
      AND o.customer_id NOT IN (
          SELECT customer_id FROM customers_with_delivery
      )
)
SELECT
    c.first_name || ' ' || c.last_name AS customer_name,
    o.order_id,
    o.order_date,
    o.total_amount
FROM pending_only_customers pc
INNER JOIN customers c ON pc.customer_id = c.customer_id
INNER JOIN orders o ON c.customer_id = o.customer_id AND o.status = 'pending'
ORDER BY o.order_date;
```

```sql
-- Productos pedidos pero nunca entregados
SELECT DISTINCT p.product_name
FROM products p
WHERE p.product_id IN (
    SELECT oi.product_id
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.order_id
    WHERE o.status NOT IN ('delivered', 'cancelled')
)
EXCEPT
SELECT DISTINCT p.product_name
FROM products p
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'delivered';
```

## Desafío 10: Dashboard Ejecutivo (Vista Materializada)

Crea una vista materializada que precomputa el dashboard ejecutivo completo y luego consúltala.

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS executive_dashboard AS
WITH
order_stats AS (
    SELECT
        COUNT(*) AS total_orders,
        COUNT(DISTINCT customer_id) AS unique_customers,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_order_value
    FROM orders
    WHERE status != 'cancelled'
),
product_stats AS (
    SELECT
        COUNT(*) AS total_products,
        SUM(stock_quantity) AS total_stock_units,
        COUNT(*) FILTER (WHERE stock_quantity <= reorder_level) AS low_stock_count
    FROM products
    WHERE discontinued = false
),
customer_stats AS (
    SELECT
        COUNT(*) AS total_customers,
        COUNT(*) FILTER (WHERE loyalty_tier IN ('gold', 'platinum')) AS vip_customers
    FROM customers
)
SELECT
    CURRENT_DATE AS report_date,
    os.total_orders,
    os.unique_customers,
    ROUND(os.total_revenue, 2) AS total_revenue,
    ROUND(os.avg_order_value, 2) AS avg_order_value,
    ps.total_products,
    ps.total_stock_units,
    ps.low_stock_count,
    cs.total_customers,
    cs.vip_customers
FROM order_stats os
CROSS JOIN product_stats ps
CROSS JOIN customer_stats cs;

-- Consultarla
SELECT * FROM executive_dashboard;
```

## Desafío Final: Juntando Todo

Construye una consulta que responda: "¿Qué clientes gold y platinum han pedido en los últimos 90 días, de qué categorías compraron, y cómo se comparan sus gastos con la media de su nivel?"

```sql
WITH
target_customers AS (
    SELECT customer_id, first_name, last_name, loyalty_tier
    FROM customers
    WHERE loyalty_tier IN ('gold', 'platinum')
),
recent_orders AS (
    SELECT o.customer_id, o.order_id, o.total_amount, o.order_date
    FROM orders o
    INNER JOIN target_customers tc ON o.customer_id = tc.customer_id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
      AND o.status != 'cancelled'
),
category_spend AS (
    SELECT
        tc.customer_id,
        tc.first_name || ' ' || tc.last_name AS full_name,
        tc.loyalty_tier,
        p.category,
        SUM(oi.quantity * oi.unit_price * (1 - oi.discount / 100)) AS spend
    FROM target_customers tc
    INNER JOIN recent_orders ro ON tc.customer_id = ro.customer_id
    INNER JOIN order_items oi ON ro.order_id = oi.order_id
    INNER JOIN products p ON oi.product_id = p.product_id
    GROUP BY tc.customer_id, full_name, tc.loyalty_tier, p.category
),
tier_avg AS (
    SELECT loyalty_tier, AVG(spend) AS avg_tier_spend
    FROM category_spend
    GROUP BY loyalty_tier
)
SELECT
    cs.full_name,
    cs.loyalty_tier,
    cs.category,
    ROUND(cs.spend, 2) AS category_spend,
    ROUND(ta.avg_tier_spend, 2) AS avg_tier_spend,
    ROUND(cs.spend - ta.avg_tier_spend, 2) AS vs_tier_avg,
    CASE
        WHEN cs.spend > ta.avg_tier_spend THEN 'Por Encima de la Media'
        ELSE 'Por Debajo de la Media'
    END AS performance
FROM category_spend cs
INNER JOIN tier_avg ta ON cs.loyalty_tier = ta.loyalty_tier
ORDER BY cs.loyalty_tier, cs.spend DESC;
```

> [!SUCCESS]
> ¡Felicidades por completar el proyecto final de SQL Intermedio! Has combinado INNER JOINs, LEFT JOINs, self-joins, CTEs, subconsultas, operaciones de conjunto, vistas, vistas materializadas y transacciones para construir una capa completa de análisis de e-commerce. Estos patrones se traducen directamente al trabajo real con datos.

## Preguntas de Práctica

1. Escribe una consulta que muestre los 3 principales productos por ingresos en cada categoría.
2. Encuentra clientes cuyo valor vitalicio está en el 20% superior de todos los clientes.
3. Escribe una CTE que calcule los ingresos totales acumulados por mes.
4. Crea una vista llamada `active_customers` mostrando clientes con al menos un pedido en los últimos 6 meses.
5. Escribe una consulta que use UNION ALL para combinar ventas del año actual y del año anterior con una columna `year`.
6. Encuentra productos que nunca han sido pedidos (anti-join).
7. Escribe una transacción que realice un nuevo pedido: inserta en orders, inserta order_items y actualiza el stock del inventario.
8. Crea una vista materializada para ingresos diarios por categoría. ¿Qué estrategia de actualización usarías?
9. Escribe una consulta de self-join en `customers` para encontrar clientes del mismo país que se registraron en el mismo mes.
10. Construye la consulta completa del dashboard ejecutivo del Desafío 10 y explica cada componente.
