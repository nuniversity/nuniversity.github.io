---
title: "Decoradores Avanzados"
description: "Construye decoradores con argumentos, decoradores basados en clase, domina functools.wraps, apilamiento y patrones del mundo real"
order: 4
duration: "75 minutos"
difficulty: avanzado
---

# Decoradores Avanzados

## Repaso de Decoradores

Un decorador es un callable que toma una función y devuelve un reemplazo.

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

Usa siempre `@functools.wraps` para preservar metadatos.

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
print(slow_add.__name__)   # "slow_add" (preservado)
print(slow_add.__doc__)    # "Add two numbers slowly." (preservado)
```

[!NOTE]
Sin `@functools.wraps`, las herramientas de introspección (help(), inspect, depuradores) muestran el wrapper en lugar de la función original.

## Decoradores con Argumentos

Tres niveles de anidamiento cuando tu decorador toma argumentos:

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

say("Hello!")  # imprime "Hello!" tres veces
```

### Decorador Parametrizado (argumentos opcionales)

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
El truco de `functools.partial` permite que `@decorator` y `@decorator(args)` funcionen: verifica si el primer argumento es callable.

## Decoradores Basados en Clase

Las clases que implementan `__call__` pueden mantener estado:

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

### Como Decorador de Clase con Estado de Instancia

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

## Apilando Decoradores

El orden importa: los decoradores se aplican de abajo arriba (más cerca de la función primero).

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
`@bold @italic greet` es equivalente a `bold(italic(greet))`. El decorador más cercano a la función se ejecuta primero.

## Decorando Métodos (self-aware)

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

## Mundo Real: Caché / Memoización

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
                # Mover al final (más recientemente usado)
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

## Mermaid: Pipeline de Decoradores

```mermaid
flowchart TD
    subgraph PILA["Pila de Decoradores"]
        RAW["def greet(name)"]
        L1["italic(greet)"]
        L2["bold(italic(greet))"]
    end
    subgraph LLAMADA["Cuando se Llama"]
        CALLER["Llamar greet('Alice')"]
        CALLER --> BOLD["bold wrapper<br>→ &lt;b&gt;...&lt;/b&gt;"]
        BOLD --> ITALIC["italic wrapper<br>→ &lt;i&gt;...&lt;/i&gt;"]
        ITALIC --> FUNC["greet() original<br>→ 'Hello, Alice'"]
    end
```

## Preguntas de Práctica

1. ¿Qué hace `@functools.wraps` y por qué es importante?
2. Escribe un decorador `timeit` que imprima el tiempo de ejecución de cualquier función.
3. Implementa un decorador `require_auth` que verifique que un argumento nombrado `user` no sea None.
4. ¿Cuál es la diferencia entre un decorador basado en función y uno basado en clase? ¿Cuándo usarías cada uno?
5. Crea un decorador parametrizado `with_retry(max_attempts)` que reintente una función en caso de fallo.
6. Explica el orden de apilamiento de decoradores. Si `@A @B def f()` es equivalente a `A(B(f))`, ¿qué significa esto para el orden de ejecución?
7. Construye un decorador basado en clase `Singleton` que garantice que solo exista una instancia de una clase.
8. Escribe un decorador que almacene en caché el valor de retorno de una función e invalide después de un TTL (time-to-live).
9. ¿Cómo decorarías un método de clase para registrar tanto el nombre de la clase como los argumentos?
10. Implementa un decorador `type_check` que valide que los tipos de los argumentos coincidan con las sugerencias de tipo y lance `TypeError` en caso de discrepancia.
