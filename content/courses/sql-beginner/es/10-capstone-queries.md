---
title: "Proyecto Final: Base de Datos de Biblioteca"
description: "Diseña una base de datos de biblioteca desde cero, crea tablas, inserta datos de ejemplo y escribe 10 consultas analíticas"
order: 10
duration: "20-30 minutos"
difficulty: "beginner"
---

# Proyecto Final: Base de Datos de Biblioteca

Has aprendido todos los fundamentos. Ahora es momento de juntarlos en un proyecto completo — desde el diseño de la base de datos hasta consultas analíticas.

## Visión General del Proyecto

Construye una base de datos para una biblioteca pública que gestione:
- **Libros** en el catálogo
- **Autores** que los escribieron
- **Miembros** que toman prestados libros
- **Préstamos** — quién tomó qué y cuándo

## Paso 1: Diseño de la Base de Datos

### Diagrama Entidad-Relación

```
AUTHORS ──< BOOKS >── BOOK_GENRES >── GENRES
           │
           └──< LOANS >── MEMBERS
```

### Relaciones

- Un autor escribe muchos libros (uno a muchos)
- Un libro pertenece a muchos géneros mediante book_genres (muchos a muchos)
- Un miembro toma prestados muchos libros (uno a muchos)
- Un préstamo vincula un miembro con una copia de libro en un momento dado

## Paso 2: Crear las Tablas

```sql
-- Tabla de autores
CREATE TABLE authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_year INTEGER CHECK (birth_year > 1000),
    nationality VARCHAR(100)
);

-- Tabla de géneros
CREATE TABLE genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de libros
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

-- Unión: books <-> genres (muchos a muchos)
CREATE TABLE book_genres (
    book_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    PRIMARY KEY (book_id, genre_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Tabla de miembros
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT TRUE
);

-- Tabla de préstamos
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
> Observa cómo separamos los libros de sus copias mediante `total_copies` y `available_copies`. Esto mantiene el esquema simple mientras gestiona la disponibilidad.

## Paso 3: Insertar Datos de Ejemplo

```sql
-- Insertar autores
INSERT INTO authors (first_name, last_name, birth_year, nationality)
VALUES
    ('Jane', 'Austen', 1775, 'British'),
    ('Gabriel', 'Garcia Marquez', 1927, 'Colombian'),
    ('Haruki', 'Murakami', 1949, 'Japanese'),
    ('Chimamanda', 'Ngozi Adichie', 1977, 'Nigerian'),
    ('George', 'Orwell', 1903, 'British');

-- Insertar géneros
INSERT INTO genres (name) VALUES
    ('Classic'), ('Fantasy'), ('Historical Fiction'),
    ('Science Fiction'), ('Romance'), ('Political Satire');

-- Insertar libros
INSERT INTO books (title, author_id, isbn, published_year, total_copies, available_copies)
VALUES
    ('Pride and Prejudice', 1, '9780141439518', 1813, 5, 3),
    ('One Hundred Years of Solitude', 2, '9780060883287', 1967, 3, 2),
    ('Norwegian Wood', 3, '9780375704024', 1987, 4, 1),
    ('Half of a Yellow Sun', 4, '9780307455925', 2006, 2, 2),
    ('1984', 5, '9780451524935', 1949, 6, 4);

-- Vincular libros a géneros
INSERT INTO book_genres (book_id, genre_id) VALUES
    (1, 1), (1, 5),  -- Pride and Prejudice: Classic, Romance
    (2, 1), (2, 3),  -- One Hundred Years: Classic, Historical Fiction
    (3, 1), (3, 5),  -- Norwegian Wood: Classic, Romance
    (4, 3),          -- Half of a Yellow Sun: Historical Fiction
    (5, 1), (5, 6);  -- 1984: Classic, Political Satire

-- Insertar miembros
INSERT INTO members (first_name, last_name, email, phone, membership_date)
VALUES
    ('Alice', 'Johnson', 'alice@email.com', '555-0101', '2024-01-15'),
    ('Bob', 'Smith', 'bob@email.com', '555-0102', '2024-02-20'),
    ('Carol', 'Chen', 'carol@email.com', '555-0103', '2024-03-10'),
    ('David', 'Brown', 'david@email.com', '555-0104', '2024-04-05'),
    ('Eve', 'Martinez', 'eve@email.com', '555-0105', '2024-05-01');

-- Insertar préstamos
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

## Paso 4: Consultas Analíticas

### Consulta 1: Todos los libros actualmente prestados (no devueltos)

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

### Consulta 2: Libros más prestados

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

### Consulta 3: Miembros con libros atrasados

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

### Consulta 4: Géneros más populares (por número de préstamos)

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

### Consulta 5: Estadísticas de préstamos por autor

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

### Consulta 6: Informe de disponibilidad de libros

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

### Consulta 7: Tendencias mensuales de préstamos

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

### Consulta 8: Miembros que nunca han tomado prestado

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

### Consulta 9: Promedio de copias por género

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

### Consulta 10: Autor con mayor tasa de disponibilidad

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

## Resumen de Salida Esperada

Esto es lo que la Consulta 1 debería devolver (asumiendo fecha actual a finales de junio de 2024):

| title | borrower | loan_date | due_date | days_overdue |
|-------|----------|-----------|----------|--------------|
| Norwegian Wood | Alice Johnson | 2024-06-10 | 2024-06-24 | 30 |
| One Hundred Years of Solitude | Carol Chen | 2024-06-08 | 2024-06-22 | 32 |
| Pride and Prejudice | David Brown | 2024-06-12 | 2024-06-26 | 28 |
| 1984 | Eve Martinez | 2024-06-15 | 2024-06-29 | 25 |

> [!NOTE]
> Estas consultas usan funciones de SQLite (`julianday`, `strftime`, `DATE`). En PostgreSQL usarías `EXTRACT`, `TO_CHAR` e `INTERVAL`. En MySQL, `DATEDIFF` y `DATE_FORMAT`. La lógica es la misma — solo la sintaxis difiere.

## Desafíos de Extensión

Si quieres más práctica, intenta:

1. **Escribe un trigger** que decremente automáticamente `available_copies` cuando se crea un préstamo y lo incremente cuando se devuelve un libro.
2. **Añade una tabla de reservas/lista de espera** para libros sin copias disponibles.
3. **Crea una vista** `overdue_loans` que muestre todos los préstamos vencidos con información de contacto del miembro.
4. **Calcula multas**: Añade una columna `late_fee` a los préstamos calculada como $0.50 por día de retraso.
5. **Encuentra los lectores más leales**: Miembros que han tomado prestados más de 5 libros y nunca han devuelto un libro tarde.

> [!SUCCESS]
> ¡Felicidades! Has completado el curso de SQL para Principiantes. Has pasado de no saber nada sobre bases de datos a diseñar esquemas, insertar datos y escribir consultas analíticas complejas. La base que has construido aquí se aplica a todos los dialectos SQL y a todos los roles que trabajan con datos.

## Preguntas de Práctica

1. ¿Cuál es el propósito de la tabla de unión `book_genres`?
2. Escribe una consulta para encontrar el libro que ha sido prestado más veces.
3. ¿Cómo actualizarías `available_copies` después de que se devuelve un libro?
4. ¿Qué consulta encuentra miembros que nunca han tomado prestado un libro?
5. ¿Por qué la tabla `authors` tiene una restricción CHECK en `birth_year`?
6. Escribe una consulta para listar todos los libros que están actualmente disponibles (tienen al menos 1 copia disponible).
7. ¿Qué calcula `julianday(due_date) - julianday('now')`?
8. ¿Cómo podrías añadir una `late_fee` a la tabla de préstamos?
9. Escribe una consulta que muestre qué autor tiene los libros devueltos más rápidamente (menor duración promedio de préstamo).
10. Describe la relación entre la tabla `loans` y ambas `books` y `members`.
