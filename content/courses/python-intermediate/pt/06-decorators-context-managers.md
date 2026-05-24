---
title: "Decoradores e Gerenciadores de Contexto"
description: "Domine funções de primeira classe, decoradores com argumentos, functools.wraps e gerenciadores de contexto com @contextmanager"
order: 6
duration: "45 minutos"
difficulty: "intermediário"
---

# Decoradores e Gerenciadores de Contexto

Decoradores e gerenciadores de contexto são recursos poderosos do Python que permitem modificar comportamento e gerenciar recursos de forma elegante. Ambos dependem do suporte a funções de primeira classe do Python.

## Funções de Primeira Classe

Em Python, funções são objetos — podem ser atribuídas, passadas e retornadas:

```python
def square(x: int) -> int:
    return x * x

def cube(x: int) -> int:
    return x * x * x

# Atribuir a variável
f = square
print(f(5))  # 25

# Passar como argumento
def apply(func, value):
    return func(value)

print(apply(square, 4))   # 16
print(apply(cube, 3))     # 27

# Retornar de função
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
> Funções podem ter atributos, ser armazenadas em estruturas de dados e ser passadas como callbacks — como qualquer outro objeto.

## Closure — Funções Lembrando Seu Escopo

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

## Decoradores — O Básico

Um decorador é uma função que recebe outra função e estende seu comportamento:

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

A sintaxe `@logger` é equivalente a: `add = logger(add)`

> [!WARNING]
> Sem `functools.wraps`, funções decoradas perdem seus metadados (nome, docstring, assinatura). Sempre use!

## Preservando Metadados com `@wraps`

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
    """Saudar alguém educadamente."""
    return f"Hello, {name}!"

print(greet.__name__)   # greet (não wrapper!)
print(greet.__doc__)    # Saudar alguém educadamente. (preservado!)
help(greet)             # Mostra assinatura correta
```

## Decoradores com Argumentos

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

## Empilhando Decoradores

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
# → wrapper  (mais externo: logger)
#   wrapper took 0.1002s  (interno: timer)
# 8
```

> [!NOTE]
> Decoradores são aplicados de baixo para cima e executados de cima para baixo. `@logger @timer` significa `logger(timer(func))`.

## Mundo Real: Decorador de Retry

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

## Decoradores Baseados em Classe

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

## Gerenciadores de Contexto — A Instrução `with`

Gerenciadores de contexto configuram e liberam recursos automaticamente:

```python
# Sem gerenciador de contexto
f = open("file.txt", "w")
f.write("data")
f.close()  # Fácil de esquecer!

# Com gerenciador de contexto
with open("file.txt", "w") as f:
    f.write("data")
# Fechado automaticamente, mesmo em exceção
```

### Criando Gerenciadores de Contexto com uma Classe

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
        # Retorne False para propagar exceções, True para suprimir
        return False

with ManagedFile("hello.txt", "w") as f:
    f.write("Hello, context manager!")
```

> [!NOTE]
> Em `__exit__`, retornar `True` suprime qualquer exceção que ocorreu. Retornar `False` (ou `None`) a deixa propagar. Suprima exceções apenas quando as tratar intencionalmente.

### Usando `@contextmanager`

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

## Padrões Comuns de Gerenciadores de Contexto

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

## Gerenciadores de Contexto Embutidos

```python
from contextlib import redirect_stdout, redirect_stderr, nullcontext, suppress
import io

# Redirecionar stdout
buf = io.StringIO()
with redirect_stdout(buf):
    print("This goes to buffer")
print(buf.getvalue())  # "This goes to buffer"

# Suprimir exceções específicas
with suppress(FileNotFoundError, PermissionError):
    with open("/etc/shadow") as f:
        print(f.read())  # Ignorado silenciosamente

# nullcontext — não faz nada (útil para gerenciadores condicionais)
def process_file(path: str, compress: bool = False):
    ctx = gzip.open(path, "rt") if compress else nullcontext(open(path))
    with ctx as f:
        return f.read()
```

> [!WARNING]
> `@contextmanager` requer o padrão `try/finally` no gerador. Se o bloco envolvido levantar, o gerador retoma no `yield` e o `finally` garante a limpeza. Sem `try/finally`, recursos podem vazar em exceções.

## Mundo Real: Pool de Conexões de Banco de Dados

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
# Conexão retornada ao pool automaticamente
```

```mermaid
flowchart TD
    A["with get_connection() as conn:"] --> B["_acquire()"]
    B --> C["yield conn"]
    C --> D["Código do usuário executa"]
    D --> E{"Exceção?"}
    E -->|Não| F["_release(conn)"]
    E -->|Sim| G["_release(conn) *"]
    G --> H["Exceção propaga"]
    F --> I["Pronto para próximo uso"]
```

> [!SUCCESS]
| Decoradores | Gerenciadores de Contexto |
|-------------|---------------------------|
| Modificam/encapsulam funções | Gerenciam recursos |
| Usados com sintaxe `@` | Usados com sintaxe `with` |
| Comumente preocupações transversais (logging, auth, timing) | Ciclo de vida de recursos (arquivos, locks, conexões) |
| Podem ser baseados em classe ou função | Podem ser baseados em classe ou gerador |

## Perguntas de Prática

1. O que `@functools.wraps` faz e por que é importante em decoradores?
2. Escreva um decorador `@timed` que imprime quanto tempo uma função leva para executar.
3. Como você cria um decorador que aceita argumentos (ex.: `@repeat(n=5)`)?
4. O que acontece quando você empilha múltiplos decoradores em uma única função? Em que ordem eles são aplicados?
5. Escreva um gerenciador de contexto `@contextmanager` que muda temporariamente o diretório de trabalho.
6. Qual é o propósito dos métodos `__enter__` e `__exit__` em um gerenciador de contexto baseado em classe?
7. O que retornar `True` de `__exit__` faz? Quando você pode usar isso?
8. Crie um decorador `@validate_args` que verifica se todos os argumentos são números positivos.
9. Escreva um gerenciador de contexto que adquire e libera um threading.Lock.
10. Como você suprime exceções específicas usando `contextlib.suppress`? Dê um exemplo.
