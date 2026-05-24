---
title: "INNER JOINs e Equi-Joins"
description: "Domine INNER JOIN, equi-joins, junção de 3+ tabelas, aliases de tabela e natural joins em SQL"
order: 1
duration: "45 minutos"
difficulty: "intermediário"
---

# INNER JOINs e Equi-Joins

Bancos de dados relacionais armazenam dados em várias tabelas. JOINs permitem reunir esses dados. O INNER JOIN é o tipo de junção mais comum e fundamental.

## Fundamentos do INNER JOIN

Um INNER JOIN retorna linhas onde a condição de junção é correspondente — linhas que não correspondem são descartadas de ambos os lados.

```sql
SELECT *
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id;
```

| employees |   | departments |
|-----------|-------|-------------|
| 1 | Alice | 10 |  | 10 | Engineering |
| 2 | Bob   | 20 |  | 20 | Marketing   |
| 3 | Carol | 30 |  | 30 | Finance     |
| 4 | Dave  | 40 |  |  |  |

Resultado: linhas 1-3 correspondem; Dave (dept 40) e Finance (sem funcionários) são excluídos.

> [!NOTE]
> `INNER JOIN` e `JOIN` são sinônimos em SQL. Use o que preferir, mas `INNER JOIN` é mais explícito.

## Equi-Joins

Um equi-join usa igualdade (`=`) na cláusula ON. Este é o padrão de junção mais comum.

```sql
SELECT e.name, d.department_name
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id;
```

Equi-joins mapeiam chaves estrangeiras para chaves primárias. Os nomes das colunas não precisam corresponder — apenas os valores.

```sql
-- Nomes de colunas diferentes, mesmos valores
SELECT o.order_id, c.name
FROM orders o
INNER JOIN customers c
    ON o.customer_id = c.id;
```

## Aliases de Tabela

Aliases de tabela encurtam consultas e desambiguam referências a colunas.

```sql
SELECT e.name AS employee_name,
       d.name AS department_name,
       l.city
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id
INNER JOIN locations l ON d.location_id = l.id;
```

| Alias | Tabela Completa |
|-------|----------------|
| `e` | employees |
| `d` | departments |
| `l` | locations |

> [!WARNING]
> Sempre use aliases significativos (`e`, `d`, `l`) em vez de `a`, `b`, `c`. Seu eu do futuro agradecerá.

## Juntando 3+ Tabelas

Não há limite para o número de JOINs em uma consulta, mas cada junção adicional reduz o desempenho.

```sql
SELECT
    e.first_name,
    e.last_name,
    d.department_name,
    p.project_name,
    t.task_description
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id
INNER JOIN projects p ON d.dept_id = p.dept_id
INNER JOIN tasks t ON p.project_id = t.project_id
WHERE e.hire_date >= '2023-01-01';
```

Esta consulta começa com employees, filtra por data de contratação e então junta para fora — o filtro WHERE acontece conceitualmente antes da projeção final, mas o otimizador do banco de dados reordena essas etapas.

> [!NOTE]
> A ordem dos JOINs na sua consulta não garante a ordem de execução. Otimizadores modernos reorganizam joins com base em estatísticas, contagens de linhas e índices disponíveis.

## Juntando uma Tabela a Ela Mesma (Self-Join via INNER JOIN)

Um self-join junta uma tabela a ela mesma. Você *deve* usar aliases.

```sql
-- Encontrar pares funcionário-gerente
SELECT
    e.name AS employee,
    m.name AS manager
FROM employees e
INNER JOIN employees m
    ON e.manager_id = m.employee_id;
```

Self-joins são úteis para dados hierárquicos (organogramas, categorias, comentários encadeados) e para encontrar linhas relacionadas na mesma tabela.

## Natural Joins

Um NATURAL JOIN automaticamente junta colunas com o mesmo nome em ambas as tabelas.

```sql
-- Ambas as tabelas têm 'department_id'
SELECT *
FROM employees
NATURAL JOIN departments;
```

| Prós | Contras |
|------|---------|
| Menos digitação | Implícito — pode quebrar quando o esquema muda |
| Limpo para esquemas bem nomeados | Difícil de depurar correspondências não intencionais |

> [!WARNING]
> Muitos guias de estilo SQL proíbem NATURAL JOIN porque ele esconde a condição de junção. Prefira `INNER JOIN ... ON` explícito em código de produção.

## Non-Equi Joins

Embora raro, INNER JOIN funciona com qualquer condição, não apenas igualdade.

```sql
-- Encontrar funcionários cujo salário está dentro da faixa orçamentária do departamento
SELECT e.name, e.salary, d.department_name
FROM employees e
INNER JOIN departments d
    ON e.dept_id = d.dept_id
    AND e.salary BETWEEN d.budget_min AND d.budget_max;
```

```sql
-- Encontrar pedidos feitos dentro de um período promocional
SELECT o.order_id, o.order_date, p.promo_name
FROM orders o
INNER JOIN promotions p
    ON o.order_date BETWEEN p.start_date AND p.end_date;
```

## Considerações de Desempenho de Join

| Fator | Impacto |
|--------|---------|
| Colunas de junção indexadas | Dramaticamente mais rápido |
| Menos linhas unidas | Menor memória e CPU |
| Cláusulas WHERE seletivas | Reduz linhas antes da junção |
| Índices compostos | Ajudam junções de múltiplas colunas |

```sql
-- Criando índices para acelerar junções
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_dept_id ON departments(department_id);
```

## Exemplo Real: Consulta de Dashboard de Vendas

```sql
SELECT
    c.name AS customer,
    p.product_name,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price AS line_total,
    o.order_date,
    s.full_name AS sales_rep
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
INNER JOIN employees s ON o.sales_rep_id = s.employee_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY o.order_date DESC, c.name;
```

> [!SUCCESS]
> Pense no INNER JOIN como um filtro em ambas as tabelas — apenas linhas correspondentes sobrevivem. Cada linha no resultado tem garantia de ter um parceiro em ambos os lados.

## Perguntas de Prática

1. Qual é a diferença entre `INNER JOIN` e `JOIN` em SQL?
2. Escreva um INNER JOIN que retorne nomes de funcionários e seus nomes de departamento de `employees` (dept_id) e `departments` (id, name).
3. O que é um equi-join? O INNER JOIN pode ser usado com condições de não igualdade?
4. Escreva uma consulta juntando 4 tabelas: `customers`, `orders`, `order_items` e `products`. Retorne nome do cliente, data do pedido, nome do produto e quantidade.
5. Por que você precisa de aliases de tabela ao juntar uma tabela a ela mesma?
6. O que é um NATURAL JOIN e quais são suas desvantagens?
7. Escreva um self-join que encontre pares de funcionários que trabalham no mesmo departamento (dica: use `a.department_id = b.department_id` e `a.id < b.id`).
8. Como você juntaria duas tabelas onde o relacionamento é baseado em data (ex.: uma transação ocorreu durante um período de campanha)?
9. Explique o que acontece com linhas que não correspondem em um INNER JOIN.
10. Escreva uma consulta que junte `students`, `enrollments` e `courses` para mostrar os nomes dos cursos em que cada aluno está matriculado. Use aliases de tabela.
