---
title: "RDD Transformations"
description: "Master RDD transformations including map, filter, flatMap, distinct, groupByKey, and reduceByKey with Python examples"
order: 5
duration: "30-40 minutes"
difficulty: "beginner"
---

# RDD Transformations

Transformations create new RDDs from existing ones. They are **lazy** — Spark records the operation but does not execute it until an action triggers computation. This enables the Catalyst optimizer (for DataFrames) and DAG scheduler to build efficient execution plans.

## Types of Transformations

| Type | Behavior | Examples |
|---|---|---|
| **Narrow** | Each input partition contributes to at most one output partition | `map`, `filter`, `flatMap` |
| **Wide (Shuffle)** | Multiple input partitions contribute to output partitions | `reduceByKey`, `groupByKey`, `distinct` |

> [!NOTE]
> Narrow transformations are pipelined and execute within a single stage. Wide transformations cause a shuffle and create a new stage boundary.

## Map Transformation

Applies a function to every element and returns one output element per input.

```python
rdd = sc.parallelize([1, 2, 3, 4, 5])

# Square each number
squared = rdd.map(lambda x: x ** 2)
print(squared.collect())  # [1, 4, 9, 16, 25]

# Parse CSV-like lines
lines = sc.parallelize(["Alice,34,Engineer", "Bob,28,Designer"])
parsed = lines.map(lambda line: line.split(","))
print(parsed.collect())
# [['Alice', '34', 'Engineer'], ['Bob', '28', 'Designer']]

# Convert types
typed = parsed.map(lambda fields: (fields[0], int(fields[1]), fields[2]))
print(typed.collect())
# [('Alice', 34, 'Engineer'), ('Bob', 28, 'Designer')]
```

## Filter Transformation

Keeps elements that satisfy a predicate function.

```python
rdd = sc.parallelize(range(1, 21))

# Keep even numbers
evens = rdd.filter(lambda x: x % 2 == 0)
print(evens.collect())
# [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

# Filter log lines
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
> Filter is a narrow transformation and very efficient. It never causes a shuffle.

## FlatMap Transformation

Applies a function that returns multiple elements (or zero) for each input. The results are flattened into a single RDD.

```python
# Tokenize sentences into words
sentences = sc.parallelize([
    "hello world",
    "spark is awesome",
    "big data processing"
])
words = sentences.flatMap(lambda sentence: sentence.split(" "))
print(words.collect())
# ['hello', 'world', 'spark', 'is', 'awesome', 'big', 'data', 'processing']

# Extract all characters
chars = sentences.flatMap(lambda s: list(s))
print(chars.take(10))
# ['h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l']

# Return multiple records per input
def expand_number(n):
    """Return n copies of the number as a list."""
    return [n] * n

rdd = sc.parallelize([1, 2, 3])
expanded = rdd.flatMap(expand_number)
print(expanded.collect())  # [1, 2, 2, 3, 3, 3]
```

### map vs flatMap

| Aspect | map | flatMap |
|---|---|---|
| **Output per input** | Exactly one | Zero or more |
| **Result type** | RDD of same length | RDD may differ in size |
| **Use case** | Transform every element | Split/expand elements |
| **Example** | Parse each line | Tokenize into words |

## Distinct

Removes duplicate elements. This causes a **shuffle** because duplicates may be on different partitions.

```python
rdd = sc.parallelize([1, 1, 2, 2, 3, 3, 4, 4, 5])
unique = rdd.distinct()
print(sorted(unique.collect()))  # [1, 2, 3, 4, 5]

# Count distinct values
print(rdd.distinct().count())

# On key-value RDDs — distinct considers the entire tuple
kv_rdd = sc.parallelize([("a", 1), ("a", 1), ("b", 2)])
print(kv_rdd.distinct().collect())
# [('a', 1), ('b', 2)]
```

> [!WARNING]
> `distinct()` is expensive because it requires a full shuffle. For large datasets, consider alternative approaches like reducing precision or using approximate algorithms.

## groupByKey

Groups all values for each key into a single iterable. This is a **wide transformation** that causes a shuffle.

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
> `groupByKey` sends all values for each key to a single partition. If one key has millions of values, the executor's memory may be overwhelmed. Prefer `reduceByKey` or `aggregateByKey` when possible.

## reduceByKey

Combines values for each key using an associative reduce function. Unlike `groupByKey`, it performs a **map-side combine** to reduce data before the shuffle.

```python
pairs = sc.parallelize([
    ("a", 1), ("b", 1), ("a", 2),
    ("b", 3), ("a", 4), ("c", 1)
])

# Sum values by key
summed = pairs.reduceByKey(lambda a, b: a + b)
print(summed.collect())
# [('a', 7), ('b', 4), ('c', 1)]

# Word count example
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

| Aspect | groupByKey | reduceByKey |
|---|---|---|
| **Map-side combine** | No | Yes |
| **Shuffle data size** | All values | Reduced values |
| **Memory risk** | High (large value lists) | Low |
| **Performance** | Slower | Faster |
| **When to use** | Need all values per key | Need aggregated values |

> [!SUCCESS]
> The Word Count example above demonstrates the classic Spark pattern: flatMap to tokenize, map to create key-value pairs, then reduceByKey for aggregation. This pattern appears in countless real applications.

## Other Important Transformations

```python
# sortByKey — sort by key (requires a shuffle)
pairs = sc.parallelize([("b", 2), ("a", 1), ("c", 3)])
sorted_rdd = pairs.sortByKey()
print(sorted_rdd.collect())  # [('a', 1), ('b', 2), ('c', 3)]

# sortBy — sort by any function
rdd = sc.parallelize([3, 1, 4, 1, 5, 9, 2])
sorted_rdd = rdd.sortBy(lambda x: x)
print(sorted_rdd.collect())  # [1, 1, 2, 3, 4, 5, 9]

# sample — random sampling
rdd = sc.parallelize(range(1, 101))
sampled = rdd.sample(withReplacement=False, fraction=0.1)
print(sampled.collect())

# union — combine two RDDs
rdd1 = sc.parallelize([1, 2, 3])
rdd2 = sc.parallelize([3, 4, 5])
union_rdd = rdd1.union(rdd2)
print(union_rdd.collect())  # [1, 2, 3, 3, 4, 5]

# intersection — common elements
intersection_rdd = rdd1.intersection(rdd2)
print(intersection_rdd.collect())  # [3]

# subtract — elements in first but not second
sub_rdd = rdd1.subtract(rdd2)
print(sub_rdd.collect())  # [1, 2]

# cartesian — all pairs (dangerous for large data!)
cart = rdd1.cartesian(rdd2)
print(cart.collect())
# [(1,3), (1,4), (1,5), (2,3), (2,4), (2,5), (3,3), (3,4), (3,5)]
```

## Practice Questions

1. What is the difference between narrow and wide transformations? Give two examples of each.
2. Why is `reduceByKey` generally preferred over `groupByKey`?
3. How does `flatMap` differ from `map`? Provide a use case for each.
4. What happens to duplicate elements when calling `distinct()`?
5. Explain why `filter` is efficient but `distinct` is not.
6. How would you implement a word count using `map` and `reduceByKey`?
7. What is a map-side combine and why does it reduce shuffle data?
8. What does `rdd.sample(withReplacement=True, fraction=0.5)` do?
9. Why is `cartesian` dangerous on large datasets?
10. How does Spark pipeline narrow transformations within a single stage?
