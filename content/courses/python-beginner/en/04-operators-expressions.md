---
title: "Operators and Expressions"
description: "Master arithmetic, comparison, logical, and assignment operators to build powerful expressions in Python"
order: 4
duration: "30 minutes"
difficulty: "beginner"
---

# Operators and Expressions

Operators perform operations on values and variables. Combined with operands, they form expressions — the building blocks of Python programs.

## Arithmetic Operators

```python
a = 10
b = 3

print(a + b)    # 13  (addition)
print(a - b)    # 7   (subtraction)
print(a * b)    # 30  (multiplication)
print(a / b)    # 3.333...  (division → always float)
print(a // b)   # 3   (integer division / floor)
print(a % b)    # 1   (modulus / remainder)
print(a ** b)   # 1000  (exponentiation)
```

### Real Example: Tip Calculator
```python
bill = 45.50
tip_percentage = 15
tip = bill * (tip_percentage / 100)
total = bill + tip
print(f"Tip: ${tip:.2f}, Total: ${total:.2f}")
```

## Comparison Operators

Compare values and get a boolean result:

```python
x = 5
y = 10

print(x == y)   # False  (equal to)
print(x != y)   # True   (not equal to)
print(x < y)    # True   (less than)
print(x > y)    # False  (greater than)
print(x <= 5)   # True   (less than or equal)
print(y >= 10)  # True   (greater than or equal)
```

### Chaining Comparisons
```python
age = 25
is_adult = 18 <= age <= 65  # True
print(is_adult)
```

## Logical Operators

Combine boolean expressions:

```python
has_license = True
has_insurance = True
age = 22

# AND — both must be True
can_drive = has_license and has_insurance

# OR — at least one must be True
needs_review = age < 18 or age > 70

# NOT — inverts the boolean
is_minor = not (age >= 18)
```

### Truth Table
| A | B | A and B | A or B | not A |
|---|---|---------|--------|-------|
| True | True | True | True | False |
| True | False | False | True | False |
| False | True | False | True | True |
| False | False | False | False | True |

> [!NOTE]
> Python uses short-circuit evaluation: `and` stops at the first False, `or` stops at the first True.

## Assignment Operators

```python
x = 10        # simple assignment
x += 5        # x = x + 5  → 15
x -= 3        # x = x - 3  → 12
x *= 2        # x = x * 2  → 24
x /= 4        # x = x / 4  → 6.0
x //= 2       # x = x // 2 → 3.0
x %= 2        # x = x % 2  → 1.0
x **= 3       # x = x ** 3 → 1.0
```

## Operator Precedence

PEMDAS applies (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction):

```python
result = 2 + 3 * 4      # 14 (3*4 first, then +2)
result2 = (2 + 3) * 4   # 20 (parentheses first)
result3 = 2 ** 3 * 4    # 32 (exponent first: 8*4)
```

> [!WARNING]
> When in doubt about precedence, use parentheses `()` to make your intent clear!

## Expression Examples

### Temperature Conversion
```python
celsius = 25
fahrenheit = (celsius * 9/5) + 32
print(f"{celsius}°C = {fahrenheit}°F")
```

### Even or Odd Check
```python
number = 7
is_even = number % 2 == 0
print(f"{number} is {'even' if is_even else 'odd'}")
```

> [!SUCCESS]
| Operator | Category | Example |
|----------|----------|---------|
| `+ - * /` | Arithmetic | `5 + 3` |
| `% // **` | Arithmetic | `10 % 3` |
| `== != < > <= >=` | Comparison | `age >= 18` |
| `and or not` | Logical | `a and b` |
| `= += -=` | Assignment | `x += 1` |

## Practice Questions

1. What does `17 % 5` evaluate to?
2. What's the result of `10 + 2 * 3`?
3. Fix this: `x = 10; if x = 5:` — what's wrong?
4. Write an expression that checks if a number is between 10 and 20 (inclusive).
5. What does `(3 + 2) * 4 // 2` evaluate to?
6. True or False: `"10" == 10` in Python?
7. What operator gives you the remainder of division?
8. Convert 100 degrees Celsius to Fahrenheit.
9. Write a boolean expression: "x is positive AND y is negative"
10. What does `not (True and False)` evaluate to?
