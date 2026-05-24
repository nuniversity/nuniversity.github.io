---
title: "Variables and Data Types"
description: "Learn how to store data using variables and understand Python's core data types: int, float, string, and bool"
order: 3
duration: "30 minutes"
difficulty: "beginner"
---

# Variables and Data Types

Variables are containers for storing data. Python is dynamically typed, meaning you don't need to declare a variable's type — Python infers it automatically.

## Variables

```python
name = "Alice"        # String
age = 25              # Integer
height = 1.68         # Float
is_student = True     # Boolean
```

### Naming Rules
- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Case-sensitive (`age` ≠ `Age`)
- Cannot use Python keywords (like `if`, `for`, `while`)

```python
# Valid names
user_name = "Bob"
_user_id = 42
camelCase = "OK"      # Allowed but not preferred

# Invalid names
2nd_place = "No"      # Starts with number
my-var = "No"         # Hyphen not allowed
class = "No"          # Reserved keyword
```

### Naming Conventions (PEP 8)
```python
# Use snake_case for variables and functions
user_age = 30
total_price = 99.99

# Use UPPER_CASE for constants
PI = 3.14159
MAX_SIZE = 100
```

> [!NOTE]
> Python follows PEP 8 style guide. Use `snake_case` for variables, not `camelCase`.

## Numeric Types

### Integers (`int`)
```python
count = 10
negative = -5
big_number = 1_000_000  # Underscores improve readability
```

### Floats (`float`)
```python
price = 19.99
pi = 3.14159
scientific = 1.5e-4   # 0.00015
```

### Type Conversion
```python
# int to float
x = float(10)       # 10.0

# float to int (truncates)
y = int(3.99)       # 3

# string to int
z = int("42")       # 42
```

## Strings (`str`)

```python
# Single or double quotes
first = 'Hello'
second = "World"

# Multi-line strings
poem = """Roses are red,
Violets are blue,
Python is fun,
And so are you."""

# String concatenation
greeting = "Hello" + " " + "World"

# String interpolation (f-strings)
name = "Alice"
age = 25
message = f"{name} is {age} years old."

# String methods
text = "  Python is FUN  "
print(text.lower())       # "  python is fun  "
print(text.upper())       # "  PYTHON IS FUN  "
print(text.strip())       # "Python is FUN"
print(text.replace("FUN", "awesome"))  # "  Python is awesome  "
```

## Booleans (`bool`)

```python
is_active = True
is_finished = False

# Comparison operators return booleans
print(10 > 5)    # True
print(3 == 4)    # False
```

## None Type

`None` represents the absence of a value:

```python
result = None
print(result)    # None
```

## Checking Types

```python
print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type("Hello"))   # <class 'str'>
print(type(True))      # <class 'bool'>
print(type(None))      # <class 'NoneType'>
```

## Dynamic Typing

A variable's type can change:

```python
x = 10        # x is int
x = "hello"   # x is now str
x = 3.14      # x is now float
```

> [!WARNING]
> Dynamic typing is flexible but can cause bugs. Use meaningful variable names and be consistent with types.

> [!SUCCESS]
> Remember: `int` for whole numbers, `float` for decimals, `str` for text, `bool` for true/false, and `None` for nothing.

## Practice Questions

1. What will `type(3.14)` return?
2. Convert `"100"` to an integer.
3. What's wrong with `2nd_place = "Bob"`?
4. Write an f-string that says "Alice is 30 years old".
5. What's the difference between `10` and `10.0`?
6. What does `"hello".upper()` return?
7. True or False: Python requires you to declare variable types.
8. What does `None` represent in Python?
9. Convert the float `99.9` to an integer — what's the result?
10. Write a Python variable name using snake_case for a user's email address.
