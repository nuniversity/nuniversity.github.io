---
title: "Excepciones y Manejo de Errores"
description: "Maneja errores de forma elegante con try/except/else/finally, lanza excepciones personalizadas y comprende la jerarquía de excepciones de Python"
order: 3
duration: "40 minutos"
difficulty: "intermedio"
---

# Excepciones y Manejo de Errores

Las excepciones son el mecanismo de Python para manejar errores en tiempo de ejecución. En lugar de fallar, puedes capturar, inspeccionar y responder a los errores de forma elegante.

## La Jerarquía de Excepciones

Todas las excepciones heredan de `BaseException`:

```python
BaseException
├── SystemExit
├── KeyboardInterrupt
├── GeneratorExit
└── Exception
    ├── ArithmeticError
    │   ├── ZeroDivisionError
    │   └── OverflowError
    ├── LookupError
    │   ├── IndexError
    │   └── KeyError
    ├── ValueError
    ├── TypeError
    ├── OSError
    │   └── FileNotFoundError
    └── RuntimeError
```

> [!NOTE]
> Siempre captura `Exception`, nunca `BaseException`. `BaseException` incluye `SystemExit` y `KeyboardInterrupt` que raramente querrás suprimir.

## try/except Básico

```python
try:
    num = int(input("Enter a number: "))
    result = 10 / num
    print(f"Result: {result}")
except ValueError:
    print("That's not a valid number!")
except ZeroDivisionError:
    print("Cannot divide by zero!")
```

## El Bloque Completo try/except/else/finally

```python
try:
    file = open("data.txt", "r")
    content = file.read()
    data = json.loads(content)
except FileNotFoundError:
    print("File not found. Using defaults.")
    data = {}
except json.JSONDecodeError:
    print("Invalid JSON. Using defaults.")
    data = {}
else:
    print("File read and parsed successfully!")
finally:
    file.close()
```

| Cláusula | Cuándo Ejecuta | Propósito |
|----------|---------------|-----------|
| `try` | Siempre primero | Código que podría lanzar excepción |
| `except` | En la excepción correspondiente | Recuperación de error |
| `else` | Si no hay excepción en `try` | Camino de éxito (evita capturar errores no intencionados) |
| `finally` | Siempre (incluso en return/break) | Limpieza (cerrar archivos, liberar locks) |

## Capturando Múltiples Excepciones

```python
try:
    value = int(input("Enter index: "))
    items = [10, 20, 30]
    print(items[value] / value)
except (ValueError, IndexError, ZeroDivisionError) as e:
    print(f"Error: {e}")
    print(f"Type: {type(e).__name__}")
```

## Objetos de Excepción y Tracebacks

```python
import traceback

def risky_function():
    raise ValueError("Something went wrong")

try:
    risky_function()
except ValueError as e:
    print(f"Args: {e.args}")
    print(f"String: {e}")
    print(f"Traceback:\n{traceback.format_exc()}")
```

## Lanzando Excepciones

```python
def withdraw(balance: float, amount: float) -> float:
    if amount <= 0:
        raise ValueError("Withdrawal amount must be positive")
    if amount > balance:
        raise ValueError("Insufficient funds")
    return balance - amount

try:
    new_balance = withdraw(100, 200)
except ValueError as e:
    print(f"Cannot process: {e}")
```

### Relanzando Excepciones

```python
def process_file(path: str):
    try:
        with open(path) as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"Attempted to read {path}, but it was missing")
        raise  # Relanza la misma excepción

try:
    data = process_file("missing.txt")
except FileNotFoundError:
    print("Could not process the file at all")
```

> [!WARNING]
> `raise` simple preserva el traceback original. `raise e` crea uno nuevo. Usa `raise` simple para relanzar.

## Encadenamiento de Excepciones

```python
def fetch_user(user_id: int) -> dict:
    try:
        response = api_call(f"/users/{user_id}")
        return response.json()
    except ConnectionError as e:
        raise RuntimeError(f"Failed to fetch user {user_id}") from e

try:
    user = fetch_user(42)
except RuntimeError as e:
    print(f"Runtime: {e}")
    print(f"Caused by: {e.__cause__}")  # ConnectionError original
```

## Creando Excepciones Personalizadas

```python
class BankError(Exception):
    """Excepción base para operaciones bancarias."""
    pass

class InsufficientFundsError(BankError):
    def __init__(self, balance: float, amount: float):
        self.balance = balance
        self.amount = amount
        self.shortfall = amount - balance
        super().__init__(f"Insufficient funds: have ${balance:.2f}, need ${amount:.2f}")

class AccountNotFoundError(BankError):
    def __init__(self, account_id: str):
        self.account_id = account_id
        super().__init__(f"Account {account_id} not found")

class FrozenAccountError(BankError):
    pass

def transfer(sender: str, recipient: str, amount: float):
    accounts = {"A1": 1000, "A2": 500}
    frozen = {"A3"}

    if sender not in accounts:
        raise AccountNotFoundError(sender)
    if recipient not in accounts:
        raise AccountNotFoundError(recipient)
    if sender in frozen:
        raise FrozenAccountError(f"Account {sender} is frozen")
    if accounts[sender] < amount:
        raise InsufficientFundsError(accounts[sender], amount)

try:
    transfer("A1", "A3", 2000)
except InsufficientFundsError as e:
    print(f"Short by ${e.shortfall:.2f}")
except AccountNotFoundError:
    print("Check account IDs")
except BankError as e:
    print(f"Bank error: {e}")
```

> [!SUCCESS]
| Regla | Por qué |
|------|--------|
| Hereda de `Exception`, no de `BaseException` | Evita capturar eventos de nivel de sistema |
| Nombra excepciones personalizadas con sufijo `Error` | Convención de nomenclatura clara (ej.: `ValidationError`) |
| Almacena contexto relevante como atributos | Permite manejo programático de errores |
| Mantén la jerarquía de excepciones superficial | Fácil de capturar amplia o específicamente según sea necesario |

## Tipos Comunes de Excepción

| Excepción | Cuándo se Lanza | Corrección Común |
|-----------|----------------|------------------|
| `ValueError` | Valor de tipo incorrecto | Valida la entrada antes de usar |
| `TypeError` | Tipo de operando incorrecto | Verifica tipos con `isinstance` |
| `IndexError` | Índice de secuencia fuera de rango | Verifica `len()` antes de indexar |
| `KeyError` | Clave de diccionario ausente | Usa `.get()` con valor predeterminado |
| `AttributeError` | Objeto sin atributo | Verifica con `hasattr()` o usa `getattr(obj, attr, default)` |
| `FileNotFoundError` | Archivo no existe | Verifica `os.path.exists()` primero |
| `StopIteration` | Iterador agotado | Usa bucle `for` en lugar de `next()` manual |
| `OSError` | Error de E/S de nivel de sistema | Verifica permisos, espacio en disco |

## Mundo Real: Cliente de API Robusto

```python
import json
import time
from typing import Optional
import urllib.request
import urllib.error

class APIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(f"API Error {status_code}: {message}")

class RateLimitError(APIError):
    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(429, f"Rate limited. Retry after {retry_after}s")

class APIClient:
    BASE_URL = "https://api.example.com"
    MAX_RETRIES = 3

    def fetch(self, endpoint: str) -> dict:
        url = f"{self.BASE_URL}/{endpoint}"
        for attempt in range(self.MAX_RETRIES):
            try:
                return self._make_request(url)
            except RateLimitError as e:
                if attempt == self.MAX_RETRIES - 1:
                    raise
                print(f"Rate limited, waiting {e.retry_after}s...")
                time.sleep(e.retry_after)
            except (urllib.error.URLError, ConnectionError) as e:
                if attempt == self.MAX_RETRIES - 1:
                    raise APIError(0, f"Connection failed after {self.MAX_RETRIES} attempts: {e}")
                print(f"Connection failed, retrying ({attempt + 1}/{self.MAX_RETRIES})...")
                time.sleep(2 ** attempt)

    def _make_request(self, url: str) -> dict:
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req) as response:
                status = response.status
                data = json.loads(response.read().decode())
                if status >= 400:
                    raise APIError(status, data.get("error", "Unknown error"))
                return data
        except urllib.error.HTTPError as e:
            if e.code == 429:
                retry_after = int(e.headers.get("Retry-After", 5))
                raise RateLimitError(retry_after)
            raise APIError(e.code, str(e.reason))

client = APIClient()
try:
    data = client.fetch("users/42")
    print(data)
except APIError as e:
    print(f"Request failed: {e}")
```

## Mejores Prácticas de Manejo de Excepciones

```python
# MAL — except simple esconde todos los errores
try:
    result = risky_operation()
except:
    pass  # ¡También captura KeyboardInterrupt!

# BIEN — captura excepciones específicas
try:
    result = risky_operation()
except (ValueError, TypeError) as e:
    logger.error(f"Invalid input: {e}")

# MAL — demasiado amplio, sin contexto
except Exception as e:
    pass

# BIEN — usa else para el camino de éxito
try:
    result = risky_operation()
except ValueError as e:
    handle_error(e)
else:
    process_result(result)

# BIEN — registrando excepciones
import logging
logger = logging.getLogger(__name__)
try:
    result = risky_operation()
except Exception:
    logger.exception("Operation failed")  # Incluye traceback completo
    raise
```

> [!WARNING]
> Nunca uses cláusulas `except:` simples a menos que relances inmediatamente. Esconden `KeyboardInterrupt` y `SystemExit`.

## Preguntas de Práctica

1. ¿Cuál es la diferencia entre `except ValueError:` y `except ValueError as e:`?
2. Escribe una excepción personalizada llamada `ValidationError` con atributos `field_name` y `message`.
3. ¿Cuándo ejecuta la cláusula `else` en un bloque try/except?
4. ¿Qué garantiza `finally`, incluso si hay un `return` en `try`?
5. ¿Cómo encadenas una excepción para mostrar la causa original (usando `from`)?
6. ¿Qué hay de malo con `except:` (except simple) y qué deberías usar en su lugar?
7. Crea una función `safe_divide(a, b)` que lance una `DivisionError` personalizada en entrada inválida.
8. ¿Cómo difiere `raise` de `raise e` al relanzar una excepción en un bloque except?
9. Enumera tres excepciones built-in comunes y cuándo ocurren típicamente.
10. Escribe un administrador de contexto (usando `try/finally`) que adquiere y libera un lock de forma segura.
