---
title: "Projeto Final: Banco de Dados de Biblioteca"
description: "Projete um banco de dados de biblioteca do zero, crie tabelas, insira dados de exemplo e escreva 10 consultas analíticas"
order: 10
duration: "20-30 minutos"
difficulty: "beginner"
---

# Projeto Final: Banco de Dados de Biblioteca

Você aprendeu todos os fundamentos. Agora é hora de juntá-los em um projeto completo — desde o design do banco de dados até consultas analíticas.

## Visão Geral do Projeto

Construa um banco de dados para uma biblioteca pública que gerencia:
- **Livros** no catálogo
- **Autores** que os escreveram
- **Membros** que pegam livros emprestados
- **Empréstimos** — quem pegou o quê e quando

## Passo 1: Design do Banco de Dados

### Diagrama Entidade-Relacionamento

```
AUTHORS ──< BOOKS >── BOOK_GENRES >── GENRES
           │
           └──< LOANS >── MEMBERS
```

### Relacionamentos

- Um autor escreve muitos livros (um-para-muitos)
- Um livro pertence a muitos gêneros via book_genres (muitos-para-muitos)
- Um membro pega emprestados muitos livros (um-para-muitos)
- Um empréstimo vincula um membro a uma cópia de livro em um ponto no tempo

## Passo 2: Criar as Tabelas

```sql
-- Tabela de autores
CREATE TABLE authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_year INTEGER CHECK (birth_year > 1000),
    nationality VARCHAR(100)
);

-- Tabela de gêneros
CREATE TABLE genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela de livros
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    author_id INTEGER NOT NULL,
    isbn VARCHAR(13) UNIQUE,
    published_year INTEGER CHECK (published_year >= 1400),
    total_copies INTEGER DEFAULT 1 CHECK (total_copies > 0),
    available_copies INTEGER DEFAULT 1 CHECK (available_copies >= 0),
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- Junção: books <-> genres (muitos-para-muitos)
CREATE TABLE book_genres (
    book_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    PRIMARY KEY (book_id, genre_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Tabela de membros
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT TRUE
);

-- Tabela de empréstimos
CREATE TABLE loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
```

> [!SUCCESS]
> Observe como separamos os livros de suas cópias via `total_copies` e `available_copies`. Isso mantém o esquema simples enquanto gerencia a disponibilidade.

## Passo 3: Inserir Dados de Exemplo

```sql
-- Inserir autores
INSERT INTO authors (first_name, last_name, birth_year, nationality)
VALUES
    ('Jane', 'Austen', 1775, 'British'),
    ('Gabriel', 'Garcia Marquez', 1927, 'Colombian'),
    ('Haruki', 'Murakami', 1949, 'Japanese'),
    ('Chimamanda', 'Ngozi Adichie', 1977, 'Nigerian'),
    ('George', 'Orwell', 1903, 'British');

-- Inserir gêneros
INSERT INTO genres (name) VALUES
    ('Classic'), ('Fantasy'), ('Historical Fiction'),
    ('Science Fiction'), ('Romance'), ('Political Satire');

-- Inserir livros
INSERT INTO books (title, author_id, isbn, published_year, total_copies, available_copies)
VALUES
    ('Pride and Prejudice', 1, '9780141439518', 1813, 5, 3),
    ('One Hundred Years of Solitude', 2, '9780060883287', 1967, 3, 2),
    ('Norwegian Wood', 3, '9780375704024', 1987, 4, 1),
    ('Half of a Yellow Sun', 4, '9780307455925', 2006, 2, 2),
    ('1984', 5, '9780451524935', 1949, 6, 4);

-- Vincular livros a gêneros
INSERT INTO book_genres (book_id, genre_id) VALUES
    (1, 1), (1, 5),  -- Pride and Prejudice: Classic, Romance
    (2, 1), (2, 3),  -- One Hundred Years: Classic, Historical Fiction
    (3, 1), (3, 5),  -- Norwegian Wood: Classic, Romance
    (4, 3),          -- Half of a Yellow Sun: Historical Fiction
    (5, 1), (5, 6);  -- 1984: Classic, Political Satire

-- Inserir membros
INSERT INTO members (first_name, last_name, email, phone, membership_date)
VALUES
    ('Alice', 'Johnson', 'alice@email.com', '555-0101', '2024-01-15'),
    ('Bob', 'Smith', 'bob@email.com', '555-0102', '2024-02-20'),
    ('Carol', 'Chen', 'carol@email.com', '555-0103', '2024-03-10'),
    ('David', 'Brown', 'david@email.com', '555-0104', '2024-04-05'),
    ('Eve', 'Martinez', 'eve@email.com', '555-0105', '2024-05-01');

-- Inserir empréstimos
INSERT INTO loans (book_id, member_id, loan_date, due_date, return_date)
VALUES
    (1, 1, '2024-06-01', '2024-06-15', '2024-06-14'),
    (3, 1, '2024-06-10', '2024-06-24', NULL),
    (5, 2, '2024-06-05', '2024-06-19', '2024-06-18'),
    (2, 3, '2024-06-08', '2024-06-22', NULL),
    (1, 4, '2024-06-12', '2024-06-26', NULL),
    (5, 5, '2024-06-15', '2024-06-29', NULL),
    (4, 2, '2024-05-20', '2024-06-03', '2024-06-02'),
    (3, 5, '2024-06-01', '2024-06-15', '2024-06-14');
```

## Passo 4: Consultas Analíticas

### Consulta 1: Todos os livros atualmente emprestados (não devolvidos)

```sql
SELECT
    b.title,
    m.first_name || ' ' || m.last_name AS borrower,
    l.loan_date,
    l.due_date,
    julianday(l.due_date) - julianday('now') AS days_overdue
FROM loans l
JOIN books b ON l.book_id = b.id
JOIN members m ON l.member_id = m.id
WHERE l.return_date IS NULL
ORDER BY l.due_date;
```

### Consulta 2: Livros mais emprestados

```sql
SELECT
    b.title,
    a.first_name || ' ' || a.last_name AS author,
    COUNT(l.id) AS times_borrowed
FROM books b
JOIN authors a ON b.author_id = a.id
LEFT JOIN loans l ON b.id = l.book_id
GROUP BY b.id
ORDER BY times_borrowed DESC;
```

### Consulta 3: Membros com livros atrasados

```sql
SELECT
    m.first_name || ' ' || m.last_name AS member,
    m.email,
    b.title AS book_title,
    l.due_date,
    CAST(julianday('now') - julianday(l.due_date) AS INTEGER) AS days_overdue
FROM loans l
JOIN members m ON l.member_id = m.id
JOIN books b ON l.book_id = b.id
WHERE l.return_date IS NULL AND l.due_date < DATE('now')
ORDER BY days_overdue DESC;
```

### Consulta 4: Gêneros mais populares (por número de empréstimos)

```sql
SELECT
    g.name AS genre,
    COUNT(l.id) AS loan_count
FROM genres g
JOIN book_genres bg ON g.id = bg.genre_id
JOIN loans l ON bg.book_id = l.book_id
GROUP BY g.id
ORDER BY loan_count DESC;
```

### Consulta 5: Estatísticas de empréstimos por autor

```sql
SELECT
    a.first_name || ' ' || a.last_name AS author,
    COUNT(DISTINCT b.id) AS books_in_catalog,
    COUNT(l.id) AS total_loans,
    ROUND(AVG(l.return_date IS NOT NULL), 2) AS return_rate
FROM authors a
JOIN books b ON a.id = b.author_id
LEFT JOIN loans l ON b.id = l.book_id
GROUP BY a.id
ORDER BY total_loans DESC;
```

### Consulta 6: Relatório de disponibilidade de livros

```sql
SELECT
    b.title,
    b.total_copies,
    b.available_copies,
    b.total_copies - b.available_copies AS currently_loaned,
    CASE
        WHEN b.available_copies = 0 THEN 'All out'
        WHEN b.available_copies < b.total_copies * 0.3 THEN 'Low stock'
        WHEN b.available_copies = b.total_copies THEN 'Fully available'
        ELSE 'Available'
    END AS availability_status
FROM books b
ORDER BY b.available_copies ASC;
```

### Consulta 7: Tendências mensais de empréstimos

```sql
SELECT
    strftime('%Y-%m', loan_date) AS month,
    COUNT(*) AS total_loans,
    COUNT(DISTINCT member_id) AS active_members,
    ROUND(AVG(CAST(julianday(COALESCE(return_date, 'now')) -
                   julianday(loan_date) AS REAL)), 1) AS avg_loan_days
FROM loans
GROUP BY month
ORDER BY month;
```

### Consulta 8: Membros que nunca pegaram livros emprestados

```sql
SELECT
    m.first_name || ' ' || m.last_name AS member,
    m.email,
    m.membership_date
FROM members m
LEFT JOIN loans l ON m.id = l.member_id
WHERE l.id IS NULL
ORDER BY m.membership_date;
```

### Consulta 9: Média de cópias por gênero

```sql
SELECT
    g.name AS genre,
    COUNT(DISTINCT bg.book_id) AS num_books,
    SUM(b.total_copies) AS total_copies,
    ROUND(AVG(b.total_copies), 2) AS avg_copies_per_book
FROM genres g
JOIN book_genres bg ON g.id = bg.genre_id
JOIN books b ON bg.book_id = b.id
GROUP BY g.id
ORDER BY avg_copies_per_book DESC;
```

### Consulta 10: Autor com maior taxa de disponibilidade

```sql
SELECT
    a.first_name || ' ' || a.last_name AS author,
    ROUND(SUM(b.available_copies) * 100.0 / SUM(b.total_copies), 1) AS availability_pct,
    SUM(b.total_copies) AS total_copies,
    SUM(b.available_copies) AS available_copies
FROM authors a
JOIN books b ON a.id = b.author_id
GROUP BY a.id
ORDER BY availability_pct DESC;
```

## Resumo da Saída Esperada

Aqui está o que a Consulta 1 deve retornar (assumindo data atual como final de junho de 2024):

| title | borrower | loan_date | due_date | days_overdue |
|-------|----------|-----------|----------|--------------|
| Norwegian Wood | Alice Johnson | 2024-06-10 | 2024-06-24 | 30 |
| One Hundred Years of Solitude | Carol Chen | 2024-06-08 | 2024-06-22 | 32 |
| Pride and Prejudice | David Brown | 2024-06-12 | 2024-06-26 | 28 |
| 1984 | Eve Martinez | 2024-06-15 | 2024-06-29 | 25 |

> [!NOTE]
> Estas consultas usam funções do SQLite (`julianday`, `strftime`, `DATE`). No PostgreSQL você usaria `EXTRACT`, `TO_CHAR` e `INTERVAL`. No MySQL, `DATEDIFF` e `DATE_FORMAT`. A lógica é a mesma — apenas a sintaxe difere.

## Desafios de Extensão

Se você quiser mais prática, tente:

1. **Escreva um trigger** que decremente automaticamente `available_copies` quando um empréstimo for criado e o incremente quando um livro for devolvido.
2. **Adicione uma tabela de reservas/lista de espera** para livros sem cópias disponíveis.
3. **Crie uma view** `overdue_loans` que mostre todos os empréstimos atrasados com informações de contato do membro.
4. **Calcule multas**: Adicione uma coluna `late_fee` aos empréstimos calculada como $0,50 por dia de atraso.
5. **Encontre os leitores mais fiéis**: Membros que pegaram mais de 5 livros emprestados e nunca devolveram um livro com atraso.

> [!SUCCESS]
> Parabéns! Você concluiu o curso de SQL para Iniciantes. Você saiu de saber nada sobre bancos de dados para projetar esquemas, inserir dados e escrever consultas analíticas complexas. A base que você construiu aqui se aplica a todos os dialetos SQL e a todas as funções que envolvem dados.

## Perguntas de Prática

1. Qual é o propósito da tabela de junção `book_genres`?
2. Escreva uma consulta para encontrar o livro que foi emprestado mais vezes.
3. Como você atualizaria `available_copies` depois que um livro é devolvido?
4. Qual consulta encontra membros que nunca pegaram um livro emprestado?
5. Por que a tabela `authors` tem uma restrição CHECK em `birth_year`?
6. Escreva uma consulta para listar todos os livros que estão atualmente disponíveis (têm pelo menos 1 cópia disponível).
7. O que `julianday(due_date) - julianday('now')` calcula?
8. Como você poderia adicionar uma `late_fee` à tabela de empréstimos?
9. Escreva uma consulta mostrando qual autor tem os livros devolvidos mais rapidamente (menor duração média de empréstimo).
10. Descreva o relacionamento entre a tabela `loans` e ambas `books` e `members`.
