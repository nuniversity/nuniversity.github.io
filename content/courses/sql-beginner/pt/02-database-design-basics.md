---
title: "Fundamentos de Design de Bancos de Dados e Normalização"
description: "Aprenda princípios de design de bancos de dados, normalização (1FN, 2FN, 3FN), diagramas ER e como escolher tipos de dados SQL"
order: 2
duration: "20-30 minutos"
difficulty: "beginner"
---

# Fundamentos de Design de Bancos de Dados e Normalização

Um banco de dados bem projetado economiza tempo, evita erros e escala graciosamente. Um design ruim leva a dados duplicados, anomalias de atualização e consultas lentas. Esta lição ensina como fazer isso certo desde o início.

## Por que o Design de Banco de Dados é Importante

Considere uma tabela `orders` mal projetada:

```
orders
| order_id | customer_name | customer_email | product1 | product2 | qty1 | qty2 |
```

Problemas:
- **Duplicação**: Nome e email do cliente se repetem em cada pedido
- **Colunas fixas**: Não é possível vender mais de 2 produtos por pedido
- **Anomalia de atualização**: Alterar o email de um cliente requer atualizar muitas linhas
- **Anomalia de exclusão**: Excluir um pedido também exclui as informações do cliente

> [!NOTE]
> Estas são chamadas de **anomalias** — inconsistências de dados causadas por design ruim. A normalização as elimina.

## Diagramas Entidade-Relacionamento (ER)

Um diagrama ER representa visualmente as tabelas e seus relacionamentos. Existem três tipos de relacionamentos:

| Relacionamento | Exemplo | Notação do Diagrama |
|----------------|---------|---------------------|
| **Um-para-Um** | Usuário ↔ Perfil | `|---|` |
| **Um-para-Muitos** | Cliente → Pedidos | `|---|{` |
| **Muitos-para-Muitos** | Estudante ↔ Curso | `}{|{` |

### Exemplo: Sistema de Biblioteca

```
AUTHOR ──< BOOK >── BOOK_GENRE >── GENRE
  │                    │
  └──< COPY            │
                       │
MEMBER ──< LOAN >──┘
```

- Um autor escreve muitos livros (um-para-muitos)
- Um livro tem muitas cópias (um-para-muitos)
- Um livro pertence a muitos gêneros, e um gênero tem muitos livros (muitos-para-muitos)
- Um membro pega emprestadas muitas cópias (um-para-muitos)

## Normalização

A normalização organiza colunas e tabelas para reduzir redundância e dependência. Ela é aplicada em **formas normais** sucessivas.

### Primeira Forma Normal (1FN)

Uma tabela está em 1FN quando:
1. Cada célula contém um **único valor** (atômico).
2. Cada coluna contém valores do **mesmo tipo**.
3. Cada linha é **única** (tem uma chave primária).

**Ruim (não 1FN):**
```
| student_id | name   | courses           |
|------------|--------|-------------------|
| 1          | Alice  | Math, Science     |
| 2          | Bob    | History, Math     |
```

**Bom (1FN):**
```
| student_id | name   | course   |
|------------|--------|----------|
| 1          | Alice  | Math     |
| 1          | Alice  | Science  |
| 2          | Bob    | History  |
| 2          | Bob    | Math     |
```

> [!NOTE]
> Colunas com múltiplos valores violam a 1FN. Se você for tentado a armazenar uma lista em uma célula, precisa de uma tabela separada ou de uma tabela de junção.

### Segunda Forma Normal (2FN)

Uma tabela está em 2FN quando:
1. Está em 1FN.
2. Toda coluna não-chave depende da **totalidade** da chave primária (não apenas de parte dela).

**Ruim (chave composta `order_id, product_id`):**
```
| order_id | product_id | product_name | quantity |
```
`product_name` depende apenas de `product_id`, não da chave inteira.

**Bom:**
```
order_items:      products:
| order_id | product_id | qty |    | product_id | product_name |
```

### Terceira Forma Normal (3FN)

Uma tabela está em 3FN quando:
1. Está em 2FN.
2. Nenhuma coluna não-chave depende de outra coluna não-chave (sem dependências transitivas).

**Ruim:**
```
| employee_id | department_id | department_name |
```
`department_name` depende de `department_id`, não de `employee_id`.

**Bom:**
```
employees:              departments:
| emp_id | dept_id |    | dept_id | dept_name |
```

> [!SUCCESS]
> Na prática, a maioria dos bancos de dados busca a **3FN**. Além da 3FN (BCNF, 4FN, 5FN) raramente é necessário para aplicações típicas.

## Escolhendo Tipos de Dados SQL

Escolher o tipo de dado correto afeta armazenamento, performance e correção.

| Dado | Tipo Recomendado | Porquê |
|------|------------------|--------|
| Nome de pessoa | `VARCHAR(100)` | Comprimento variável, limitado |
| Email | `VARCHAR(255)` | Comprimento máximo conforme RFC |
| Idade | `INTEGER` ou `SMALLINT` | Número inteiro, faixa pequena |
| Preço | `DECIMAL(10,2)` | Precisão exata, sem arredondamento |
| Descrição | `TEXT` | Comprimento ilimitado |
| Data de nascimento | `DATE` | Tipo apenas data |
| Timestamp de criação | `TIMESTAMP` | Data + hora com fuso horário |
| Indicador booleano | `BOOLEAN` / `TINYINT(1)` | Valores verdadeiro/falso |
| UUID | `CHAR(36)` ou tipo `UUID` | Formato fixo |

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Desnormalização (Quando Quebrar as Regras)

Às vezes você intencionalmente **desnormaliza** por performance:

- **Tabelas de relatório**: Dados pré-juntados para dashboards
- **APIs com muitas leituras**: Armazenar cópia de um campo frequentemente acessado
- **Cache**: Evitar junções caras em caminhos críticos

> [!WARNING]
> A desnormalização introduz redundância e anomalias de atualização. Só faça isso depois de medir e comprovar uma necessidade de performance. A desnormalização prematura é um erro comum de iniciantes.

## Caso de Uso Real: Plataforma de Blog

Tabelas necessárias:

- `authors(id, name, email, bio)`
- `posts(id, author_id, title, body, published_at)`
- `categories(id, name, slug)`
- `post_categories(post_id, category_id)` — tabela de junção
- `comments(id, post_id, author_name, body, created_at)`

```sql
-- Encontre todos os posts do autor "Alice" na categoria "SQL"
SELECT p.title, p.published_at
FROM posts p
JOIN authors a ON p.author_id = a.id
JOIN post_categories pc ON p.id = pc.post_id
JOIN categories c ON pc.category_id = c.id
WHERE a.name = 'Alice' AND c.name = 'SQL';
```

## Projetando uma Tabela: Passo a Passo

Vamos projetar uma tabela `products` para e-commerce do zero:

1. **Identifique a entidade**: Um produto.
2. **Liste os atributos**: Nome, descrição, preço, categoria, SKU, quantidade em estoque, URL da imagem, data de criação.
3. **Escolha os tipos de dados**:
   - `name` → `VARCHAR(200)` NOT NULL
   - `description` → `TEXT`
   - `price` → `DECIMAL(10,2)` NOT NULL
   - `category` → `VARCHAR(100)` (ou chave estrangeira para `categories`)
   - `sku` → `VARCHAR(50)` UNIQUE
   - `stock` → `INTEGER` DEFAULT 0
   - `image_url` → `VARCHAR(500)`
   - `created_at` → `TIMESTAMP` DEFAULT CURRENT_TIMESTAMP
4. **Identifique as chaves**: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `sku VARCHAR(50) UNIQUE`.
5. **Adicione restrições**: `CHECK (price > 0)`, `CHECK (stock >= 0)`.
6. **Considere relacionamentos**: Chave estrangeira para `categories(id)`.

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    category_id INTEGER,
    sku VARCHAR(50) UNIQUE NOT NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## Exemplo de Normalização: Passo a Passo Completo

Comece com uma grande tabela desnormalizada:

```
orders (order_id, customer_name, customer_email, customer_phone,
        product_name, product_price, product_category, order_date, quantity)
```

### Passo 1: Aplicar 1FN

Já está em 1FN (todos os valores atômicos). Mas há redundância.

### Passo 2: Aplicar 2FN

Identifique dependências parciais. Se `product_name` depende apenas de `product_id` (não do pedido completo), separe:

```
order_items (order_id, product_id, quantity)
products (id, name, price, category)
orders (id, customer_name, customer_email, customer_phone, order_date)
```

### Passo 3: Aplicar 3FN

Identifique dependências transitivas. `customer_phone` depende de `customer_name` (não de `order_id`). Separe:

```
orders (id, customer_id, order_date)
customers (id, name, email, phone)
order_items (order_id, product_id, quantity)
products (id, name, price, category_id)
categories (id, name)
```

O resultado: 5 tabelas, zero redundância, relacionamentos claros.

> [!SUCCESS]
> Um bom design é invisível — você só percebe quando ele está faltando. Reserve um tempo para planejar antes de escrever um único CREATE TABLE.

## Perguntas de Prática

1. Quais três problemas a normalização resolve?
2. Descreva 1FN, 2FN e 3FN com suas próprias palavras.
3. Uma tabela tem colunas `(order_id, product_id, product_name, quantity)` com chave primária composta de `(order_id, product_id)`. Qual forma normal é violada? Por quê?
4. Desenhe um diagrama ER simples para uma escola onde estudantes se matriculam em cursos e professores ministram cursos.
5. Que tipo de dado você usaria para o preço de um produto? Por que não FLOAT?
6. Quando você desnormalizaria intencionalmente um banco de dados?
7. Suponha uma tabela com `(student_id, advisor_name, advisor_phone)`. Cada estudante tem um orientador. Que problema de forma normal existe?
8. O que é uma tabela de junção e quando ela é necessária?
9. Converta esta tabela desnormalizada para 3FN: `(order_id, customer_name, customer_email, product_name, product_price)`
10. Por que `VARCHAR(255)` é uma escolha comum para colunas de email?
