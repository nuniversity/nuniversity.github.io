---
title: "Tipos de Datos y Restricciones SQL"
description: "Profundiza en tipos de datos SQL (INT, VARCHAR, TEXT, DATE, DECIMAL) y restricciones (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT)"
order: 7
duration: "20-30 minutos"
difficulty: "beginner"
---

# Tipos de Datos y Restricciones SQL

Elegir el tipo de dato correcto y aplicar restricciones apropiadas garantiza la integridad de los datos, optimiza el almacenamiento y previene errores en aplicaciones.

## Tipos de Datos SQL

### Tipos Numéricos

| Tipo | Almacenamiento | Rango / Precisión | Caso de Uso |
|------|----------------|-------------------|-------------|
| `INTEGER` / `INT` | 4 bytes | -2^31 a 2^31-1 | Conteos, IDs, edades |
| `SMALLINT` | 2 bytes | -32.768 a 32.767 | Rangos pequeños, códigos de estado |
| `BIGINT` | 8 bytes | -2^63 a 2^63-1 | Contadores grandes, IDs grandes |
| `DECIMAL(p,s)` | Variable | Precisión exacta | Dinero, mediciones científicas |
| `REAL` / `FLOAT` | 4-8 bytes | Aproximado | Porcentajes, promedios (¡no dinero!) |

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,  -- 10 dígitos, 2 después del decimal
    rating DECIMAL(3,2),            -- ej. 4.75
    stock SMALLINT DEFAULT 0
);
```

> [!WARNING]
> Nunca uses `FLOAT` o `REAL` para valores monetarios. Los errores de redondeo de punto flotante (ej.: 0.1 + 0.2 = 0.30000000000000004) causarán discrepancias contables. Usa siempre `DECIMAL`.

### Tipos de Carácter/String

| Tipo | Descripción | Caso de Uso |
|------|-------------|-------------|
| `CHAR(n)` | Longitud fija, rellenado con espacios | Códigos, códigos postales, hashes |
| `VARCHAR(n)` | Longitud variable con máximo | Nombres, emails, direcciones |
| `TEXT` | Longitud ilimitada | Artículos, descripciones, JSON |

```sql
CREATE TABLE articles (
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    body TEXT,
    excerpt VARCHAR(500)
);
```

> [!NOTE]
> `VARCHAR(255)` es un valor predeterminado común porque 255 es la longitud máxima que se puede codificar con un prefijo de un byte. Usa `TEXT` cuando el contenido pueda exceder unos cientos de caracteres.

### Tipos de Fecha/Hora

| Tipo | Formato | Ejemplo | Precisión |
|------|---------|---------|-----------|
| `DATE` | YYYY-MM-DD | 2024-01-15 | Día |
| `TIME` | HH:MM:SS | 14:30:00 | Segundo |
| `TIMESTAMP` | YYYY-MM-DD HH:MM:SS | 2024-01-15 14:30:00 | Segundo (o sub-segundo) |
| `DATETIME` | YYYY-MM-DD HH:MM:SS | 2024-01-15 14:30:00 | Sin zona horaria (MySQL) |

```sql
CREATE TABLE events (
    event_name VARCHAR(200),
    event_date DATE,
    start_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Otros Tipos Útiles

| Tipo | Caso de Uso |
|------|-------------|
| `BOOLEAN` | Indicadores verdadero/falso |
| `BLOB` | Datos binarios (imágenes, archivos) |
| `JSON` | Datos estructurados anidados (PostgreSQL, MySQL) |
| `UUID` | Identificadores universalmente únicos |
| `ENUM` | Lista fija de valores (MySQL) |

## Restricciones

Las restricciones imponen reglas sobre los datos en tus tablas.

### NOT NULL

Garantiza que una columna no puede contener NULL:

```sql
CREATE TABLE users (
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL
);
```

```sql
-- Esto fallará
INSERT INTO users (name) VALUES ('Alice');  -- email es NULL, viola NOT NULL
```

### UNIQUE

Garantiza que todos los valores en una columna (o combinación de columnas) son distintos:

```sql
CREATE TABLE users (
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE
);
```

```sql
-- Esto fallará
INSERT INTO users (email, username) VALUES ('a@x.com', 'alice');
INSERT INTO users (email, username) VALUES ('b@x.com', 'alice');  -- username duplicado
```

> [!SUCCESS]
> `UNIQUE` también crea un índice, haciendo las búsquedas rápidas. Úsalo para claves naturales como email, nombre de usuario o SKU.

### PRIMARY KEY

Identifica de forma única cada fila. Combina `NOT NULL` + `UNIQUE`. Una tabla solo puede tener una:

```sql
-- PK de columna única
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL
);

-- PK compuesta (múltiples columnas)
CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)
);
```

### FOREIGN KEY

Vincula filas entre tablas y mantiene la **integridad referencial**:

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
```

#### Acciones Referenciales

| Acción | On Delete | On Update |
|--------|-----------|-----------|
| `CASCADE` | Eliminar filas hijas | Actualizar valores FK hijos |
| `SET NULL` | Establecer FK hijo a NULL | Establecer FK hijo a NULL |
| `RESTRICT` | Prevenir eliminación del padre | Prevenir actualización del padre |
| `NO ACTION` | Igual que RESTRICT (comprobable diferido) |
| `SET DEFAULT` | Establecer a valor predeterminado | Establecer a valor predeterminado |

```sql
-- Si el usuario se elimina, sus pedidos también se eliminan
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Si el usuario se elimina, los pedidos mantienen user_id como NULL
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
```

> [!WARNING]
> `ON DELETE CASCADE` es poderoso pero peligroso. Eliminar accidentalmente una fila padre puede borrar silenciosamente miles de filas hijas. Úsalo con precaución.

### CHECK

Valida que los valores cumplan una condición:

```sql
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    salary DECIMAL(10,2) CHECK (salary > 0),
    age INTEGER CHECK (age >= 16 AND age <= 120),
    department VARCHAR(50) CHECK (department IN ('Engineering', 'Sales', 'HR'))
);
```

```sql
-- Esto fallará
INSERT INTO employees (salary, age, department)
VALUES (-500, 150, 'Gaming');  -- salario negativo, edad excesiva, depto inválido
```

### DEFAULT

Establece un valor cuando no se proporciona ninguno:

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    currency VARCHAR(3) DEFAULT 'USD'
);
```

```sql
INSERT INTO orders (id) VALUES (1);
-- status = 'pending', created_at = ahora, currency = 'USD'
```

## Todo Junto: Una Tabla Bien Diseñada

```sql
CREATE TABLE accounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin', 'moderator')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    balance     DECIMAL(12,2) NOT NULL DEFAULT 0.00
                    CHECK (balance >= 0),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP
);
```

## Caso de Uso Real: Previniendo Datos Incorrectos

```sql
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (user_id, product_id)  -- una reseña por usuario por producto
);
```

Esta tabla garantiza:
- La calificación está siempre entre 1 y 5
- Sin calificaciones NULL
- Una reseña por usuario por producto
- Si un usuario/producto se elimina, las reseñas se limpian
- La reseña tiene un timestamp de creación

> [!SUCCESS]
> Las restricciones son tu primera línea de defensa contra datos incorrectos. Defínelas a nivel de base de datos, no solo en el código de tu aplicación. Las restricciones de la base de datos se aplican en todas partes — incluso si alguien escribe un INSERT con errores o se conecta desde una herramienta diferente.

## Preguntas de Práctica

1. ¿Qué tipo de dato deberías usar para una columna que almacena precios de productos? ¿Por qué?
2. Escribe una instrucción CREATE TABLE para `students` con: id (PK), email (único, no nulo), age (verificar 0-150), enrollment_date (predeterminado hoy).
3. ¿Cuál es la diferencia entre `CHAR(10)` y `VARCHAR(10)`?
4. ¿Qué hace `ON DELETE CASCADE`? Da un ejemplo donde sea apropiado.
5. Escribe una restricción CHECK que garantice que una columna `discount` esté entre 0 y 100 (inclusive).
6. ¿Puede una tabla tener múltiples restricciones PRIMARY KEY? ¿Puede tener múltiples restricciones UNIQUE?
7. ¿Qué sucede con las filas hijas cuando se elimina una fila padre con `ON DELETE SET NULL`?
8. Escribe una tabla `enrollments` con una clave primaria compuesta en `(student_id, course_id)` y claves foráneas a ambas tablas.
9. ¿Por qué deberías evitar `FLOAT` para columnas monetarias?
10. ¿Cuál es la diferencia de almacenamiento entre `INTEGER` y `SMALLINT`? ¿Cuándo elegirías uno sobre el otro?
