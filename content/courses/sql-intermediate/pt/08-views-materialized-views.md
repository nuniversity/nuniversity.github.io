---
title: "Views e Materialized Views"
description: "Domine CREATE VIEW, views atualizáveis, WITH CHECK OPTION, materialized views e estratégias de atualização"
order: 8
duration: "45 minutos"
difficulty: "intermediário"
---

# Views e Materialized Views

Uma view é uma consulta salva que se comporta como uma tabela virtual. Uma materialized view armazena o resultado da consulta fisicamente. Ambas simplificam consultas complexas e adicionam uma camada de abstração.

## Criando Views

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

Uma vez criada, consulte-a como uma tabela:

```sql
SELECT * FROM active_customers
WHERE created_at >= '2024-01-01'
ORDER BY last_name;
```

> [!NOTE]
> Uma view é apenas uma consulta armazenada. Ela não tem dados próprios — cada consulta contra uma view executa o SELECT subjacente. Tabelas referenciadas em uma view são chamadas de tabelas base.

### Por que Usar Views?

| Benefício | Descrição |
|---------|-------------|
| Simplificação | Encapsula JOINs e agregações complexas |
| Segurança | Restringe acesso a colunas ou linhas específicas |
| Consistência | Padroniza consultas em toda a organização |
| Abstração | Protege usuários de mudanças no esquema |
| Reutilização | Escreva uma vez, consulte muitas vezes |

```sql
-- View amigável para negócios
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

## Views Atualizáveis

Views simples podem suportar INSERT, UPDATE e DELETE. A view deve atender certas condições:

```sql
-- View atualizável: tabela única, sem agregação
CREATE VIEW active_products AS
SELECT product_id, product_name, price, category_id
FROM products
WHERE discontinued = false;

-- Estas modificam a tabela products subjacente
INSERT INTO active_products (product_name, price, category_id)
VALUES ('Widget Pro', 29.99, 1);

UPDATE active_products
SET price = 24.99
WHERE product_id = 101;

DELETE FROM active_products
WHERE product_id = 101;
```

Uma view é atualizável quando:
- Referencia uma única tabela base (sem JOINs)
- Não usa DISTINCT, GROUP BY, HAVING ou funções de janela
- Não usa operações de conjunto (UNION, INTERSECT, EXCEPT)
- Não usa funções de agregação

> [!WARNING]
| Padrão Não Atualizável | Motivo |
|-----------------------|--------|
| `CREATE VIEW v AS SELECT ... FROM a JOIN b` | Múltiplas tabelas base |
| `CREATE VIEW v AS SELECT DISTINCT ...` | Não pode mapear de volta para uma única linha |
| `CREATE VIEW v AS SELECT SUM(...)` | Agregação — sem identidade de linha |
| `CREATE VIEW v AS SELECT ... UNION ...` | Múltiplas fontes |

## WITH CHECK OPTION

WITH CHECK OPTION previne INSERTs e UPDATEs que fariam linhas desaparecerem da view.

```sql
CREATE VIEW high_value_orders AS
SELECT order_id, customer_id, total, order_date
FROM orders
WHERE total >= 1000
WITH CHECK OPTION;

-- Isto funciona:
INSERT INTO high_value_orders (order_id, customer_id, total, order_date)
VALUES (1001, 42, 1500.00, '2024-01-15');

-- Isto FALHA (total < 1000 tornaria a linha invisível):
INSERT INTO high_value_orders (order_id, customer_id, total, order_date)
VALUES (1002, 42, 500.00, '2024-01-15');
-- ERROR: new row violates WITH CHECK OPTION for view "high_value_orders"
```

| Opção | Comportamento |
|--------|----------|
| `WITH CHECK OPTION` | Rejeita mudanças que violam a cláusula WHERE da view |
| `WITH CASCADED CHECK OPTION` | Aplica-se a todas as views subjacentes (padrão) |
| `WITH LOCAL CHECK OPTION` | Aplica-se apenas à view atual |

## Materialized Views

Materialized views armazenam o resultado da consulta fisicamente. Elas trocam frescor por velocidade.

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
-- Consultar uma materialized view (rápido — dados pré-computados)
SELECT * FROM daily_sales_summary
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';
```

### Atualizando Materialized Views

Diferente de views regulares, materialized views ficam desatualizadas e devem ser atualizadas.

```sql
-- PostgreSQL: substituir todos os dados
REFRESH MATERIALIZED VIEW daily_sales_summary;

-- PostgreSQL: atualização concorrente (não bloqueia leitores)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
```

| Estratégia de Atualização | Comportamento | Bloqueio de Tabela | Requer Índice Único |
|-----------------|----------|--------------|----------------------|
| Padrão | Substitui todos os dados | Bloqueia leituras | Não |
| Concorrente | Substitui incrementalmente | Não bloqueia | Sim |
| Agendada (cron) | Atualiza em intervalos | Depende | Depende |
| Baseada em gatilho | Atualiza na mudança de dados | Variável | Não |

> [!NOTE]
> `REFRESH MATERIALIZED VIEW CONCURRENTLY` requer um índice único na materialized view. Cria uma versão temporária e a substitui, permitindo leituras durante a atualização.

### Estratégias de Atualização

```sql
-- 1. Agendada com cron/pg_cron
SELECT cron.schedule('refresh-sales', '0 6 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary'
);

-- 2. Atualização manual após ETL
-- (no seu script de pipeline)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;

-- 3. Baseada em gatilho (função PostgreSQL)
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
> Atualizações baseadas em gatilho em cada escrita podem destruir o desempenho. Use atualizações agendadas a menos que você precise de dados quase em tempo real e tenha baixo volume de escrita.

## Views vs Materialized Views

| Aspecto | View | Materialized View |
|--------|------|-------------------|
| Armazenamento | Nenhum (apenas consulta) | Armazena dados em disco |
| Velocidade | Mais lenta (executa consulta cada vez) | Rápida (pré-computada) |
| Atualização | Sempre atual | Desatualizada até atualizar |
| Indexável | Não | Sim |
| Espaço | Nenhum | Usa espaço em disco |
| Atualizável | Às vezes | Não (apenas refresh) |

```sql
-- Quando usar cada uma

-- View regular: sempre atual, abstração simples
CREATE VIEW current_employee_details AS
SELECT e.*, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- Materialized view: agregação complexa, desempenho de consulta crítico
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

## Exemplo Real: Camada de Relatórios

```sql
-- 1. Views base para segurança
CREATE VIEW customer_safe AS
SELECT customer_id, first_name, last_name, country
FROM customers;  -- exclui email, phone, ssn

-- 2. Materialized views agregadas para dashboards
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

-- 3. Atualizar em horários de baixa demanda
-- Agendar: REFRESH MATERIALIZED VIEW dashboard_kpi às 3 AM diariamente
```

> [!SUCCESS]
> Views são para abstração e segurança. Materialized views são para desempenho. Use views regulares para simplificar código e esconder complexidade. Use materialized views quando você precisar de acesso rápido a dados pré-computados e puder tolerar alguma desatualização.

## Perguntas de Prática

1. O que é uma view? Ela armazena dados?
2. Escreva uma declaração CREATE VIEW para `recent_orders` mostrando pedidos dos últimos 7 dias.
3. Quando uma view é atualizável? Quais operações são suportadas?
4. O que WITH CHECK OPTION faz? Escreva uma consulta que falharia por causa dele.
5. O que é uma materialized view e como ela difere de uma view regular?
6. Escreva uma consulta que cria uma materialized view resumindo vendas totais por categoria de produto.
7. O que `REFRESH MATERIALIZED VIEW CONCURRENTLY` faz? Quando você usaria?
8. Qual é a compensação entre views regulares e materialized views?
9. Escreva uma view regular que esconde colunas sensíveis (ex.: `salary`, `ssn`) dos usuários.
10. Descreva três estratégias para atualizar materialized views. Qual é a melhor para dados quase em tempo real?
