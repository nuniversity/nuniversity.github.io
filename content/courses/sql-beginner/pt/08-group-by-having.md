---
title: "GROUP BY e HAVING — Agrupando e Filtrando Agregados"
description: "Domine GROUP BY, funções agregadas (COUNT, SUM, AVG, MIN, MAX) e entenda HAVING vs WHERE"
order: 8
duration: "20-30 minutos"
difficulty: "beginner"
---

# GROUP BY e HAVING — Agrupando e Filtrando Agregados

Dados brutos são ruidosos. A agregação permite resumir milhares de linhas em métricas significativas: totais, médias, contagens e extremos.

## Funções Agregadas

| Função | Propósito | Exemplo |
|--------|-----------|---------|
| `COUNT()` | Número de linhas | `COUNT(*)` ou `COUNT(coluna)` |
| `SUM()` | Total de coluna numérica | `SUM(salary)` |
| `AVG()` | Média aritmética | `AVG(price)` |
| `MIN()` | Menor valor | `MIN(age)` |
| `MAX()` | Maior valor | `MAX(salary)` |

```sql
-- Agregados simples em toda a tabela
SELECT
    COUNT(*) AS total_employees,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS payroll_total
FROM employees;
```

> [!NOTE]
> Funções agregadas ignoram valores `NULL` (exceto `COUNT(*)` que conta linhas, não valores). `AVG(NULL, 10, 20)` = 15, não 10.

## GROUP BY — Agrupando Linhas

`GROUP BY` divide linhas em grupos e aplica funções agregadas a cada grupo:

```sql
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department;
```

Resultado de exemplo:

| department | avg_salary |
|------------|------------|
| Engineering | 91500.00 |
| Marketing | 75000.00 |
| Sales | 65000.00 |

### GROUP BY com Múltiplas Colunas

```sql
SELECT department, status, COUNT(*) AS count
FROM employees
GROUP BY department, status
ORDER BY department;
```

| department | status | count |
|------------|--------|-------|
| Engineering | active | 12 |
| Engineering | on_leave | 2 |
| Marketing | active | 8 |
| Sales | active | 5 |
| Sales | inactive | 1 |

> [!SUCCESS]
> Toda coluna na lista SELECT deve estar no GROUP BY ou envolta em uma função agregada. Caso contrário, o SQL não sabe qual valor mostrar.

### GROUP BY com WHERE

`WHERE` filtra linhas **antes** do agrupamento:

```sql
-- Salário médio apenas para Engineering e Marketing
SELECT department, AVG(salary) AS avg_salary
FROM employees
WHERE department IN ('Engineering', 'Marketing')
GROUP BY department;
```

Ordem de filtragem: `WHERE` → `GROUP BY` → funções agregadas

## HAVING — Filtrando Grupos

`WHERE` não pode filtrar resultados agregados porque os agregados ainda não existem quando `WHERE` é executado. Use `HAVING`:

```sql
-- Departamentos com salário médio acima de 80.000
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 80000;
```

| department | avg_salary |
|------------|------------|
| Engineering | 91500.00 |

### HAVING vs WHERE

| Cláusula | Filtra | Executa Quando | Pode Usar Agregados |
|----------|--------|----------------|---------------------|
| `WHERE` | Linhas individuais | Antes do GROUP BY | Não |
| `HAVING` | Grupos | Após o GROUP BY | Sim |

```sql
-- Correto: WHERE filtra linhas, HAVING filtra grupos
SELECT department, COUNT(*) AS employee_count
FROM employees
WHERE salary > 50000             -- exclui quem ganha pouco primeiro
GROUP BY department
HAVING COUNT(*) > 5             -- apenas departamentos com 5+ funcionários bem pagos
ORDER BY employee_count DESC;
```

> [!WARNING]
> Usar `HAVING` onde `WHERE` funcionaria (ex.: `HAVING department = 'Engineering'`) é válido, mas ineficiente. `WHERE` é mais rápido porque elimina linhas antes do agrupamento.

## Agrupando com Expressões

Você pode agrupar por expressões calculadas:

```sql
-- Agrupar funcionários por faixa salarial
SELECT
    CASE
        WHEN salary < 50000 THEN 'Low'
        WHEN salary BETWEEN 50000 AND 90000 THEN 'Mid'
        ELSE 'High'
    END AS bracket,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY bracket
ORDER BY avg_salary DESC;
```

## COUNT(*) vs COUNT(coluna) vs COUNT(DISTINCT coluna)

```sql
SELECT
    COUNT(*) AS total_rows,
    COUNT(department) AS non_null_depts,
    COUNT(DISTINCT department) AS unique_depts
FROM employees;
```

| total_rows | non_null_depts | unique_depts |
|------------|----------------|--------------|
| 100 | 98 | 4 |

- `COUNT(*)` conta todas as linhas
- `COUNT(col)` conta valores não-NULL naquela coluna
- `COUNT(DISTINCT col)` conta valores não-NULL únicos

## Caso de Uso Real: Dashboard de Vendas

```sql
SELECT
    DATE_TRUNC('month', order_date) AS month,  -- PostgreSQL
    COUNT(DISTINCT customer_id) AS active_customers,
    COUNT(*) AS total_orders,
    SUM(total) AS revenue,
    AVG(total) AS avg_order_value,
    MAX(total) AS biggest_order
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY month
ORDER BY month;
```

## Caso de Uso Real: Identificando Anomalias

```sql
-- Encontre produtos com taxas de devolução anormalmente altas
SELECT
    product_id,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returns,
    ROUND(
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) AS return_rate_pct
FROM order_items
GROUP BY product_id
HAVING return_rate_pct > 15
ORDER BY return_rate_pct DESC;
```

## Ordem Completa de Execução do SELECT

Entender a ordem em que o SQL processa as cláusulas ajuda a escrever consultas corretas:

1. `FROM` / `JOIN` — identificar tabelas de origem
2. `WHERE` — filtrar linhas individuais
3. `GROUP BY` — agrupar linhas
4. `HAVING` — filtrar grupos
5. `SELECT` — calcular expressões e aliases
6. `ORDER BY` — ordenar resultados
7. `LIMIT` / `OFFSET` — paginar

Isso explica por que `WHERE` não pode usar aliases do SELECT, mas `ORDER BY` pode.

> [!NOTE]
> A maioria dos compiladores SQL otimiza a ordem lógica internamente, mas entender a ordem conceitual ajuda a depurar problemas em consultas.

## Perguntas de Prática

Dada `orders(id, customer_id, total, status, order_date)`:

1. Conte o número total de pedidos.
2. Calcule a receita total (soma dos totais) de todos os pedidos.
3. Encontre o valor médio do pedido por cliente.
4. Liste os clientes que fizeram mais de 5 pedidos.
5. Qual é a diferença entre WHERE e HAVING?
6. Encontre o total máximo e mínimo de pedidos.
7. Mostre o número de pedidos por mês em 2024, ordenado por mês.
8. Por que `SELECT name, COUNT(*) FROM employees GROUP BY department` falha? Corrija-o.
9. Encontre status que têm menos de 10 pedidos.
10. Escreva uma consulta que mostre a porcentagem de pedidos que estão 'shipped' vs 'pending' vs 'cancelled'.
