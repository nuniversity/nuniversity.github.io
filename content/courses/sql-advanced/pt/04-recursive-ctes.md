---
title: "CTEs Recursivas"
description: "Domine Common Table Expressions recursivas: membro âncora e recursivo, travessia de hierarquias, travessia de grafos, geração de datas e detecção de ciclos"
order: 4
duration: "90 minutos"
difficulty: advanced
---

# CTEs Recursivas

## O que é uma CTE Recursiva?

Uma CTE recursiva refere-se a si mesma. Consiste em duas partes unidas por `UNION ALL`:

1. **Membro âncora**: O conjunto de resultados base (não recursivo).
2. **Membro recursivo**: Referencia a CTE pelo nome, alimentando linhas de volta para a próxima iteração.

```sql
WITH RECURSIVE cte_name AS (
    -- Membro âncora
    SELECT ...
    UNION ALL
    -- Membro recursivo
    SELECT ...
    FROM cte_name
    WHERE ...
)
SELECT * FROM cte_name;
```

[!WARNING]
Sem uma condição de terminação na cláusula `WHERE`, CTEs recursivas entram em loop infinito. A maioria dos bancos tem uma configuração `max_recursion_depth` ou `max_recursive_iterations` (ex: `max_recursive_CTE_iterations` do PostgreSQL).

## Exemplo Simples: Série Numérica

```sql
WITH RECURSIVE numbers AS (
    SELECT 1 AS n                     -- âncora
    UNION ALL
    SELECT n + 1                      -- recursivo
    FROM numbers
    WHERE n < 100                     -- terminação
)
SELECT n FROM numbers;
```

Isso produz os inteiros de 1 a 100.

## Fluxo de Execução

```
Iteração 0: âncora → {1}
Iteração 1: recursivo em {1} → {2}
Iteração 2: recursivo em {2} → {3}
...
Iteração 99: recursivo em {99} → {100}
Iteração 100: WHERE n < 100 falha → para
Resultado: UNION ALL de todas iterações → {1, 2, ..., 100}
```

[!NOTE]
Cada iteração vê apenas as linhas produzidas pela iteração **anterior**. O conjunto de resultados acumulados cresce a cada passagem.

## Travessia de Hierarquia: Organograma

```sql
WITH RECURSIVE org_tree AS (
    -- Âncora: gerentes de topo (sem gerente)
    SELECT
        employee_id,
        employee_name,
        manager_id,
        0 AS level,
        employee_name::TEXT AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursivo: subordinados diretos
    SELECT
        e.employee_id,
        e.employee_name,
        e.manager_id,
        ot.level + 1,
        ot.path || ' → ' || e.employee_name
    FROM employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT * FROM org_tree
ORDER BY level, employee_name;
```

| level | employee_name | path |
|---|---|---|
| 0 | CEO | CEO |
| 1 | CTO | CEO → CTO |
| 1 | CFO | CEO → CFO |
| 2 | Eng Director | CEO → CTO → Eng Director |
| 3 | Sr Engineer | CEO → CTO → Eng Director → Sr Engineer |

## Travessia de Hierarquia: Árvore de Categorias

```sql
WITH RECURSIVE category_tree AS (
    SELECT
        category_id,
        category_name,
        parent_id,
        category_name::TEXT AS full_path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT
        c.category_id,
        c.category_name,
        c.parent_id,
        ct.full_path || ' > ' || c.category_name
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.category_id
)
SELECT * FROM category_tree
ORDER BY full_path;
```

### Encontrar Todos os Descendentes

```sql
WITH RECURSIVE descendants AS (
    SELECT category_id, category_name, parent_id
    FROM categories
    WHERE parent_id = 5  -- começar da categoria 5

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_id
    FROM categories c
    INNER JOIN descendants d ON c.parent_id = d.category_id
)
SELECT * FROM descendants;
```

### Encontrar Todos os Ancestrais

```sql
WITH RECURSIVE ancestors AS (
    SELECT category_id, category_name, parent_id, 0 AS depth
    FROM categories
    WHERE category_id = 42  -- começar da folha

    UNION ALL

    SELECT c.category_id, c.category_name, c.parent_id, a.depth + 1
    FROM categories c
    INNER JOIN ancestors a ON c.category_id = a.parent_id
)
SELECT * FROM ancestors ORDER BY depth;
```

## Travessia de Grafos

### Amigo-de-um-Amigo (Grafo Social)

```sql
WITH RECURSIVE friend_network AS (
    SELECT
        user_id,
        0 AS degree,
        ARRAY[user_id] AS visited
    FROM users
    WHERE user_id = 1

    UNION ALL

    SELECT
        f.friend_id,
        fn.degree + 1,
        fn.visited || f.friend_id
    FROM friendships f
    INNER JOIN friend_network fn ON f.user_id = fn.user_id
    WHERE NOT f.friend_id = ANY(fn.visited)
    AND fn.degree < 3
)
SELECT DISTINCT user_id, degree
FROM friend_network
ORDER BY degree, user_id;
```

### Detecção de Ciclos

```sql
WITH RECURSIVE graph_traversal AS (
    SELECT
        node_id,
        ARRAY[node_id] AS path,
        FALSE AS is_cycle
    FROM graph_nodes
    WHERE node_id = 'A'

    UNION ALL

    SELECT
        e.to_node,
        gt.path || e.to_node,
        e.to_node = ANY(gt.path)
    FROM graph_edges e
    INNER JOIN graph_traversal gt ON e.from_node = gt.node_id
    WHERE NOT gt.is_cycle
)
SELECT * FROM graph_traversal;
```

[!IMPORTANT]
Sempre rastreie nós visitados em travessias de grafos para evitar loops infinitos. Use uma coluna de array e `= ANY()` para verificar o status de visita.

## Geração de Séries de Datas

```sql
-- Gerar todas as datas de um ano
WITH RECURSIVE dates AS (
    SELECT '2024-01-01'::DATE AS dt
    UNION ALL
    SELECT dt + 1
    FROM dates
    WHERE dt < '2024-12-31'
)
SELECT dt FROM dates;

-- Gerar apenas dias úteis
WITH RECURSIVE business_days AS (
    SELECT '2024-01-01'::DATE AS dt
    UNION ALL
    SELECT dt + 1
    FROM business_days
    WHERE dt < '2024-12-31'
      AND EXTRACT(DOW FROM dt + 1) NOT IN (0, 6)  -- pular Dom/Sáb
)
SELECT dt FROM business_days;
```

### Preencher Datas Faltantes (Preenchimento de Datas Esparsas)

```sql
WITH RECURSIVE date_range AS (
    SELECT MIN(order_date) AS dt FROM orders
    UNION ALL
    SELECT dt + 1 FROM date_range
    WHERE dt < (SELECT MAX(order_date) FROM orders)
)
SELECT
    dr.dt,
    COALESCE(SUM(o.amount), 0) AS daily_revenue
FROM date_range dr
LEFT JOIN orders o ON o.order_date = dr.dt
GROUP BY dr.dt
ORDER BY dr.dt;
```

## Avançado: Lista de Materiais (BOM)

```sql
WITH RECURSIVE bom AS (
    SELECT
        part_id,
        part_name,
        1 AS quantity,
        0 AS level
    FROM parts
    WHERE part_id = 'A'  -- montagem de topo

    UNION ALL

    SELECT
        p.part_id,
        p.part_name,
        b.quantity * bp.quantity,
        b.level + 1
    FROM bom b
    INNER JOIN bom_parts bp ON b.part_id = bp.assembly_id
    INNER JOIN parts p ON bp.component_id = p.part_id
)
SELECT * FROM bom ORDER BY level, part_name;
```

## Avançado: Enumeração de Caminhos

```sql
-- Encontrar todas as rotas possíveis entre duas cidades
WITH RECURSIVE routes AS (
    SELECT
        origin,
        destination,
        ARRAY[origin, destination] AS path,
        distance
    FROM flights
    WHERE origin = 'JFK'

    UNION ALL

    SELECT
        r.origin,
        f.destination,
        r.path || f.destination,
        r.distance + f.distance
    FROM routes r
    INNER JOIN flights f ON r.destination = f.origin
    WHERE NOT f.destination = ANY(r.path)
      AND r.distance < 5000  -- podar caminhos longos
)
SELECT * FROM routes
WHERE destination = 'LAX'
ORDER BY distance;
```

## Considerações de Performance

| Fator | Impacto | Mitigação |
|---|---|---|
| Profundidade da iteração | Crescimento linear | Definir `max_recursive_iterations` |
| Conjuntos intermediários grandes | Pressão de memória | Empurrar filtros para dentro da recursão |
| Detecção de ciclos | Sobrecarga de comparação de arrays | Usar conjuntos de visitados baseados em hash quando disponível |
| Índice em colunas de junção | Crítico para performance | Indexar colunas FK usadas em junções recursivas |

[!TIP]
Para hierarquias profundas (50+ níveis), considere usar conjuntos aninhados ou caminhos materializados para cargas de trabalho com muitas leituras em vez de CTEs recursivas.

## Perguntas de Prática

1. Escreva uma CTE recursiva que gere todos os inteiros de 1 a 1000.
2. Dada `employees(id, name, manager_id)`, escreva uma consulta para mostrar a cadeia de reporte completa do CEO a cada funcionário.
3. Como uma CTE recursiva termina? O que acontece se você omitir a cláusula `WHERE` no membro recursivo?
4. Escreva uma CTE recursiva para gerar uma lista de todas as datas de fevereiro de 2024.
5. Dada `categories(id, name, parent_id)`, escreva uma consulta para encontrar todos os ancestrais da categoria com id 50.
6. Qual é a diferença entre `UNION ALL` e `UNION` em uma CTE recursiva? Você pode usar `UNION`?
7. Escreva uma CTE recursiva para percorrer um grafo social até 4 graus de separação a partir do usuário 1, evitando ciclos.
8. Dada `parts(id, name)` e `bom(assembly_id, component_id, quantity)`, escreva uma consulta para calcular a quantidade total de cada matéria-prima necessária para construir uma unidade do produto 'X'.
9. Escreva uma consulta que preencha datas faltantes para uma tabela com lacunas: `sales(date, amount)` deve ter uma linha para cada data no intervalo.
10. Explique como você detectaria e preveniria loops infinitos em uma CTE recursiva que percorre um grafo direcionado com ciclos.
