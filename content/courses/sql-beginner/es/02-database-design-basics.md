---
title: "Fundamentos de Diseño de Bases de Datos y Normalización"
description: "Aprende principios de diseño de bases de datos, normalización (1FN, 2FN, 3FN), diagramas ER y cómo elegir tipos de datos SQL"
order: 2
duration: "20-30 minutos"
difficulty: "beginner"
---

# Fundamentos de Diseño de Bases de Datos y Normalización

Una base de datos bien diseñada ahorra tiempo, evita errores y escala adecuadamente. Un diseño deficiente conduce a datos duplicados, anomalías de actualización y consultas lentas. Esta lección te enseña cómo hacerlo bien desde el principio.

## Por qué el Diseño de Base de Datos es Importante

Considera una tabla `orders` mal diseñada:

```
orders
| order_id | customer_name | customer_email | product1 | product2 | qty1 | qty2 |
```

Problemas:
- **Duplicación**: El nombre y email del cliente se repiten en cada pedido
- **Columnas fijas**: No se pueden vender más de 2 productos por pedido
- **Anomalía de actualización**: Cambiar el email de un cliente requiere actualizar muchas filas
- **Anomalía de eliminación**: Eliminar un pedido también elimina la información del cliente

> [!NOTE]
> Estas se llaman **anomalías** — inconsistencias de datos causadas por un diseño deficiente. La normalización las elimina.

## Diagramas Entidad-Relación (ER)

Un diagrama ER representa visualmente las tablas y sus relaciones. Existen tres tipos de relaciones:

| Relación | Ejemplo | Notación del Diagrama |
|----------|---------|-----------------------|
| **Uno a Uno** | Usuario ↔ Perfil | `|---|` |
| **Uno a Muchos** | Cliente → Pedidos | `|---|{` |
| **Muchos a Muchos** | Estudiante ↔ Curso | `}{|{` |

### Ejemplo: Sistema de Biblioteca

```
AUTHOR ──< BOOK >── BOOK_GENRE >── GENRE
  │                    │
  └──< COPY            │
                       │
MEMBER ──< LOAN >──┘
```

- Un autor escribe muchos libros (uno a muchos)
- Un libro tiene muchas copias (uno a muchos)
- Un libro pertenece a muchos géneros, y un género tiene muchos libros (muchos a muchos)
- Un miembro toma prestadas muchas copias (uno a muchos)

## Normalización

La normalización organiza columnas y tablas para reducir redundancia y dependencia. Se aplica en **formas normales** sucesivas.

### Primera Forma Normal (1FN)

Una tabla está en 1FN cuando:
1. Cada celda contiene un **único valor** (atómico).
2. Cada columna contiene valores del **mismo tipo**.
3. Cada fila es **única** (tiene una clave primaria).

**Malo (no 1FN):**
```
| student_id | name   | courses           |
|------------|--------|-------------------|
| 1          | Alice  | Math, Science     |
| 2          | Bob    | History, Math     |
```

**Bueno (1FN):**
```
| student_id | name   | course   |
|------------|--------|----------|
| 1          | Alice  | Math     |
| 1          | Alice  | Science  |
| 2          | Bob    | History  |
| 2          | Bob    | Math     |
```

> [!NOTE]
> Las columnas con múltiples valores violan la 1FN. Si te sientes tentado a almacenar una lista en una celda, necesitas una tabla separada o una tabla de unión.

### Segunda Forma Normal (2FN)

Una tabla está en 2FN cuando:
1. Está en 1FN.
2. Toda columna no clave depende de la **totalidad** de la clave primaria (no solo de una parte).

**Malo (clave compuesta `order_id, product_id`):**
```
| order_id | product_id | product_name | quantity |
```
`product_name` depende solo de `product_id`, no de la clave completa.

**Bueno:**
```
order_items:      products:
| order_id | product_id | qty |    | product_id | product_name |
```

### Tercera Forma Normal (3FN)

Una tabla está en 3FN cuando:
1. Está en 2FN.
2. Ninguna columna no clave depende de otra columna no clave (sin dependencias transitivas).

**Malo:**
```
| employee_id | department_id | department_name |
```
`department_name` depende de `department_id`, no de `employee_id`.

**Bueno:**
```
employees:              departments:
| emp_id | dept_id |    | dept_id | dept_name |
```

> [!SUCCESS]
> En la práctica, la mayoría de las bases de datos apuntan a **3FN**. Más allá de 3FN (BCNF, 4FN, 5FN) rara vez es necesario para aplicaciones típicas.

## Eligiendo Tipos de Datos SQL

Elegir el tipo de dato correcto afecta el almacenamiento, el rendimiento y la corrección.

| Dato | Tipo Recomendado | Por qué |
|------|------------------|---------|
| Nombre de persona | `VARCHAR(100)` | Longitud variable, limitada |
| Email | `VARCHAR(255)` | Longitud máxima según RFC |
| Edad | `INTEGER` o `SMALLINT` | Número entero, rango pequeño |
| Precio | `DECIMAL(10,2)` | Precisión exacta, sin redondeo |
| Descripción | `TEXT` | Longitud ilimitada |
| Fecha de nacimiento | `DATE` | Tipo solo fecha |
| Timestamp de creación | `TIMESTAMP` | Fecha + hora con zona horaria |
| Indicador booleano | `BOOLEAN` / `TINYINT(1)` | Valores verdadero/falso |
| UUID | `CHAR(36)` o tipo `UUID` | Formato fijo |

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Desnormalización (Cuándo Romper las Reglas)

A veces intencionalmente **desnormalizas** por rendimiento:

- **Tablas de informes**: Datos precombinados para paneles
- **APIs con muchas lecturas**: Almacenar una copia de un campo frecuentemente accedido
- **Caché**: Evitar uniones costosas en rutas críticas

> [!WARNING]
> La desnormalización introduce redundancia y anomalías de actualización. Solo hazlo después de medir y demostrar una necesidad de rendimiento. La desnormalización prematura es un error común de principiantes.

## Caso de Uso Real: Plataforma de Blog

Tablas necesarias:

- `authors(id, name, email, bio)`
- `posts(id, author_id, title, body, published_at)`
- `categories(id, name, slug)`
- `post_categories(post_id, category_id)` — tabla de unión
- `comments(id, post_id, author_name, body, created_at)`

```sql
-- Encuentra todos los posts del autor "Alice" en la categoría "SQL"
SELECT p.title, p.published_at
FROM posts p
JOIN authors a ON p.author_id = a.id
JOIN post_categories pc ON p.id = pc.post_id
JOIN categories c ON pc.category_id = c.id
WHERE a.name = 'Alice' AND c.name = 'SQL';
```

## Diseñando una Tabla: Paso a Paso

Diseñemos una tabla `products` para comercio electrónico desde cero:

1. **Identifica la entidad**: Un producto.
2. **Lista los atributos**: Nombre, descripción, precio, categoría, SKU, cantidad en stock, URL de imagen, fecha de creación.
3. **Elige los tipos de datos**:
   - `name` → `VARCHAR(200)` NOT NULL
   - `description` → `TEXT`
   - `price` → `DECIMAL(10,2)` NOT NULL
   - `category` → `VARCHAR(100)` (o clave foránea a `categories`)
   - `sku` → `VARCHAR(50)` UNIQUE
   - `stock` → `INTEGER` DEFAULT 0
   - `image_url` → `VARCHAR(500)`
   - `created_at` → `TIMESTAMP` DEFAULT CURRENT_TIMESTAMP
4. **Identifica las claves**: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `sku VARCHAR(50) UNIQUE`.
5. **Añade restricciones**: `CHECK (price > 0)`, `CHECK (stock >= 0)`.
6. **Considera relaciones**: Clave foránea a `categories(id)`.

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

## Ejemplo de Normalización: Recorrido Completo

Comienza con una gran tabla desnormalizada:

```
orders (order_id, customer_name, customer_email, customer_phone,
        product_name, product_price, product_category, order_date, quantity)
```

### Paso 1: Aplicar 1FN

Ya está en 1FN (todos los valores atómicos). Pero hay redundancia.

### Paso 2: Aplicar 2FN

Identifica dependencias parciales. Si `product_name` depende solo de `product_id` (no del pedido completo), sepáralo:

```
order_items (order_id, product_id, quantity)
products (id, name, price, category)
orders (id, customer_name, customer_email, customer_phone, order_date)
```

### Paso 3: Aplicar 3FN

Identifica dependencias transitivas. `customer_phone` depende de `customer_name` (no de `order_id`). Sepáralo:

```
orders (id, customer_id, order_date)
customers (id, name, email, phone)
order_items (order_id, product_id, quantity)
products (id, name, price, category_id)
categories (id, name)
```

El resultado: 5 tablas, cero redundancia, relaciones claras.

> [!SUCCESS]
> Un buen diseño es invisible — solo lo notas cuando falta. Tómate tiempo para planificar antes de escribir un solo CREATE TABLE.

## Preguntas de Práctica

1. ¿Qué tres problemas resuelve la normalización?
2. Describe 1FN, 2FN y 3FN con tus propias palabras.
3. Una tabla tiene columnas `(order_id, product_id, product_name, quantity)` con una clave primaria compuesta de `(order_id, product_id)`. ¿Qué forma normal se viola? ¿Por qué?
4. Dibuja un diagrama ER simple para una escuela donde los estudiantes se inscriben en cursos y los profesores imparten cursos.
5. ¿Qué tipo de dato usarías para el precio de un producto? ¿Por qué no FLOAT?
6. ¿Cuándo desnormalizarías intencionalmente una base de datos?
7. Supón una tabla con `(student_id, advisor_name, advisor_phone)`. Cada estudiante tiene un asesor. ¿Qué problema de forma normal existe?
8. ¿Qué es una tabla de unión y cuándo se necesita?
9. Convierte esta tabla desnormalizada a 3FN: `(order_id, customer_name, customer_email, product_name, product_price)`
10. ¿Por qué `VARCHAR(255)` es una elección común para columnas de email?
