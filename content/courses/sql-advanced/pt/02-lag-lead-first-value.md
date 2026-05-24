---
title: "LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE(), NTH_VALUE()"
description: "Domine as funções de valor de janela: LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE e cláusulas de quadro (ROWS, RANGE, GROUPS)"
order: 2
duration: "90 minutos"
difficulty: advanced
---

# LAG(), LEAD(), FIRST_VALUE(), LAST_VALUE(), NTH_VALUE()

## Funções de Valor no Contexto de Janela

Funções de valor fornecem acesso a outras linhas dentro do mesmo conjunto de resultados **sem um self-join**. Elas são a base para análise de séries temporais, detecção de mudanças e classificação.

| Função | Retorna |
|---|---|
| `LAG(expr, offset, default)` | Valor de uma linha **antes** da linha atual |
| `LEAD(expr, offset, default)` | Valor de uma linha **depois** da linha atual |
| `FIRST_VALUE(expr)` | Valor da **primeira** linha no quadro da janela |
| `LAST_VALUE(expr)` | Valor da **última** linha no quadro da janela |
| `NTH_VALUE(expr, n)` | Valor da **enésima** linha no quadro da janela |

## LAG() e LEAD()

```sql
-- Comparar o salário de cada funcionário com o anterior contratado no mesmo departamento
SELECT
  employee_id,
  department_id,
  hire_date,
  salary,
  LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS prev_salary,
  salary - LAG(salary, 1, 0) OVER (PARTITION BY department_id ORDER BY hire_date) AS diff
FROM employees;
```

### Offset e Padrão

O segundo argumento é o **offset** (número de linhas atrás/adiante). O terceiro é o **padrão** quando não existe linha (padrão é `NULL`).

```sql
-- Olhar 2 linhas à frente, padrão 0
LEAD(amount, 2, 0) OVER (ORDER BY event_date)

-- Valor anterior, sem padrão (NULL se não houver linha anterior)
LAG(metric) OVER (ORDER BY ts)
```

### Casos de Uso Comuns

```sql
-- Mudança de receita dia a dia
SELECT
  order_date,
  revenue,
  LAG(revenue) OVER (ORDER BY order_date) AS prev_day_revenue,
  ROUND(
    (revenue - LAG(revenue) OVER (ORDER BY order_date))
    / NULLIF(LAG(revenue) OVER (ORDER BY order_date), 0) * 100, 2
  ) AS pct_change
FROM daily_revenue;

-- Comparação ano a ano
SELECT
  EXTRACT(YEAR FROM order_date) AS year,
  EXTRACT(MONTH FROM order_date) AS month,
  SUM(amount) AS monthly_total,
  LAG(SUM(amount), 12) OVER (ORDER BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)) AS same_month_last_year
FROM orders
GROUP BY year, month;
```

[!IMPORTANT]
`LAG`/`LEAD` com grandes offsets podem ser caros. Em bancos com milhões de linhas, considere indexar as colunas do `ORDER BY`.

## FIRST_VALUE() e LAST_VALUE()

```sql
SELECT
  department_id,
  employee_id,
  salary,
  FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS highest_in_dept,
  LAST_VALUE(salary)  OVER (PARTITION BY department_id ORDER BY salary DESC) AS lowest_in_dept
FROM employees;
```

### A Armadilha do LAST_VALUE

`LAST_VALUE` sem um quadro explícito retorna a **linha atual**, não a última linha na partição. Isso acontece porque o quadro padrão com `ORDER BY` é `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

```sql
-- ERRADO: LAST_VALUE retorna a linha atual, não o máximo da partição
SELECT
  department_id,
  salary,
  LAST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) AS wrong_min
FROM employees;

-- CORRETO: Especificar o quadro
SELECT
  department_id,
  salary,
  LAST_VALUE(salary) OVER (
    PARTITION BY department_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS correct_min
FROM employees;
```

## Cláusulas de Quadro (Frame)

Quadros definem quais linhas são visíveis para a função de janela.

| Cláusula de quadro | Significado |
|---|---|
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | Linhas físicas do início até a atual |
| `ROWS BETWEEN 5 PRECEDING AND 2 FOLLOWING` | 5 antes, atual, 2 depois |
| `RANGE BETWEEN 100 PRECEDING AND CURRENT ROW` | Linhas onde o valor ORDER BY está a até 100 da atual |
| `RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW` | Janela baseada em tempo (PostgreSQL) |
| `GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING` | Grupos de pares (mesmo valor ORDER BY) |

### ROWS vs RANGE vs GROUPS

| Tipo de quadro | Base | Tratamento de empates |
|---|---|---|
| `ROWS` | Contagem física de linhas | Ignora empates — cada linha é distinta |
| `RANGE` | Diferença de valor da linha atual | Inclui todos os empates |
| `GROUPS` | Grupos de valores iguais | Trata valores iguais como um grupo |

```sql
-- ROWS: deslocamento físico estrito
SELECT
  value,
  event_date,
  SUM(value) OVER (ORDER BY event_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rows_3
FROM metrics;

-- RANGE: todas as linhas dentro de 10 unidades de valor
SELECT
  score,
  AVG(score) OVER (ORDER BY score RANGE BETWEEN 5 PRECEDING AND 5 FOLLOWING) AS rang_avg
FROM exam_results;

-- GROUPS: grupos de pares
SELECT
  department_id,
  headcount,
  SUM(headcount) OVER (ORDER BY headcount GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS grps_sum
FROM dept_stats;
```

[!TIP]
Use `RANGE` para janelas de data/hora em dados financeiros ou IoT onde você precisa de todos os pontos de dados dentro de um intervalo de tempo, independentemente de quantas linhas existem.

## NTH_VALUE()

Retorna o valor da enésima linha no quadro da janela.

```sql
SELECT
  department_id,
  salary,
  NTH_VALUE(salary, 2) OVER (
    PARTITION BY department_id
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS second_highest
FROM employees;
```

### NTH_VALUE com Controle de Quadro

```sql
-- Terceiro maior por departamento
SELECT DISTINCT department_id,
  NTH_VALUE(salary, 3) OVER (
    PARTITION BY department_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS third_highest
FROM employees;
```

## Exemplos Práticos

### Exemplo 1: Duração de Sessão a partir de Logs Web

```sql
WITH ordered AS (
  SELECT
    session_id,
    event_time,
    page,
    LEAD(event_time) OVER (PARTITION BY session_id ORDER BY event_time) AS next_event_time
  FROM web_logs
)
SELECT
  session_id,
  MIN(event_time) AS session_start,
  MAX(next_event_time) AS session_end,
  SUM(EXTRACT(EPOCH FROM next_event_time - event_time)) AS total_active_seconds
FROM ordered
WHERE next_event_time IS NOT NULL
GROUP BY session_id;
```

### Exemplo 2: Indicador de Momentum de Preço

```sql
SELECT
  ticker,
  trade_date,
  close_price,
  LAG(close_price, 20) OVER (PARTITION BY ticker ORDER BY trade_date) AS price_20d_ago,
  ROUND(
    (close_price - LAG(close_price, 20) OVER (PARTITION BY ticker ORDER BY trade_date))
    / NULLIF(LAG(close_price, 20) OVER (PARTITION BY ticker ORDER BY trade_date), 0) * 100, 2
  ) AS momentum_20d
FROM stock_prices;
```

### Exemplo 3: Flag Booleana para Mudanças de Estado

```sql
SELECT
  device_id,
  status,
  event_time,
  CASE
    WHEN status <> LAG(status) OVER (PARTITION BY device_id ORDER BY event_time)
    THEN 1 ELSE 0
  END AS status_changed
FROM device_events;
```

### Exemplo 4: Mediana Móvel (Janela de Valor)

```sql
SELECT
  reading_time,
  sensor_value,
  AVG(sensor_value) OVER (
    ORDER BY reading_time
    ROWS BETWEEN 6 PRECEDING AND 6 FOLLOWING
  ) AS rolling_avg_13
FROM sensor_readings;
```

## Notas de Performance

| Função | Custo do quadro | Recomendação de índice |
|---|---|---|
| `LAG`/`LEAD` (offset=1) | O(n) | Índice na coluna de ordenação |
| `LAG`/`LEAD` (grande offset) | O(n) | Índice composto |
| `FIRST_VALUE` | O(n) por partição | Índice partição + ordem |
| `LAST_VALUE` com quadro completo | O(n log n) | Considere subconsulta |
| `NTH_VALUE` | O(n) | Evite com n grande |

[!WARNING]
`LAST_VALUE` e `NTH_VALUE` com quadros grandes podem causar pressão significativa de memória. Para min/max simples, prefira `MIN() OVER()` ou `MAX() OVER()`.

## Perguntas de Prática

1. Escreva uma consulta para encontrar a mudança de temperatura diária usando `LAG` em uma tabela `weather(date, temperature)`.
2. Qual é a diferença entre `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` e `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`?
3. Dada `orders(id, customer_id, order_date, amount)`, use `LAG` para calcular a diferença em dias entre pedidos consecutivos para o mesmo cliente.
4. Por que `LAST_VALUE` às vezes retorna a linha atual em vez da última linha na partição? Como corrigir?
5. Escreva uma consulta que retorne o preço de cada produto junto com os próximos 2 preços para aquele produto (ordenado por data).
6. Dada `sensor_readings(sensor_id, reading_time, value)`, calcule uma média móvel de 5 minutos para cada sensor usando `RANGE BETWEEN`.
7. Use `NTH_VALUE` para encontrar a terceira maior pontuação por turma a partir de `exam_scores(student_id, class_id, score)`.
8. Escreva uma consulta para marcar linhas onde um `user_status` muda de `'active'` para `'inactive'` em uma tabela `user_log`.
9. Compare os tipos de quadro `ROWS`, `RANGE` e `GROUPS`. Dê um cenário onde cada um é a escolha mais apropriada.
10. Escreva uma consulta que calcule o crescimento ano a ano para receita mensal, preenchendo meses faltantes com 0 usando `COALESCE` com `LAG`.
