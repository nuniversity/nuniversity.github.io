---
title: "Projeto Final Intermediário: Análise de E-Commerce"
description: "Construa e consulte um banco de dados de e-commerce com pedidos, produtos e clientes; escreva consultas de relatórios complexas usando JOINs, CTEs, subconsultas, views e transações"
order: 10
duration: "90 minutos"
difficulty: "intermediário"
---

# Projeto Final Intermediário: Análise de E-Commerce

Neste projeto final, você construirá uma camada de relatórios de e-commerce usando todas as habilidades deste curso: JOINs, subconsultas, CTEs, operações de conjunto, views e transações.

## Configuração do Esquema

```sql
-- Execute para criar o banco de dados do projeto
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

### Dados de Exemplo

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
> Copie o esquema e os dados de exemplo acima para seu ambiente SQL. Todos os exercícios do projeto assumem que estes dados estão carregados.

## Desafio 1: Resumo de Pedidos do Cliente (JOINs + Agregação)

Escreva uma consulta que mostre o nome completo de cada cliente, total de pedidos, valor vitalício, valor médio do pedido e data do pedido mais recente. Inclua clientes que nunca pediram.

```sql
-- Sua solução aqui
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

## Desafio 2: Relatório de Desempenho de Produtos (Múltiplos JOINs)

Mostre nome do produto, categoria, total de unidades vendidas, receita total, lucro total (receita - custo * quantidade) e estoque atual. Ordene por lucro decrescente.

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
        WHEN stock_quantity <= 0 THEN 'Fora de Estoque'
        WHEN stock_quantity < 10 THEN 'Estoque Baixo'
        ELSE 'Em Estoque'
    END AS stock_status
FROM product_sales
ORDER BY total_profit DESC;
```

## Desafio 3: Clientes de Alto Valor (CTEs + Subconsultas)

Use uma CTE para encontrar clientes cujo valor vitalício excede o valor vitalício médio de todos os clientes. Mostre seu nome, valor vitalício e quanto acima da média estão.

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
    ROUND(cl.lifetime_value - al.avg_value, 2) AS acima_da_media
FROM customer_ltv cl
CROSS JOIN avg_ltv al
WHERE cl.lifetime_value > al.avg_value
ORDER BY cl.lifetime_value DESC;
```

## Desafio 4: Tendência Mensal de Vendas (CTEs + Funções de Janela)

Mostre receita mensal, a receita do mês anterior e a variação percentual mês a mês.

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

## Desafio 5: Cross-Selling de Produtos (Self-Join)

Encontre pares de produtos que são frequentemente comprados juntos no mesmo pedido. Mostre os nomes dos produtos, quantas vezes aparecem juntos e ordene por frequência.

```sql
SELECT
    p1.product_name AS product_a,
    p2.product_name AS product_b,
    COUNT(*) AS vezes_comprados_juntos
FROM order_items oi1
INNER JOIN order_items oi2
    ON oi1.order_id = oi2.order_id
    AND oi1.product_id < oi2.product_id
INNER JOIN products p1 ON oi1.product_id = p1.product_id
INNER JOIN products p2 ON oi2.product_id = p2.product_id
GROUP BY p1.product_name, p2.product_name
ORDER BY vezes_comprados_juntos DESC;
```

## Desafio 6: View de Desempenho por Categoria

Crie uma view que mostre vendas totais, desconto médio e número de pedidos por categoria.

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

-- Consultar a view
SELECT * FROM category_performance ORDER BY revenue DESC;
```

## Desafio 7: Atendimento de Pedidos (Operações de Conjunto)

Encontre produtos que estão entre os 5 primeiros em unidades vendidas mas também entre os 5 últimos em estoque atual (estes precisam de reabastecimento urgente). Use operações de conjunto.

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

## Desafio 8: Upgrade de Nível de Fidelidade (Transação)

Escreva uma transação que atualize clientes para o próximo nível de fidelidade baseado em seu valor vitalício:
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

## Desafio 9: Análise de Carrinho Abandonado (Anti-Join + CTE)

Encontre clientes que têm um pedido com status 'pending' mas nenhum pedido 'delivered'. Também encontre produtos que foram pedidos mas nunca entregues.

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
-- Produtos pedidos mas nunca entregues
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

## Desafio 10: Dashboard Executivo (Materialized View)

Crie uma materialized view que pré-computa o dashboard executivo completo e então a consulte.

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

-- Consultá-la
SELECT * FROM executive_dashboard;
```

## Desafio Final: Juntando Tudo

Construa uma consulta que responda: "Quais clientes gold e platinum pediram nos últimos 90 dias, de quais categorias compraram, e como seus gastos se comparam à média de seu nível?"

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
        WHEN cs.spend > ta.avg_tier_spend THEN 'Acima da Média'
        ELSE 'Abaixo da Média'
    END AS performance
FROM category_spend cs
INNER JOIN tier_avg ta ON cs.loyalty_tier = ta.loyalty_tier
ORDER BY cs.loyalty_tier, cs.spend DESC;
```

> [!SUCCESS]
> Parabéns por completar o projeto final de SQL Intermediário! Você combinou INNER JOINs, LEFT JOINs, self-joins, CTEs, subconsultas, operações de conjunto, views, materialized views e transações para construir uma camada completa de análise de e-commerce. Estes padrões se traduzem diretamente para o trabalho real com dados.

## Perguntas de Prática

1. Escreva uma consulta que mostre os 3 principais produtos por receita em cada categoria.
2. Encontre clientes cujo valor vitalício está nos 20% superiores de todos os clientes.
3. Escreva uma CTE que calcule a receita total acumulada por mês.
4. Crie uma view chamada `active_customers` mostrando clientes com pelo menos um pedido nos últimos 6 meses.
5. Escreva uma consulta que use UNION ALL para combinar vendas do ano atual e do ano anterior com uma coluna `year`.
6. Encontre produtos que nunca foram pedidos (anti-join).
7. Escreva uma transação que faça um novo pedido: insira em orders, insira order_items e atualize o estoque do inventário.
8. Crie uma materialized view para receita diária por categoria. Qual estratégia de atualização você usaria?
9. Escreva uma consulta de self-join em `customers` para encontrar clientes do mesmo país que se inscreveram no mesmo mês.
10. Construa a consulta completa do dashboard executivo do Desafio 10 e explique cada componente.
