---
title: "Operaciones JSON y JSONB"
description: "Domina funciones JSON, consultas JSON path, indexación de JSON, trade-offs JSON vs tablas normalizadas y agregaciones JSON"
order: 8
duration: "90 minutos"
difficulty: advanced
---

# Operaciones JSON y JSONB

## JSON vs JSONB

| Aspecto | JSON | JSONB |
|---|---|---|
| Almacenamiento | Copia textual exacta | Binario descompuesto |
| Velocidad de inserción | Rápida | Ligeramente más lenta (overhead de parsing) |
| Velocidad de consulta | Lenta (re-analiza en cada acceso) | Rápida (sin re-análisis) |
| Indexación | No | Sí (GIN, BTREE) |
| Orden de claves | Preservado | No preservado |
| Claves duplicadas | Mantenidas | Último valor gana |
| Espacio en blanco | Preservado | Eliminado |

[!IMPORTANT]
En PostgreSQL, siempre prefiere `JSONB` sobre `JSON` a menos que necesites preservar formato exacto o claves duplicadas. JSONB soporta indexación y es significativamente más rápido para consultas.

## Creando Datos JSON

```sql
-- Desde una cadena
INSERT INTO events (data) VALUES ('{"user_id": 42, "action": "login"}');

-- Desde datos de fila usando funciones
SELECT jsonb_build_object(
    'order_id', o.id,
    'customer', jsonb_build_object('name', c.name, 'email', c.email),
    'items', (SELECT jsonb_agg(jsonb_build_object('product', p.name, 'qty', oi.quantity))
              FROM order_items oi
              JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = o.id),
    'total', o.total
)
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

## Consultando JSONB

### Operadores Básicos

| Operador | Descripción | Ejemplo |
|---|---|---|
| `->` | Obtener campo JSON (retorna JSON) | `data->'name'` |
| `->>` | Obtener campo JSON como texto | `data->>'name'` |
| `#>` | Obtener ruta (retorna JSON) | `data#>'{a,b}'` |
| `#>>` | Obtener ruta como texto | `data#>>'{a,b}'` |
| `@>` | Contiene (JSONB en JSONB) | `data @> '{"status": "active"}'` |
| `<@` | Está contenido en | `'{"status": "active"}' <@ data` |
| `?` | Clave existe | `data ? 'email'` |
| `?|` | Alguna de las claves existe | `data ?| ARRAY['email', 'phone']` |
| `?&` | Todas las claves existen | `data ?& ARRAY['email', 'phone']` |

```sql
-- Crear tabla
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar datos de ejemplo
INSERT INTO events (event_type, payload) VALUES
    ('user_signup', '{"user_id": 1, "email": "alice@example.com", "plan": "premium", "tags": ["new", "vip"]}'),
    ('purchase', '{"user_id": 1, "items": [{"sku": "A1", "price": 29.99}, {"sku": "B2", "price": 49.99}], "total": 79.98}'),
    ('user_signup', '{"user_id": 2, "email": "bob@example.com", "plan": "free"}');

-- Consultas básicas
SELECT payload->>'email' AS email FROM events WHERE payload ? 'email';
SELECT * FROM events WHERE payload @> '{"plan": "premium"}';
SELECT * FROM events WHERE payload->'tags' ? 'vip';
```

## Consultas JSON Path (SQL/JSON Path)

PostgreSQL 12+ soporta el lenguaje SQL/JSON path.

```sql
-- Encontrar todos los eventos donde cualquier artículo tiene precio > 30
SELECT * FROM events
WHERE payload @@ '$.items[*].price > 30';

-- Extraer todos los SKUs de artículos
SELECT jsonb_path_query(payload, '$.items[*].sku') AS sku
FROM events
WHERE event_type = 'purchase';

-- Ruta compleja: encontrar usuarios premium con compras mayores a $50
SELECT jsonb_path_query(payload, '$.user_id')
FROM events
WHERE payload @@ 'exists($.plan ? (@ == "premium"))'
  AND payload @@ '$.total > 50';
```

### Métodos JSON Path

| Método | Propósito |
|---|---|
| `jsonb_path_exists(data, path)` | Verificar si la ruta existe |
| `jsonb_path_match(data, path)` | Verificar predicado de ruta |
| `jsonb_path_query(data, path)` | Retornar elementos coincidentes |
| `jsonb_path_query_array(data, path)` | Retornar array de coincidencias |
| `jsonb_path_query_first(data, path)` | Retornar primera coincidencia |

```sql
-- Verificar si el payload tiene una compra con total > 100
SELECT id,
       jsonb_path_exists(payload, '$.total ? (@ > 100)') AS high_value
FROM events;

-- Extraer todas las direcciones de correo de estructuras anidadas
SELECT jsonb_path_query_array(payload, '$.**.email') AS emails
FROM events;
```

## Indexando JSONB

### Índice GIN (Predeterminado)

```sql
-- Índice GIN de propósito general
CREATE INDEX idx_events_payload ON events USING GIN (payload);

-- Soporta: @>, ?, ?|, ?&, @@ (jsonpath)
```

### GIN con `jsonb_path_ops`

```sql
-- Más pequeño y más rápido para consultas @>, pero no soporta ?, ?|, ?&
CREATE INDEX idx_events_payload_ops ON events USING GIN (payload jsonb_path_ops);
```

| Tipo de índice | Tamaño | Velocidad @> | ? / ?| / ?& | jsonpath |
|---|---|---|---|---|
| `GIN` (predeterminado) | Mayor | Rápida | Sí | Sí |
| `GIN jsonb_path_ops` | Menor | Más rápida | No | No |
| `BTREE` (en expresión) | Menor | Solo igualdad | No | No |

### Índice BTREE en Campos JSON

```sql
-- Indexar un campo JSON específico
CREATE INDEX idx_events_user_id ON events (((payload->>'user_id')::INT));

-- Consulta usando el índice
SELECT * FROM events
WHERE (payload->>'user_id')::INT = 42;
```

[!TIP]
Para consultas que filtran en una clave JSON específica (ej: `payload->>'email'`), un índice BTREE en la expresión es más pequeño y más rápido que un índice GIN.

### Índice Parcial en JSON

```sql
-- Indexar solo usuarios premium
CREATE INDEX idx_premium_users ON events ((payload->>'user_id'))
WHERE payload @> '{"plan": "premium"}';
```

## Agregaciones JSON

```sql
-- Agregar filas en un array JSON
SELECT jsonb_agg(jsonb_build_object('id', id, 'type', event_type, 'ts', created_at))
FROM events
WHERE created_at > NOW() - INTERVAL '1 day';

-- Agregar en un objeto JSON indexado por user_id
SELECT jsonb_object_agg(
    payload->>'user_id',
    jsonb_build_object('last_event', event_type, 'time', created_at)
)
FROM events
GROUP BY payload->>'user_id';

-- Agregación anidada
SELECT
    event_type,
    jsonb_agg(payload ORDER BY created_at DESC) AS latest_first
FROM events
GROUP BY event_type;
```

## JSON vs Tablas Normalizadas

| Escenario | JSONB | Normalizado |
|---|---|---|
| Esquema fijo | Peor (sin validación de tipo) | Mejor |
| Atributos altamente variables | Mejor | Peor (patrón EAV) |
| Consultas complejas en campos internos | Peor | Mejor |
| Flexibilidad de indexación | Peor | Mejor |
| Evolución de esquema sin migración | Mejor | Peor |
| Rendimiento de JOINs | Peor | Mejor |
| Almacenamiento con columnas dispersas | Mejor | Peor |

### Cuándo Usar JSONB

- **Event sourcing**: Cada evento tiene campos diferentes
- **Campos definidos por el usuario**: Usuarios pueden crear campos personalizados
- **Almacenamiento de configuración**: Clave-valor con estructura variada
- **Prototipado rápido**: Esquema evoluciona rápidamente

### Cuándo Usar Tablas Normalizadas

- **Integridad relacional**: Claves foráneas requeridas
- **Consultas frecuentes en campos específicos**: Seguridad de tipo + indexación
- **Herramientas de informes/BI**: Herramientas esperan columnas fijas
- **Alto rendimiento de escritura**: Parsing JSONB añade overhead

## Ejemplos Prácticos

### Ejemplo 1: Variantes de Producto en E-commerce

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    base_price NUMERIC NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultar productos por atributo
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);

-- Encontrar productos rojos en talla M
SELECT * FROM products
WHERE attributes @> '{"color": "red", "size": "M"}';

-- Productos con cualquier atributo de color
SELECT * FROM products WHERE attributes ? 'color';
```

### Ejemplo 2: Envíos de Formularios Dinámicos

```sql
CREATE TABLE form_submissions (
    id BIGSERIAL PRIMARY KEY,
    form_id INT NOT NULL,
    respondent_id INT,
    answers JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Puntuación media de satisfacción en todos los envíos
SELECT
    AVG((answers->>'satisfaction')::INT) AS avg_satisfaction,
    COUNT(*) FILTER (WHERE answers @> '{"satisfaction": "5"}') AS five_star_count
FROM form_submissions
WHERE form_id = 42;
```

### Ejemplo 3: Feed de Actividades

```sql
-- Almacenar actividades heterogéneas en una tabla
INSERT INTO activities (actor_id, verb, object) VALUES
    (1, 'post', jsonb_build_object('type', 'article', 'id', 100, 'title', 'Hello World')),
    (2, 'comment', jsonb_build_object('type', 'comment', 'id', 50, 'body', 'Great post!', 'parent_id', 100)),
    (1, 'like', jsonb_build_object('type', 'comment', 'id', 50));

-- Consulta: encontrar todas las actividades relacionadas con el artículo 100
SELECT *
FROM activities
WHERE object @> '{"id": 100}'
   OR object @> '{"parent_id": 100}';
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre los operadores `->` y `->>` en PostgreSQL JSONB? Da un ejemplo.
2. Escribe una consulta que encuentre todas las filas en una tabla `users` donde la columna JSONB `preferences` tenga `"theme": "dark"`.
3. Crea un índice GIN en una columna JSONB y explica qué operadores acelera.
4. Dada `events(data JSONB)`, escribe una consulta JSON path para encontrar eventos donde `data.items[0].price > 50`.
5. ¿Cuándo elegirías un índice `BTREE` en una expresión JSONB en lugar de un índice `GIN`?
6. Escribe una consulta que agregue filas de `orders` en un array JSON de objetos con las claves `id`, `total` e `item_count`.
7. Compara los trade-offs de usar JSONB vs un esquema normalizado para almacenar atributos de productos en e-commerce.
8. Usa `jsonb_set()` para actualizar un campo anidado: cambia `{"user": {"name": "Alice"}}` a `{"user": {"name": "Alice", "verified": true}}`.
9. Escribe una consulta usando `jsonb_path_query` para extraer todos los valores únicos de SKU de los payloads de eventos de compra.
10. Dada `config(key TEXT, value JSONB)`, escribe una consulta que retorne una única fila con todas las claves de configuración como columnas.
