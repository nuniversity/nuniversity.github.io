---
title: "UNION, INTERSECT e EXCEPT"
description: "Domine UNION, UNION ALL, INTERSECT, EXCEPT/MINUS e ordenação de operações de conjunto em SQL"
order: 5
duration: "40 minutos"
difficulty: "intermediário"
---

# UNION, INTERSECT e EXCEPT

Operações de conjunto combinam resultados de múltiplas declarações SELECT. Diferente de JOINs que combinam colunas horizontalmente, operações de conjunto empilham ou comparam linhas verticalmente.

## Regras para Operações de Conjunto

Toda operação de conjunto segue as mesmas regras:

1. Mesmo número de colunas em todas as declarações SELECT.
2. Colunas correspondentes devem ter tipos de dados compatíveis.
3. Nomes de colunas vêm do primeiro SELECT.
4. ORDER BY se aplica apenas ao resultado final.

```sql
SELECT column1, column2, column3 FROM table1
UNION
SELECT col_a, col_b, col_c FROM table2
ORDER BY column1;
```

> [!WARNING]
> Nomes de colunas e aliases na segunda declaração SELECT e subsequentes são ignorados. O resultado usa os nomes de coluna do primeiro SELECT.

## UNION

UNION combina resultados de duas ou mais consultas e remove duplicatas.

```sql
-- Clientes e funcionários em uma única lista de mala direta
SELECT name, email, 'Cliente' AS source
FROM customers
UNION
SELECT name, email, 'Funcionário' AS source
FROM employees
ORDER BY name;
```

| name | email | source |
|------|-------|--------|
| Alice | alice@example.com | Cliente |
| Bob | bob@work.com | Funcionário |
| Carol | carol@example.com | Cliente |

Se uma pessoa é tanto cliente quanto funcionário, ela aparece uma vez.

## UNION ALL

UNION ALL combina resultados sem remover duplicatas. É mais rápido que UNION porque pula a etapa de deduplicação.

```sql
-- Log de eventos total (duplicatas preservadas)
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
| Remove duplicatas | Preserva duplicatas |
| Ordena internamente (dedup) | Apenas anexa |
| Mais lento em conjuntos grandes | Mais rápido — sem overhead de ordenação |
| Use quando quiser linhas distintas | Use quando duplicatas são aceitáveis ou desejadas |

### UNION vs UNION ALL: Desempenho

```sql
-- 1M linhas cada de duas tabelas
-- UNION: 1.8s (passo de dedup requer ordenação/hash)
-- UNION ALL: 0.3s (concatenação simples)

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

INTERSECT retorna apenas as linhas que aparecem em ambos os conjuntos de resultados (com duplicatas removidas).

```sql
-- Produtos que foram tanto visualizados QUANTO comprados
SELECT product_id
FROM page_views
WHERE view_date >= '2024-01-01'
INTERSECT
SELECT product_id
FROM purchases
WHERE purchase_date >= '2024-01-01';
```

```sql
-- Clientes que pediram ambas as categorias
SELECT customer_id
FROM orders
WHERE category = 'Electronics'
INTERSECT
SELECT customer_id
FROM orders
WHERE category = 'Books';
```

> [!NOTE]
> INTERSECT é equivalente a um INNER JOIN com DISTINCT na coluna de junção. Use o que for mais legível para seu caso de uso.

## EXCEPT / MINUS

EXCEPT retorna linhas da primeira consulta que **não** aparecem na segunda consulta (com duplicatas removidas).

```sql
-- Produtos que nunca foram vendidos
SELECT product_id
FROM products
EXCEPT
SELECT product_id
FROM order_items;
```

```sql
-- Clientes com contas mas sem pedidos nos últimos 90 dias
SELECT customer_id
FROM customers
WHERE status = 'active'
EXCEPT
SELECT customer_id
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days';
```

> [!NOTE]
> Oracle usa `MINUS` em vez de `EXCEPT`. PostgreSQL, SQL Server, Snowflake e DuckDB usam `EXCEPT`. Ambos significam a mesma coisa.

## Ordem de Operações de Conjunto e Parênteses

Sem parênteses, operações de conjunto são avaliadas de cima para baixo. Use parênteses para controlar a ordem de avaliação.

```sql
-- UNION de dois resultados de INTERSECT
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
-- Sem parênteses: todos os três são unidos, depois intersectados
SELECT product_id FROM electronics_products
UNION
SELECT product_id FROM clothing_products
INTERSECT
SELECT product_id FROM top_selling_products;
```

| Expressão | Significado |
|------------|---------|
| `A UNION B INTERSECT C` | `A UNION (B INTERSECT C)` — INTERSECT tem precedência |
| `(A UNION B) INTERSECT C` | Union primeiro, depois intersect (sobrescrever com parênteses) |

> [!WARNING]
> INTERSECT tem precedência sobre UNION no padrão SQL. Sempre use parênteses para tornar sua intenção explícita — esta é uma área onde clareza importa mais que brevidade.

## Padrões Práticos

### Combinando Dados Históricos e Atuais

```sql
-- Dados mestre de clientes de sistemas legado e atual
SELECT id, name, email, 'legado' AS system
FROM customers_archive
WHERE status = 'active'
UNION ALL
SELECT id, name, email, 'atual' AS system
FROM customers
WHERE status = 'active'
ORDER BY name;
```

### Encontrando Lacunas

```sql
-- IDs de funcionários faltantes (ex.: funcionários demitidos cujos registros foram excluídos)
SELECT generate_series(1, 1000) AS employee_id
EXCEPT
SELECT employee_id FROM employees;
```

### Relatórios entre Bancos de Dados

```sql
-- Combinar dados de vendas de múltiplas regiões (bancos de dados separados)
SELECT 'América do Norte' AS region, SUM(amount) AS total_sales
FROM na_sales
WHERE year = 2024
UNION ALL
SELECT 'Europa', SUM(amount)
FROM eu_sales
WHERE year = 2024
UNION ALL
SELECT 'Ásia Pacífico', SUM(amount)
FROM apac_sales
WHERE year = 2024
ORDER BY total_sales DESC;
```

## Exemplo Real: Relatório de Engajamento de Usuário

```sql
WITH
-- Usuários que visitaram o site
visitors AS (
    SELECT DISTINCT user_id
    FROM sessions
    WHERE session_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Usuários que adicionaram ao carrinho
cart_adders AS (
    SELECT DISTINCT user_id
    FROM cart_events
    WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Usuários que compraram
purchasers AS (
    SELECT DISTINCT user_id
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
),
-- Usuários que visitaram E adicionaram ao carrinho (mas não compraram)
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

| Operação de Conjunto | Comportamento | Duplicatas | Custo de Desempenho |
|---------------|----------|------------|-----------------|
| UNION | Combina, deduplica | Removidas | Mais alto |
| UNION ALL | Combina, anexa bruto | Preservadas | Mais baixo |
| INTERSECT | Apenas linhas comuns | Removidas | Mais alto |
| EXCEPT | Primeira menos segunda | Removidas | Mais alto |

> [!SUCCESS]
> UNION ALL é seu aliado para combinar dados similares (logs, dados multirregionais). Use UNION, INTERSECT e EXCEPT para lógica baseada em conjuntos. Quando em dúvida sobre ordem de avaliação, use parênteses.

## Perguntas de Prática

1. Quais são as três regras que toda consulta de operação de conjunto deve seguir?
2. Qual é a diferença entre UNION e UNION ALL? Qual é mais rápido?
3. Escreva uma consulta usando UNION ALL para combinar as tabelas `sales_2023` e `sales_2024`. Adicione uma coluna `year` para distingui-las.
4. O que INTERSECT faz? Como é diferente de um INNER JOIN?
5. Escreva uma consulta que encontre IDs de produtos que foram pedidos no T1 mas NÃO no T2.
6. `A UNION B INTERSECT C` significa o mesmo que `(A UNION B) INTERSECT C`? Explique.
7. Escreva uma consulta que use tanto INTERSECT quanto UNION para encontrar clientes que compraram das categorias Eletrônicos e Vestuário, combinados com clientes que compraram das categorias Livros e Casa.
8. Qual é o equivalente Oracle de EXCEPT?
9. Escreva uma consulta que encontre todos os IDs de clientes de `customers` menos aqueles de `inactive_customers`.
10. Como ORDER BY funciona com operações de conjunto? Onde você deve colocá-lo?
