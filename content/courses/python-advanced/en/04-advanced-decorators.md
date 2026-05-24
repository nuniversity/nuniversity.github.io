---
title: "Advanced Decorators"
description: "Build decorators with arguments, class-based decorators, master functools.wraps, stacking, and real-world patterns"
order: 4
duration: "75 minutes"
difficulty: advanced
---

# Advanced Decorators

## Decorator Refresher

A decorator is a callable that takes a function and returns a replacement.

```python
def simple_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@simple_decorator
def greet(name):
    return f"Hello, {name}"

print(greet("Alice"))
# Calling greet
# Hello, Alice
```

## functools.wraps

Always use `@functools.wraps` to preserve metadata.

```python
import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@timer
def slow_add(a, b):
    """Add two numbers slowly."""
    time.sleep(0.1)
    return a + b

print(slow_add(1, 2))
print(slow_add.__name__)   # "slow_add" (preserved)
print(slow_add.__doc__)    # "Add two numbers slowly." (preserved)
```

[!NOTE]
Without `@functools.wraps`, introspection tools (help(), inspect, debuggers) show the wrapper instead of the original function.

## Decorators with Arguments

Three levels of nesting when your decorator takes arguments:

```python
import functools

def repeat(n=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(n):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(n=3)
def say(msg):
    print(msg)

say("Hello!")  # prints "Hello!" three times
```

### Parameterised Decorator (optional arguments)

```python
import functools

def retry(max_attempts=3, delay=0.1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            import time
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    print(f"Attempt {attempt} failed: {e}")
                    if attempt < max_attempts:
                        time.sleep(delay)
            raise last_exc
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def unstable_api():
    import random
    if random.random() < 0.7:
        raise ConnectionError("Network error")
    return "success"
```

[!SUCCESS]
The `functools.partial` trick allows `@decorator` and `@decorator(args)` to both work: check if the first arg is callable.

## Class-Based Decorators

Classes implementing `__call__` can maintain state:

```python
import functools
import time

class RateLimit:
    def __init__(self, calls=5, period=1):
        self.calls = calls
        self.period = period
        self.timestamps = []

    def __call__(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            now = time.monotonic()
            self.timestamps = [t for t in self.timestamps
                               if now - t < self.period]
            if len(self.timestamps) >= self.calls:
                raise RuntimeError("Rate limit exceeded")
            self.timestamps.append(now)
            return func(*args, **kwargs)
        return wrapper

@RateLimit(calls=3, period=2)
def api_call():
    return "OK"
```

### As Class Decorator with Instance State

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
def hello():
    print("Hi!")

hello()  # Call 1 of hello
hello()  # Call 2 of hello
```

## Stacking Decorators

Order matters: decorators apply bottom-up (nearest the function first).

```python
import functools

def bold(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return f"<b>{func(*args, **kwargs)}</b>"
    return wrapper

def italic(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return f"<i>{func(*args, **kwargs)}</i>"
    return wrapper

@bold
@italic
def greet(name):
    return f"Hello, {name}"

print(greet("Alice"))  # <b><i>Hello, Alice</i></b>
```

[!NOTE]
`@bold @italic greet` is equivalent to `bold(italic(greet))`. The decorator closest to the function runs first.

## Decorating Methods (self-aware)

```python
import functools

def method_logger(func):
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        print(f"{type(self).__name__}.{func.__name__} called")
        return func(self, *args, **kwargs)
    return wrapper

class Service:
    @method_logger
    def process(self, data):
        return data * 2

s = Service()
s.process(10)  # Service.process called
```

## Real-World: Cache / Memoisation

```python
import functools
import time

def lru_cache(maxsize=128):
    def decorator(func):
        cache = {}
        order = []

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            key = (args, tuple(sorted(kwargs.items())))
            if key in cache:
                # Move to end (most recently used)
                order.remove(key)
                order.append(key)
                return cache[key]

            result = func(*args, **kwargs)
            cache[key] = result
            order.append(key)

            if len(cache) > maxsize:
                oldest = order.pop(0)
                del cache[oldest]

            return result
        return wrapper
    return decorator

@lru_cache(maxsize=3)
def expensive(n):
    time.sleep(0.5)
    return n * n
```

## Mermaid: Decorator Pipeline

```mermaid
flowchart TD
    subgraph STACK["Decorator Stack"]
        RAW["def greet(name)"]
        L1["italic(greet)"]
        L2["bold(italic(greet))"]
    end
    subgraph CALL["When Called"]
        CALLER["Call greet('Alice')"]
        CALLER --> BOLD["bold wrapper<br>→ &lt;b&gt;...&lt;/b&gt;"]
        BOLD --> ITALIC["italic wrapper<br>→ &lt;i&gt;...&lt;/i&gt;"]
        ITALIC --> FUNC["original greet()<br>→ 'Hello, Alice'"]
    end
```

## Practice Questions

1. What does `@functools.wraps` do and why is it important?
2. Write a decorator `timeit` that prints the execution time of any function.
3. Implement a decorator `require_auth` that checks a keyword argument `user` is not None.
4. What is the difference between a function-based decorator and a class-based decorator? When would you use each?
5. Create a parameterised decorator `with_retry(max_attempts)` that retries a function on failure.
6. Explain decorator stacking order. If `@A @B def f()` is equivalent to `A(B(f))`, what does this mean for execution order?
7. Build a class-based decorator `Singleton` that ensures only one instance of a class exists.
8. Write a decorator that caches the return value of a function and invalidates after a TTL (time-to-live).
9. How would you decorate a class method to log both the class name and arguments?
10. Implement a decorator `type_check` that validates argument types match type hints and raises `TypeError` on mismatch.
