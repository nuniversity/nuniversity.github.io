---
title: "Common Table Expressions (CTEs)"
description: "Domine a sintaxe WITH/CTE, CTEs múltiplas, CTEs recursivas e quando usar CTEs vs subconsultas"
order: 4
duration: "50 minutos"
difficulty: "intermediário"
---

# Common Table Expressions (CTEs)

Uma Common Table Expression (CTE) é um conjunto de resultados temporário nomeado que existe dentro do escopo de uma única consulta. CTEs tornam consultas complexas mais legíveis, reutilizáveis e fáceis de manter.

## Sintaxe Básica de CTE

Uma CTE usa a palavra-chave `WITH` seguida por um nome, colunas opcionais e uma definição de consulta.

```sql
WITH regional_sales AS (
    SELECT
        region_id,
        SUM(amount) AS total_sales
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY region_id
)
SELECT
    r.name AS region,
    rs.total_sales
FROM regions r
INNER JOIN regional_sales rs ON r.region_id = rs.region_id
ORDER BY rs.total_sales DESC;
```

A CTE `regional_sales` se comporta como uma visão temporária durante a execução desta consulta.

> [!NOTE]
> CTEs são às vezes chamadas de "consultas WITH". A cláusula `WITH` deve aparecer no início da declaração — apenas `WITH` pode precedê-la.

## CTEs Múltiplas

Você pode definir múltiplas CTEs separadas por vírgulas. Cada uma pode referenciar CTEs anteriores.

```sql
WITH
avg_salary AS (
    SELECT department_id, AVG(salary) AS avg_dept_salary
    FROM employees
    GROUP BY department_id
),
above_avg AS (
    SELECT
        e.name,
        e.salary,
        e.department_id,
        a.avg_dept_salary
    FROM employees e
    INNER JOIN avg_salary a ON e.department_id = a.department_id
    WHERE e.salary > a.avg_dept_salary
),
dept_summary AS (
    SELECT
        department_id,
        COUNT(*) AS above_avg_count,
        AVG(salary) AS above_avg_avg_salary
    FROM above_avg
    GROUP BY department_id
)
SELECT
    d.department_name,
    ds.above_avg_count,
    ds.above_avg_avg_salary
FROM dept_summary ds
INNER JOIN departments d ON ds.department_id = d.department_id
ORDER BY ds.above_avg_count DESC;
```

```sql
WITH
products_2023 AS (
    SELECT * FROM products WHERE launch_year = 2023
),
products_2024 AS (
    SELECT * FROM products WHERE launch_year = 2024
),
sales_2023 AS (
    SELECT p.product_id, SUM(s.quantity) AS total_qty
    FROM products_2023 p
    INNER JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.product_id
),
sales_2024 AS (
    SELECT p.product_id, SUM(s.quantity) AS total_qty
    FROM products_2024 p
    INNER JOIN sales s ON p.product_id = s.product_id
    GROUP BY p.product_id
)
SELECT
    COALESCE(a.product_id, b.product_id) AS product_id,
    COALESCE(a.total_qty, 0) AS qty_2023,
    COALESCE(b.total_qty, 0) AS qty_2024,
    COALESCE(b.total_qty, 0) - COALESCE(a.total_qty, 0) AS growth
FROM sales_2023 a
FULL OUTER JOIN sales_2024 b ON a.product_id = b.product_id;
```

> [!NOTE]
> Cada CTE é separada por uma vírgula — sem vírgula após a última CTE antes da consulta principal. Este é um erro de sintaxe comum.

## CTEs vs Subconsultas

| Aspecto | CTE | Subconsulta (Tabela Derivada) |
|--------|-----|------------------------------|
| Legibilidade | Excelente — nomeada | Ruim — aninhada |
| Reutilização | Referenciada múltiplas vezes | Deve repetir |
| Recursão | Suportada | Não suportada |
| Otimização | Inlineável — sem materialização | Inlineável |
| Escopo | Consulta única | Expressão única |

```sql
-- Subconsulta aninhada (difícil de ler)
SELECT name, salary, dept_name
FROM (
    SELECT e.*, d.name AS dept_name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
    WHERE e.salary > (SELECT AVG(salary) FROM employees)
) high_earners
WHERE dept_name LIKE '%Eng%';
```

```sql
-- Mesma consulta com CTE (mais fácil de acompanhar)
WITH employee_with_dept AS (
    SELECT e.*, d.name AS dept_name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
),
dept_avg AS (
    SELECT department_id, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT e.name, e.salary, e.dept_name
FROM employee_with_dept e
INNER JOIN dept_avg a ON e.department_id = a.department_id
WHERE e.salary > a.avg_salary
  AND e.dept_name LIKE '%Eng%';
```

> [!SUCCESS]
> Use CTEs quando a legibilidade for importante ou quando você precisar referenciar a mesma subconsulta várias vezes. Use subconsultas inline para casos muito simples onde uma CTE seria exagero.

## CTEs Recursivas

CTEs recursivas referenciam a si mesmas. São essenciais para percorrer dados hierárquicos ou em estrutura de árvore.

```sql
WITH RECURSIVE org_chart AS (
    -- Âncora: o CEO (sem gerente)
    SELECT
        employee_id,
        name,
        manager_id,
        0 AS level,
        name AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursiva: subordinados diretos
    SELECT
        e.employee_id,
        e.name,
        e.manager_id,
        oc.level + 1,
        oc.path || ' -> ' || e.name
    FROM employees e
    INNER JOIN org_chart oc ON e.manager_id = oc.employee_id
)
SELECT *
FROM org_chart
ORDER BY level, name;
```

| employee_id | name | manager_id | level | path |
|------------|------|------------|-------|------|
| 1 | Sarah | NULL | 0 | Sarah |
| 2 | Tom | 1 | 1 | Sarah -> Tom |
| 5 | Uma | 1 | 1 | Sarah -> Uma |
| 3 | Jerry | 2 | 2 | Sarah -> Tom -> Jerry |

### Anatomia de uma CTE Recursiva

```
WITH RECURSIVE name AS (
    -- Membro âncora (não recursivo, conjunto inicial)
    SELECT ...
    WHERE base_condition

    UNION ALL

    -- Membro recursivo (referencia name)
    SELECT ...
    FROM name
    JOIN ... ON recursion_condition
)
SELECT * FROM name;
```

1. **Âncora**: Executa primeiro, produz linhas iniciais.
2. **Recursiva**: Executa repetidamente, cada vez trabalhando nas novas linhas da iteração anterior.
3. **Terminação**: Para quando o passo recursivo retorna zero linhas.

### Exemplos de CTE Recursiva

```sql
-- Árvore de categorias (profundidade ilimitada)
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 1 AS depth
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.name, c.parent_id, ct.depth + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree;

-- Gerar uma série de datas
WITH RECURSIVE dates AS (
    SELECT '2024-01-01'::date AS dt
    UNION ALL
    SELECT dt + 1
    FROM dates
    WHERE dt < '2024-12-31'
)
SELECT * FROM dates;
```

> [!WARNING]
> CTEs recursivas podem executar infinitamente se a condição de recursão nunca terminar. Sempre garanta que seu passo recursivo eventualmente retorne zero linhas. Defina `max_recursion_depth` (ou equivalente) em produção para evitar consultas descontroladas.

## Materialização vs Inline de CTE

Diferentes bancos de dados lidam com CTEs de forma diferente:

| Banco de Dados | Comportamento Padrão | Dica para Controle |
|----------|-----------------|------------------|
| PostgreSQL | Inline (a menos que referenciada múltiplas vezes) | `MATERIALIZED` / `NOT MATERIALIZED` |
| SQL Server | Igual ao PostgreSQL | `OPTION (RECOMPILE)` |
| Snowflake | Inline | Nenhum controle necessário |
| DuckDB | Materializado | Nenhum controle necessário |

```sql
-- PostgreSQL: forçar materialização
WITH high_value AS MATERIALIZED (
    SELECT * FROM orders WHERE total > 10000
)
SELECT * FROM high_value h
INNER JOIN customers c ON h.customer_id = c.id;
```

## Exemplo Real: Análise de Sessão

```sql
WITH
user_sessions AS (
    SELECT
        user_id,
        session_start,
        session_end,
        EXTRACT(EPOCH FROM (session_end - session_start)) / 60 AS duration_minutes
    FROM sessions
    WHERE session_start >= '2024-01-01'
),
session_stats AS (
    SELECT
        user_id,
        COUNT(*) AS total_sessions,
        AVG(duration_minutes) AS avg_duration,
        SUM(duration_minutes) AS total_minutes,
        MAX(session_start) AS last_session
    FROM user_sessions
    GROUP BY user_id
),
active_users AS (
    SELECT *
    FROM session_stats
    WHERE total_sessions >= 5
      AND last_session >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
    u.name,
    au.total_sessions,
    ROUND(au.avg_duration, 2) AS avg_session_minutes,
    ROUND(au.total_minutes, 2) AS total_minutes
FROM active_users au
INNER JOIN users u ON au.user_id = u.user_id
ORDER BY total_minutes DESC;
```

> [!SUCCESS]
> Pense em CTEs como blocos de construção nomeados para sua consulta. Cada CTE resolve um problema. Juntas, elas compõem análises complexas que são fáceis de ler, depurar e modificar.

## Perguntas de Prática

1. O que é uma CTE e qual palavra-chave inicia uma?
2. Escreva uma CTE chamada `high_value_customers` que seleciona clientes com total de pedidos acima de $10.000. Em seguida, junte-a com uma tabela de regiões.
3. Como você define múltiplas CTEs em uma única consulta? Há vírgula entre elas?
4. Escreva uma consulta com duas CTEs onde a segunda CTE referencia a primeira.
5. Qual é a diferença entre uma CTE e uma tabela derivada (subconsulta em FROM)?
6. Escreva uma CTE recursiva que gere todos os números de 1 a 100.
7. Como uma CTE recursiva termina? O que acontece se o passo recursivo nunca retornar zero linhas?
8. Escreva uma CTE recursiva para percorrer uma tabela `employees` onde cada funcionário tem um `manager_id`. Mostre nome, nível e caminho de subordinação.
9. Quando você preferiria uma CTE a uma subconsulta? Dê duas razões.
10. O que a palavra-chave `MATERIALIZED` faz em CTEs do PostgreSQL?
