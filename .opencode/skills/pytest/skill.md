---
name: pytest
description: Runs and writes Python tests using pytest, pytest-mock, pytest-cov, and related plugins
triggers:
  - "**/*.py"
  - "**/test_*.py"
  - "**/*_test.py"
  - "**/conftest.py"
  - "**/pytest.ini"
  - "**/pyproject.toml"
  - "**/setup.cfg"
---

# Pytest Skill

## Activation Context

Activate when the user requests running, writing, or debugging Python tests using pytest.

---

## Instructions

### Step 1: Discover Project Configuration

```bash
# Check for pytest config
ls pytest.ini pyproject.toml setup.cfg conftest.py 2>/dev/null

# Check for test directories
find . -type d -name "tests" -o -name "test" 2>/dev/null

# Check installed plugins
pip list | grep pytest
```

### Step 2: Run Tests

```bash
# Basic run
pytest

# With verbose output
pytest -v

# With coverage
pytest --cov=src --cov-report=term-missing

# Run specific file
pytest tests/test_example.py

# Run specific test
pytest tests/test_example.py::test_function

# Run by marker
pytest -m "not slow"

# Parallel execution
pytest -n auto
```

### Step 3: Write Tests

Follow pytest conventions:
- Test files: `test_*.py` or `*_test.py`
- Test functions: `test_*`
- Test classes: `Test*`
- Fixtures in `conftest.py`

### Step 4: Use Fixtures

```python
import pytest

@pytest.fixture
def sample_data():
    return {"key": "value"}

@pytest.fixture
def mock_api(mocker):
    mock = mocker.patch("module.api")
    mock.return_value = {"status": "ok"}
    return mock

def test_with_data(sample_data):
    assert sample_data["key"] == "value"
```

### Step 5: Use Markers

```python
import pytest

@pytest.mark.slow
def test_heavy_computation():
    pass

@pytest.mark.parametrize("input,expected", [
    ("a", "A"),
    ("b", "B"),
])
def test_uppercase(input, expected):
    assert input.upper() == expected
```

### Step 6: Measure Coverage

```bash
# Generate coverage report
pytest --cov=src --cov-report=html

# Fail under threshold
pytest --cov=src --cov-fail-under=80

# Show missing lines
pytest --cov=src --cov-report=term-missing
```

---

## Common Patterns

### Fixture Scoping

```python
@pytest.fixture(scope="session")
def db_connection():
    # Shared across all tests in session
    return create_connection()

@pytest.fixture(scope="module")
def api_client():
    # Shared across all tests in module
    return APIClient()

@pytest.fixture(scope="function")
def temp_file(tmp_path):
    # Fresh for each test
    return tmp_path / "test.txt"
```

### Mocking

```python
def test_with_mock(mocker):
    # Patch a function
    mock_func = mocker.patch("module.function")
    mock_func.return_value = 42
    assert module.function() == 42

    # Patch a class method
    mock_class = mocker.patch("module.MyClass.method")
    mock_class.return_value = "mocked"

    # Spy on calls
    spy = mocker.spy(module, "function")
    module.function()
    spy.assert_called_once()
```

### Parametrize

```python
@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
])
def test_double(input, expected):
    assert input * 2 == expected
```

### Exception Testing

```python
def test_raises_exception():
    with pytest.raises(ValueError, match="invalid"):
        raise ValueError("invalid input")
```

---

## Output Format

Test results follow pytest format:

```
tests/test_example.py::test_one PASSED
tests/test_example.py::test_two FAILED

=================================== FAILURES ===================================
tests/test_example.py::test_two
    assert 1 == 2
```

---

## Quality Rules

- Rule 1: All tests must be deterministic
- Rule 2: Tests must not depend on execution order
- Rule 3: Fixtures must be properly scoped
- Rule 4: Mocks must be cleaned up after tests
- Rule 5: Coverage threshold must be met

---

## Reference

See `references/pytest-guide.md` for more details.
