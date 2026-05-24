---
title: "Decorators and Context Managers"
description: "Master first-class functions, decorators with arguments, functools.wraps, and context managers with @contextmanager"
order: 6
duration: "45 minutes"
difficulty: "intermediate"
---

# Decorators and Context Managers

Decorators and context managers are powerful Python features that let you modify behavior and manage resources elegantly. Both rely on Python's first-class function support.

## First-Class Functions

In Python, functions are objects — they can be assigned, passed, and returned:

```python
def square(x: int) -> int:
    return x * x

def cube(x: int) -> int:
    return x * x * x

# Assign to variable
f = square
print(f(5))  # 25

# Pass as argument
def apply(func, value):
    return func(value)

print(apply(square, 4))   # 16
print(apply(cube, 3))     # 27

# Return from function
def get_operation(name: str):
    if name == "square":
        return square
    elif name == "cube":
        return cube
    else:
        return lambda x: x

op = get_operation("square")
print(op(6))  # 36
```

> [!NOTE]
> Functions can have attributes, be stored in data structures, and be passed as callbacks — just like any other object.

## Closure — Functions Remembering Their Scope

```python
def make_multiplier(factor: float):
    def multiplier(x: float) -> float:
        return x * factor
    return multiplier

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(5))   # 10
print(triple(5))   # 15
```

## Decorators — The Basics

A decorator is a function that takes another function and extends its behavior:

```python
def logger(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__} with {args}, {kwargs}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result
    return wrapper

@logger
def add(a: int, b: int) -> int:
    return a + b

print(add(3, 5))
# Calling add with (3, 5), {}
# add returned 8
# 8
```

The `@logger` syntax is equivalent to: `add = logger(add)`

> [!WARNING]
> Without `functools.wraps`, decorated functions lose their metadata (name, docstring, signature). Always use it!

## Preserving Metadata with `@wraps`

```python
import functools

def logger(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@logger
def greet(name: str) -> str:
    """Greet someone politely."""
    return f"Hello, {name}!"

print(greet.__name__)   # greet (not wrapper!)
print(greet.__doc__)    # Greet someone politely. (preserved!)
help(greet)             # Shows correct signature
```

## Decorators with Arguments

```python
import functools

def repeat(times: int = 2):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def say_hello(name: str):
    print(f"Hello, {name}!")

say_hello("Alice")
# Hello, Alice!
# Hello, Alice!
# Hello, Alice!
```

## Stacking Decorators

```python
import functools
import time

def logger(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"→ {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"  {func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@logger
@timer
def slow_add(a: int, b: int) -> int:
    time.sleep(0.1)
    return a + b

slow_add(3, 5)
# → wrapper  (outermost: logger)
#   wrapper took 0.1002s  (inner: timer)
# 8
```

> [!NOTE]
> Decorators are applied from bottom up and executed from top down. `@logger @timer` means `logger(timer(func))`.

## Real-World: Retry Decorator

```python
import functools
import time
import random

def retry(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except (ConnectionError, TimeoutError) as e:
                    last_exception = e
                    if attempt < max_attempts:
                        wait = delay * (backoff ** (attempt - 1))
                        print(f"Attempt {attempt} failed. Retrying in {wait:.1f}s...")
                        time.sleep(wait)
            raise last_exception
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def fetch_data(url: str) -> str:
    if random.random() < 0.7:
        raise ConnectionError("Network timeout")
    return f"Data from {url}"

try:
    result = fetch_data("https://api.example.com")
    print(result)
except ConnectionError:
    print("All retries exhausted")
```

## Class-based Decorators

```python
import functools

class CountCalls:
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"Call {self.count} of {self.func.__name__}")
        return self.func(*args, **kwargs)

@CountCalls
def say(message: str):
    print(message)

say("Hi")   # Call 1 of say
say("Bye")  # Call 2 of say
print(f"Called {say.count} times")  # Called 2 times
```

## Context Managers — The `with` Statement

Context managers set up and tear down resources automatically:

```python
# Without context manager
f = open("file.txt", "w")
f.write("data")
f.close()  # Easy to forget!

# With context manager
with open("file.txt", "w") as f:
    f.write("data")
# Automatically closed, even on exception
```

### Creating Context Managers with a Class

```python
class ManagedFile:
    def __init__(self, path: str, mode: str = "r"):
        self.path = path
        self.mode = mode

    def __enter__(self):
        self.file = open(self.path, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()
        # Return False to propagate exceptions, True to suppress
        return False

with ManagedFile("hello.txt", "w") as f:
    f.write("Hello, context manager!")
```

> [!NOTE]
> In `__exit__`, returning `True` suppresses any exception that occurred. Returning `False` (or `None`) lets it propagate. Only suppress exceptions when you intentionally handle them.

### Using `@contextmanager`

```python
from contextlib import contextmanager

@contextmanager
def managed_file(path: str, mode: str = "r"):
    file = open(path, mode)
    try:
        yield file
    finally:
        file.close()

with managed_file("hello.txt", "w") as f:
    f.write("Much shorter!")
```

## Common Context Manager Patterns

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(message: str = "Block"):
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{message} took {elapsed:.4f}s")

with timer("Heavy computation"):
    time.sleep(0.5)

@contextmanager
def change_directory(path: str):
    import os
    old_cwd = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old_cwd)

with change_directory("/tmp"):
    print(f"Working in {os.getcwd()}")
print(f"Back to {os.getcwd()}")

@contextmanager
def transaction(db):
    db.begin()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
```

## Built-in Context Managers

```python
from contextlib import redirect_stdout, redirect_stderr, nullcontext, suppress
import io

# Redirect stdout
buf = io.StringIO()
with redirect_stdout(buf):
    print("This goes to buffer")
print(buf.getvalue())  # "This goes to buffer"

# Suppress specific exceptions
with suppress(FileNotFoundError, PermissionError):
    with open("/etc/shadow") as f:
        print(f.read())  # Silently ignored

# nullcontext — do nothing (useful for conditional managers)
def process_file(path: str, compress: bool = False):
    ctx = gzip.open(path, "rt") if compress else nullcontext(open(path))
    with ctx as f:
        return f.read()
```

> [!WARNING]
> `@contextmanager` requires the `try/finally` pattern in the generator. If the wrapped block raises, the generator resumes at the `yield` and the `finally` ensures cleanup. Without `try/finally`, resources may leak on exceptions.

## Real-World: Database Connection Pool

```python
from contextlib import contextmanager
from typing import Optional

class DatabaseConnection:
    def __init__(self, host: str):
        self.host = host
        self.connected = False

    def connect(self):
        print(f"Connecting to {self.host}...")
        self.connected = True

    def disconnect(self):
        print(f"Disconnecting from {self.host}...")
        self.connected = False

    def query(self, sql: str) -> list:
        if not self.connected:
            raise RuntimeError("Not connected")
        return [f"Result of: {sql}"]

class ConnectionPool:
    def __init__(self, host: str, max_connections: int = 5):
        self.host = host
        self.max_connections = max_connections
        self._pool: list[DatabaseConnection] = []

    @contextmanager
    def get_connection(self) -> DatabaseConnection:
        conn = self._acquire()
        try:
            yield conn
        finally:
            self._release(conn)

    def _acquire(self) -> DatabaseConnection:
        if self._pool:
            return self._pool.pop()
        return DatabaseConnection(self.host)

    def _release(self, conn: DatabaseConnection):
        if len(self._pool) < self.max_connections:
            self._pool.append(conn)
        else:
            conn.disconnect()

pool = ConnectionPool("db.example.com")
with pool.get_connection() as conn:
    results = conn.query("SELECT * FROM users")
    print(results)
# Connection returned to pool automatically
```

```mermaid
flowchart TD
    A["with get_connection() as conn:"] --> B["_acquire()"]
    B --> C["yield conn"]
    C --> D["User code runs"]
    D --> E{"Exception?"}
    E -->|No| F["_release(conn)"]
    E -->|Yes| G["_release(conn) *"]
    G --> H["Exception propagates"]
    F --> I["Ready for next usage"]
```

> [!SUCCESS]
| Decorators | Context Managers |
|------------|-----------------|
| Modify/wrap functions | Manage resources |
| Used with `@` syntax | Used with `with` syntax |
| Commonly cross-cutting concerns (logging, auth, timing) | Resource lifecycle (files, locks, connections) |
| Can be class-based or function-based | Can be class-based or generator-based |

## Practice Questions

1. What does `@functools.wraps` do, and why is it important in decorators?
2. Write a decorator `@timed` that prints how long a function takes to run.
3. How do you create a decorator that accepts arguments (e.g., `@repeat(n=5)`)?
4. What happens when you stack multiple decorators on a single function? In what order are they applied?
5. Write a context manager `@contextmanager` that temporarily changes the working directory.
6. What is the purpose of `__enter__` and `__exit__` methods in a class-based context manager?
7. What does returning `True` from `__exit__` do? When might you use this?
8. Create a decorator `@validate_args` that checks all arguments are positive numbers.
9. Write a context manager that acquires and releases a threading.Lock.
10. How do you suppress specific exceptions using `contextlib.suppress`? Give an example.
