---
title: "Functions and Scope"
description: "Create reusable code with functions: parameters, return values, scope, default arguments, and best practices"
order: 9
duration: "30 minutes"
difficulty: "beginner"
---

# Functions and Scope

Functions are reusable blocks of code that perform a specific task. They help you organize code, avoid repetition, and build complex programs from simple pieces.

## Defining and Calling Functions

```python
def greet():
    print("Hello, World!")

greet()  # Call the function
```

## Parameters and Arguments

```python
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")  # "Hello, Alice!"
```

### Multiple Parameters
```python
def add(a, b):
    result = a + b
    return result

sum_result = add(5, 3)  # 8
```

## The return Statement

Functions can return values (or `None` by default):

```python
def square(x):
    return x * x

result = square(4)  # 16

# Multiple return values (as tuple)
def divide(a, b):
    quotient = a // b
    remainder = a % b
    return quotient, remainder

q, r = divide(17, 5)  # q=3, r=2
```

## Default Arguments

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))          # "Hello, Alice!"
print(greet("Bob", "Hi"))      # "Hi, Bob!"
```

> [!WARNING]
> Never use mutable default arguments (lists, dicts). They're created once and shared across calls!

```python
def bad_append(item, list=[]):  # Wrong!
    list.append(item)
    return list

def good_append(item, list=None):  # Correct
    if list is None:
        list = []
    list.append(item)
    return list
```

## Keyword Arguments

```python
def create_user(name, age, country):
    return f"{name}, {age}, from {country}"

# Positional
user1 = create_user("Alice", 25, "USA")

# Keyword (order doesn't matter)
user2 = create_user(age=30, country="Canada", name="Bob")
```

## Variable Scope

### Local Scope
```python
def my_func():
    x = 10  # Local variable
    print(x)

my_func()     # 10
print(x)      # NameError! x is not defined
```

### Global Scope
```python
x = 10  # Global variable

def my_func():
    print(x)  # Can read global

my_func()  # 10
```

### Modifying Globals (Use Sparingly!)
```python
count = 0

def increment():
    global count
    count += 1

increment()
print(count)  # 1
```

> [!NOTE]
| Type | Defined | Accessible | Best Practice |
|------|---------|------------|---------------|
| Local | Inside function | Only in that function | Default — use for temporary data |
| Enclosing | In outer function | Inner functions | Use with closures |
| Global | Top-level | Everywhere | Avoid modifying; use parameters instead |
| Built-in | Python itself | Everywhere | Don't override |

## Type Hints (Documentation)

```python
def add(a: int, b: int) -> int:
    return a + b

def greet(name: str) -> str:
    return f"Hello, {name}"

def process(items: list[str]) -> None:
    for item in items:
        print(item)
```

## Docstrings

Document what your function does:

```python
def calculate_bmi(weight: float, height: float) -> float:
    """Calculate Body Mass Index.
    
    Args:
        weight: Weight in kilograms
        height: Height in meters
        
    Returns:
        BMI value
    """
    return weight / (height ** 2)
```

## Real-World Example: Data Processing Functions

```python
def clean_text(text: str) -> str:
    """Remove punctuation and normalize whitespace."""
    import string
    for char in string.punctuation:
        text = text.replace(char, "")
    return " ".join(text.split())

def word_frequency(text: str) -> dict:
    """Count word frequency in text."""
    words = clean_text(text).lower().split()
    freq = {}
    for word in words:
        freq[word] = freq.get(word, 0) + 1
    return freq

def top_words(freq: dict, n: int = 5) -> list:
    """Return the n most common words."""
    return sorted(freq.items(), key=lambda x: x[1], reverse=True)[:n]

# Usage
text = "Hello world! Hello everyone. Welcome to the world of Python."
freq = word_frequency(text)
print(top_words(freq))
```

> [!SUCCESS]
> Functions are the building blocks of maintainable code: they hide complexity, prevent repetition, and make your programs modular.

## Practice Questions

1. Write a function that takes two numbers and returns their product.
2. What's the difference between `print` and `return` in a function?
3. What happens if a function doesn't have a return statement?
4. Why is `def func(x=[])` problematic?
5. Write a function with type hints that converts Celsius to Fahrenheit.
6. What's the scope of a variable defined inside a function?
7. How do you return multiple values from a function?
8. Write a recursive function that calculates factorial.
9. What does `global` do inside a function?
10. Write a docstring for a function that validates an email address.
