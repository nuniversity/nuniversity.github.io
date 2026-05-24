---
title: "Modules, Packages, and Standard Library"
description: "Organize code with modules and packages, explore Python's rich standard library, and learn to use third-party packages"
order: 10
duration: "30 minutes"
difficulty: "beginner"
---

# Modules, Packages, and Standard Library

As programs grow, you need to organize code into separate files. Python uses modules (files) and packages (directories) for this.

## Modules

A module is simply a `.py` file:

```python
# utils.py
def greet(name):
    return f"Hello, {name}"

PI = 3.14159

class Circle:
    def __init__(self, radius):
        self.radius = radius
```

Import it in another file:

```python
# main.py
import utils

print(utils.greet("Alice"))       # "Hello, Alice"
print(utils.PI)                   # 3.14159
circle = utils.Circle(5)
```

### Import Styles

```python
import math                    # Import whole module
from math import sqrt          # Import specific items
from math import *             # Import everything (avoid!)
import math as m               # Alias
from math import sqrt as s     # Alias specific
```

> [!NOTE]
| Form | When to Use |
|------|-------------|
| `import module` | Using many items from a module |
| `from module import item` | Using one or two items |
| `import module as alias` | Module name is long or conflicts |

## Packages

A package is a directory containing `__init__.py` (can be empty):

```
my_project/
├── main.py
└── shapes/
    ├── __init__.py
    ├── circle.py
    └── rectangle.py
```

```python
# shapes/circle.py
def area(radius):
    return 3.14159 * radius ** 2
```

```python
# main.py
from shapes import circle
print(circle.area(5))
```

## Python Standard Library

Python's "batteries-included" philosophy means a rich standard library:

### Math
```python
import math
print(math.sqrt(16))      # 4.0
print(math.pi)            # 3.14159...
print(math.floor(3.7))    # 3
print(math.ceil(3.2))     # 4
```

### Random
```python
import random
print(random.randint(1, 10))       # Random int 1-10
print(random.choice(["a", "b", "c"]))  # Random element
items = [1, 2, 3, 4, 5]
random.shuffle(items)              # Shuffle in place
```

### Datetime
```python
from datetime import datetime, date

now = datetime.now()
print(now)                       # Current date/time
print(now.strftime("%Y-%m-%d"))  # Formatted string
birthday = date(2025, 12, 25)
print(birthday)                  # 2025-12-25
```

### OS and File Operations
```python
import os
print(os.getcwd())           # Current directory
os.mkdir("new_folder")       # Create directory
print(os.listdir("."))       # List files
```

### JSON
```python
import json

data = {"name": "Alice", "age": 25}
json_str = json.dumps(data)       # Serialize to string
parsed = json.loads(json_str)     # Parse back to dict
```

## Using Third-Party Packages with pip

```python
# Install
pip install requests

# Use
import requests
response = requests.get("https://api.github.com")
data = response.json()
print(data)
```

## The `if __name__ == "__main__"` Pattern

Allows a file to be both imported and run:

```python
# calculator.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

if __name__ == "__main__":
    # This runs only when the file is executed directly
    print("Testing calculator:")
    print(f"3 + 5 = {add(3, 5)}")
    print(f"10 - 4 = {subtract(10, 4)}")
```

```bash
python calculator.py  # Runs the test code
```

```python
# other.py
import calculator     # Does NOT run the test code
```

## Real-World Example: Data Analysis Script

```python
# analyze.py
import csv
import json
from collections import Counter
from datetime import datetime

def load_data(filename: str) -> list[dict]:
    with open(filename, "r") as f:
        return list(csv.DictReader(f))

def analyze_sales(data: list[dict]) -> dict:
    total = sum(float(row["amount"]) for row in data)
    categories = Counter(row["category"] for row in data)
    return {"total": total, "categories": dict(categories)}

if __name__ == "__main__":
    sales = load_data("sales.csv")
    report = analyze_sales(sales)
    print(json.dumps(report, indent=2))
```

> [!SUCCESS]
| Concept | What It Is | File |
|---------|------------|------|
| Module | Single `.py` file | `utils.py` |
| Package | Directory of modules | `shapes/` |
| Standard Library | Built-in modules | `import math` |
| Third-Party | External packages | `pip install requests` |

## Practice Questions

1. What's the difference between a module and a package?
2. How do you import a specific function from a module?
3. What's the purpose of `__init__.py`?
4. Generate a random number between 1 and 100.
5. How do you get the current date and time?
6. What does `if __name__ == "__main__":` do?
7. Convert a Python dict to a JSON string.
8. How do you install a third-party package?
9. Why should you avoid `from module import *`?
10. Write a module with two functions and test it using `__name__`.
