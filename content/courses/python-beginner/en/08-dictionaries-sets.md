---
title: "Dictionaries and Sets"
description: "Master key-value pairs with dictionaries and unordered unique collections with sets"
order: 8
duration: "30 minutes"
difficulty: "beginner"
---

# Dictionaries and Sets

Dictionaries store key-value pairs for fast lookups. Sets store unique elements for membership testing and mathematical operations.

## Dictionaries (`dict`)

Dictionaries map keys to values:

```python
# Creating dictionaries
student = {
    "name": "Alice",
    "age": 22,
    "major": "Computer Science",
    "gpa": 3.8
}

# Alternative constructor
student = dict(name="Alice", age=22, major="CS")
```

### Accessing Values

```python
print(student["name"])      # "Alice"
print(student.get("age"))   # 22
print(student.get("grade", "N/A"))  # "N/A" (safe access)
```

> [!WARNING]
> Accessing a missing key with `[]` raises a KeyError. Use `.get()` for safe access.

### Modifying Dictionaries

```python
student["gpa"] = 3.9       # Update value
student["year"] = 3        # Add new key-value
del student["age"]         # Remove key
popped = student.pop("major")  # Remove and return
```

### Dictionary Methods

```python
for key in student:
    print(key)

for value in student.values():
    print(value)

for key, value in student.items():
    print(f"{key}: {value}")

# Check key existence
if "name" in student:
    print("Name exists")
```

## Real-World Use: Word Counter

```python
text = "the quick brown fox jumps over the lazy dog"
word_count = {}

for word in text.split():
    if word in word_count:
        word_count[word] += 1
    else:
        word_count[word] = 1

print(word_count)
# {'the': 2, 'quick': 1, 'brown': 1, ...}
```

### Using defaultdict (simpler)

```python
from collections import defaultdict

word_count = defaultdict(int)
for word in text.split():
    word_count[word] += 1
```

## Sets (`set`)

Sets store **unique**, unordered elements:

```python
# Creating sets
fruits = {"apple", "banana", "cherry", "apple"}  # Duplicates removed
numbers = set([1, 2, 3, 3, 2, 1])  # {1, 2, 3}
empty = set()  # {} creates an empty dict, not set!
```

### Set Operations

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # Union: {1, 2, 3, 4, 5, 6}
print(a & b)   # Intersection: {3, 4}
print(a - b)   # Difference: {1, 2}
print(a ^ b)   # Symmetric difference: {1, 2, 5, 6}
```

### Set Methods

```python
a.add(7)         # Add element
a.remove(7)      # Remove (raises KeyError if missing)
a.discard(10)    # Remove (no error if missing)
print(3 in a)    # Membership test (very fast!)
```

> [!NOTE]
> Sets are optimized for membership testing (`in`) — O(1) average vs O(n) for lists. Use sets when order doesn't matter and duplicates shouldn't exist.

## Real-World Use Cases

### Unique Visitors
```python
visitor_ips = set()
visitor_ips.add("192.168.1.1")
visitor_ips.add("192.168.1.2")
visitor_ips.add("192.168.1.1")  # Duplicate, ignored
print(f"Unique visitors: {len(visitor_ips)}")
```

### Finding Common Elements
```python
python_students = {"Alice", "Bob", "Charlie"}
java_students = {"Bob", "Diana", "Eve"}
both = python_students & java_students
print(f"Students in both: {both}")
```

### Removing Duplicates from a List
```python
items = [1, 2, 2, 3, 3, 3, 4]
unique = list(set(items))  # [1, 2, 3, 4]
```

> [!SUCCESS]
| Structure | Ordered | Mutable | Unique Keys | Use Case |
|-----------|---------|---------|-------------|----------|
| List | Yes | Yes | No | Ordered collection |
| Tuple | Yes | No | No | Fixed data |
| Dict | Yes* | Yes | Yes | Key-value lookups |
| Set | No | Yes | Yes* | Membership, uniqueness |

*Python 3.7+ dicts maintain insertion order. Sets store unique values.

## Practice Questions

1. Create a dictionary for a book with title, author, and year.
2. How do you safely get a value from a dict without risking a KeyError?
3. What's the difference between `{}` and `set()`?
4. Write code to count character frequency in a string using a dict.
5. How do you find unique elements across two lists using sets?
6. What does `{1, 2, 3} - {2, 3, 4}` return?
7. How do you loop through both keys and values of a dictionary?
8. Why are set membership tests faster than list membership tests?
9. Remove duplicates from `[1, 1, 2, 3, 3, 4, 5, 5]`.
10. What happens if you add a duplicate element to a set?
