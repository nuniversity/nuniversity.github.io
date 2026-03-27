---
title: "Dominio 3.1 — Carga y Descarga de Datos"
description: "Domina la carga y descarga masiva de datos en Snowflake: formatos de archivo, stages (internos y externos), el comando COPY INTO, opciones de manejo de errores y mejores prácticas para ingesta de alto rendimiento."
order: 10
difficulty: intermediate
duration: "75 min"
---

# Dominio 3.1 — Carga y Descarga de Datos

## Peso en el Examen

El **Dominio 3.0 — Carga, Descarga y Conectividad de Datos** representa aproximadamente el **~18%** del examen.

> [!NOTE]
> Esta lección corresponde al **Objetivo de Examen 3.1**: *Realizar carga y descarga de datos*, incluyendo formatos de archivo, stages, el comando COPY INTO y opciones de manejo de errores.

---

## El Proceso de Carga de Datos

El proceso de carga masiva de Snowflake sigue este flujo:

```
Archivos Fuente (CSV, JSON, Parquet, etc.)
           │
           ▼
      Stage (Interno o Externo)
           │
           ▼
    COPY INTO <tabla>
           │
           ▼
      Tabla Snowflake (micro-particiones)
```

---

## Formatos de Archivo

Un **Formato de Archivo** define cómo Snowflake analiza los archivos durante la carga y descarga. Tipos soportados:

| Formato | Tipo | Notas |
|---|---|---|
| **CSV** | Estructurado | El más común; delimitador, comillas y codificación altamente configurables |
| **JSON** | Semi-estructurado | Cargado en columnas VARIANT |
| **Avro** | Semi-estructurado | Esquema embebido en el archivo |
| **ORC** | Semi-estructurado | Columnar, frecuente en ecosistemas Hadoop |
| **Parquet** | Semi-estructurado | Columnar, altamente comprimido |
| **XML** | Semi-estructurado | Formato de documento jerárquico |

```sql
-- Formato de archivo CSV
CREATE FILE FORMAT csv_format
    TYPE = CSV
    FIELD_DELIMITER = ','
    RECORD_DELIMITER = '\n'
    SKIP_HEADER = 1
    FIELD_OPTIONALLY_ENCLOSED_BY = '"'
    NULL_IF = ('NULL', 'null', 'N/A', '')
    EMPTY_FIELD_AS_NULL = TRUE
    ENCODING = 'UTF-8'
    TRIM_SPACE = TRUE;

-- Formato de archivo JSON
CREATE FILE FORMAT json_format
    TYPE = JSON
    STRIP_OUTER_ARRAY = TRUE    -- eliminar el envoltorio externo []
    STRIP_NULL_VALUES = FALSE
    IGNORE_UTF8_ERRORS = FALSE;

-- Formato de archivo Parquet
CREATE FILE FORMAT parquet_format
    TYPE = PARQUET
    SNAPPY_COMPRESSION = TRUE;

-- Formato en línea (sin necesidad de crear un formato con nombre)
COPY INTO my_table
FROM @my_stage
FILE_FORMAT = (TYPE = CSV FIELD_DELIMITER = '|' SKIP_HEADER = 1);
```

---

## Stages (Áreas de Preparación de Datos)

Un **stage** es la zona de aterrizaje intermedia donde se colocan los archivos antes de cargarlos en las tablas de Snowflake.

### Stages Internos

Snowflake gestiona el almacenamiento subyacente:

| Tipo de Stage | Sintaxis | Alcance |
|---|---|---|
| **Stage de usuario** | `@~` | Por usuario; privado, no compartible |
| **Stage de tabla** | `@%nombre_tabla` | Por tabla; vinculado a una tabla específica |
| **Stage interno con nombre** | `@nombre_stage` | Compartido dentro de la cuenta, más flexible |

```sql
-- Subir un archivo a un stage interno con nombre usando SnowSQL / CLI
PUT file:///ruta/local/orders.csv @my_stage AUTO_COMPRESS = TRUE;

-- O vía Snowflake CLI
snow stage copy ./orders.csv @my_stage/

-- Listar archivos en un stage
LIST @my_stage;
LIST @my_stage/orders/;

-- Eliminar archivos de un stage
REMOVE @my_stage/old_files/;
```

### Stages Externos

Los datos permanecen en el **cloud storage del cliente**:

```sql
-- Stage externo en Amazon S3
CREATE STAGE s3_orders_stage
    URL = 's3://my-bucket/orders/'
    STORAGE_INTEGRATION = my_s3_integration
    FILE_FORMAT = (FORMAT_NAME = csv_format)
    DIRECTORY = (ENABLE = TRUE);  -- habilitar tabla de directorio

-- Stage externo en Azure Blob Storage
CREATE STAGE azure_stage
    URL = 'azure://myaccount.blob.core.windows.net/mycontainer/data/'
    STORAGE_INTEGRATION = my_azure_integration
    FILE_FORMAT = (FORMAT_NAME = json_format);

-- Stage externo en Google Cloud Storage
CREATE STAGE gcs_stage
    URL = 'gcs://my-bucket/data/'
    STORAGE_INTEGRATION = my_gcs_integration;
```

### Integraciones de Almacenamiento (*Storage Integrations*)

Una **integración de almacenamiento** conecta Snowflake de forma segura al cloud storage usando un **rol IAM / principal de servicio** — sin credenciales almacenadas en Snowflake:

```sql
CREATE STORAGE INTEGRATION my_s3_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = S3
    ENABLED = TRUE
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/snowflake-role'
    STORAGE_ALLOWED_LOCATIONS = ('s3://my-bucket/orders/', 's3://my-bucket/products/');

-- Obtener los valores IAM para configurar en AWS
DESC INTEGRATION my_s3_integration;
```

### Tablas de Directorio

Habilita el **listado de archivos** en stages externos como una tabla consultable:

```sql
ALTER STAGE s3_orders_stage SET DIRECTORY = (ENABLE = TRUE);

-- Actualizar los metadatos de la tabla de directorio
ALTER STAGE s3_orders_stage REFRESH;

-- Consultar la tabla de directorio
SELECT * FROM DIRECTORY(@s3_orders_stage);
```

---

## COPY INTO — Carga de Datos

`COPY INTO <tabla>` es el comando principal de carga masiva:

```sql
-- Carga básica
COPY INTO orders
FROM @my_stage/orders/
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- Cargar archivos específicos
COPY INTO orders
FROM @my_stage/orders/
FILES = ('orders_2025_01.csv', 'orders_2025_02.csv')
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- Cargar usando coincidencia de patrones
COPY INTO orders
FROM @my_stage/orders/
PATTERN = '.*orders_2025_.*\\.csv'
FILE_FORMAT = (FORMAT_NAME = csv_format);

-- Transformar durante la carga (SELECT desde el stage)
COPY INTO orders (id, amount, load_ts)
FROM (
    SELECT $1::NUMBER, $2::DECIMAL(10,2), CURRENT_TIMESTAMP
    FROM @my_stage/orders/
)
FILE_FORMAT = (FORMAT_NAME = csv_format);
```

### Seguimiento del Estado de Carga

COPY INTO rastrea automáticamente qué archivos han sido cargados para evitar duplicados:

```sql
-- Ver historial de carga de una tabla (últimos 64 días)
SELECT *
FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
    TABLE_NAME => 'ORDERS',
    START_TIME => DATEADD('day', -7, CURRENT_TIMESTAMP)
));

-- Historial de toda la cuenta
SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.COPY_HISTORY
WHERE TABLE_NAME = 'ORDERS'
AND LAST_LOAD_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

> [!NOTE]
> Snowflake rastrea el **historial de carga de 64 días** por stage. Los archivos cargados en los últimos 64 días se rastrean y **no se vuelven a cargar** por defecto. Para forzar una recarga, usa `FORCE = TRUE`.

---

## Opciones de Manejo de Errores

El parámetro `ON_ERROR` controla cómo COPY INTO maneja los errores:

| Opción | Comportamiento | Caso de Uso |
|---|---|---|
| `CONTINUE` | Omite filas incorrectas, carga filas correctas | Carga tolerante a errores |
| `SKIP_FILE` | Omite el archivo completo con errores | Puerta de calidad a nivel de archivo |
| `SKIP_FILE_<n>` | Omite el archivo si ocurren más de n errores | Umbral basado en cantidad |
| `SKIP_FILE_<n>%` | Omite el archivo si la tasa de error supera el n% | Umbral basado en porcentaje |
| `ABORT_STATEMENT` | Aborta todo el COPY al primer error (predeterminado) | Validación estricta |

```sql
-- Continuar cargando, omitir filas incorrectas
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
ON_ERROR = 'CONTINUE';

-- Omitir archivo si hay más de 5 errores
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
ON_ERROR = 'SKIP_FILE_5';

-- Omitir archivo si hay más del 10% de errores
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
ON_ERROR = 'SKIP_FILE_10%';

-- Verificar qué fue rechazado
SELECT *
FROM TABLE(VALIDATE(orders, JOB_ID => '<copy_job_id>'));
```

### Validar Antes de Cargar

```sql
-- Validar sin cargar realmente (ejecución en seco)
COPY INTO orders
FROM @my_stage
FILE_FORMAT = (FORMAT_NAME = csv_format)
VALIDATION_MODE = 'RETURN_ERRORS';  -- devuelve solo filas con errores

-- O validar todas las filas
COPY INTO orders
FROM @my_stage
VALIDATION_MODE = 'RETURN_ALL_ERRORS';
```

---

## Carga de Datos Semi-Estructurados

### Carga de JSON

```sql
-- Cargar JSON en una columna VARIANT
CREATE TABLE raw_events (v VARIANT);

COPY INTO raw_events
FROM @json_stage
FILE_FORMAT = (TYPE = JSON STRIP_OUTER_ARRAY = TRUE);

-- Consultar JSON anidado
SELECT
    v:event_type::STRING AS tipo_evento,
    v:user.id::NUMBER AS id_usuario,
    v:user.name::STRING AS nombre_usuario,
    v:properties:page_url::STRING AS url_pagina
FROM raw_events;

-- Aplanar (*flatten*) arreglos
SELECT
    v:order_id::NUMBER AS id_pedido,
    item.value:product_id::NUMBER AS id_producto,
    item.value:quantity::NUMBER AS cantidad
FROM raw_events,
LATERAL FLATTEN(INPUT => v:items) item;
```

---

## Descarga de Datos con COPY INTO (Hacia un Stage)

`COPY INTO @stage` exporta datos de Snowflake a archivos:

```sql
-- Descargar a un stage interno
COPY INTO @my_stage/exports/orders_export
FROM orders
FILE_FORMAT = (TYPE = CSV HEADER = TRUE)
SINGLE = FALSE         -- múltiples archivos (exportación paralela)
MAX_FILE_SIZE = 500000000;  -- 500 MB por archivo

-- Descargar a un stage S3 externo
COPY INTO @s3_export_stage/orders/
FROM (SELECT * FROM orders WHERE order_date = CURRENT_DATE)
FILE_FORMAT = (TYPE = PARQUET)
HEADER = TRUE;

-- Descargar como CSV comprimido con gzip
COPY INTO @my_stage/compressed_export
FROM orders
FILE_FORMAT = (TYPE = CSV COMPRESSION = GZIP HEADER = TRUE);
```

### Mejores Prácticas para la Descarga

| Configuración | Recomendación |
|---|---|
| `SINGLE = FALSE` | Usar múltiples archivos para exportaciones grandes (paralelo) |
| `MAX_FILE_SIZE` | Mantener archivos entre 100–500 MB para compatibilidad con sistemas destino |
| Compresión | Usar GZIP o SNAPPY para reducir costos de transferencia |
| Nomenclatura de archivos | Usar `INCLUDE_QUERY_ID = TRUE` para nombres de archivo únicos |

---

## Preguntas de Práctica

**P1.** Se ejecuta un comando COPY INTO y algunas filas tienen tipos de datos inválidos. ¿Qué opción `ON_ERROR` carga todas las filas válidas mientras omite solo las filas incorrectas?

- A) `ABORT_STATEMENT`
- B) `SKIP_FILE`
- C) `CONTINUE` ✅
- D) `RETURN_ERRORS`

**P2.** Snowflake rastrea el historial de carga de COPY INTO durante cuántos días por stage para evitar cargas duplicadas?

- A) 7 días
- B) 30 días
- C) 64 días ✅
- D) 90 días

**P3.** ¿Qué parámetro de COPY INTO permite validar el contenido de los archivos sin cargar ningún dato?

- A) `ON_ERROR = CONTINUE`
- B) `VALIDATION_MODE = 'RETURN_ERRORS'` ✅
- C) `FORCE = TRUE`
- D) `PURGE = TRUE`

**P4.** Un stage externo usa una `STORAGE_INTEGRATION` en lugar de credenciales. ¿Cuál es el principal beneficio de seguridad?

- A) Los datos se cifran automáticamente
- B) No se almacenan credenciales de nube en Snowflake ✅
- C) El stage solo puede ser usado por SYSADMIN
- D) Los archivos se eliminan automáticamente después de la carga

**P5.** ¿Qué sintaxis especial de stage se refiere al stage auto-aprovisionado de una tabla?

- A) `@~`
- B) `@nombre_stage`
- C) `@%nombre_tabla` ✅
- D) `@$nombre_tabla`

**P6.** Al descargar con `SINGLE = FALSE` (predeterminado), ¿qué ventaja proporciona esto?

- A) Los archivos se cifran automáticamente
- B) La exportación se ejecuta en paralelo en los nodos del warehouse ✅
- C) Los archivos se comprimen automáticamente
- D) Solo se puede usar un formato de archivo

---

> [!SUCCESS]
> **Puntos Clave para el Día del Examen:**
> 1. Flujo de carga: **Archivos → Stage → COPY INTO → Tabla**
> 2. Stages internos: `@~` (usuario), `@%tabla` (tabla), `@nombre` (con nombre)
> 3. `ON_ERROR = CONTINUE` = omitir filas incorrectas | `ABORT_STATEMENT` = fallar al primer error (predeterminado)
> 4. Historial de COPY rastreado durante **64 días** por stage (evita cargas duplicadas)
> 5. `VALIDATION_MODE` = ejecución en seco para verificar errores sin cargar
> 6. Integraciones de Almacenamiento = autenticación por rol IAM; **sin credenciales en Snowflake**
