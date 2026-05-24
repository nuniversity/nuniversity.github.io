---
title: "O que é SQL e Bancos de Dados Relacionais?"
description: "Entenda SQL, bancos de dados relacionais, tabelas, linhas, colunas, chaves primárias e RDBMS populares como MySQL, PostgreSQL e SQLite"
order: 1
duration: "20-30 minutos"
difficulty: "beginner"
---

# O que é SQL e Bancos de Dados Relacionais?

SQL (Structured Query Language) é a linguagem padrão para gerenciar e consultar dados em sistemas de gerenciamento de bancos de dados relacionais (RDBMS). Ela permite criar, ler, atualizar e excluir dados — frequentemente chamadas de operações CRUD.

## O que é um Banco de Dados Relacional?

Um banco de dados relacional organiza dados em **tabelas** (como planilhas) onde cada tabela armazena informações sobre um tópico. As tabelas se relacionam entre si por meio de **chaves**, eliminando redundância enquanto mantém os dados conectados.

> [!NOTE]
> O modelo relacional foi inventado por Edgar F. Codd na IBM em 1970. Ele revolucionou a forma como armazenamos e consultamos dados ao separar a estrutura lógica do armazenamento físico.

## Conceitos Principais

### Tabelas

Uma tabela é uma coleção de dados relacionados organizados em linhas e colunas.

```
users
| id | name   | email              | age |
|----|--------|--------------------|-----|
| 1  | Alice  | alice@example.com  | 30  |
| 2  | Bob    | bob@example.com    | 25  |
| 3  | Carol  | carol@example.com  | 28  |
```

### Linhas e Colunas

- **Coluna**: Um único campo (atributo) de dados, como `name` ou `email`. Colunas têm um **tipo de dado** (texto, número, data, etc.).
- **Linha**: Um único registro em uma tabela, representando uma entidade (um usuário, um produto, etc.).

### Chave Primária

Uma **chave primária** identifica exclusivamente cada linha em uma tabela. Toda tabela deve ter uma.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT
);
```

> [!SUCCESS]
> Uma boa chave primária é única, nunca é nula e nunca muda. Inteiros auto-incrementáveis são a escolha mais comum.

### Chave Estrangeira

Uma **chave estrangeira** vincula linhas entre tabelas, criando relacionamentos.

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    total DECIMAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Sistemas RDBMS Populares

| RDBMS | Tipo | Melhor Para | Licença |
|-------|------|-------------|---------|
| **PostgreSQL** | Objeto-relacional | Funcionalidades avançadas, integridade de dados | Open Source |
| **MySQL** | Relacional | Aplicações web, amplo suporte de hospedagem | Open Source |
| **SQLite** | Embarcado | Aplicativos móveis, armazenamento local, prototipagem | Domínio Público |
| **SQL Server** | Relacional | Ecossistemas Windows empresariais | Comercial |
| **Oracle DB** | Relacional | Empresas de grande porte | Comercial |

### Quando Escolher Qual

- **SQLite**: Seu projeto precisa de um banco de dados leve e sem servidor (aplicativos móveis, sites pequenos, desenvolvimento/testes).
- **PostgreSQL**: Você precisa de recursos avançados (JSON, busca em texto completo, tipos personalizados, gravações concorrentes).
- **MySQL**: Você quer um banco de dados web amplamente hospedado e testado (WordPress, e-commerce).
- **SQL Server / Oracle**: Você trabalha em um ambiente empresarial com licenças existentes.

> [!WARNING]
> Embora o SQL seja padronizado, cada RDBMS tem seu próprio dialeto. `LIMIT` no MySQL/PostgreSQL é `TOP` no SQL Server e `ROWNUM` no Oracle. Use SQL ANSI quando possível.

## Sua Primeira Consulta SQL

```sql
SELECT 'Olá, Mundo SQL!' AS greeting;
```

Isso retorna:
| greeting |
|----------|
| Olá, Mundo SQL! |

## Como os Dados Fluem em um RDBMS

1. O cliente envia uma consulta SQL (via aplicativo, CLI ou GUI).
2. O analisador verifica a sintaxe e constrói uma árvore de análise.
3. O otimizador escolhe o plano de execução mais eficiente.
4. O executor executa o plano e busca/atualiza os dados.
5. Os resultados são enviados de volta ao cliente.

## Caso de Uso Real: Banco de Dados de E-Commerce

Uma loja online pode ter tabelas como:

- `customers` — quem compra
- `products` — o que compram
- `orders` — quando compram
- `order_items` — quais produtos em cada pedido
- `categories` — agrupamento de produtos

Em vez de armazenar o nome do cliente em cada pedido, cada linha de `orders` contém uma chave estrangeira `customer_id`. Isso evita duplicação e facilita atualizações — altere o endereço em um só lugar.

```sql
-- Encontre todos os pedidos do cliente Alice
SELECT o.id, o.order_date, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.name = 'Alice';
```

## Categorias de Instruções SQL

| Categoria | Propósito | Exemplos |
|-----------|-----------|----------|
| **DDL** | Definir estrutura | CREATE, ALTER, DROP |
| **DML** | Manipular dados | SELECT, INSERT, UPDATE, DELETE |
| **DCL** | Controlar acesso | GRANT, REVOKE |
| **TCL** | Gerenciar transações | COMMIT, ROLLBACK, SAVEPOINT |

> [!NOTE]
> Ao longo deste curso, você usará **DML** com mais frequência. SELECT sozinho representa ~80% de todo o SQL escrito.

## Por que Aprender SQL?

- **Universal**: Toda empresa de tecnologia usa um banco de dados. SQL é o portal.
- **Estável**: SQL foi inventado nos anos 1970 e ainda é a linguagem de dados nº 1.
- **Alto impacto**: Uma única consulta pode analisar milhões de linhas em milissegundos.
- **Transferível**: Habilidades se aplicam a MySQL, PostgreSQL, SQLite, BigQuery, Snowflake e muito mais.

> [!SUCCESS]
> SQL não é só para engenheiros. Analistas de dados, gerentes de produto, profissionais de marketing e designers se beneficiam ao consultar dados diretamente.

## SQL no Mundo Real

SQL não é apenas para engenheiros de backend. Veja como diferentes funções o usam:

| Função | O que Consultam | Porquê |
|--------|----------------|--------|
| **Analista de Dados** | Vendas, comportamento de usuários, funis | Gerar relatórios e dashboards |
| **Gerente de Produto** | Adoção de funcionalidades, retenção | Tomar decisões de produto baseadas em dados |
| **Marketing** | Performance de campanhas, segmentos | Otimizar gastos com anúncios e segmentação |
| **Engenheiro** | Dados de aplicação, logs, métricas | Construir funcionalidades e depurar problemas |
| **Finanças** | Receita, custos, previsões | Fechar balanços e planejar orçamentos |

### Exemplo: Consulta de Marketing

```sql
-- Encontre os 5 principais canais de marketing por taxa de conversão
SELECT
    channel,
    COUNT(DISTINCT user_id) AS visitors,
    COUNT(DISTINCT CASE WHEN purchased THEN user_id END) AS buyers,
    ROUND(COUNT(DISTINCT CASE WHEN purchased THEN user_id END) * 100.0 /
          COUNT(DISTINCT user_id), 2) AS conversion_pct
FROM campaign_data
WHERE campaign_date >= '2024-01-01'
GROUP BY channel
ORDER BY conversion_pct DESC
LIMIT 5;
```

## Configurando Seu Ambiente

Para praticar SQL localmente, escolha uma opção:

1. **SQLite** (mais fácil): Instale `sqlite3` e abra um arquivo `.db`.
2. **PostgreSQL**: Instale, execute `psql`, crie um banco de dados.
3. **MySQL**: Instale, execute `mysql -u root -p`.
4. **Online**: Use SQLFiddle, DB Fiddle ou SQLite Online.

```bash
# SQLite — sem configuração necessária
sqlite3 test.db
```

```sql
-- Crie uma tabela e consulte imediatamente
CREATE TABLE hello (message TEXT);
INSERT INTO hello VALUES ('SQL funciona!');
SELECT * FROM hello;
```

## Erros Comuns de Iniciantes em SQL

- **Esquecer o ponto e vírgula**: Instruções SQL precisam de `;` no final
- **Usar `=` em vez de `IS NULL`**: `WHERE name = NULL` nunca funciona
- **Misturar aspas simples e duplas**: SQL usa aspas simples para strings
- **Omitir WHERE em DELETE/UPDATE**: Exclusão acidental em massa
- **SELECT ***: Retorna dados desnecessários e quebra com mudanças no esquema

> [!WARNING]
> Sempre teste suas consultas em uma cópia dos dados primeiro. Um UPDATE ou DELETE descontrolado em dados de produção pode causar danos irreversíveis.

## Perguntas de Prática

1. O que significa a sigla SQL?
2. Nomeie três sistemas RDBMS populares e um caso de uso para cada um.
3. Qual é a diferença entre uma chave primária e uma chave estrangeira?
4. Na tabela `employees(id, name, department_id, salary)`, qual coluna é provavelmente a chave primária? Qual é uma chave estrangeira?
5. Quais são as quatro categorias de instruções SQL?
6. Por que o SQLite é considerado "sem servidor"?
7. Verdadeiro ou Falso: SQL é idêntico em todos os sistemas de banco de dados.
8. Por que um banco de dados de e-commerce deve usar chaves estrangeiras em vez de armazenar nomes de clientes em cada linha de pedido?
9. O que o otimizador SQL faz?
10. Liste cinco indústrias ou funções onde habilidades em SQL são valiosas.
