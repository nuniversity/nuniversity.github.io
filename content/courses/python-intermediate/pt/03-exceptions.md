---
title: "Exceções e Tratamento de Erros"
description: "Lide com erros de forma elegante com try/except/else/finally, levante exceções personalizadas e entenda a hierarquia de exceções do Python"
order: 3
duration: "40 minutos"
difficulty: "intermediário"
---

# Exceções e Tratamento de Erros

Exceções são o mecanismo do Python para lidar com erros em tempo de execução. Em vez de travar, você pode capturar, inspecionar e responder aos erros de forma elegante.

## A Hierarquia de Exceções

Todas as exceções herdam de `BaseException`:

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
> Sempre capture `Exception`, nunca `BaseException`. `BaseException` inclui `SystemExit` e `KeyboardInterrupt` que raramente se deseja suprimir.

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

## O Bloco Completo try/except/else/finally

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

| Cláusula | Quando Executa | Propósito |
|----------|---------------|-----------|
| `try` | Sempre primeiro | Código que pode levantar exceção |
| `except` | Na exceção correspondente | Recuperação de erro |
| `else` | Se nenhuma exceção no `try` | Caminho de sucesso (evita capturar erros não intencionais) |
| `finally` | Sempre (mesmo em return/break) | Limpeza (fechar arquivos, liberar locks) |

## Capturando Múltiplas Exceções

```python
try:
    value = int(input("Enter index: "))
    items = [10, 20, 30]
    print(items[value] / value)
except (ValueError, IndexError, ZeroDivisionError) as e:
    print(f"Error: {e}")
    print(f"Type: {type(e).__name__}")
```

## Objetos de Exceção e Tracebacks

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

## Levantando Exceções

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

### Re-lançando Exceções

```python
def process_file(path: str):
    try:
        with open(path) as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"Attempted to read {path}, but it was missing")
        raise  # Re-lança a mesma exceção

try:
    data = process_file("missing.txt")
except FileNotFoundError:
    print("Could not process the file at all")
```

> [!WARNING]
> `raise` simples preserva o traceback original. `raise e` cria um novo. Use `raise` simples para re-lançar.

## Encadeamento de Exceções

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

## Criando Exceções Personalizadas

```python
class BankError(Exception):
    """Exceção base para operações bancárias."""
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
| Regra | Porquê |
|------|--------|
| Herde de `Exception`, não de `BaseException` | Evita capturar eventos de nível de sistema |
| Nomeie exceções personalizadas com sufixo `Error` | Convenção de nomenclatura clara (ex.: `ValidationError`) |
| Armazene contexto relevante como atributos | Permite tratamento programático de erros |
| Mantenha a hierarquia de exceções rasa | Fácil de capturar ampla ou especificamente conforme necessário |

## Tipos Comuns de Exceção

| Exceção | Quando Levantada | Correção Comum |
|---------|-----------------|----------------|
| `ValueError` | Valor de tipo errado | Valide a entrada antes de usar |
| `TypeError` | Tipo de operando errado | Verifique tipos com `isinstance` |
| `IndexError` | Índice de sequência fora do intervalo | Verifique `len()` antes de indexar |
| `KeyError` | Chave de dicionário ausente | Use `.get()` com valor padrão |
| `AttributeError` | Objeto sem atributo | Verifique com `hasattr()` ou use `getattr(obj, attr, default)` |
| `FileNotFoundError` | Arquivo não existe | Verifique `os.path.exists()` primeiro |
| `StopIteration` | Iterador esgotado | Use loop `for` em vez de `next()` manual |
| `OSError` | Erro de E/S de nível de sistema | Verifique permissões, espaço em disco |

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

## Melhores Práticas de Tratamento de Exceções

```python
# RUIM — except simples esconde todos os erros
try:
    result = risky_operation()
except:
    pass  # Também captura KeyboardInterrupt!

# BOM — capture exceções específicas
try:
    result = risky_operation()
except (ValueError, TypeError) as e:
    logger.error(f"Invalid input: {e}")

# RUIM — muito amplo, sem contexto
except Exception as e:
    pass

# BOM — use else para o caminho de sucesso
try:
    result = risky_operation()
except ValueError as e:
    handle_error(e)
else:
    process_result(result)

# BOM — registrando exceções
import logging
logger = logging.getLogger(__name__)
try:
    result = risky_operation()
except Exception:
    logger.exception("Operation failed")  # Inclui traceback completo
    raise
```

> [!WARNING]
> Nunca use cláusulas `except:` simples a menos que você re-lance imediatamente. Elas escondem `KeyboardInterrupt` e `SystemExit`.

## Perguntas de Prática

1. Qual é a diferença entre `except ValueError:` e `except ValueError as e:`?
2. Escreva uma exceção personalizada chamada `ValidationError` com atributos `field_name` e `message`.
3. Quando a cláusula `else` em um bloco try/except executa?
4. O que `finally` garante, mesmo que haja um `return` no `try`?
5. Como você encadeia uma exceção para mostrar a causa original (usando `from`)?
6. O que há de errado com `except:` (except simples) e o que você deve usar em vez disso?
7. Crie uma função `safe_divide(a, b)` que levanta `DivisionError` personalizada em entrada inválida.
8. Como `raise` difere de `raise e` ao re-lançar uma exceção em um bloco except?
9. Liste três exceções built-in comuns e quando elas tipicamente ocorrem.
10. Escreva um gerenciador de contexto (usando `try/finally`) que adquire e libera um lock com segurança.
