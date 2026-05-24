---
title: "Acciones RDD"
description: "Aprende acciones RDD: collect, count, take, reduce, foreach y saveAsTextFile con ejemplos PySpark"
order: 6
duration: "30-40 minutos"
difficulty: "principiante"
---

# Acciones RDD

Las acciones desencadenan que Spark ejecute el DAG de transformaciones y devuelva un resultado al driver o escriba datos en almacenamiento. Sin acciones, las transformaciones nunca se calculan.

> [!NOTE]
> Cada acción hace que Spark re-evalúe todo el linaje desde los datos de origen. Use `cache()` o `persist()` para evitar recalcular RDDs intermedios al ejecutar múltiples acciones.

## collect()

Devuelve todos los elementos del RDD como una lista al driver.

```python
rdd = sc.parallelize(range(1, 11))
data = rdd.collect()
print(data)  # [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

> [!WARNING]
> `collect()` trae todos los datos al driver. Para RDDs grandes, esto puede causar errores de falta de memoria. Use `collect()` solo en conjuntos de datos pequeños o después de filtrar/agregar.

## count()

Devuelve el número de elementos en el RDD.

```python
rdd = sc.parallelize(range(1, 1001))
print(f"Conteo: {rdd.count()}")  # Conteo: 1000

# Contar con filtro
errors = sc.parallelize([
    "INFO: OK", "ERROR: Failed", "INFO: Done", "ERROR: Timeout"
])
error_count = errors.filter(lambda x: "ERROR" in x).count()
print(f"Errores: {error_count}")  # Errores: 2
```

## take(n)

Devuelve los primeros `n` elementos del RDD al driver. A diferencia de `collect()`, recupera solo un número limitado de elementos.

```python
rdd = sc.parallelize(range(1, 10001))

# Tomar primeros 5 elementos
print(rdd.take(5))   # [1, 2, 3, 4, 5]

# Tomar ordenado (usa más recursos)
print(rdd.takeOrdered(5))          # [1, 2, 3, 4, 5]
print(rdd.takeOrdered(5, key=lambda x: -x))  # [10000, 9999, 9998, 9997, 9996]

# Tomar muestra
print(rdd.takeSample(False, 3))    # 3 elementos aleatorios
```

> [!SUCCESS]
> Use `take(n)` para explorar datos en lugar de `collect()`. Es mucho más seguro y le da una muestra representativa para entender su estructura de datos.

## first()

Devuelve el primer elemento del RDD. Equivalente a `take(1)[0]`.

```python
rdd = sc.parallelize(["first", "second", "third"])
print(rdd.first())  # first
```

## reduce()

Agrega elementos usando una función asociativa y conmutativa.

```python
rdd = sc.parallelize(range(1, 11))

# Sumar todos los elementos
total = rdd.reduce(lambda a, b: a + b)
print(total)  # 55

# Encontrar máximo
max_val = rdd.reduce(lambda a, b: a if a > b else b)
print(max_val)  # 10

# Encontrar mínimo
min_val = rdd.reduce(lambda a, b: a if a < b else b)
print(min_val)  # 1
```

> [!NOTE]
> La función pasada a `reduce()` debe ser asociativa y conmutativa. Esto es necesario porque los datos se procesan en múltiples particiones en paralelo, y los resultados se combinan en orden arbitrario.

## fold()

Similar a `reduce()`, pero toma un valor cero para cada partición.

```python
rdd = sc.parallelize(range(1, 11))

# Sumar con valor cero 0
total = rdd.fold(0, lambda a, b: a + b)
print(total)  # 55

# Concatenar strings
words = sc.parallelize(["hello", " ", "world"])
result = words.fold("", lambda a, b: a + b)
print(result)  # hello world
```

> [!WARNING]
> El valor cero se aplica a cada partición, no solo una vez. Para suma, `0` funciona. Para multiplicación, use `1`. Un valor cero incorrecto producirá resultados erróneos.

## aggregate()

Proporciona control detallado sobre la agregación con funciones de combinación separadas a nivel de partición y global.

```python
rdd = sc.parallelize(range(1, 11))

# Computar (suma, conteo) en un solo pase
seq_op = lambda agg, x: (agg[0] + x, agg[1] + 1)
comb_op = lambda a, b: (a[0] + b[0], a[1] + b[1])
zero = (0, 0)

result = rdd.aggregate(zero, seq_op, comb_op)
print(f"Suma: {result[0]}, Conteo: {result[1]}, Media: {result[0]/result[1]}")
# Suma: 55, Conteo: 10, Media: 5.5
```

## foreach()

Aplica una función a cada elemento sin devolver nada al driver. Se usa para efectos secundarios como escribir en bases de datos.

```python
rdd = sc.parallelize([1, 2, 3, 4, 5])

# Imprimir cada elemento (la salida aparece en stdout de los ejecutores)
rdd.foreach(lambda x: print(f"Procesando: {x}"))

# Escribir cada elemento en una base de datos
def write_to_db(record):
    # database_connection.insert(record)
    pass

rdd.foreach(write_to_db)
```

> [!NOTE]
> `foreach()` se ejecuta en los ejecutores, por lo que la impresión va a los logs del ejecutor — no a su consola driver. Use `foreachPartition()` para una gestión de recursos más eficiente (una conexión por partición).

## foreachPartition()

Como `foreach()` pero opera en una partición completa a la vez. Útil para inicializar recursos costosos una vez por partición.

```python
def process_partition(iterator):
    # Abrir conexión de base de datos una vez por partición
    conn = create_connection()
    for record in iterator:
        conn.insert(record)
    conn.close()

rdd.foreachPartition(process_partition)
```

## saveAsTextFile()

Escribe el RDD como un archivo de texto (o archivos) en un directorio.

```python
rdd = sc.parallelize(["line1", "line2", "line3", "line4"])

# Guardar en sistema de archivos local
rdd.saveAsTextFile("output/text_data")

# Guardar en HDFS
rdd.saveAsTextFile("hdfs://namenode:9000/user/data/output/")

# Guardar con compresión
rdd.saveAsTextFile("output/compressed", compressionCodecClass="org.apache.hadoop.io.compress.GzipCodec")
```

> [!WARNING]
> `saveAsTextFile` crea un **directorio** que contiene múltiples archivos de parte (uno por partición). Esto es estándar para sistemas distribuidos pero puede ser inesperado si espera un solo archivo.

```
output/text_data/
  _SUCCESS
  part-00000
  part-00001
```

## Otras Acciones Útiles

```python
# countByKey — contar elementos por clave (devuelve dict)
pairs = sc.parallelize([("a", 1), ("b", 1), ("a", 1), ("c", 1)])
counts = pairs.countByKey()
print(dict(counts))  # {'a': 2, 'b': 1, 'c': 1}

# countByValue — contar ocurrencias de cada valor
rdd = sc.parallelize([1, 2, 1, 3, 2, 1, 4])
value_counts = rdd.countByValue()
print(dict(value_counts))  # {1: 3, 2: 2, 3: 1, 4: 1}

# isEmpty — verificar si RDD está vacío
rdd = sc.parallelize([])
print(rdd.isEmpty())   # True

# max / min
rdd = sc.parallelize([5, 2, 9, 1, 7])
print(rdd.max())  # 9
print(rdd.min())  # 1

# stdev / variance / mean (aproximado)
from pyspark.statcounter import StatCounter
rdd = sc.parallelize(range(1, 101))
stats = rdd.stats()
print(f"Media: {stats.mean()}, Desviación: {stats.stdev()}")

# histogram
rdd = sc.parallelize(range(1, 11))
buckets, counts = rdd.histogram(5)
print(f"Intervalos: {buckets}, Conteos: {counts}")
```

## Tabla Resumen de Acciones

| Acción | Devuelve | Datos en Driver | Cuándo Usar |
|---|---|---|---|
| `collect()` | Lista | Todos los datos | Solo resultados pequeños |
| `count()` | Int | Número único | Cualquier conjunto de datos |
| `take(n)` | Lista | n elementos | Exploración de datos |
| `first()` | Elemento | 1 elemento | Vistazo rápido |
| `reduce()` | Elemento | Valor único | Agregación |
| `fold()` | Elemento | Valor único | Agregación con cero |
| `aggregate()` | Elemento | Valor único | Agregación compleja |
| `foreach()` | Nada | Ninguno | Efectos secundarios |
| `saveAsTextFile()` | Nada | Ninguno | Persistir resultados |
| `countByKey()` | Dict | Dict de conteos | Frecuencia por clave |

## Preguntas de Práctica

1. ¿Por qué `collect()` arriesga errores de falta de memoria en grandes conjuntos de datos?
2. ¿Cuál es la diferencia entre `take(10)` y `collect()`?
3. ¿Qué restricciones debe satisfacer la función pasada a `reduce()`? ¿Por qué?
4. ¿Cómo difiere `fold()` de `reduce()`? ¿Cuándo usaría cada uno?
5. ¿Cuál es la ventaja de `aggregate()` sobre `fold()`?
6. ¿Por qué `saveAsTextFile` crea un directorio en lugar de un solo archivo?
7. ¿Cómo es `foreachPartition()` más eficiente que `foreach()`?
8. ¿Qué devuelve `takeOrdered(3, key=lambda x: -x)`?
9. ¿Por qué `countByValue()` puede ser costoso en grandes conjuntos de datos?
10. ¿Cuándo debería llamar `cache()` antes de ejecutar múltiples acciones en el mismo RDD?
