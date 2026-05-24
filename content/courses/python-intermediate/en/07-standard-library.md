---
title: "The Python Standard Library"
description: "Deep dive into os, sys, re, collections, itertools, and functools — Python's built-in modules for everyday development"
order: 7
duration: "50 minutes"
difficulty: "intermediate"
---

# The Python Standard Library

Python's standard library is famously comprehensive — "batteries included." These modules are available with every Python installation and solve a vast range of common problems.

## `os` — Operating System Interface

```python
import os

# Current working directory
cwd = os.getcwd()

# List directory contents
entries = os.listdir(".")

# Create/remove directories
os.makedirs("a/b/c", exist_ok=True)
os.rmdir("a/b/c")     # Must be empty
os.removedirs("a/b")  # Remove leaf and empty parents

# File info
stat_info = os.stat("file.txt")
print(stat_info.st_size)      # File size in bytes
print(stat_info.st_mtime)     # Last modified timestamp

# Environment variables
print(os.environ.get("HOME"))
os.environ["MY_VAR"] = "value"

# Path operations (legacy — prefer pathlib)
full_path = os.path.join("dir", "subdir", "file.txt")
base = os.path.basename("/path/to/file.txt")     # file.txt
dir_name = os.path.dirname("/path/to/file.txt")  # /path/to
name, ext = os.path.splitext("data.csv")         # ("data", ".csv")
```

> [!NOTE]
> Python 3.4+ recommends `pathlib.Path` over `os.path` for most path operations. It's more intuitive and cross-platform.

## `sys` — System-Specific Parameters

```python
import sys

# Command-line arguments
print(f"Script: {sys.argv[0]}")
print(f"Args: {sys.argv[1:]}")

# Python version
print(f"Python {sys.version}")
print(f"Major: {sys.version_info.major}")

# Exit program with status code
sys.exit(0)   # Success
sys.exit(1)   # Error

# Path search
print(sys.path)  # List of import search directories

# Standard streams
sys.stdout.write("Output to stdout\n")
sys.stderr.write("Error message\n")

# Memory size of an object
print(sys.getsizeof([1, 2, 3]))  # 120 (approx, varies by Python/build)

# Recursion limit
print(sys.getrecursionlimit())   # 1000 default
sys.setrecursionlimit(5000)      # Increase (use cautiously)
```

## `re` — Regular Expressions

```python
import re

# Basic matching
pattern = r"\d+"  # One or more digits
text = "Order 42: 12 items at $3.99"

match = re.search(pattern, text)
if match:
    print(match.group())  # 42
    print(match.start())  # 6
    print(match.end())    # 8

# Find all matches
prices = re.findall(r"\d+\.?\d*", text)
print(prices)  # ['42', '12', '3', '99']  (note: 3.99 splits)

# Better: capture full decimal
prices = re.findall(r"\d+\.\d+|\d+", text)
print(prices)  # ['42', '12', '3.99']
```

```python
import re

# Substitution
cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", "Hello, World! #2024")
print(cleaned)  # "Hello World 2024"

# Compilation (for repeated use)
email_pattern = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
emails = ["alice@example.com", "bob@bad", "carol@test.org"]
valid = [e for e in emails if email_pattern.search(e)]
print(valid)  # ['alice@example.com', 'carol@test.org']

# Named groups
log_line = "2024-01-15 10:30:45 ERROR: Connection timeout"
pattern = r"(?P<date>\S+)\s+(?P<time>\S+)\s+(?P<level>\w+):\s+(?P<message>.+)"
m = re.match(pattern, log_line)
print(m.groupdict())
# {'date': '2024-01-15', 'time': '10:30:45', 'level': 'ERROR', 'message': 'Connection timeout'}
```

| Pattern | Meaning |
|---------|---------|
| `\d` | Digit (0-9) |
| `\w` | Word character (letter, digit, underscore) |
| `\s` | Whitespace (space, tab, newline) |
| `.` | Any character except newline |
| `*` | Zero or more |
| `+` | One or more |
| `?` | Zero or one (also makes `*`, `+` non-greedy) |
| `{n,m}` | Between n and m repetitions |
| `^` | Start of string |
| `$` | End of string |
| `[abc]` | Character class (a, b, or c) |
| `(.*)` | Capturing group |

> [!WARNING]
> Use raw strings (`r"pattern"`) for regex patterns to avoid escaping backslashes. `r"\d"` is correct; `"\\d"` also works but is ugly.

## `collections` — Specialized Data Structures

### Counter

```python
from collections import Counter

words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
counter = Counter(words)
print(counter)                # Counter({'apple': 3, 'banana': 2, 'cherry': 1})
print(counter["apple"])       # 3
print(counter["orange"])      # 0 (no KeyError!)

# Most common
print(counter.most_common(2))  # [('apple', 3), ('banana', 2)]

# Arithmetic
counter2 = Counter(["apple", "date"])
print(counter + counter2)     # Counter({'apple': 4, 'banana': 2, 'cherry': 1, 'date': 1})
```

### defaultdict

```python
from collections import defaultdict

# Group items by category
data = [("fruit", "apple"), ("fruit", "banana"), ("color", "red"), ("fruit", "cherry")]
groups = defaultdict(list)
for category, item in data:
    groups[category].append(item)

print(groups["fruit"])   # ['apple', 'banana', 'cherry']
print(groups["color"])   # ['red']
print(groups["unknown"])  # [] — no KeyError!

# Nested defaultdict
nested = defaultdict(lambda: defaultdict(int))
nested["alice"]["apples"] += 1
nested["bob"]["bananas"] += 2
```

> [!NOTE]
> `defaultdict` never raises `KeyError` — missing keys are automatically created using the factory function. Perfect for grouping and counting.

### namedtuple

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 5)
print(p.x, p.y)       # 3 5
print(p[0], p[1])     # 3 5 (tuple indexing works too)
x, y = p              # Tuple unpacking

# Convert to dict
print(p._asdict())    # {'x': 3, 'y': 5}

# Create new instance with changed field
p2 = p._replace(x=10)
print(p2)             # Point(x=10, y=5)

# Type hints with namedtuple
from typing import NamedTuple

class Employee(NamedTuple):
    name: str
    id: int
    salary: float

e = Employee("Alice", 123, 75000.0)
print(e.name, e.salary)  # Alice 75000.0
```

## `itertools` — Iterator Tools

```python
from itertools import count, cycle, repeat, chain, product, permutations, combinations, groupby, accumulate, islice

# Infinite iterators
for i in count(10, 2):   # 10, 12, 14, ...
    if i > 20: break

# Cycle
colors = cycle(["red", "green", "blue"])
print([next(colors) for _ in range(5)])  # ['red', 'green', 'blue', 'red', 'green']

# Chain
combined = chain([1, 2], [3, 4], "ab")
print(list(combined))  # [1, 2, 3, 4, 'a', 'b']

# Product (cartesian)
print(list(product("AB", [1, 2])))   # [('A', 1), ('A', 2), ('B', 1), ('B', 2)]

# Permutations
print(list(permutations("ABC", 2)))  # [('A','B'), ('A','C'), ('B','A'), ('B','C'), ('C','A'), ('C','B')]

# Combinations
print(list(combinations("ABC", 2)))  # [('A','B'), ('A','C'), ('B','C')]

# Accumulate
print(list(accumulate([1, 2, 3, 4])))  # [1, 3, 6, 10]
print(list(accumulate([1, 2, 3, 4], lambda a, b: a * b)))  # [1, 2, 6, 24]
```

```python
from itertools import islice, groupby

# Slicing an iterator
iterator = iter(range(1000))
first_10 = list(islice(iterator, 10))
print(first_10)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# groupby (requires sorted data)
data = [("fruit", "apple"), ("fruit", "banana"), ("animal", "dog")]
data.sort(key=lambda x: x[0])  # Must sort first!
for key, group in groupby(data, key=lambda x: x[0]):
    print(f"{key}: {list(group)}")
```

## `functools` — Higher-Order Functions

```python
from functools import partial, lru_cache, reduce, wraps

# partial — freeze arguments
def power(base: float, exponent: float) -> float:
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)
print(square(5))  # 25
print(cube(5))    # 125

# lru_cache — memoization
@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(100))  # 354224848179261915075 (instant!)
print(fibonacci.cache_info())
# CacheInfo(hits=98, misses=101, maxsize=128, currsize=101)

# reduce — accumulate from left
from functools import reduce
product = reduce(lambda a, b: a * b, [1, 2, 3, 4, 5])
print(product)  # 120
```

> [!SUCCESS]
| Module | Best For |
|--------|----------|
| `os` | OS interaction (env vars, process, filesystem) |
| `sys` | Python runtime (version, path, argv, exit) |
| `re` | Text pattern matching and extraction |
| `collections` | Specialized dict/list/tuple types |
| `itertools` | Iterator algebra (lazy combinatorial tools) |
| `functools` | Function manipulation (cache, partial, reduce) |

## Real-World: Log File Analyzer

```python
import re
from collections import Counter, defaultdict
from pathlib import Path

def analyze_logs(log_path: str) -> dict:
    pattern = re.compile(
        r"(?P<ip>\d+\.\d+\.\d+\.\d+) .* "
        r"\[(?P<timestamp>[^\]]+)\] "
        r'"(?P<method>\w+) (?P<path>\S+) .*" '
        r"(?P<status>\d{3})"
    )

    status_counts = Counter()
    paths_by_ip = defaultdict(list)

    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            m = pattern.search(line)
            if m:
                data = m.groupdict()
                status_counts[data["status"]] += 1
                paths_by_ip[data["ip"]].append(data["path"])

    return {
        "total_requests": sum(status_counts.values()),
        "status_distribution": dict(status_counts),
        "most_active_ips": Counter({ip: len(paths) for ip, paths in paths_by_ip.items()}).most_common(5),
    }

result = analyze_logs("/var/log/nginx/access.log")
print(f"Total: {result['total_requests']}")
print(f"Statuses: {result['status_distribution']}")
print(f"Top IPs: {result['most_active_ips']}")
```

## Real-World: Data Pipeline with itertools

```python
from itertools import islice, chain, groupby
import csv

def process_batches(filename: str, batch_size: int = 100):
    with open(filename, "r", newline="") as f:
        reader = csv.DictReader(f)
        while True:
            batch = list(islice(reader, batch_size))
            if not batch:
                break
            yield from process_batch(batch)

def process_batch(rows: list[dict]) -> list[dict]:
    results = []
    for row in rows:
        row["total"] = float(row.get("price", 0)) * int(row.get("quantity", 0))
        results.append(row)
    return results

for item in process_batches("large_orders.csv", 500):
    print(f"Processed {item['id']}: ${item['total']:.2f}")
```

> [!WARNING]
> `itertools.groupby` only groups consecutive elements. Sort your data by the grouping key first, or use `defaultdict` for non-consecutive grouping.

## Practice Questions

1. How do you get all environment variables using `os.environ`? How do you get a specific one safely?
2. Write a regex that validates a US phone number format: `(123) 456-7890`.
3. What is the difference between `re.search()` and `re.match()`?
4. Use `collections.Counter` to find the most common word in a sentence.
5. When would you use `namedtuple` instead of a regular class? When would you use `dict` instead?
6. Write code using `itertools.product` to generate all possible 3-letter combinations from "ABC".
7. What does `functools.lru_cache` do and when should you use it?
8. Use `itertools.chain` to flatten `[[1, 2], [3, 4], [5]]` into `[1, 2, 3, 4, 5]`.
9. How does `collections.defaultdict` differ from a regular `dict`?
10. Write a function using `functools.partial` that creates a `to_celsius` converter from a general temperature converter.
