---
title: "SELECT e WHERE: Consultando Dados"
description: "Domine SELECT, FROM, WHERE com operadores de comparação, AND/OR/NOT, LIKE, IN e BETWEEN"
order: 3
duration: "20-30 minutos"
difficulty: "beginner"
---

# SELECT e WHERE: Consultando Dados

A instrução `SELECT` é o comando SQL mais frequentemente usado. Combinada com `WHERE`, ela se torna um filtro poderoso que extrai exatamente os dados que você precisa.

## SELECT Básico

```sql
SELECT column1, column2 FROM table_name;
```

```sql
-- Selecionar colunas específicas
SELECT name, email FROM users;

-- Selecionar todas as colunas
SELECT * FROM users;
```

> [!WARNING]
> Evite `SELECT *` em código de produção. Ele retorna mais dados do que o necessário, quebra se o esquema mudar e impede o banco de dados de usar varreduras apenas de índice.

## A Cláusula WHERE

`WHERE` filtra linhas antes de serem retornadas:

```sql
SELECT name, age FROM users WHERE age >= 18;
```

| name | age |
|------|-----|
| Alice | 30 |
| Bob | 25 |

## Operadores de Comparação

| Operador | Significado | Exemplo |
|----------|-------------|---------|
| `=` | Igual | `WHERE name = 'Alice'` |
| `<>` ou `!=` | Diferente | `WHERE status <> 'inactive'` |
| `>` | Maior que | `WHERE price > 10` |
| `<` | Menor que | `WHERE age < 18` |
| `>=` | Maior ou igual | `WHERE quantity >= 0` |
| `<=` | Menor ou igual | `WHERE rating <= 5` |

```sql
SELECT title, price FROM products WHERE price <= 19.99;
```

## AND, OR, NOT

Combine condições com operadores lógicos:

```sql
-- AND: todas as condições devem ser verdadeiras
SELECT * FROM employees
WHERE department = 'Engineering' AND salary > 80000;

-- OR: pelo menos uma condição deve ser verdadeira
SELECT * FROM products
WHERE category = 'Electronics' OR category = 'Books';

-- NOT: nega uma condição
SELECT * FROM users
WHERE NOT status = 'banned';

-- Misturando AND/OR (use parênteses para clareza)
SELECT * FROM orders
WHERE (status = 'pending' OR status = 'shipped')
  AND total > 100;
```

> [!NOTE]
> `AND` é avaliado antes de `OR`. Sempre use parênteses para tornar sua intenção clara e evitar bugs sutis.

## LIKE — Correspondência de Padrões

`LIKE` corresponde a strings usando dois caracteres curinga:
- `%` — corresponde a qualquer sequência de caracteres
- `_` — corresponde exatamente a um caractere

```sql
-- Começa com "A"
SELECT name FROM users WHERE name LIKE 'A%';

-- Contém "smith" em qualquer lugar
SELECT name FROM users WHERE name LIKE '%smith%';

-- Exatamente 5 caracteres
SELECT code FROM products WHERE code LIKE '_____';

-- Começa com J, termina com n
SELECT name FROM users WHERE name LIKE 'J%n';
```

### Dados de Exemplo: Funcionários

| id | name | department | salary |
|----|------|-----------|--------|
| 1 | Alice Johnson | Engineering | 95000 |
| 2 | Bob Smith | Marketing | 72000 |
| 3 | Carol Chen | Engineering | 88000 |
| 4 | David Brown | Sales | 65000 |
| 5 | Eve Martinez | Marketing | 78000 |

```sql
-- Encontre funcionários da Engineering com salário acima de 85.000
SELECT name, salary FROM employees
WHERE department = 'Engineering' AND salary > 85000;
-- Retorna: Alice Johnson (95000), Carol Chen (88000)
```

## IN — Corresponder a uma Lista

`IN` é uma abreviação para múltiplas condições `OR`:

```sql
-- Sem IN
SELECT * FROM products
WHERE category = 'Electronics'
   OR category = 'Books'
   OR category = 'Music';

-- Com IN (mais limpo)
SELECT * FROM products
WHERE category IN ('Electronics', 'Books', 'Music');
```

Você também pode usar `NOT IN`:

```sql
SELECT name FROM users
WHERE status NOT IN ('banned', 'suspended');
```

## BETWEEN — Correspondência de Faixa

`BETWEEN` é inclusivo em ambos os extremos:

```sql
SELECT name, salary FROM employees
WHERE salary BETWEEN 70000 AND 90000;
-- Retorna: Bob Smith (72000), Carol Chen (88000), Eve Martinez (78000)

-- Equivalente a:
SELECT name, salary FROM employees
WHERE salary >= 70000 AND salary <= 90000;
```

Funciona também com datas:

```sql
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31';
```

> [!SUCCESS]
> `BETWEEN` é mais limpo que `>= AND <=` para faixas inclusivas. Para faixas de datas, lembre-se que `BETWEEN` inclui a meia-noite da data final — use `>= 'inicio' AND < 'fim + 1 dia'` para limites exatos.

## Juntando Tudo

```sql
SELECT name, email, age
FROM users
WHERE age BETWEEN 25 AND 40
  AND email LIKE '%@gmail.com'
  AND name NOT LIKE 'Admin%';
```

## Caso de Uso Real: Consulta de Inventário de Produtos

```sql
-- Encontre produtos com estoque baixo, em categorias específicas,
-- e que custam menos de $50
SELECT product_name, category, stock, price
FROM inventory
WHERE stock < 10
  AND category IN ('Electronics', 'Accessories')
  AND price < 50
ORDER BY stock ASC;
```

> [!WARNING]
> `LIKE` com um curinga no início (`'%padrao'`) não pode usar índices e será lento em tabelas grandes. Evite-o em milhões de linhas.

## Tratamento de NULL

`NULL` significa **desconhecido** — não é zero, nem string vazia.

```sql
-- Comparações de NULL requerem IS NULL, não = NULL
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM users WHERE email IS NOT NULL;

-- Isto é sempre falso:
SELECT * FROM users WHERE email = NULL;
```

> [!NOTE]
> `NULL` se propaga através de expressões. `NULL > 5` retorna `NULL` (não `TRUE` ou `FALSE`). `WHERE` só mantém linhas onde a condição é `TRUE`, não `NULL`.

## Perguntas de Prática

Dada uma tabela `employees(id, name, department, salary, hire_date)`:

1. Escreva uma consulta para selecionar todos os funcionários do departamento 'Sales'.
2. Encontre funcionários com salários maiores que 60000 mas menores ou iguais a 100000.
3. Encontre funcionários cujo nome começa com 'M'.
4. Encontre funcionários contratados em 2023 (use `BETWEEN`).
5. Encontre funcionários nos departamentos 'Engineering' ou 'Product' com salário de pelo menos 90000.
6. Qual é a diferença entre `WHERE` e `HAVING`? (Apenas suponha por enquanto.)
7. Encontre funcionários cujo departamento NÃO é 'Marketing'.
8. Escreva uma consulta usando `IN` que retorne funcionários em 'HR', 'Finance' ou 'Legal'.
9. O que `SELECT * FROM products WHERE price = NULL` retorna? Por que está errado?
10. Encontre funcionários cujo nome contém exatamente 5 letras e termina com 'n'.
