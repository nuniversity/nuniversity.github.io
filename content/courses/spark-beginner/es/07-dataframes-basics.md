---
title: "Fundamentos de DataFrames"
description: "Crea DataFrames a partir de RDDs, archivos CSV y JSON; comprende la inferencia de esquema vs definición explícita de esquema"
order: 7
duration: "30-40 minutos"
difficulty: "principiante"
---

# Fundamentos de DataFrames

Los DataFrames son la API de alto nivel principal en Spark moderno. Organizan datos en columnas con nombre, similar a una tabla en una base de datos relacional o un DataFrame en la biblioteca pandas de Python. Los DataFrames proporcionan mejor rendimiento que los RDDs gracias al optimizador Catalyst y al motor de ejecución Tungsten.

## DataFrame vs RDD

| Aspecto | RDD | DataFrame |
|---|---|---|
| **Nivel de API** | Bajo nivel | Alto nivel |
| **Esquema** | Sin esquema (objetos brutos) | Columnas con nombre y tipos |
| **Optimización** | Optimización manual | Optimizador Catalyst |
| **Serialización** | Serialización Java/Python | Tungsten (formato binario) |
| **Rendimiento** | Más lento | 5-10x más rápido |
| **Soporte SQL** | No | Sí (Spark SQL) |
| **Caso de uso** | Datos no estructurados, lógica personalizada | Datos estructurados/semiestructurados |

> [!NOTE]
> En Spark 3.x, DataFrames son la API recomendada para la mayoría de los casos de uso. Ofrecen mejor rendimiento, optimizaciones más ricas y una interfaz más amigable.

## Creando DataFrames

### Desde una SparkSession

```python
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

spark = SparkSession.builder \
    .appName("DataFrameBasics") \
    .master("local[*]") \
    .getOrCreate()
```

### Desde una Lista de Rows

```python
from pyspark.sql import Row

data = [
    Row(name="Alice", age=34, dept="Engineering"),
    Row(name="Bob", age=28, dept="Design"),
    Row(name="Charlie", age=41, dept="Engineering"),
    Row(name="Diana", age=25, dept="Marketing")
]

df = spark.createDataFrame(data)
df.show()
# +-------+---+-----------+
# |   name|age|       dept|
# +-------+---+-----------+
# |  Alice| 34|Engineering|
# |    Bob| 28|     Design|
# |Charlie| 41|Engineering|
# |  Diana| 25|  Marketing|
# +-------+---+-----------+
```

### Desde una Lista de Diccionarios Python

```python
data = [
    {"name": "Alice", "age": 34, "dept": "Engineering"},
    {"name": "Bob", "age": 28, "dept": "Design"}
]

df = spark.createDataFrame(data)
df.printSchema()
# root
#  |-- name: string (nullable = true)
#  |-- age: long (nullable = true)
#  |-- dept: string (nullable = true)
```

### Desde un RDD

```python
rdd = sc.parallelize([
    ("Alice", 34, "Engineering"),
    ("Bob", 28, "Design"),
    ("Charlie", 41, "Engineering")
])

# Inferir nombres y tipos de columnas
df = rdd.toDF(["name", "age", "dept"])
df.show()
```

> [!SUCCESS]
> El método `toDF()` en RDDs es el puente más simple entre las APIs RDD y DataFrame. El esquema se infiere a partir de los tipos de la primera fila.

### Desde Archivos CSV

```python
# Inferencia de esquema (Spark lee las primeras filas para inferir tipos)
df = spark.read.csv("data/people.csv", header=True, inferSchema=True)
df.show()
df.printSchema()

# Sin encabezado — Spark asigna nombres _c0, _c1, ...
df_no_header = spark.read.csv("data/people.csv", inferSchema=True)
df_no_header.show()
```

| Opción CSV | Predeterminado | Descripción |
|---|---|---|
| `header` | `false` | Primera línea son nombres de columnas |
| `inferSchema` | `false` | Inferir tipos de columna desde datos |
| `sep` | `,` | Delimitador de campo |
| `quote` | `"` | Carácter de cita |
| `escape` | `\` | Carácter de escape |
| `mode` | `PERMISSIVE` | Modo de análisis (PERMISSIVE, DROPMALFORMED, FAILFAST) |
| `nullValue` | `""` | Qué string representa nulo |
| `dateFormat` | `yyyy-MM-dd` | String de formato de fecha |

```python
# Opciones CSV explícitas
df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("sep", "|") \
    .option("nullValue", "NA") \
    .csv("data/pipe_delimited.txt")
```

### Desde Archivos JSON

```python
# JSON (cada línea es un objeto JSON)
df = spark.read.json("data/people.json")
df.show()
df.printSchema()

# JSON multi-línea (pretty-printed)
df = spark.read \
    .option("multiLine", "true") \
    .json("data/people_pretty.json")
```

> [!NOTE]
> Spark espera archivos JSON en formato "JSON Lines" donde cada línea es un objeto JSON separado. Para JSON pretty-printed (múltiples líneas por objeto), use `multiLine=true`.

## Inferencia de Esquema vs Esquema Explícito

### Inferencia de Esquema

Spark lee una muestra de los datos para determinar nombres y tipos de columnas.

```python
df_inferred = spark.read \
    .option("inferSchema", "true") \
    .option("samplingRatio", "0.1") \
    .csv("data/large_file.csv")
```

**Ventajas**: Rápido, sin mantenimiento de código, bueno para exploración
**Desventajas**:
- Pasada extra sobre los datos (hasta 10% más tiempo)
- Puede inferir tipos incorrectos (string en lugar de int si las primeras 1000 filas son nulas)
- Sobrecarga de rendimiento

> [!WARNING]
> La inferencia de esquema lee una muestra de los datos para determinar tipos. Si la muestra no es representativa (por ejemplo, todos los valores nulos en las primeras filas), obtiene tipos incorrectos. Siempre verifique esquemas inferidos en datos de producción.

### Esquema Explícito

Defina el esquema programáticamente para control total y mejor rendimiento.

```python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType

schema = StructType([
    StructField("name", StringType(), nullable=False),
    StructField("age", IntegerType(), nullable=True),
    StructField("salary", DoubleType(), nullable=True),
    StructField("dept", StringType(), nullable=False)
])

df = spark.read \
    .schema(schema) \
    .csv("data/people.csv")
print(df.printSchema())
```

**Ventajas**:
- Sin pasada extra para muestreo
- Seguridad de tipos — sin cambios sorpresa de tipo
- Mejor rendimiento (sin sobrecarga de inferencia)

**Desventajas**:
- Más código para escribir
- El esquema debe coincidir exactamente con los datos

### Sintaxis de String DDL

Spark soporta strings DDL para definiciones compactas de esquema.

```python
ddl_schema = "name STRING, age INT, salary DOUBLE, dept STRING"

df = spark.read \
    .schema(ddl_schema) \
    .csv("data/people.csv")
```

## Explorando el Esquema del DataFrame

```python
# Imprimir árbol del esquema
df.printSchema()

# Obtener esquema como objeto StructType
schema = df.schema
print(schema)

# Obtener nombres de columnas
print(df.columns)  # ['name', 'age', 'dept']

# Obtener tipos de datos
for field in df.schema.fields:
    print(f"{field.name}: {field.dataType}")
```

## Tipos de Datos en Spark

| DataType | Descripción | Ejemplo |
|---|---|---|
| `StringType` | Strings de texto | `"hello"` |
| `IntegerType` | Entero de 4 bytes | `42` |
| `LongType` | Entero de 8 bytes | `10000000000L` |
| `FloatType` | Float de 4 bytes | `3.14f` |
| `DoubleType` | Float de 8 bytes | `3.14159265` |
| `BooleanType` | Verdadero/Falso | `True` |
| `DateType` | Solo fecha | `2024-01-15` |
| `TimestampType` | Fecha y hora | `2024-01-15 14:30:00` |
| `ArrayType` | Lista de elementos | `[1, 2, 3]` |
| `MapType` | Pares clave-valor | `{"a": 1}` |
| `StructType` | Estructura anidada | `(a: 1, b: "x")` |

## Manejando Valores Nulos

```python
# Crear DataFrame con nulos
data = [
    (1, "Alice", None),
    (2, None, 50000.0),
    (3, "Bob", 60000.0)
]
df = spark.createDataFrame(data, ["id", "name", "salary"])

# Eliminar filas con cualquier nulo
df.dropna().show()

# Eliminar filas donde columnas específicas son nulas
df.dropna(subset=["name", "salary"]).show()

# Rellenar nulos con un valor
df.fillna({"name": "Unknown", "salary": 0.0}).show()
```

## Conclusiones Clave

1. Los DataFrames son la API Spark recomendada para datos estructurados
2. Cree DataFrames desde RDDs, CSV, JSON, colecciones Python y bases de datos
3. La inferencia de esquema es conveniente pero peligrosa para producción
4. Los esquemas explícitos proporcionan seguridad de tipos y mejor rendimiento
5. Las strings DDL ofrecen definiciones compactas de esquema
6. Las funciones de manejo de nulos (`dropna`, `fillna`) gestionan datos faltantes

## Preguntas de Práctica

1. ¿Qué ventajas tienen los DataFrames sobre los RDDs?
2. ¿Cómo mejora el optimizador Catalyst el rendimiento del DataFrame?
3. ¿Cuál es la diferencia entre `toDF()` y `createDataFrame()`?
4. ¿Por qué la inferencia de esquema es potencialmente peligrosa para pipelines de producción?
5. ¿Cómo se define un esquema con una string DDL?
6. ¿Qué opciones CSV controlan el encabezado y el manejo del delimitador?
7. ¿Cuándo usaría `multiLine=true` para archivos JSON?
8. ¿Qué es el formato "JSON Lines" y por qué Spark lo prefiere?
9. ¿Cómo se verifica el esquema de un DataFrame existente?
10. ¿Qué sucede si establece `inferSchema=false` sin proporcionar un esquema?
