---
title: "Unit Testing"
description: "Write reliable tests with unittest and pytest: assertions, test fixtures, mocking, and test-driven development patterns"
order: 9
duration: "45 minutes"
difficulty: "intermediate"
---

# Unit Testing

Testing ensures your code works correctly and stays correct as it evolves. Python's standard library includes `unittest`, and the community widely uses `pytest` for its simplicity and power.

## Why Test?

| Benefit | Description |
|---------|-------------|
| Catch regressions | Changes that break existing behavior are detected immediately |
| Document behavior | Tests serve as executable documentation |
| Enable refactoring | Confidently restructure code knowing tests guard correctness |
| Design improvement | Testable code tends to be better factored |

## The `unittest` Module

```python
import unittest

def add(a: int, b: int) -> int:
    return a + b

class TestAdd(unittest.TestCase):
    def test_add_positive(self):
        self.assertEqual(add(2, 3), 5)

    def test_add_negative(self):
        self.assertEqual(add(-1, 1), 0)

    def test_add_zero(self):
        self.assertEqual(add(0, 0), 0)

if __name__ == "__main__":
    unittest.main()
```

```bash
python -m unittest test_math.py
python -m unittest test_math.TestAdd
python -m unittest test_math.TestAdd.test_add_positive
```

## Common `assert` Methods

| Method | Checks |
|--------|--------|
| `assertEqual(a, b)` | `a == b` |
| `assertNotEqual(a, b)` | `a != b` |
| `assertTrue(x)` | `bool(x) is True` |
| `assertFalse(x)` | `bool(x) is False` |
| `assertIs(a, b)` | `a is b` |
| `assertIsNone(x)` | `x is None` |
| `assertIn(a, b)` | `a in b` |
| `assertNotIn(a, b)` | `a not in b` |
| `assertRaises(Exc, func, *args)` | `func(*args)` raises `Exc` |
| `assertAlmostEqual(a, b)` | Floats within tolerance (7 decimal places) |
| `assertIsInstance(obj, cls)` | `isinstance(obj, cls)` |

```python
import unittest

class TestAssertions(unittest.TestCase):
    def test_assertions(self):
        self.assertAlmostEqual(0.1 + 0.2, 0.3)  # Floats!
        self.assertRaises(ValueError, int, "not_a_number")
        self.assertIn("key", {"key": 42})
        self.assertIsInstance(3.14, float)

    def test_assert_raises_context_manager(self):
        with self.assertRaises(ZeroDivisionError):
            1 / 0

    def test_assert_raises_with_message(self):
        with self.assertRaisesRegex(ValueError, "invalid"):
            int("invalid")
```

## Test Fixtures — `setUp` and `tearDown`

```python
import unittest
import tempfile
from pathlib import Path

class TestFileProcessor(unittest.TestCase):
    def setUp(self):
        """Create a temporary directory and test file before each test."""
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.test_file = Path(self.tmp_dir.name) / "test.txt"
        self.test_file.write_text("Hello, World!")

    def tearDown(self):
        """Clean up temporary directory after each test."""
        self.tmp_dir.cleanup()

    def test_file_exists(self):
        self.assertTrue(self.test_file.exists())

    def test_file_content(self):
        content = self.test_file.read_text()
        self.assertEqual(content, "Hello, World!")

    def test_file_deletion(self):
        self.test_file.unlink()
        self.assertFalse(self.test_file.exists())
```

> [!NOTE]
| Method | When | Frequency |
|--------|------|-----------|
| `setUp` | Before each test method | Per test |
| `tearDown` | After each test method | Per test |
| `setUpClass` | Before all tests in class | Once per class |
| `tearDownClass` | After all tests in class | Once per class |

```python
class TestDatabase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("Setting up database connection...")
        cls.db = {"alice": 100, "bob": 200}  # Simulated DB

    @classmethod
    def tearDownClass(cls):
        print("Closing database connection...")
        cls.db = None

    def test_get_balance(self):
        self.assertEqual(self.db["alice"], 100)

    def test_update_balance(self):
        self.db["alice"] = 150
        self.assertEqual(self.db["alice"], 150)
```

## Mocking with `unittest.mock`

Mock objects replace real dependencies to isolate the code under test:

```python
from unittest.mock import Mock, patch
import unittest

class PaymentProcessor:
    def __init__(self, api_client):
        self.api = api_client

    def process_payment(self, user_id: str, amount: float) -> dict:
        user = self.api.get_user(user_id)
        if not user.get("active"):
            raise ValueError("User not active")
        result = self.api.charge(user_id, amount)
        self.api.send_receipt(user_id, result["transaction_id"])
        return result

class TestPaymentProcessor(unittest.TestCase):
    def test_process_payment_success(self):
        mock_api = Mock()
        mock_api.get_user.return_value = {"id": "42", "active": True}
        mock_api.charge.return_value = {"transaction_id": "txn_123", "status": "success"}

        processor = PaymentProcessor(mock_api)
        result = processor.process_payment("42", 50.0)

        self.assertEqual(result["status"], "success")
        mock_api.get_user.assert_called_once_with("42")
        mock_api.charge.assert_called_once_with("42", 50.0)
        mock_api.send_receipt.assert_called_once_with("42", "txn_123")
```

### Using `patch` — temporarily replacing objects

```python
from unittest.mock import patch
import unittest
import requests

def fetch_user(user_id: int) -> dict:
    response = requests.get(f"https://api.example.com/users/{user_id}")
    response.raise_for_status()
    return response.json()

class TestFetchUser(unittest.TestCase):
    @patch("requests.get")
    def test_fetch_user_success(self, mock_get):
        mock_response = Mock()
        mock_response.json.return_value = {"id": 1, "name": "Alice"}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = fetch_user(1)
        self.assertEqual(result["name"], "Alice")
        mock_get.assert_called_once_with("https://api.example.com/users/1")

    @patch("requests.get")
    def test_fetch_user_http_error(self, mock_get):
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.HTTPError("Not Found")
        mock_get.return_value = mock_response

        with self.assertRaises(requests.HTTPError):
            fetch_user(999)
```

> [!WARNING]
> Always patch where the object IS LOOKED UP, not where it IS DEFINED. Use `@patch("module.function")`, not `@patch("library.module.function")`.

### Mock Side Effects

```python
from unittest.mock import Mock

# Alternating return values
mock = Mock()
mock.side_effect = [1, 2, 3]
print(mock())  # 1
print(mock())  # 2
print(mock())  # 3

# Raising exceptions
mock.side_effect = ValueError("Bad value")
with self.assertRaises(ValueError):
    mock()

# Callable: compute return based on args
mock.side_effect = lambda x: x * 2
print(mock(5))  # 10
print(mock(10)) # 20
```

## Testing with `pytest`

```python
# test_math_pytest.py
def add(a: int, b: int) -> int:
    return a + b

def test_add_positive():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-1, 1) == 0

def test_add_floats():
    assert add(0.1, 0.2) == pytest.approx(0.3)
```

```bash
pytest                          # Discover and run all tests
pytest -v                       # Verbose output
pytest -k "positive"            # Run tests matching keyword
pytest -x                       # Stop on first failure
pytest --tb=short               # Shorter tracebacks
pytest test_math_pytest.py      # Run specific file
pytest --cov=src                # With coverage (pip install pytest-cov)
```

### pytest Fixtures

```python
import pytest

@pytest.fixture
def sample_data():
    return {"name": "Alice", "age": 30}

@pytest.fixture
def db_connection():
    conn = create_database_connection(":memory:")
    yield conn
    conn.close()

def test_with_fixtures(sample_data, db_connection):
    assert sample_data["name"] == "Alice"
    result = db_connection.query("SELECT 1")
    assert result is not None
```

### pytest Parameterization

```python
import pytest

@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
    (100, 200, 300),
])
def test_add(a: int, b: int, expected: int):
    assert add(a, b) == expected

# Fixture parameterization
@pytest.fixture(params=["json", "xml", "yaml"])
def parser(request):
    if request.param == "json":
        return JSONParser()
    elif request.param == "xml":
        return XMLParser()

def test_parsing(parser):
    data = parser.parse("<root/>")
    assert data is not None
```

```mermaid
flowchart LR
    subgraph "Test Lifecycle (pytest)"
        A[Collection] --> B[Fixture setup]
        B --> C[Test execution]
        C --> D{Assertion}
        D -->|Pass| E[Fixture teardown]
        D -->|Fail| E
        E --> F[Next test]
    end
```

## Real-World: Testing a Data Pipeline

```python
# pipeline.py
import csv
from pathlib import Path

def load_csv(path: Path) -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def filter_adults(people: list[dict]) -> list[dict]:
    return [p for p in people if int(p["age"]) >= 18]

def compute_average_age(people: list[dict]) -> float:
    if not people:
        raise ValueError("Cannot compute average of empty list")
    ages = [int(p["age"]) for p in people]
    return sum(ages) / len(ages)
```

```python
# test_pipeline.py
import pytest
from pathlib import Path
from pipeline import load_csv, filter_adults, compute_average_age

class TestLoadCSV:
    def test_load_csv_success(self, tmp_path: Path):
        test_file = tmp_path / "test.csv"
        test_file.write_text("name,age\nAlice,30\nBob,15\nCarol,25\n")
        result = load_csv(test_file)
        assert len(result) == 3
        assert result[0]["name"] == "Alice"

    def test_load_csv_empty(self, tmp_path: Path):
        test_file = tmp_path / "empty.csv"
        test_file.write_text("name,age\n")
        result = load_csv(test_file)
        assert result == []

class TestFilterAdults:
    def test_filters_minors(self):
        people = [
            {"name": "Alice", "age": "30"},
            {"name": "Bob", "age": "15"},
            {"name": "Carol", "age": "25"},
        ]
        result = filter_adults(people)
        assert len(result) == 2
        assert all(p["name"] != "Bob" for p in result)

class TestComputeAverageAge:
    def test_average(self):
        people = [{"name": "A", "age": "20"}, {"name": "B", "age": "30"}]
        assert compute_average_age(people) == 25.0

    def test_empty_raises(self):
        with pytest.raises(ValueError, match="Cannot compute"):
            compute_average_age([])
```

## Test-Driven Development (TDD) Cycle

```mermaid
flowchart LR
    A[Write failing test] --> B[Write minimal code]
    B --> C{Test passes?}
    C -->|No| B
    C -->|Yes| D[Refactor code]
    D --> E[Write next test]
    E --> A
```

> [!SUCCESS]
| Principle | Why |
|-----------|-----|
| Test one thing per test | Simple debugging, clear failure messages |
| Use descriptive test names | `test_withdraw_reduces_balance` not `test_1` |
| Isolate tests | Each test should set up and tear down its own state |
| Test edge cases | Empty input, boundary values, error conditions |
| Make tests fast | Slow tests don't get run often |

## Practice Questions

1. What is the difference between `setUp` / `tearDown` and `setUpClass` / `tearDownClass`?
2. Write a `unittest.TestCase` that tests a function `is_palindrome(s: str) -> bool`.
3. What does `@patch` do, and where should you apply it relative to the module under test?
4. Write a pytest fixture that creates a temporary directory with test data files.
5. How do you use `@pytest.mark.parametrize` to test a function with multiple inputs?
6. What is the purpose of `Mock.side_effect`? Provide an example with both a list and a callable.
7. Write a test for a function that reads a file and returns its contents. Mock the file open operation.
8. What methods does `unittest.mock.Mock` provide for verifying how a mock was called?
9. How does `pytest` discover test files and functions? What naming conventions does it follow?
10. Write a full test suite (using pytest) for a `ShoppingCart` class with add, remove, and total methods.
