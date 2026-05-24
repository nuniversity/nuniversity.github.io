---
title: "OUTER JOINs e CROSS JOINs"
description: "Domine LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, self-joins e padrões anti-join"
order: 2
duration: "50 minutos"
difficulty: "intermediário"
---

# OUTER JOINs e CROSS JOINs

Enquanto o INNER JOIN mantém apenas linhas correspondentes, OUTER JOINs preservam linhas de um ou ambos os lados mesmo quando não há correspondência. CROSS JOINs produzem todas as combinações possíveis de linhas.

## LEFT JOIN

Um LEFT JOIN preserva todas as linhas da tabela esquerda. Quando não há correspondência na direita, as colunas da tabela direita são NULL.

```sql
SELECT
    d.department_name,
    e.name AS employee
FROM departments d
LEFT JOIN employees e
    ON d.department_id = e.department_id;
```

| department_name | employee |
|----------------|----------|
| Engineering    | Alice    |
| Marketing      | Bob      |
| Finance        | Carol    |
| HR             | NULL     |

O departamento HR aparece mesmo não tendo funcionários.

> [!NOTE]
> Alguns bancos de dados usam `LEFT OUTER JOIN`. A palavra `OUTER` é opcional — `LEFT JOIN` significa a mesma coisa.

## RIGHT JOIN

Um RIGHT JOIN é o espelho do LEFT JOIN: todas as linhas da tabela direita são preservadas.

```sql
SELECT
    e.name AS employee,
    d.department_name
FROM employees e
RIGHT JOIN departments d
    ON e.department_id = d.department_id;
```

Isso é funcionalmente idêntico ao exemplo de LEFT JOIN acima — apenas escrito da outra direção.

> [!WARNING]
> Muitos desenvolvedores acham RIGHT JOIN confuso. Quando possível, reescreva como LEFT JOIN trocando a ordem das tabelas. Virtualmente todo SQL de produção usa LEFT JOIN exclusivamente.

## FULL OUTER JOIN

Um FULL OUTER JOIN preserva linhas de ambas as tabelas. Linhas não correspondidas de qualquer lado recebem NULL para as colunas da tabela oposta.

```sql
SELECT
    e.name AS employee,
    d.department_name
FROM employees e
FULL OUTER JOIN departments d
    ON e.department_id = d.department_id;
```

| employee | department_name |
|----------|----------------|
| Alice    | Engineering    |
| Bob      | Marketing      |
| Carol    | Finance        |
| Dave     | NULL           |
| NULL     | HR             |

Dave não tem departamento; HR não tem funcionários. Ambos aparecem.

```sql
-- Encontrar órfãos de ambos os lados
SELECT
    COALESCE(e.name, 'SEM FUNCIONÁRIO') AS employee,
    COALESCE(d.department_name, 'SEM DEPARTAMENTO') AS department
FROM employees e
FULL OUTER JOIN departments d
    ON e.department_id = d.department_id
WHERE e.employee_id IS NULL
   OR d.department_id IS NULL;
```

> [!NOTE]
> FULL OUTER JOIN não é suportado no MySQL (embora você possa simulá-lo com UNION de LEFT e RIGHT JOINs). PostgreSQL, SQL Server, Oracle e Snowflake o suportam nativamente.

## CROSS JOIN

Um CROSS JOIN produz o produto cartesiano — cada linha da tabela A pareada com cada linha da tabela B.

```sql
SELECT
    s.size,
    c.color
FROM sizes s
CROSS JOIN colors c;
```

| size | color |
|------|-------|
| S    | Red   |
| S    | Blue  |
| M    | Red   |
| M    | Blue  |
| L    | Red   |
| L    | Blue  |

Se sizes tem 3 linhas e colors tem 2 linhas: 6 linhas no resultado.

> [!WARNING]
| CROSS JOIN Implícito | CROSS JOIN Explícito |
|---------------------|---------------------|
| `SELECT * FROM a, b` | `SELECT * FROM a CROSS JOIN b` |
| Fácil de esquecer WHERE | Intencional e claro |

Sempre prefira `CROSS JOIN` explícito para evitar produtos cartesianos acidentais.

### Uso Real de CROSS JOIN

```sql
-- Gerar todas as combinações data-tamanho para relatório de inventário
SELECT
    d.date,
    s.size,
    COALESCE(SUM(inv.quantity), 0) AS total_inventory
FROM (
    SELECT generate_series(
        '2024-01-01'::date,
        '2024-12-31'::date,
        '1 day'::interval
    )::date AS date
) d
CROSS JOIN sizes s
LEFT JOIN inventory inv
    ON d.date = inv.date AND s.size = inv.size
GROUP BY d.date, s.size
ORDER BY d.date, s.size;
```

## Self-Joins com OUTER JOINs

Self-joins funcionam com OUTER JOINs para encontrar linhas que carecem de relacionamentos.

```sql
-- Encontrar funcionários que não têm subordinados diretos (gerentes sem equipe)
SELECT
    m.name AS manager,
    e.name AS direct_report
FROM employees m
LEFT JOIN employees e
    ON m.employee_id = e.manager_id
WHERE e.employee_id IS NULL;

-- Encontrar todos os gerentes e seus subordinados (incluindo os que não têm nenhum)
SELECT
    m.name AS manager,
    e.name AS report
FROM employees m
LEFT JOIN employees e
    ON m.employee_id = e.manager_id;
```

## Padrão Anti-Join

Um anti-join encontra linhas em uma tabela que não têm correspondência em outra. Geralmente é feito com LEFT JOIN + IS NULL ou NOT EXISTS / NOT IN.

```sql
-- Clientes que nunca fizeram um pedido (anti-join)
SELECT c.*
FROM customers c
LEFT JOIN orders o
    ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;
```

| Cliente | Tem Pedido | Incluído |
|----------|-----------|----------|
| Alice    | 1001      | Não      |
| Bob      | 1002      | Não      |
| Carol    | NULL      | Sim      |

```sql
-- Mesmo resultado com NOT EXISTS
SELECT c.*
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.customer_id
);
```

> [!SUCCESS]
| Método Anti-Join | Desempenho | Legibilidade |
|------------------|-----------|--------------|
| LEFT JOIN + IS NULL | Rápido com índices | Claro para veteranos SQL |
| NOT EXISTS | Mais eficiente para subconsultas correlacionadas | Revela intenção |
| NOT IN | Arriscado com NULLs | Simples mas perigoso |

NOT IN é perigoso porque retorna zero linhas se a subconsulta contiver qualquer NULL:

```sql
-- ARRISCADO: retorna nada se algum pedido tiver customer_id NULL
SELECT * FROM customers
WHERE customer_id NOT IN (SELECT customer_id FROM orders);

-- SEGURO: lida com NULLs corretamente
SELECT * FROM customers
WHERE customer_id NOT IN (
    SELECT customer_id FROM orders WHERE customer_id IS NOT NULL
);
```

## Comparatório Resumo de Joins

| Tipo de Join | Linhas Esquerdas | Linhas Direitas | Linhas Resultantes |
|-----------|-----------|------------|-----------------|
| INNER JOIN | Apenas correspondidas | Apenas correspondidas | correspondidas |
| LEFT JOIN | Todas | Apenas correspondidas | todas esq. + correspondidas dir. |
| RIGHT JOIN | Apenas correspondidas | Todas | correspondidas esq. + todas dir. |
| FULL OUTER JOIN | Todas | Todas | todas linhas ambos lados |
| CROSS JOIN | Todas | Todas | len(E) × len(D) |

## Exemplo Real: Catálogo de Produtos com Vendas

```sql
SELECT
    p.product_id,
    p.product_name,
    c.category_name,
    COALESCE(SUM(s.quantity), 0) AS units_sold,
    COALESCE(SUM(s.revenue), 0) AS total_revenue
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
LEFT JOIN sales s ON p.product_id = s.product_id
    AND s.sale_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.product_id, p.product_name, c.category_name
ORDER BY total_revenue DESC;
```

> [!SUCCESS]
> Escolha seu join pelas linhas que você quer manter. INNER JOIN descarta não correspondências. LEFT JOIN mantém linhas da esquerda. FULL OUTER JOIN mantém tudo. CROSS JOIN combina cada linha com todas as outras.

## Perguntas de Prática

1. Qual é a diferença entre LEFT JOIN e INNER JOIN?
2. Escreva uma consulta que mostre todos os departamentos e seus funcionários, incluindo departamentos com zero funcionários.
3. Quando você usaria RIGHT JOIN em vez de LEFT JOIN? Como você pode evitar a necessidade de RIGHT JOIN?
4. O que FULL OUTER JOIN retorna? Dê um cenário onde é útil.
5. Escreva um CROSS JOIN entre as tabelas `colors` e `sizes`. Qual é a cardinalidade se colors tem 5 linhas e sizes tem 4?
6. O que é um anti-join? Escreva um usando LEFT JOIN e um usando NOT EXISTS.
7. Por que NOT IN é perigoso ao juntar tabelas? Como você corrige?
8. Escreva um self-LEFT JOIN que encontre todas as categorias e suas subcategorias, incluindo categorias sem subcategorias.
9. Dadas `students`, `enrollments` e `courses`, escreva uma consulta mostrando todos os alunos e os cursos em que estão matriculados, incluindo alunos sem matrículas.
10. O que acontece com as colunas da tabela não preservada em um OUTER JOIN quando não há correspondência?
