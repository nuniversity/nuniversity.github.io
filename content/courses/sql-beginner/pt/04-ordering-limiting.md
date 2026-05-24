---
title: "Ordenando, Limitando e Renomeando Resultados"
description: "Domine ORDER BY, LIMIT, OFFSET, DISTINCT e aliases AS para controlar a apresentação dos resultados"
order: 4
duration: "20-30 minutos"
difficulty: "beginner"
---

# Ordenando, Limitando e Renomeando Resultados

Resultados brutos de consultas raramente estão na ordem que você precisa. Esta lição ensina como ordenar, paginar, deduplicar e renomear colunas para uma saída limpa.

## ORDER BY — Ordenando Resultados

`ORDER BY` ordena o conjunto de resultados por uma ou mais colunas.

```sql
SELECT name, salary FROM employees
ORDER BY salary ASC;   -- ascendente (padrão)
```

```sql
SELECT name, salary FROM employees
ORDER BY salary DESC;  -- descendente
```

| name | salary |
|------|--------|
| Bob Smith | 72000 |
| Eve Martinez | 78000 |
| Carol Chen | 88000 |
| Alice Johnson | 95000 |

### Ordenando por Múltiplas Colunas

```sql
SELECT department, name, salary
FROM employees
ORDER BY department ASC, salary DESC;
```

Isso ordena alfabeticamente por departamento, depois pelo maior salário dentro de cada departamento.

> [!NOTE]
> `ASC` é o padrão. Você só precisa escrever `DESC` para ordem descendente.

### Ordenando por Posição da Coluna

Você pode referenciar colunas pela sua posição na lista SELECT (não recomendado para produção):

```sql
SELECT name, salary FROM employees ORDER BY 2 DESC;
-- Ordena pela 2ª coluna (salary)
```

> [!WARNING]
> Ordenar por posição ordinal (2, 3, etc.) é frágil. Se a lista SELECT mudar, a ordem de classificação muda silenciosamente. Sempre use nomes de colunas.

### Ordenando com Expressões

```sql
SELECT name, salary, salary * 1.1 AS projected_raise
FROM employees
ORDER BY projected_raise DESC;
```

## LIMIT e OFFSET — Paginação

`LIMIT` restringe quantas linhas são retornadas. `OFFSET` pula um número de linhas antes de retornar os resultados.

```sql
-- Top 5 funcionários com maiores salários
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5;
```

```sql
-- 5 funcionários após pular os primeiros 5 (página 2)
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5 OFFSET 5;
```

> [!SUCCESS]
> Juntos, `LIMIT` e `OFFSET` implementam paginação. Página 1 é `LIMIT 10 OFFSET 0`, página 2 é `LIMIT 10 OFFSET 10`, etc.

### Variações de Sintaxe LIMIT

Diferentes bancos de dados têm sintaxes ligeiramente diferentes:

| RDBMS | Sintaxe |
|-------|---------|
| PostgreSQL, SQLite | `LIMIT 10 OFFSET 5` |
| MySQL | `LIMIT 5, 10` (offset, count) |
| SQL Server | `OFFSET 5 ROWS FETCH NEXT 10 ROWS ONLY` |
| Oracle | `OFFSET 5 ROWS FETCH NEXT 10 ROWS ONLY` |

```sql
-- Estilo MySQL (offset, count)
SELECT name, salary FROM employees
ORDER BY salary DESC
LIMIT 5, 10;  -- Pula 5, retorna 10
```

## DISTINCT — Remover Duplicatas

`DISTINCT` retorna apenas valores únicos para as colunas selecionadas.

```sql
-- Liste todos os departamentos únicos
SELECT DISTINCT department FROM employees;
```

| department |
|------------|
| Engineering |
| Marketing |
| Sales |

```sql
-- Combinações únicas de departamento e status
SELECT DISTINCT department, status FROM employees;
```

> [!NOTE]
> `DISTINCT` se aplica a todas as colunas selecionadas, não apenas à primeira. `SELECT DISTINCT a, b` retorna pares únicos, não valores únicos de `a`.

### COUNT(DISTINCT ...)

```sql
SELECT COUNT(DISTINCT department) AS unique_departments
FROM employees;
```

## Aliases AS

Aliases renomeiam colunas ou tabelas no conjunto de resultados. Eles **não** alteram o esquema subjacente.

### Aliases de Coluna

```sql
SELECT name AS employee_name,
       salary * 12 AS annual_salary
FROM employees;
```

| employee_name | annual_salary |
|---------------|---------------|
| Alice Johnson | 1140000 |
| Bob Smith | 864000 |

### Aliases de Tabela

Aliases de tabela tornam as consultas mais curtas e legíveis, especialmente com junções:

```sql
SELECT e.name, d.name AS department_name
FROM employees AS e
JOIN departments AS d ON e.department_id = d.id;
```

> [!SUCCESS]
> A palavra-chave `AS` é opcional. `SELECT name employee_name` funciona, mas `AS` torna a intenção explícita. Use-a.

### Aliases com Espaços

Se um alias contém espaços, coloque-o entre aspas duplas (ou crases no MySQL):

```sql
SELECT name AS "Employee Name", salary AS "Annual Salary"
FROM employees;
```

## Juntando Tudo

```sql
-- Página 3 de departamentos únicos, ordenados alfabeticamente
SELECT DISTINCT department AS dept
FROM employees
ORDER BY dept
LIMIT 5 OFFSET 10;
```

## Caso de Uso Real: Ranking

```sql
-- Top 10 jogadores com as maiores pontuações, paginado
SELECT
    username AS player,
    score,
    RANK() OVER (ORDER BY score DESC) AS rank
FROM leaderboard
ORDER BY score DESC
LIMIT 10 OFFSET 0;
```

## Caso de Uso Real: Pedidos Recentes com Paginação

```sql
-- Mostre a página 2 dos pedidos mais recentes (5 por página)
SELECT
    id AS order_id,
    customer_name,
    total AS order_total,
    order_date
FROM orders
ORDER BY order_date DESC, id DESC
LIMIT 5 OFFSET 5;
```

> [!WARNING]
> `OFFSET` fica lento em grandes conjuntos de dados porque o banco de dados ainda precisa escanear e descartar linhas puladas. Para paginação profunda (página 1000+), use paginação por chave (`WHERE id > ultimo_id_visto LIMIT 10`).

## DISTINCT vs GROUP BY

`DISTINCT` e `GROUP BY` podem ambos deduplicar, mas servem a propósitos diferentes:

| Característica | DISTINCT | GROUP BY |
|----------------|----------|----------|
| Propósito | Remover duplicatas | Agrupar linhas para agregação |
| Pode usar agregados | Não | Sim |
| Performance | Similar (mesmo plano de execução frequentemente) | Similar |
| Legibilidade | Mais limpo para dedup simples | Necessário para agregados |

```sql
-- Mesmo resultado, intenção diferente
SELECT DISTINCT department FROM employees;
SELECT department FROM employees GROUP BY department;
```

## Perguntas de Prática

Dada `employees(id, name, department, salary, hire_date)`:

1. Escreva uma consulta para listar todos os funcionários ordenados por data de contratação, do mais recente primeiro.
2. Retorne os 3 funcionários contratados mais recentemente.
3. Liste todos os departamentos únicos em ordem alfabética.
4. Qual é a diferença entre `LIMIT 5 OFFSET 5` e `LIMIT 5, 5`?
5. Escreva uma consulta que retorne nomes de funcionários com alias "full_name" e seus salários com alias "monthly_pay".
6. Mostre funcionários ordenados por departamento (A-Z), depois por salário (maior primeiro dentro de cada departamento).
7. Retorne a 4ª página de funcionários (10 por página).
8. Como você contaria quantos departamentos distintos existem na tabela employees?
9. Por que ordenar por posição da coluna (`ORDER BY 2`) é desencorajado?
10. Escreva uma consulta que retorne os 5 funcionários com menores salários.
