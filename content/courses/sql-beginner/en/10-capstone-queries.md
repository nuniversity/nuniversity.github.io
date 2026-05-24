---
title: "Capstone Project: Library Database"
description: "Design a library database from scratch, create tables, insert sample data, and write 10 analytical queries"
order: 10
duration: "20-30 minutes"
difficulty: "beginner"
---

# Capstone Project: Library Database

You've learned all the fundamentals. Now it's time to put them together into a complete project — from database design through to analytical queries.

## Project Overview

Build a database for a public library that tracks:
- **Books** in the catalog
- **Authors** who wrote them
- **Members** who borrow books
- **Loans** — who borrowed what and when

## Step 1: Database Design

### Entity-Relationship Diagram

```
AUTHORS ──< BOOKS >── BOOK_GENRES >── GENRES
           │
           └──< LOANS >── MEMBERS
```

### Relationships

- One author writes many books (one-to-many)
- A book belongs to many genres via book_genres (many-to-many)
- A member borrows many books (one-to-many)
- A loan links one member to one book copy at a point in time

## Step 2: Create the Tables

```sql
-- Authors table
CREATE TABLE authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_year INTEGER CHECK (birth_year > 1000),
    nationality VARCHAR(100)
);

-- Genres table
CREATE TABLE genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Books table
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

-- Junction: books <-> genres (many-to-many)
CREATE TABLE book_genres (
    book_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    PRIMARY KEY (book_id, genre_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Members table
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT TRUE
);

-- Loans table
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
> Notice how we separate books from their copies via `total_copies` and `available_copies`. This keeps the schema simple while tracking availability.

## Step 3: Insert Sample Data

```sql
-- Insert authors
INSERT INTO authors (first_name, last_name, birth_year, nationality)
VALUES
    ('Jane', 'Austen', 1775, 'British'),
    ('Gabriel', 'Garcia Marquez', 1927, 'Colombian'),
    ('Haruki', 'Murakami', 1949, 'Japanese'),
    ('Chimamanda', 'Ngozi Adichie', 1977, 'Nigerian'),
    ('George', 'Orwell', 1903, 'British');

-- Insert genres
INSERT INTO genres (name) VALUES
    ('Classic'), ('Fantasy'), ('Historical Fiction'),
    ('Science Fiction'), ('Romance'), ('Political Satire');

-- Insert books
INSERT INTO books (title, author_id, isbn, published_year, total_copies, available_copies)
VALUES
    ('Pride and Prejudice', 1, '9780141439518', 1813, 5, 3),
    ('One Hundred Years of Solitude', 2, '9780060883287', 1967, 3, 2),
    ('Norwegian Wood', 3, '9780375704024', 1987, 4, 1),
    ('Half of a Yellow Sun', 4, '9780307455925', 2006, 2, 2),
    ('1984', 5, '9780451524935', 1949, 6, 4);

-- Link books to genres
INSERT INTO book_genres (book_id, genre_id) VALUES
    (1, 1), (1, 5),  -- Pride and Prejudice: Classic, Romance
    (2, 1), (2, 3),  -- One Hundred Years: Classic, Historical Fiction
    (3, 1), (3, 5),  -- Norwegian Wood: Classic, Romance
    (4, 3),          -- Half of a Yellow Sun: Historical Fiction
    (5, 1), (5, 6);  -- 1984: Classic, Political Satire

-- Insert members
INSERT INTO members (first_name, last_name, email, phone, membership_date)
VALUES
    ('Alice', 'Johnson', 'alice@email.com', '555-0101', '2024-01-15'),
    ('Bob', 'Smith', 'bob@email.com', '555-0102', '2024-02-20'),
    ('Carol', 'Chen', 'carol@email.com', '555-0103', '2024-03-10'),
    ('David', 'Brown', 'david@email.com', '555-0104', '2024-04-05'),
    ('Eve', 'Martinez', 'eve@email.com', '555-0105', '2024-05-01');

-- Insert loans
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

## Step 4: Analytical Queries

### Query 1: All books currently on loan (not returned)

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

### Query 2: Most borrowed books

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

### Query 3: Members with overdue books

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

### Query 4: Most popular genres (by number of loans)

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

### Query 5: Author loan statistics

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

### Query 6: Book availability report

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

### Query 7: Monthly loan trends

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

### Query 8: Members who have never borrowed

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

### Query 9: Average copies per genre

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

### Query 10: Author with highest availability rate

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

## Expected Output Summary

Here's what Query 1 should return (assuming current date is late June 2024):

| title | borrower | loan_date | due_date | days_overdue |
|-------|----------|-----------|----------|--------------|
| Norwegian Wood | Alice Johnson | 2024-06-10 | 2024-06-24 | 30 |
| One Hundred Years of Solitude | Carol Chen | 2024-06-08 | 2024-06-22 | 32 |
| Pride and Prejudice | David Brown | 2024-06-12 | 2024-06-26 | 28 |
| 1984 | Eve Martinez | 2024-06-15 | 2024-06-29 | 25 |

> [!NOTE]
> These queries use SQLite functions (`julianday`, `strftime`, `DATE`). In PostgreSQL you'd use `EXTRACT`, `TO_CHAR`, and `INTERVAL`. In MySQL, `DATEDIFF` and `DATE_FORMAT`. The logic is the same — only the syntax differs.

## Extension Challenges

If you want more practice, try:

1. **Write a trigger** that automatically decrements `available_copies` when a loan is created and increments it when a book is returned.
2. **Add a holds/waitlist table** for books with no available copies.
3. **Create a view** `overdue_loans` that shows all overdue loans with member contact info.
4. **Calculate fines**: Add a `late_fee` column to loans computed as $0.50 per day overdue.
5. **Find the most loyal readers**: Members who have borrowed more than 5 books and never returned a book late.

> [!SUCCESS]
> Congratulations! You've completed the SQL Beginner course. You've gone from knowing nothing about databases to designing schemas, inserting data, and writing complex analytical queries. The foundation you've built here applies to every SQL dialect and every data role.

## Practice Questions

1. What is the purpose of the `book_genres` junction table?
2. Write a query to find the book that has been borrowed the most times.
3. How would you update `available_copies` after a book is returned?
4. What query finds members who have never borrowed a book?
5. Why does the `authors` table have a `birth_year` CHECK constraint?
6. Write a query to list all books that are currently available (have at least 1 available copy).
7. What does `julianday(due_date) - julianday('now')` calculate?
8. How could you add a `late_fee` to the loans table?
9. Write a query showing which author's books are returned the fastest (lowest average loan duration).
10. Describe the relationship between the `loans` table and both `books` and `members`.
