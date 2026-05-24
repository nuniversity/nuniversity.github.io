---
title: "Transformaciones RDD"
description: "Domina transformaciones RDD incluyendo map, filter, flatMap, distinct, groupByKey y reduceByKey con ejemplos Python"
order: 5
duration: "30-40 minutos"
difficulty: "principiante"
---

# Transformaciones RDD

Las transformaciones crean nuevos RDDs a partir de existentes. Son **perezosas** — Spark registra la operación pero no la ejecuta hasta que una acción desencadena el cálculo. Esto permite que el optimizador Catalyst (para DataFrames) y el programador DAG construyan planes de ejecución eficientes.

## Tipos de Transformaciones

| Tipo | Comportamiento | Ejemplos |
|---|---|---|
| **Estrecha** | Cada partición de entrada contribuye a como máximo una partición de salida | `map`, `filter`, `flatMap` |
| **Amplia (Shuffle)** | Múltiples particiones de entrada contribuyen a particiones de salida | `reduceByKey`, `groupByKey`, `distinct` |

> [!NOTE]
> Las transformaciones estrechas se canalizan y ejecutan dentro de una sola etapa. Las transformaciones amplias causan un shuffle y crean un límite de nueva etapa.

## Transformación Map

Aplica una función a cada elemento y devuelve un elemento de salida por entrada.

```python
rdd = sc.parallelize([1, 2, 3, 4, 5])

# Elevar cada número al cuadrado
squared = rdd.map(lambda x: x ** 2)
print(squared.collect())  # [1, 4, 9, 16, 25]

# Analizar líneas tipo CSV
lines = sc.parallelize(["Alice,34,Engineer", "Bob,28,Designer"])
parsed = lines.map(lambda line: line.split(","))
print(parsed.collect())
# [['Alice', '34', 'Engineer'], ['Bob', '28', 'Designer']]

# Convertir tipos
typed = parsed.map(lambda fields: (fields[0], int(fields[1]), fields[2]))
print(typed.collect())
# [('Alice', 34, 'Engineer'), ('Bob', 28, 'Designer')]
```

## Transformación Filter

Mantiene elementos que satisfacen una función predicado.

```python
rdd = sc.parallelize(range(1, 21))

# Mantener números pares
evens = rdd.filter(lambda x: x % 2 == 0)
print(evens.collect())
# [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

# Filtrar líneas de log
logs = sc.parallelize([
    "INFO: Server started",
    "ERROR: Connection refused",
    "WARN: Disk space low",
    "ERROR: Timeout exceeded"
])
errors = logs.filter(lambda line: line.startswith("ERROR"))
print(errors.collect())
# ['ERROR: Connection refused', 'ERROR: Timeout exceeded']
```

> [!SUCCESS]
> Filter es una transformación estrecha y muy eficiente. Nunca causa un shuffle.

## Transformación FlatMap

Aplica una función que devuelve múltiples elementos (o cero) para cada entrada. Los resultados se aplanan en un único RDD.

```python
# Tokenizar frases en palabras
sentences = sc.parallelize([
    "hello world",
    "spark is awesome",
    "big data processing"
])
words = sentences.flatMap(lambda sentence: sentence.split(" "))
print(words.collect())
# ['hello', 'world', 'spark', 'is', 'awesome', 'big', 'data', 'processing']

# Extraer todos los caracteres
chars = sentences.flatMap(lambda s: list(s))
print(chars.take(10))
# ['h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l']

# Devolver múltiples registros por entrada
def expand_number(n):
    """Devolver n copias del número como una lista."""
    return [n] * n

rdd = sc.parallelize([1, 2, 3])
expanded = rdd.flatMap(expand_number)
print(expanded.collect())  # [1, 2, 2, 3, 3, 3]
```

### map vs flatMap

| Aspecto | map | flatMap |
|---|---|---|
| **Salida por entrada** | Exactamente uno | Cero o más |
| **Tipo de resultado** | RDD del mismo tamaño | RDD puede diferir en tamaño |
| **Caso de uso** | Transformar cada elemento | Dividir/expandir elementos |
| **Ejemplo** | Analizar cada línea | Tokenizar en palabras |

## Distinct

Elimina elementos duplicados. Esto causa un **shuffle** porque los duplicados pueden estar en diferentes particiones.

```python
rdd = sc.parallelize([1, 1, 2, 2, 3, 3, 4, 4, 5])
unique = rdd.distinct()
print(sorted(unique.collect()))  # [1, 2, 3, 4, 5]

# Contar valores distintos
print(rdd.distinct().count())

# En RDDs clave-valor — distinct considera la tupla completa
kv_rdd = sc.parallelize([("a", 1), ("a", 1), ("b", 2)])
print(kv_rdd.distinct().collect())
# [('a', 1), ('b', 2)]
```

> [!WARNING]
> `distinct()` es costoso porque requiere un shuffle completo. Para grandes conjuntos de datos, considere enfoques alternativos como reducir precisión o usar algoritmos aproximados.

## groupByKey

Agrupa todos los valores para cada clave en un único iterable. Esta es una **transformación amplia** que causa un shuffle.

```python
pairs = sc.parallelize([
    ("fruit", "apple"), ("fruit", "banana"),
    ("veggie", "carrot"), ("fruit", "orange"),
    ("veggie", "broccoli")
])

grouped = pairs.groupByKey()
result = grouped.mapValues(list).collect()
print(dict(result))
# {'fruit': ['apple', 'banana', 'orange'], 'veggie': ['carrot', 'broccoli']}
```

> [!WARNING]
> `groupByKey` envía todos los valores para cada clave a una sola partición. Si una clave tiene millones de valores, la memoria del ejecutor puede desbordarse. Prefiera `reduceByKey` o `aggregateByKey` cuando sea posible.

## reduceByKey

Combina valores para cada clave usando una función de reducción asociativa. A diferencia de `groupByKey`, realiza una **combinación en el lado del map** para reducir datos antes del shuffle.

```python
pairs = sc.parallelize([
    ("a", 1), ("b", 1), ("a", 2),
    ("b", 3), ("a", 4), ("c", 1)
])

# Sumar valores por clave
summed = pairs.reduceByKey(lambda a, b: a + b)
print(summed.collect())
# [('a', 7), ('b', 4), ('c', 1)]

# Ejemplo de conteo de palabras
text = sc.parallelize([
    "hello world hello",
    "world spark hello",
    "spark is awesome"
])
word_counts = text \
    .flatMap(lambda line: line.split(" ")) \
    .map(lambda word: (word, 1)) \
    .reduceByKey(lambda a, b: a + b)
print(dict(word_counts.collect()))
# {'hello': 3, 'world': 2, 'spark': 2, 'is': 1, 'awesome': 1}
```

### groupByKey vs reduceByKey

| Aspecto | groupByKey | reduceByKey |
|---|---|---|
| **Combinación en lado del map** | No | Sí |
| **Tamaño de datos del shuffle** | Todos los valores | Valores reducidos |
| **Riesgo de memoria** | Alto (grandes listas de valores) | Bajo |
| **Rendimiento** | Más lento | Más rápido |
| **Cuándo usar** | Necesitar todos los valores por clave | Necesitar valores agregados |

> [!SUCCESS]
> El ejemplo de Conteo de Palabras arriba demuestra el patrón clásico de Spark: flatMap para tokenizar, map para crear pares clave-valor, luego reduceByKey para agregación. Este patrón aparece en innumerables aplicaciones reales.

## Otras Transformaciones Importantes

```python
# sortByKey — ordenar por clave (requiere un shuffle)
pairs = sc.parallelize([("b", 2), ("a", 1), ("c", 3)])
sorted_rdd = pairs.sortByKey()
print(sorted_rdd.collect())  # [('a', 1), ('b', 2), ('c', 3)]

# sortBy — ordenar por cualquier función
rdd = sc.parallelize([3, 1, 4, 1, 5, 9, 2])
sorted_rdd = rdd.sortBy(lambda x: x)
print(sorted_rdd.collect())  # [1, 1, 2, 3, 4, 5, 9]

# sample — muestreo aleatorio
rdd = sc.parallelize(range(1, 101))
sampled = rdd.sample(withReplacement=False, fraction=0.1)
print(sampled.collect())

# union — combinar dos RDDs
rdd1 = sc.parallelize([1, 2, 3])
rdd2 = sc.parallelize([3, 4, 5])
union_rdd = rdd1.union(rdd2)
print(union_rdd.collect())  # [1, 2, 3, 3, 4, 5]

# intersection — elementos comunes
intersection_rdd = rdd1.intersection(rdd2)
print(intersection_rdd.collect())  # [3]

# subtract — elementos en el primero pero no en el segundo
sub_rdd = rdd1.subtract(rdd2)
print(sub_rdd.collect())  # [1, 2]

# cartesian — todos los pares (peligroso para datos grandes!)
cart = rdd1.cartesian(rdd2)
print(cart.collect())
# [(1,3), (1,4), (1,5), (2,3), (2,4), (2,5), (3,3), (3,4), (3,5)]
```

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre transformaciones estrechas y amplias? Dé dos ejemplos de cada.
2. ¿Por qué `reduceByKey` es generalmente preferido sobre `groupByKey`?
3. ¿Cómo difiere `flatMap` de `map`? Proporcione un caso de uso para cada.
4. ¿Qué sucede con los elementos duplicados al llamar `distinct()`?
5. Explique por qué `filter` es eficiente pero `distinct` no lo es.
6. ¿Cómo implementaría un conteo de palabras usando `map` y `reduceByKey`?
7. ¿Qué es una combinación en el lado del map y por qué reduce los datos del shuffle?
8. ¿Qué hace `rdd.sample(withReplacement=True, fraction=0.5)`?
9. ¿Por qué `cartesian` es peligroso en grandes conjuntos de datos?
10. ¿Cómo canaliza Spark las transformaciones estrechas dentro de una sola etapa?
