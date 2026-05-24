---
title: "PIVOT, UNPIVOT e Consultas Crosstab"
description: "Domine a transformação linha-para-coluna: PIVOT baseado em CASE, PIVOT/UNPIVOT nativo, consultas crosstab e técnicas de pivô dinâmico"
order: 3
duration: "90 minutos"
difficulty: advanced
---

# PIVOT, UNPIVOT e Consultas Crosstab

## Transformação Linha-para-Coluna

Pivoteamento transforma valores únicos de linhas em cabeçalhos de colunas. Isso é essencial para relatórios, painéis e desnormalização de dados.

```sql
-- Entrada: formato longo
-- department | year | revenue
-- Sales      | 2023 | 100000
-- Sales      | 2024 | 120000
-- Eng        | 2023 | 200000

-- Saída: formato largo
-- department | 2023    | 2024
-- Sales      | 100000  | 120000
-- Eng        | 200000  | NULL
```

## PIVOT Baseado em CASE (Portável)

Funciona em **todos** os bancos de dados SQL.

```sql
SELECT
  department,
  MAX(CASE WHEN year = 2023 THEN revenue END) AS "2023",
  MAX(CASE WHEN year = 2024 THEN revenue END) AS "2024",
  MAX(CASE WHEN year = 2025 THEN revenue END) AS "2025"
FROM department_revenue
GROUP BY department;
```

### Por que MAX()?

Sem uma agregação, cada combinação de `department` e `year` produz uma linha. `MAX()` colapsa escolhendo o valor não-NULL. Se pode haver múltiplos valores, use `SUM()`.

```sql
-- Múltiplos valores por célula (somá-los)
SELECT
  product_id,
  SUM(CASE WHEN month = 1 THEN amount END) AS jan,
  SUM(CASE WHEN month = 2 THEN amount END) AS feb,
  SUM(CASE WHEN month = 3 THEN amount END) AS mar
FROM monthly_sales
GROUP BY product_id;
```

## PIVOT Nativo (PostgreSQL, SQL Server, Oracle)

PostgreSQL 16+ e bancos de dados dedicados suportam sintaxe `PIVOT` nativa.

```sql
-- PostgreSQL (via extensão tablefunc) / SQL Server
SELECT *
FROM (
  SELECT department, year, revenue
  FROM department_revenue
) AS src
PIVOT (
  MAX(revenue)
  FOR year IN (2023, 2024, 2025)
) AS pvt;
```

[!NOTE]
PostgreSQL não tem uma palavra-chave `PIVOT` nativa (pré-16). Use a função `crosstab()` da extensão `tablefunc` ou a abordagem baseada em CASE. SQL Server e Oracle têm `PIVOT` nativo.

## UNPIVOT (Colunas para Linhas)

```sql
-- Entrada: largo
-- product | q1 | q2 | q3 | q4
-- Widget  | 10 | 20 | 15 | 25

-- Saída: longo
-- product | quarter | sales
-- Widget  | q1      | 10
-- Widget  | q2      | 20
```

### UNPIVOT Baseado em CASE

```sql
SELECT product_id, 'q1' AS quarter, q1 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q2' AS quarter, q2 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q3' AS quarter, q3 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'q4' AS quarter, q4 AS sales FROM quarterly_sales
ORDER BY product_id, quarter;
```

### UNPIVOT Nativo (SQL Server, Oracle)

```sql
SELECT product_id, quarter, sales
FROM quarterly_sales
UNPIVOT (
  sales FOR quarter IN (q1, q2, q3, q4)
) AS unpvt;
```

## Crosstab com tablefunc (PostgreSQL)

```sql
-- Requer: CREATE EXTENSION IF NOT EXISTS tablefunc;

SELECT *
FROM crosstab(
  'SELECT department, year, revenue
   FROM department_revenue
   ORDER BY 1, 2',
  'SELECT DISTINCT year FROM department_revenue ORDER BY 1'
) AS ct (
  department TEXT,
  "2023" NUMERIC,
  "2024" NUMERIC,
  "2025" NUMERIC
);
```

[!WARNING]
`crosstab()` espera exatamente 3 colunas: `row_name`, `category`, `value`. A segunda consulta define os valores das colunas. Incompatibilidades causam erros em tempo de execução.

### Crosstab com Múltiplas Colunas de Valor

```sql
SELECT *
FROM crosstab(
  'SELECT department, year, revenue, expenses
   FROM department_finances
   ORDER BY 1, 2',
  'SELECT DISTINCT year FROM department_finances ORDER BY 1'
) AS ct (
  department TEXT,
  rev2023 NUMERIC, exp2023 NUMERIC,
  rev2024 NUMERIC, exp2024 NUMERIC,
  rev2025 NUMERIC, exp2025 NUMERIC
);
```

## Pivoteamento Dinâmico

Quando os valores das colunas de pivô são desconhecidos no momento da escrita da consulta, use SQL dinâmico.

### Pivot Dinâmico no PostgreSQL

```sql
DO $$
DECLARE
  year_list TEXT;
  query TEXT;
BEGIN
  SELECT string_agg(DISTINCT
    FORMAT('MAX(CASE WHEN year = %s THEN revenue END) AS "%s"', year, year), ', ')
  INTO year_list
  FROM department_revenue;

  query := FORMAT(
    'SELECT department, %s FROM department_revenue GROUP BY department ORDER BY department',
    year_list
  );

  EXECUTE query;
END $$;
```

### Pivot Dinâmico no SQL Server

```sql
DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);

SELECT @columns = STRING_AGG(QUOTENAME(year), ',')
FROM (SELECT DISTINCT year FROM department_revenue) AS years;

SET @sql = N'
  SELECT department, ' + @columns + N'
  FROM (
    SELECT department, year, revenue
    FROM department_revenue
  ) AS src
  PIVOT (
    MAX(revenue) FOR year IN (' + @columns + N')
  ) AS pvt
  ORDER BY department;
';

EXEC sp_executesql @sql;
```

[!TIP]
O pivoteamento dinâmico é poderoso, mas introduz risco de injeção SQL. Sempre sanitize os nomes das colunas, ou use `QUOTENAME()` (SQL Server) ou `format('%I', col)` (PostgreSQL).

## Exemplos Práticos

### Exemplo 1: Matriz de Presença

```sql
-- Longo: student, date, status (present/absent/late)
-- Pivot para: student | 2024-01-01 | 2024-01-02 | ...

SELECT *
FROM crosstab(
  'SELECT student, date, status
   FROM attendance
   ORDER BY 1, 2',
  'SELECT DISTINCT date FROM attendance ORDER BY 1'
) AS ct (
  student TEXT,
  "2024-01-01" TEXT,
  "2024-01-02" TEXT,
  "2024-01-03" TEXT
);
```

### Exemplo 2: Matriz de Respostas de Pesquisa

```sql
-- Cada linha = respondente, cada coluna = pergunta
SELECT
  respondent_id,
  MAX(CASE WHEN question_id = 1 THEN answer END) AS q1_rating,
  MAX(CASE WHEN question_id = 2 THEN answer END) AS q2_rating,
  MAX(CASE WHEN question_id = 3 THEN answer END) AS q3_rating
FROM survey_responses
GROUP BY respondent_id;
```

### Exemplo 3: Receita Mensal por Categoria de Produto

```sql
WITH monthly AS (
  SELECT
    category,
    TO_CHAR(order_date, 'YYYY-MM') AS month,
    SUM(amount) AS revenue
  FROM orders
  GROUP BY category, TO_CHAR(order_date, 'YYYY-MM')
)
SELECT *
FROM crosstab(
  'SELECT category, month, revenue
   FROM monthly
   ORDER BY 1, 2',
  'SELECT DISTINCT month FROM monthly ORDER BY 1'
) AS ct (
  category TEXT,
  "2024-01" NUMERIC,
  "2024-02" NUMERIC,
  "2024-03" NUMERIC,
  "2024-04" NUMERIC,
  "2024-05" NUMERIC,
  "2024-06" NUMERIC
);
```

## Comparação de Performance

| Método | Portabilidade | Dinâmico | Velocidade | Complexidade |
|---|---|---|---|---|
| CASE + agregado | Todos os bancos | Manual | Rápida | Baixa |
| PIVOT nativo | SQL Server, Oracle, PG 16+ | Via SQL dinâmico | Rápida | Baixa |
| crosstab() | PostgreSQL (tablefunc) | Via SQL dinâmico | Mais rápida | Média |
| UNION ALL UNPIVOT | Todos os bancos | N/A | Lenta em tabelas largas | Baixa |

## Perguntas de Prática

1. Converta `students(id, subject, score)` do formato longo para largo (uma coluna por matéria) usando CASE.
2. Quais são as três colunas exigidas por `crosstab()`? Por que a entrada deve ser ordenada?
3. Escreva uma consulta para unpivot `sales(product_id, jan, feb, mar, apr, may, jun)` em `(product_id, month, amount)`.
4. Como você implementaria um pivô quando os valores das colunas não são conhecidos antecipadamente?
5. Dada `employees(id, department, salary)`, faça um pivô para mostrar o salário médio por departamento como colunas.
6. Qual é a diferença entre `PIVOT` nativo e `crosstab()` no PostgreSQL?
7. Escreva uma consulta de pivô dinâmico para PostgreSQL que pivoteie por ano sem codificar nomes de colunas.
8. Dada `orders(order_id, product, quantity, unit_price)`, escreva um pivô mostrando a receita total por produto como colunas.
9. Explique por que `MAX()` é comumente usado em pivôs baseados em CASE. O que acontece se você omitir a agregação?
10. Converta uma tabela larga `sensor_log(sensor_id, temp_1h, temp_2h, ..., temp_24h)` para o formato longo com `(sensor_id, hour, temperature)`.
