---
title: "Exceptions and Error Handling"
description: "Handle errors gracefully with try/except/else/finally, raise custom exceptions, and understand Python's exception hierarchy"
order: 3
duration: "40 minutes"
difficulty: "intermediate"
---

# Exceptions and Error Handling

Exceptions are Python's mechanism for handling errors at runtime. Instead of crashing, you can catch, inspect, and respond to errors gracefully.

## The Exception Hierarchy

All exceptions inherit from `BaseException`:

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
> Always catch `Exception`, never `BaseException`. `BaseException` includes `SystemExit` and `KeyboardInterrupt` which you rarely want to suppress.

## Basic try/except

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

## The Full try/except/else/finally Block

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

| Clause | When It Runs | Purpose |
|--------|-------------|---------|
| `try` | Always first | Code that might raise |
| `except` | On matching exception | Error recovery |
| `else` | If no exception in `try` | Success path (avoids catching unintended errors) |
| `finally` | Always (even on return/break) | Cleanup (close files, release locks) |

## Catching Multiple Exceptions

```python
try:
    value = int(input("Enter index: "))
    items = [10, 20, 30]
    print(items[value] / value)
except (ValueError, IndexError, ZeroDivisionError) as e:
    print(f"Error: {e}")
    print(f"Type: {type(e).__name__}")
```

## Exception Objects and Tracebacks

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

## Raising Exceptions

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

### Re-raising Exceptions

```python
def process_file(path: str):
    try:
        with open(path) as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"Attempted to read {path}, but it was missing")
        raise  # Re-raise the same exception

try:
    data = process_file("missing.txt")
except FileNotFoundError:
    print("Could not process the file at all")
```

> [!WARNING]
> Bare `raise` preserves the original traceback. `raise e` creates a new one. Use bare `raise` for re-raising.

## Chaining Exceptions

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
    print(f"Caused by: {e.__cause__}")  # Original ConnectionError
```

## Creating Custom Exceptions

```python
class BankError(Exception):
    """Base exception for bank operations."""
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
| Rule | Why |
|------|-----|
| Inherit from `Exception`, not `BaseException` | Avoids catching system-level events |
| Name custom exceptions with `Error` suffix | Clear naming convention (e.g., `ValidationError`) |
| Store relevant context as attributes | Enables programmatic error handling |
| Keep exception hierarchy shallow | Easy to catch broad or specific as needed |

## Common Exception Types

| Exception | When Raised | Common Fix |
|-----------|------------|------------|
| `ValueError` | Wrong value type | Validate input before use |
| `TypeError` | Wrong operand type | Check types with `isinstance` |
| `IndexError` | Sequence index out of range | Check `len()` before indexing |
| `KeyError` | Missing dict key | Use `.get()` with default |
| `AttributeError` | Object lacks attribute | Check with `hasattr()` or use `getattr(obj, attr, default)` |
| `FileNotFoundError` | File doesn't exist | Check `os.path.exists()` first |
| `StopIteration` | Iterator exhausted | Use `for` loop instead of manual `next()` |
| `OSError` | System-level I/O error | Check permissions, disk space |

## Real-World: Robust API Client

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

## Exception Handling Best Practices

```python
# BAD — bare except hides all errors
try:
    result = risky_operation()
except:
    pass  # Also catches KeyboardInterrupt!

# GOOD — catch specific exceptions
try:
    result = risky_operation()
except (ValueError, TypeError) as e:
    logger.error(f"Invalid input: {e}")

# BAD — too broad, no context
except Exception as e:
    pass

# GOOD — use else for success path
try:
    result = risky_operation()
except ValueError as e:
    handle_error(e)
else:
    process_result(result)

# GOOD — logging exceptions
import logging
logger = logging.getLogger(__name__)
try:
    result = risky_operation()
except Exception:
    logger.exception("Operation failed")  # Includes full traceback
    raise
```

> [!WARNING]
> Never use bare `except:` clauses unless you immediately re-raise. They hide `KeyboardInterrupt` and `SystemExit`.

## Practice Questions

1. What is the difference between `except ValueError:` and `except ValueError as e:`?
2. Write a custom exception called `ValidationError` with `field_name` and `message` attributes.
3. When does the `else` clause in a try/except block execute?
4. What does `finally` guarantee, even if there's a `return` in `try`?
5. How do you chain an exception to show the original cause (using `from`)?
6. What is wrong with `except:` (bare except) and what should you use instead?
7. Create a function `safe_divide(a, b)` that raises custom `DivisionError` on invalid input.
8. How does `raise` differ from `raise e` when re-raising an exception in an except block?
9. List three common built-in exceptions and when they typically occur.
10. Write a context manager (using `try/finally`) that acquires and releases a lock safely.
