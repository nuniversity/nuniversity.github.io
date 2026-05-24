---
title: "Conditionals (if/elif/else)"
description: "Control program flow with conditional statements: if, elif, else, nested conditions, and the ternary operator"
order: 5
duration: "25 minutes"
difficulty: "beginner"
---

# Conditionals (if/elif/else)

Conditionals let your program make decisions based on conditions. This is how code becomes "smart."

## The if Statement

```python
age = 18
if age >= 18:
    print("You are an adult")
```

Indentation matters! The block under `if` must be indented consistently.

## if/else

```python
temperature = 30
if temperature > 25:
    print("It's hot outside!")
else:
    print("It's cool outside.")
```

## if/elif/else

```python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Grade: {grade}")
```

> [!NOTE]
> Python has no `switch` statement. Use `if/elif/else` instead. Python 3.10+ has `match` (structural pattern matching).

## Nested Conditionals

```python
age = 20
has_id = True

if age >= 18:
    if has_id:
        print("Entry allowed")
    else:
        print("ID required")
else:
    print("Too young")
```

## The Ternary Operator (Conditional Expression)

A compact way to write simple conditionals:

```python
# Standard form
if age >= 18:
    status = "Adult"
else:
    status = "Minor"

# Ternary form (one line)
status = "Adult" if age >= 18 else "Minor"
```

## Truthiness

In Python, some values are "truthy" and others are "falsy":

```python
# Falsy values (evaluate to False in boolean context)
False, None, 0, 0.0, "", [], {}, set(), range(0)

# Everything else is truthy
name = "Alice"
if name:  # True because string is non-empty
    print(f"Hello, {name}")
```

### Practical Examples
```python
# Check if a list is empty
items = []
if not items:
    print("Cart is empty")

# Check if a number is non-zero
count = 5
if count:
    print(f"Processing {count} items")
```

> [!WARNING]
> Be careful with `==` vs `=`. `=` is assignment, `==` is comparison. Using `=` in a condition (`if x = 5:`) causes a syntax error.

## Real-World Use Case: User Authentication

```python
username = input("Username: ")
password = input("Password: ")

if username == "admin" and password == "secret123":
    print("Welcome, admin!")
elif username == "admin":
    print("Wrong password")
elif password == "secret123":
    print("Unknown user")
else:
    print("Invalid credentials")
```

> [!SUCCESS]
> Think of conditionals as decision points in your program: if this is true, do this; otherwise, do that.

## Practice Questions

1. Write an if statement that prints "Positive" if `num > 0`.
2. What's the difference between `=` and `==` in Python?
3. Convert this to a ternary: `if x > 0: result = "positive" else: result = "negative"`
4. List all falsy values in Python.
5. What does `if "":` evaluate to?
6. Write a nested conditional that checks if a person is at least 18 AND has a valid ticket.
7. What's wrong with `if x = 10:`?
8. How do you write a multi-way conditional in Python (like switch/case)?
9. Write a program that prints "Even" or "Odd" based on a number.
10. What does this output: `status = "pass" if score >= 60 else "fail"` if score is 45?
