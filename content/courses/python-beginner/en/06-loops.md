---
title: "Loops (for and while)"
description: "Master iteration in Python with for loops, while loops, range(), break, continue, and nested loops"
order: 6
duration: "30 minutes"
difficulty: "beginner"
---

# Loops (for and while)

Loops let you repeat code multiple times — essential for processing data, automating tasks, and building efficient programs.

## The for Loop

Iterate over a sequence (list, string, range, etc.):

```python
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
```

### Looping Through a String
```python
for char in "Python":
    print(char)
# Output: P, y, t, h, o, n
```

### Using range()

`range(start, stop, step)` generates a sequence of numbers:

```python
# 0 to 4
for i in range(5):
    print(i)

# 2 to 8 (step 2)
for i in range(2, 9, 2):
    print(i)

# Countdown
for i in range(10, 0, -1):
    print(i)
print("Blast off!")
```

## The while Loop

Runs while a condition is True:

```python
count = 0
while count < 5:
    print(count)
    count += 1
```

### Input Validation
```python
password = ""
while password != "secret":
    password = input("Enter password: ")
print("Access granted!")
```

> [!WARNING]
> Always ensure your while loop condition will eventually become False — otherwise you create an infinite loop!

## break and continue

### break — Exit the loop entirely
```python
for i in range(100):
    if i == 5:
        break
    print(i)
# Prints: 0 1 2 3 4
```

### continue — Skip to the next iteration
```python
for i in range(10):
    if i % 2 == 0:
        continue
    print(i)
# Prints: 1 3 5 7 9
```

## Nested Loops

Loops inside loops:

```python
for i in range(3):
    for j in range(3):
        print(f"({i}, {j})", end=" ")
    print()
# Output:
# (0, 0) (0, 1) (0, 2)
# (1, 0) (1, 1) (1, 2)
# (2, 0) (2, 1) (2, 2)
```

## The else Clause in Loops

Executes when the loop completes normally (no break):

```python
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(f"{n} = {x} * {n//x}")
            break
    else:
        print(f"{n} is prime")
```

## enumerate — Loop with Index

```python
colors = ["red", "green", "blue"]
for index, color in enumerate(colors):
    print(f"{index}: {color}")
# 0: red, 1: green, 2: blue
```

## zip — Loop Multiple Lists Together

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

> [!SUCCESS]
| Loop | When to Use | Example |
|------|-------------|---------|
| `for` | Iterating over a known sequence | `for item in list:` |
| `while` | Repeating until a condition changes | `while running:` |
| `for` + `range()` | Known number of iterations | `for i in range(10):` |

## Practice Questions

1. Write a for loop that prints numbers 1 to 10.
2. What does `range(5)` generate?
3. Write a while loop that sums numbers from 1 to 100.
4. What's the difference between `break` and `continue`?
5. Write nested loops to print a 3×3 multiplication table.
6. How do you loop through a list with both index and value?
7. What happens if a while loop condition is always True?
8. Write a for loop with an else clause.
9. How do you loop through two lists simultaneously?
10. Write a program that prints all even numbers from 1 to 20 using continue.
