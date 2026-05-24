---
title: "Funções Agregadas Avançadas"
description: "Aprofunde-se em agregação com ROLLUP, GROUPING, tratamento de NULL em agregados e prévia de funções janela"
order: 9
duration: "20-30 minutos"
difficulty: "beginner"
---

# Funções Agregadas Avançadas

Você já conhece COUNT, SUM, AVG, MIN e MAX. Agora é hora de ir além com subtotais, conjuntos de agrupamento e entendendo como NULL se comporta.

## Recapitulação: Funções Agregadas Básicas

| Função | Descrição | Tipo de Retorno |
|--------|-----------|-----------------|
| `COUNT(*)` | Total de linhas no grupo | INTEGER |
| `COUNT(expr)` | Valores não-NULL de expr | INTEGER |
| `SUM(expr)` | Soma dos valores | Mesmo que expr |
| `AVG(expr)` | Média aritmética | Geralmente DECIMAL |
| `MIN(expr)` | Menor valor | Mesmo que expr |
| `MAX(expr)` | Maior valor | Mesmo que expr |

```sql
SELECT
    COUNT(*) AS total,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount
FROM payments;
```

## Comportamento de NULL em Agregados

> [!NOTE]
> Funções agregadas ignoram valores NULL — exceto `COUNT(*)` que conta linhas independentemente. Isso pode dar resultados enganosos se você não levar isso em conta.

```sql
SELECT
    COUNT(*) AS row_count,          -- 10
    COUNT(rating) AS rating_count,   -- 7 (3 NULLs ignorados)
    AVG(rating) AS avg_rating,       -- média correta de 7 valores
    SUM(rating) / COUNT(*) AS wrong  -- incorreto: divide por 10
FROM reviews;
```

### COALESCE — Substituir NULLs Antes da Agregação

```sql
SELECT
    AVG(COALESCE(rating, 0)) AS avg_with_zeros,  -- trata NULL como 0
    AVG(rating) AS avg_nulls_ignored              -- NULLs excluídos
FROM reviews;
```

> [!WARNING]
> Escolher entre ignorar NULLs e tratá-los como 0 é uma decisão de negócio. Se uma avaliação não tem nota, isso deve reduzir a média? Geralmente não — é melhor excluí-la.

### NULLIF — Prevenir Divisão por Zero

```sql
-- Divisão que poderia dividir por zero
SELECT
    department,
    SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(*), 0) AS return_pct
FROM orders
GROUP BY department;
```

`NULLIF(a, b)` retorna NULL se a = b, caso contrário retorna a. Isso previne erros de divisão por zero.

## Extensões de GROUP BY

### GROUP BY ROLLUP

`ROLLUP` gera subtotais e totais gerais para dados hierárquicos:

```sql
SELECT
    department,
    status,
    COUNT(*) AS count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY ROLLUP (department, status);
```

Resultado:

| department | status | count | avg_salary |
|------------|--------|-------|------------|
| Engineering | active | 10 | 92000 |
| Engineering | on_leave | 2 | 88000 |
| Engineering | NULL | 12 | 91500 |  ← subtotal para Engineering
| Marketing | active | 6 | 75000 |
| Marketing | NULL | 6 | 75000 |    ← subtotal para Marketing
| NULL | NULL | 18 | 86000 |      ← total geral

> [!SUCCESS]
> `ROLLUP` é ideal para geração de relatórios. Uma única consulta substitui a necessidade de múltiplas consultas UNION para obter subtotais por grupo e um total geral.

### GROUP BY CUBE (se disponível)

`CUBE` gera subtotais para **todas as combinações** das colunas listadas:

```sql
SELECT department, status, COUNT(*)
FROM employees
GROUP BY CUBE (department, status);
```

Isso produz 2^n linhas de agrupamento (incluindo todas as combinações), não apenas as hierárquicas.

### GROUPING — Identificar Subtotais

`GROUPING(coluna)` retorna 1 se a coluna está agregada na linha atual (usado em linhas de subtotal/total geral):

```sql
SELECT
    CASE
        WHEN GROUPING(department) = 1 AND GROUPING(status) = 1 THEN 'Grand Total'
        WHEN GROUPING(status) = 1 THEN 'Subtotal: ' || department
        ELSE department
    END AS department_group,
    status,
    COUNT(*) AS count
FROM employees
GROUP BY ROLLUP (department, status);
```

## Cláusula FILTER (PostgreSQL, SQLite 3.30+)

`FILTER` aplica uma condição a um único agregado sem afetar outros:

```sql
SELECT
    department,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE salary > 80000) AS high_earners,
    AVG(salary) FILTER (WHERE age < 30) AS avg_salary_young,
    AVG(salary) FILTER (WHERE age >= 30) AS avg_salary_senior
FROM employees
GROUP BY department;
```

Sem `FILTER`, você precisaria de expressões CASE verbosas:

```sql
COUNT(CASE WHEN salary > 80000 THEN 1 ELSE NULL END) AS high_earners
```

## Prévia de Funções Janela

Funções janela realizam cálculos em linhas relacionadas à linha atual **sem colapsá-las**:

```sql
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary,
    salary - AVG(salary) OVER (PARTITION BY department) AS diff_from_avg
FROM employees;
```

| name | department | salary | dept_avg_salary | diff_from_avg |
|------|------------|--------|-----------------|---------------|
| Alice | Engineering | 95000 | 91500 | 3500 |
| Bob | Marketing | 72000 | 75000 | -3000 |
| Carol | Engineering | 88000 | 91500 | -3500 |

> [!NOTE]
> Diferente de GROUP BY, funções janela mantêm linhas individuais. O valor agregado é calculado sobre uma "janela" (PARTITION BY) e anexado a cada linha. Você explorará isso em profundidade no curso intermediário.

## Caso de Uso Real: Relatório de Vendas com Subtotais

```sql
SELECT
    CASE WHEN GROUPING(category) = 1 THEN 'All Categories'
         ELSE category
    END AS category,
    CASE WHEN GROUPING(product_name) = 1 THEN 'Subtotal'
         ELSE product_name
    END AS product,
    SUM(quantity) AS units_sold,
    SUM(revenue) AS total_revenue
FROM sales
WHERE sale_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY ROLLUP (category, product_name)
ORDER BY category, product;
```

## Caso de Uso Real: Estatísticas de Funcionários

```sql
SELECT
    department,
    COUNT(*) AS total_employees,
    COUNT(*) FILTER (WHERE salary > 100000) AS executives,
    ROUND(AVG(salary), 2) AS avg_salary,
    ROUND(AVG(salary) FILTER (WHERE hire_date < '2020-01-01'), 2) AS avg_salary_veteran,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    ROUND(MAX(salary) - MIN(salary), 2) AS salary_spread
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
```

## Folha de Dicas de Agregação

| Necessidade | Solução |
|-------------|---------|
| Contar linhas | `COUNT(*)` |
| Contar valores não-NULL | `COUNT(coluna)` |
| Contar valores únicos | `COUNT(DISTINCT coluna)` |
| Somar com condição | `SUM(CASE WHEN ... THEN val ELSE 0 END)` |
| Agregado condicional (limpo) | `COUNT(*) FILTER (WHERE ...)` |
| Evitar divisão por zero | `/ NULLIF(denominador, 0)` |
| Substituir NULL em agregado | `AVG(COALESCE(col, 0))` |
| Subtotais | `GROUP BY ROLLUP (a, b)` |
| Todas as combinações de subtotais | `GROUP BY CUBE (a, b)` |
| Detectar linhas de subtotal | `GROUPING(col) = 1` |

> [!SUCCESS]
> O domínio da agregação é o que separa usuários iniciantes de intermediários em SQL. Pratique escrever consultas que combinam GROUP BY, HAVING, ROLLUP, FILTER e COALESCE.

## Perguntas de Prática

Dada `sales(id, product, category, amount, sale_date)`:

1. Escreva uma consulta que retorne o valor total de vendas por categoria.
2. Qual é a diferença entre `COUNT(*)` e `COUNT(amount)`?
3. Use `COALESCE` para substituir valores NULL de amount por 0, depois calcule a média.
4. Escreva uma consulta com `GROUP BY ROLLUP (category, product)` mostrando o total de vendas.
5. O que `GROUPING(category)` retorna em uma linha de total geral?
6. Escreva uma consulta usando `FILTER` para contar vendas de alto valor (amount > 100) por categoria.
7. Qual é a saída de `AVG(NULL, 10, 20)`?
8. Use `NULLIF` para prevenir um erro de divisão por zero em `SUM(amount) / COUNT(*)`.
9. Escreva uma consulta que mostre as vendas de cada produto junto com a média de vendas para sua categoria (use uma função janela).
10. Crie um relatório mostrando: categoria, contagem de produtos, receita total, receita média por produto e a maior venda única por categoria.
