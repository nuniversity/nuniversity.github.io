---
title: "Subconsultas"
description: "Domine subconsultas escalares, de linha, correlacionadas, EXISTS/NOT EXISTS e padrões IN/NOT IN"
order: 3
duration: "50 minutos"
difficulty: "intermediário"
---

# Subconsultas

Uma subconsulta é uma consulta aninhada dentro de outra consulta. Subconsultas aparecem nas cláusulas SELECT, FROM, WHERE e HAVING. Elas podem retornar valores únicos, linhas únicas ou conjuntos de resultados inteiros.

## Subconsultas Escalares

Uma subconsulta escalar retorna exatamente um valor (uma linha, uma coluna). Pode ser usada em qualquer lugar onde um valor único é esperado.

```sql
-- Encontrar funcionários que ganham mais que a média salarial
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Incluir a média como coluna
SELECT
    name,
    salary,
    (SELECT AVG(salary) FROM employees) AS avg_salary,
    salary - (SELECT AVG(salary) FROM employees) AS difference
FROM employees;
```

| name | salary | avg_salary | difference |
|------|--------|------------|------------|
| Alice | 95000 | 82000 | 13000 |
| Bob | 75000 | 82000 | -7000 |

> [!WARNING]
> Uma subconsulta escalar deve retornar exatamente uma linha. Se retornar zero linhas, o resultado se torna NULL. Se retornar múltiplas linhas, o banco de dados lança um erro.

```sql
-- Isto FALHARÁ se algum departamento tiver múltiplos funcionários com o salário máximo
SELECT name, department_id
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees GROUP BY department_id);
```

## Subconsultas de Linha

Uma subconsulta de linha retorna uma única linha com múltiplas colunas. Use construtores de linha para comparar.

```sql
-- Encontrar funcionários com o maior salário em seu departamento
SELECT name, salary, department_id
FROM employees
WHERE (department_id, salary) IN (
    SELECT department_id, MAX(salary)
    FROM employees
    GROUP BY department_id
);
```

```sql
-- Encontrar funcionários cujo departamento e cargo correspondem a um padrão existente
SELECT *
FROM employees
WHERE (department_id, job_id) = (
    SELECT department_id, job_id
    FROM employees
    WHERE employee_id = 100
);
```

## Subconsultas na Cláusula FROM (Tabelas Derivadas)

Uma subconsulta em FROM atua como uma tabela temporária que a consulta externa pode referenciar.

```sql
SELECT dept_name, avg_salary
FROM (
    SELECT
        d.department_name AS dept_name,
        AVG(e.salary) AS avg_salary
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.department_id
    GROUP BY d.department_name
) dept_stats
WHERE avg_salary > 80000
ORDER BY avg_salary DESC;
```

```sql
-- Classificar produtos por receita dentro de cada categoria
SELECT category, product_name, revenue, rank
FROM (
    SELECT
        c.category_name AS category,
        p.product_name,
        SUM(oi.quantity * oi.unit_price) AS revenue,
        RANK() OVER (
            PARTITION BY c.category_id
            ORDER BY SUM(oi.quantity * oi.unit_price) DESC
        ) AS rank
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    INNER JOIN order_items oi ON p.product_id = oi.product_id
    GROUP BY c.category_id, c.category_name, p.product_name
) ranked
WHERE rank <= 3;
```

> [!NOTE]
> Tabelas derivadas devem ter um alias. Toda subconsulta em FROM precisa de um nome, mesmo que você não o referencie em outro lugar.

## Subconsultas Correlacionadas

Uma subconsulta correlacionada referencia colunas da consulta externa. Ela é reexecutada para cada linha da consulta externa.

```sql
-- Encontrar funcionários que ganham mais que a média em seu próprio departamento
SELECT e.name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(salary)
    FROM employees
    WHERE department_id = e.department_id
);
```

| Tipo de Subconsulta | Executada | Desempenho |
|---------------|----------|-------------|
| Não correlacionada | Uma vez | Rápido |
| Correlacionada | Uma vez por linha externa | Mais lento — cuidado com tabelas grandes |

```sql
-- Encontrar produtos cujo preço está acima da média de sua categoria
SELECT p.product_name, p.category_id, p.price
FROM products p
WHERE p.price > (
    SELECT AVG(price)
    FROM products
    WHERE category_id = p.category_id
);
```

### Execução Correlacionada vs Não Correlacionada

Não correlacionada (uma execução):
```
1. Calcular AVG(salary) de todos os funcionários → 82000
2. Encontrar funcionários WHERE salary > 82000
   → escanear 1000 linhas, comparar com constante
```

Correlacionada (N execuções):
```
Para cada um dos 1000 funcionários:
  1. Calcular AVG(salary) do departamento daquele funcionário
  2. Comparar salário do funcionário com a média do departamento
```

## EXISTS e NOT EXISTS

EXISTS retorna TRUE se a subconsulta produzir qualquer linha. Não se importa com os valores — apenas com a existência de linhas.

```sql
-- Encontrar departamentos que têm pelo menos um funcionário
SELECT d.department_name
FROM departments d
WHERE EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);

-- Encontrar departamentos sem funcionários
SELECT d.department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.department_id = d.department_id
);
```

> [!SUCCESS]
> Sempre use `SELECT 1` (ou `SELECT *`) em subconsultas EXISTS — as colunas reais não importam. O banco de dados apenas verifica a existência de linhas.

### EXISTS vs IN

| Aspecto | EXISTS | IN |
|--------|--------|----|
| Para na primeira correspondência | Sim | Não (avalia todas) |
| Lida com NULLs | Com segurança | Problemático |
| Desempenho (subconsulta grande) | Melhor | Pior |
| Desempenho (subconsulta pequena) | Comparável | Comparável |

```sql
-- EXISTS é frequentemente mais rápido quando a subconsulta é grande
SELECT c.*
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
      AND o.order_date >= '2024-01-01'
);

-- IN é mais claro para listas pequenas e estáticas
SELECT *
FROM products
WHERE category_id IN (1, 3, 5);
```

## IN e NOT IN

```sql
-- Encontrar clientes de países específicos
SELECT name, country
FROM customers
WHERE country IN ('USA', 'Canada', 'Mexico');

-- Usando uma subconsulta
SELECT name
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE total > 1000
);
```

> [!WARNING]
> NOT IN com uma subconsulta que retorna NULL produz zero linhas. Use NOT EXISTS ou adicione `WHERE col IS NOT NULL` à subconsulta.

## ANY, ALL e SOME

```sql
-- Salário maior que ANY funcionário do departamento 10
SELECT name, salary
FROM employees
WHERE salary > ANY (
    SELECT salary
    FROM employees
    WHERE department_id = 10
);

-- Salário maior que ALL funcionários do departamento 10
SELECT name, salary
FROM employees
WHERE salary > ALL (
    SELECT salary
    FROM employees
    WHERE department_id = 10
);
```

| Operador | Significado |
|----------|---------|
| `> ANY(...)` | Maior que pelo menos um valor |
| `> ALL(...)` | Maior que todos os valores |
| `= ANY(...)` | Igual a pelo menos um (mesmo que IN) |
| `<> ALL(...)` | Diferente de todos (mesmo que NOT IN) |

## Subconsultas Aninhadas

Subconsultas podem aninhar vários níveis de profundidade, embora isso frequentemente sinalize uma oportunidade de refatoração.

```sql
SELECT name
FROM employees
WHERE department_id IN (
    SELECT department_id
    FROM departments
    WHERE location_id IN (
        SELECT location_id
        FROM locations
        WHERE country = 'USA'
    )
);
```

```sql
-- Equivalente com JOINs (geralmente preferido)
SELECT e.name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
INNER JOIN locations l ON d.location_id = l.location_id
WHERE l.country = 'USA';
```

## Exemplo Real: Relatório de Clientes

```sql
SELECT
    c.name,
    c.email,
    (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS total_orders,
    (
        SELECT SUM(o.total_amount)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS lifetime_value,
    (
        SELECT MAX(o.order_date)
        FROM orders o
        WHERE o.customer_id = c.customer_id
    ) AS last_order_date,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.customer_id = c.customer_id
              AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
        ) THEN 'Ativo'
        ELSE 'Inativo'
    END AS customer_status
FROM customers c
ORDER BY lifetime_value DESC NULLS LAST;
```

> [!SUCCESS]
> Subconsultas são poderosas mas podem prejudicar a legibilidade. Como regra geral: use subconsultas para agregações simples e verificações de existência; use JOINs para dados de várias tabelas. CTEs (próxima lição) oferecem um meio-termo.

## Perguntas de Prática

1. O que é uma subconsulta escalar? O que acontece se ela retornar zero linhas? E se retornar múltiplas linhas?
2. Escreva uma consulta que liste produtos com preço acima da média geral de preços.
3. Qual é a diferença entre uma subconsulta correlacionada e uma não correlacionada?
4. Escreva uma subconsulta correlacionada para encontrar funcionários contratados antes da data média de contratação de seu departamento.
5. Quando você usaria EXISTS em vez de IN? Dê um exemplo.
6. Reescreva `SELECT * FROM products WHERE category_id NOT IN (SELECT category_id FROM categories WHERE active = false)` de forma segura.
7. O que significam `> ANY()` e `> ALL()`? Forneça consultas de exemplo.
8. Escreva uma consulta usando uma tabela derivada (subconsulta em FROM) para encontrar os 2 funcionários mais bem pagos por departamento.
9. O que é uma subconsulta de linha? Escreva uma que use um construtor de linha em uma cláusula WHERE.
10. Por que `SELECT 1` é comumente usado dentro de subconsultas EXISTS?
