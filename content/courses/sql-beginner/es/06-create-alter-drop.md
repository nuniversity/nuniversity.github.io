---
title: "CREATE, ALTER y DROP de Tablas"
description: "Aprende a definir esquemas de base de datos con CREATE TABLE, modificarlos con ALTER TABLE y eliminarlos con DROP TABLE"
order: 6
duration: "20-30 minutos"
difficulty: "beginner"
---

# CREATE, ALTER y DROP de Tablas

Estos comandos de **Lenguaje de Definición de Datos (DDL)** definen y gestionan la estructura de tu base de datos. Acertar el diseño del esquema es crítico — es mucho más fácil planificar con anticipación que migrar después.

## CREATE TABLE

### Sintaxis Básica

```sql
CREATE TABLE table_name (
    column1 datatype constraints,
    column2 datatype constraints,
    ...
);
```

### Ejemplo

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    age INTEGER CHECK (age >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Creando una Tabla con Clave Foránea

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

> [!NOTE]
> En MySQL, `AUTO_INCREMENT` reemplaza a `AUTOINCREMENT`. PostgreSQL usa `SERIAL` o `GENERATED AS IDENTITY`. Siempre verifica el dialecto de tu RDBMS.

### IF NOT EXISTS

Previene errores si la tabla ya existe:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT
);
```

## ALTER TABLE — Cambiando la Estructura de la Tabla

### ADD COLUMN

```sql
ALTER TABLE users
ADD COLUMN phone VARCHAR(20);

-- Con restricciones
ALTER TABLE users
ADD COLUMN bio TEXT DEFAULT '';
```

> [!SUCCESS]
> Añadir una columna con valor `DEFAULT` suele ser rápido. Añadir una columna `NOT NULL` sin un valor predeterminado en una tabla grande puede ser muy lento.

### MODIFY COLUMN (Cambiando Tipo de Dato / Restricciones)

```sql
-- MySQL / SQLite
ALTER TABLE users
MODIFY COLUMN age SMALLINT NOT NULL;

-- PostgreSQL
ALTER TABLE users
ALTER COLUMN age TYPE SMALLINT;
ALTER TABLE users
ALTER COLUMN age SET NOT NULL;
```

### RENAME COLUMN

```sql
-- PostgreSQL, SQLite 3.25+
ALTER TABLE users
RENAME COLUMN phone TO phone_number;

-- MySQL
ALTER TABLE users
CHANGE phone phone_number VARCHAR(20);
```

### DROP COLUMN

```sql
ALTER TABLE users
DROP COLUMN phone;
```

> [!WARNING]
> Eliminar una columna es destructivo e irreversible (fuera de una copia de seguridad o transacción). Algunas bases de datos (SQLite < 3.35.0) requieren recrear la tabla para eliminar una columna.

### RENAME TABLE

```sql
ALTER TABLE users RENAME TO customers;
```

## DROP TABLE — Eliminando Tablas

```sql
-- Elimina permanentemente la tabla y todos sus datos
DROP TABLE users;

-- Solo elimina si existe (sin error)
DROP TABLE IF EXISTS users;
```

> [!WARNING]
> `DROP TABLE` no se puede deshacer en la mayoría de las bases de datos a menos que esté dentro de una transacción. No hay mensaje de confirmación. Asegúrate absolutamente antes de ejecutar esto en producción.

### DROP vs TRUNCATE vs DELETE

| Comando | Elimina Datos | Elimina Estructura | Puede Deshacer | Reinicia Índices | Velocidad |
|---------|-------------|-------------------|----------------|------------------|-----------|
| `DELETE` | Sí | No | Sí | No | Lento |
| `TRUNCATE` | Sí | No | Sí* | Sí | Rápido |
| `DROP` | Sí | Sí | Sí* | Sí | Más rápido |

*En la mayoría de las bases de datos si está dentro de una transacción.

## Uniendo Todo: Construyendo un Esquema

```sql
-- Paso 1: Crear la base de datos (MySQL/PostgreSQL)
CREATE DATABASE ecommerce;

USE ecommerce;  -- MySQL
-- \c ecommerce  -- PostgreSQL

-- Paso 2: Crear tablas
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Paso 3: Alterar después de la creación (si es necesario)
ALTER TABLE products ADD COLUMN sku VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN active BOOLEAN DEFAULT TRUE;
```

## Caso de Uso Real: Migración de Esquema

Imagina que heredaste una tabla `customers` con una sola columna `full_name`, pero ahora necesitas nombres y apellidos separados:

```sql
-- 1. Añadir nuevas columnas
ALTER TABLE customers ADD COLUMN first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN last_name VARCHAR(100);

-- 2. Poblar desde datos existentes
UPDATE customers
SET
    first_name = SUBSTR(full_name, 1, INSTR(full_name, ' ') - 1),
    last_name = SUBSTR(full_name, INSTR(full_name, ' ') + 1);

-- 3. (Opcional) Eliminar la columna antigua
ALTER TABLE customers DROP COLUMN full_name;
```

> [!NOTE]
> En producción, los cambios de esquema como la eliminación de columnas deben realizarse durante ventanas de mantenimiento y probarse primero en una copia. Usa una herramienta de migración (Flyway, Alembic, Liquibase) para rastrear cambios.

## Caso de Uso Real: Añadiendo Auditoría

```sql
-- Añadir seguimiento de timestamp a una tabla existente
ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Crear un trigger para auto-actualizar en modificación (PostgreSQL / SQLite)
CREATE TRIGGER update_products_timestamp
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

## Preguntas de Práctica

1. Escribe una instrucción CREATE TABLE para una tabla `books` con columnas: id, title, author_id, published_year, isbn y una clave foránea a `authors`.
2. ¿Qué hace `ALTER TABLE students ADD COLUMN gpa DECIMAL(3,2) DEFAULT 0.00;`?
3. ¿Cuál es la diferencia entre `DROP TABLE` y `TRUNCATE TABLE`?
4. Escribe una instrucción ALTER para renombrar la tabla `students` a `enrollees`.
5. ¿Cómo añadirías una restricción `UNIQUE` a una columna existente llamada `email`?
6. ¿Qué hace `CREATE TABLE IF NOT EXISTS` y por qué es útil?
7. Escribe una secuencia de instrucciones ALTER que: añada una columna `middle_name`, elimine la columna `nickname` y renombre `full_name` a `display_name`.
8. ¿Por qué añadir una columna `NOT NULL` sin un valor predeterminado es potencialmente problemático en tablas grandes?
9. Escribe un CREATE TABLE para una tabla `reviews` con una clave foránea compuesta que referencia `(product_id, user_id)`.
10. ¿Qué sucede con los datos en una tabla cuando ejecutas `DROP TABLE products`?
