---
title: "ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE()"
description: "Domine as funções de janela de classificação: ROW_NUMBER, RANK, DENSE_RANK, NTILE e comportamento do ORDER BY em janelas"
order: 1
duration: "90 minutos"
difficulty: advanced
---

# ROW_NUMBER(), RANK(), DENSE_RANK(), NTILE()

## Visão Geral das Funções de Janela

Funções de janela realizam cálculos em um conjunto de linhas relacionadas à linha atual. Diferente das funções de agregação com `GROUP BY`, as funções de janela **não colapsam linhas** — cada linha de entrada mantém sua identidade.

```sql
-- Agregação: colapsa
SELECT department_id, AVG(salary)
FROM employees
GROUP BY department_id;

-- Janela: preserva detalhes
SELECT employee_id, department_id, salary,
       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
FROM employees;
```

[!NOTE]
A cláusula `OVER` define a janela. Uma janela pode incluir `PARTITION BY` (grupos de linhas), `ORDER BY` (ordenação dentro dos grupos) e especificações de quadro (limites de linhas).

## ROW_NUMBER()

Atribui um número inteiro sequencial único a cada linha dentro de uma partição, começando em 1.

```sql
SELECT
  employee_id,
  department_id,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
FROM employees;
```

### Casos de Uso Comuns

- **Desduplicação**: Manter a primeira ocorrência e excluir duplicatas.
- **Paginação**: Numerar linhas e filtrar por página.
- **Top-N por grupo**: Atribuir números de linha e filtrar.

```sql
-- Desduplicar
WITH numbered AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS rn
  FROM users
)
DELETE FROM users WHERE (email, created_at) IN (
  SELECT email, created_at FROM numbered WHERE rn > 1
);

-- Paginação
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM products
) t WHERE rn BETWEEN 21 AND 40;
```

## RANK() e DENSE_RANK()

Ambos atribuem classificações com empates tratados de forma diferente:

| Função | Empates | Próximo rank após empate | Exemplo (valores: 100, 90, 90, 80) |
|---|---|---|---|
| `ROW_NUMBER()` | Arbitrário | N/A | 1, 2, 3, 4 |
| `RANK()` | Mesmo rank | Pula | 1, 2, 2, 4 |
| `DENSE_RANK()` | Mesmo rank | Não pula | 1, 2, 2, 3 |

```sql
SELECT
  employee_id,
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
  RANK()       OVER (ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;
```

### Casos de Uso para RANK/DENSE_RANK

- **RANK**: "Mostre-me os 5 maiores salários" — se 3 pessoas empatam em 1º, o próximo é 4º.
- **DENSE_RANK**: "Mostre-me os 5 principais níveis salariais" — todos nos 5 valores distintos principais.

```sql
-- 5 principais níveis salariais distintos
SELECT *
FROM (
  SELECT *,
         DENSE_RANK() OVER (ORDER BY salary DESC) AS dr
  FROM employees
) t WHERE dr <= 5;
```

## NTILE()

Divide as linhas em N buckets aproximadamente iguais e atribui um número de bucket (1 a N).

```sql
SELECT
  employee_id,
  salary,
  NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

### Estratégias NTILE

| Buckets | Nome | Significado |
|---|---|---|
| 2 | Divisão mediana | Metade superior/inferior |
| 4 | Quartis | Q1–Q4 |
| 10 | Decis | Top 10%, bottom 10% |
| 100 | Percentis | Classificação por percentil |

```sql
-- Decil superior de funcionários
SELECT * FROM (
  SELECT *, NTILE(10) OVER (ORDER BY sales DESC) AS decile
  FROM sales_reps
) t WHERE decile = 1;
```

[!WARNING]
`NTILE` requer um `ORDER BY`. Quando o número de linhas não é divisível pela contagem de buckets, os primeiros buckets recebem uma linha extra. Sempre verifique o comportamento de desempate do seu banco de dados.

## ORDER BY em Janelas

O `ORDER BY` dentro de `OVER` define a ordem lógica dentro de cada partição. Importantemente, ele interage com o **quadro padrão**:

- Sem `ORDER BY`: o quadro é **todas as linhas na partição**.
- Com `ORDER BY`: o quadro padrão é `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

```sql
-- Total acumulado: quadro padrão com ORDER BY
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Equivalente a
SELECT
  order_date,
  amount,
  SUM(amount) OVER (
    ORDER BY order_date
    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders;
```

### ORDER BY com NULLS

```sql
-- Controlar posição dos NULL
SELECT
  employee_id,
  commission,
  ROW_NUMBER() OVER (ORDER BY commission NULLS LAST) AS rn
FROM employees;
```

## Especificações de Quadro

| Cláusula | Significado |
|---|---|
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Deslocamento físico de linhas |
| `RANGE BETWEEN 5 PRECEDING AND CURRENT ROW` | Deslocamento lógico de valor (requer ORDER BY) |
| `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | Todas as linhas até a atual (padrão) |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | Atual + todas depois |
| `ROWS BETWEEN 3 PRECEDING AND 1 FOLLOWING` | Janela de 5 linhas |

```sql
-- Média móvel de 3 dias
SELECT
  order_date,
  amount,
  AVG(amount) OVER (
    ORDER BY order_date
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS moving_avg_3d
FROM orders;
```

## Exemplos Práticos

### Exemplo 1: Sessões em Logs Web

Atribuir um ID de sessão a cada sessão de usuário com base em uma lacuna de inatividade de 30 minutos.

```sql
WITH lagged AS (
  SELECT
    user_id,
    page,
    event_time,
    LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_time
  FROM web_events
),
sessions AS (
  SELECT *,
    SUM(CASE WHEN prev_time IS NULL
          OR EXTRACT(EPOCH FROM event_time - prev_time) > 1800
        THEN 1 ELSE 0 END
    ) OVER (PARTITION BY user_id ORDER BY event_time) AS session_id
  FROM lagged
)
SELECT user_id, session_id,
       COUNT(*) AS page_views,
       MIN(event_time) AS session_start,
       MAX(event_time) AS session_end
FROM sessions
GROUP BY user_id, session_id;
```

### Exemplo 2: Salário Mediano por Departamento

```sql
SELECT DISTINCT department_id,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)
    OVER (PARTITION BY department_id) AS median_salary
FROM employees;
```

### Exemplo 3: Lacunas e Ilhas

```sql
-- Encontrar intervalos de datas consecutivos por produto
WITH numbered AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sale_date) AS rn,
    sale_date - INTERVAL '1 day' * ROW_NUMBER()
      OVER (PARTITION BY product_id ORDER BY sale_date) AS grp
  FROM sales
)
SELECT product_id,
  MIN(sale_date) AS range_start,
  MAX(sale_date) AS range_end,
  COUNT(*) AS days_in_range
FROM numbered
GROUP BY product_id, grp
ORDER BY product_id, range_start;
```

## Considerações de Performance

| Função | Custo | Observações |
|---|---|---|
| `ROW_NUMBER()` | Baixo | Uma ordenação por partição |
| `RANK()` | Baixo | Mesma ordenação que ROW_NUMBER |
| `DENSE_RANK()` | Baixo | Mesma ordenação que ROW_NUMBER |
| `NTILE()` | Médio | Requer contagem de linhas + distribuição |
| Muitas partições | Alto | Ordenação domina — indexar colunas de partição e ordem |

[!TIP]
Crie um índice composto em `(coluna_particao, coluna_ordem)` para que as ordenações das funções de janela usem uma varredura de índice em vez de uma ordenação completa.

```sql
CREATE INDEX idx_dept_salary ON employees (department_id, salary DESC);
```

## Perguntas de Prática

1. Qual é a diferença entre `RANK()` e `DENSE_RANK()`? Dê um exemplo com valores empatados.
2. Escreva uma consulta que atribua a cada funcionário um número de linha dentro de seu departamento ordenado por data de contratação (mais antigo primeiro).
3. Você tem uma tabela `orders(id, customer_id, order_date, total)`. Escreva uma consulta para encontrar os 3 pedidos mais recentes por cliente.
4. Como o `NTILE(4)` se comporta quando há 10 linhas na partição? Quantas linhas em cada bucket?
5. Escreva uma consulta para desduplicar linhas de `users(id, email, signup_date)` mantendo apenas o cadastro mais antigo por email.
6. Qual é o quadro de janela padrão quando `ORDER BY` é especificado dentro de `OVER`? Quando `ORDER BY` está ausente?
7. Use `NTILE` para segmentar funcionários em 5 níveis de desempenho por valor de vendas e conte quantos estão em cada nível.
8. Escreva uma média móvel de preços de ações em uma janela de 7 dias (6 anteriores + atual).
9. Dada uma tabela `logs(user_id, action, timestamp)`, escreva uma consulta que atribua um número de sessão a cada usuário onde uma nova sessão começa após 30 minutos de inatividade.
10. Explique a diferença entre `ROWS BETWEEN 3 PRECEDING AND CURRENT ROW` e `RANGE BETWEEN 3 PRECEDING AND CURRENT ROW` com um exemplo.
