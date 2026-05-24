---
title: "Lists and Tuples"
description: "Learn Python's sequence types: list operations, tuple immutability, indexing, slicing, and common methods"
order: 7
duration: "30 minutes"
difficulty: "beginner"
---

# Lists and Tuples

Lists and tuples are Python's workhorse data structures for storing ordered collections of items.

## Lists (`list`)

Lists are **mutable** (can be changed) ordered sequences:

```python
# Creating lists
fruits = ["apple", "banana", "cherry"]
mixed = [1, "hello", 3.14, True]
empty = []
nested = [[1, 2], [3, 4]]
```

### Indexing

```python
fruits = ["apple", "banana", "cherry", "date"]
print(fruits[0])      # "apple" (first)
print(fruits[-1])     # "date" (last)
print(fruits[1:3])    # ["banana", "cherry"] (slicing)
```

### Modifying Lists

```python
fruits[1] = "blueberry"     # Change element
fruits.append("elderberry") # Add to end
fruits.insert(0, "avocado") # Insert at position
fruits.remove("cherry")     # Remove by value
popped = fruits.pop()       # Remove and return last
del fruits[0]               # Delete by index
```

### List Methods

```python
numbers = [3, 1, 4, 1, 5, 9, 2]
numbers.sort()              # [1, 1, 2, 3, 4, 5, 9]
numbers.reverse()           # [9, 5, 4, 3, 2, 1, 1]
print(len(numbers))         # 7
print(numbers.count(1))     # 2
print(3 in numbers)         # True
```

### List Operations

```python
# Concatenation
a = [1, 2] + [3, 4]        # [1, 2, 3, 4]

# Repetition
b = ["ha"] * 3             # ["ha", "ha", "ha"]

# List comprehension (advanced preview)
squares = [x**2 for x in range(5)]  # [0, 1, 4, 9, 16]
```

## Tuples (`tuple`)

Tuples are **immutable** (cannot change) ordered sequences:

```python
# Creating tuples
point = (3, 4)
colors = ("red", "green", "blue")
single = (1,)       # Trailing comma required!
empty = ()          # Empty tuple
```

### Accessing Tuple Elements
```python
point = (3, 4)
x = point[0]    # 3
y = point[1]    # 4
```

### Tuple Unpacking
```python
point = (3, 4)
x, y = point    # x=3, y=4

# Swap variables elegantly
a, b = 1, 2
a, b = b, a     # a=2, b=1
```

> [!NOTE]
> Tuples are faster than lists and protect data integrity. Use them for fixed data like coordinates, RGB colors, or function return values.

## When to Use Which

| Feature | List | Tuple |
|---------|------|-------|
| Mutable? | Yes | No |
| Syntax | `[1, 2, 3]` | `(1, 2, 3)` |
| Performance | Slower | Faster |
| Use case | Changing data | Fixed data |
| Methods | Many (`append`, `sort`, etc.) | Few (`count`, `index`) |

## Real-World Examples

### Shopping Cart (List — changes often)
```python
cart = []
cart.append("laptop")
cart.append("mouse")
cart.append("keyboard")
total_items = len(cart)
print(f"Cart has {total_items} items")
```

### RGB Color (Tuple — fixed)
```python
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

def apply_color(pixel, color):
    r, g, b = color
    return (pixel[0] * r // 255, pixel[1] * g // 255, pixel[2] * b // 255)
```

### Student Grades
```python
grades = [85, 92, 78, 90, 88]
average = sum(grades) / len(grades)
print(f"Average: {average:.1f}")

max_grade = max(grades)
min_grade = min(grades)
print(f"Range: {min_grade} - {max_grade}")
```

> [!SUCCESS]
> Lists are for collections that change. Tuples are for collections that don't. When in doubt, use lists.

## Practice Questions

1. Create a list of 5 favorite foods. Print the third item.
2. What's the difference between `list.append()` and `list.insert()`?
3. How do you get the last element of a list?
4. Why would you use a tuple instead of a list?
5. What does `[1, 2, 3] * 3` produce?
6. How do you create a tuple with one element?
7. Write code that swaps `a = 5` and `b = 10` using tuple unpacking.
8. What's the output of `[x*2 for x in range(4)]`?
9. How do you check if an item exists in a list?
10. What happens if you try `my_tuple[0] = 5`?
