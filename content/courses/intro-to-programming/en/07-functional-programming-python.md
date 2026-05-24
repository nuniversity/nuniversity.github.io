---
title: "Introduction to Functional Programming with Python"
description: "Explore the functional paradigm using Python: pure functions, map/filter/reduce, and list comprehensions"
order: 7
duration: "35 minutes"
difficulty: "intermediate"
---

# Introduction to Functional Programming with Python

So far you have written imperative code — step-by-step instructions that change state. Functional programming is a different paradigm: it emphasizes pure functions, immutability, and transforming data through pipelines.

## What is Functional Programming?

Functional programming treats computation as the evaluation of mathematical functions. Key principles:

- **Pure functions**: Same input always produces the same output, no side effects
- **Immutability**: Data is never modified — instead, new data is created
- **Function composition**: Build complex operations by combining simple functions

## Pure Functions

A pure function depends only on its inputs and has no side effects:

```python
# Pure: same input always gives the same output
def add(a, b):
    return a + b

# Impure: depends on external state
total = 0
def add_to_total(x):
    global total
    total += x     # side effect — modifies external variable
    return total
```

Pure functions are easier to test, debug, and reason about.

## Map, Filter, and Reduce

These three functions are the cornerstone of functional data processing.

### map

Apply a function to every element in a sequence:

```python
numbers = [1, 2, 3, 4, 5]

def square(x):
    return x * x

squared = list(map(square, numbers))
print(squared)  # [1, 4, 9, 16, 25]
```

### filter

Keep only elements that satisfy a condition:

```python
def is_even(x):
    return x % 2 == 0

evens = list(filter(is_even, numbers))
print(evens)  # [2, 4]
```

### reduce

Combine all elements into a single value:

```python
from functools import reduce

def multiply(x, y):
    return x * y

product = reduce(multiply, numbers)
print(product)  # 120  (1 * 2 * 3 * 4 * 5)
```

> [!NOTE]
> Python's `reduce` is in the `functools` module. `map` and `filter` are built-in.

## Lambda Functions

Lambdas are anonymous one-line functions, perfect for simple operations:

```python
numbers = [1, 2, 3, 4, 5]

squared = list(map(lambda x: x * x, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

print(squared)  # [1, 4, 9, 16, 25]
print(evens)    # [2, 4]
```

## List Comprehensions

Python offers a more readable alternative to `map` and `filter`:

```python
numbers = [1, 2, 3, 4, 5]

# Map equivalent
squared = [x * x for x in numbers]
print(squared)  # [1, 4, 9, 16, 25]

# Filter equivalent
evens = [x for x in numbers if x % 2 == 0]
print(evens)    # [2, 4]

# Combined
even_squares = [x * x for x in numbers if x % 2 == 0]
print(even_squares)  # [4, 16]
```

## Immutability

In functional programming, you avoid changing data in place:

```python
# Imperative (mutates)
def add_to_list(item, items):
    items.append(item)
    return items

# Functional (creates new list)
def add_to_list_pure(item, items):
    return items + [item]

original = [1, 2, 3]
new_list = add_to_list_pure(4, original)
print(original)  # [1, 2, 3]  — unchanged
print(new_list)  # [1, 2, 3, 4]
```

## Practice Exercise

Use functional techniques to process a list of temperatures in Celsius:

```python
celsius = [0, 10, 20, 30, 40]

# Convert to Fahrenheit using map + lambda
fahrenheit = list(map(lambda c: (c * 9/5) + 32, celsius))
print("Fahrenheit:", fahrenheit)

# Filter only "hot" temperatures (above 80F)
hot = list(filter(lambda f: f > 80, fahrenheit))
print("Hot days:", hot)

# Using list comprehensions
fahrenheit2 = [(c * 9/5) + 32 for c in celsius]
hot2 = [f for f in fahrenheit2 if f > 80]
print("Comprehensions:", fahrenheit2, hot2)
```

## Summary

| Concept | Python Tool | Example |
|---------|-------------|---------|
| Pure function | No side effects | `def add(a, b): return a + b` |
| Map | `map(func, iterable)` | Apply function to each element |
| Filter | `filter(func, iterable)` | Keep matching elements |
| Reduce | `reduce(func, iterable)` | Combine into one value |
| Lambda | `lambda x: expr` | Inline anonymous function |
| Comprehension | `[expr for x in list]` | Readable map/filter alternative |

## Next Steps

JavaScript and Python are interpreted languages. The next lesson explores compiled languages using Rust, where code is translated to machine code before execution.
