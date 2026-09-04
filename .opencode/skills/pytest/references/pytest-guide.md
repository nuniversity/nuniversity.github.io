# Pytest Quick Reference

## Installation

```bash
pip install pytest pytest-mock pytest-cov pytest-xdist pytest-asyncio
```

## Running Tests

```bash
# Run all tests
pytest

# Verbose output
pytest -v

# Specific file
pytest tests/test_example.py

# Specific test
pytest tests/test_example.py::test_function

# Specific class
pytest tests/test_example.py::TestMyClass

# By marker
pytest -m "not slow"

# Parallel
pytest -n auto

# Stop on first failure
pytest -x

# Show local variables on failure
pytest -l
```

## Fixtures

```python
import pytest

@pytest.fixture
def fixture():
    return "data"

@pytest.fixture(scope="session")
def session_fixture():
    return "shared"

@pytest.fixture(autouse=True)
def auto_fixture():
    # Runs for every test
    pass

@pytest.fixture
def mock_api(mocker):
    return mocker.patch("module.api")
```

## Parametrize

```python
@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
])
def test_double(input, expected):
    assert input * 2 == expected

@pytest.mark.parametrize("input", [1, 2, 3], ids=["one", "two", "three"])
def test_ids(input):
    assert input > 0
```

## Markers

```python
@pytest.mark.slow
def test_slow():
    pass

@pytest.mark.skip(reason="Not implemented")
def test_skip():
    pass

@pytest.mark.xfail(reason="Known bug")
def test_xfail():
    assert False

@pytest.mark.parametrize("x", [1, 2, 3])
def test_param(x):
    pass
```

## Mocking

```python
def test_mock(mocker):
    # Patch
    mock = mocker.patch("module.function")
    mock.return_value = 42
    assert module.function() == 42

    # Spy
    spy = mocker.spy(module, "function")
    module.function()
    spy.assert_called_once()

    # Stub
    mocker.stub("module.function")
```

## Assertions

```python
# Equality
assert a == b

# Exception
with pytest.raises(ValueError):
    raise ValueError("msg")

# Warning
with pytest.warns(DeprecationWarning):
    warnings.warn("deprecated")

# Approximate
assert 0.1 + 0.2 == pytest.approx(0.3)
```

## Coverage

```bash
# Basic coverage
pytest --cov=src

# With report
pytest --cov=src --cov-report=html

# Fail under threshold
pytest --cov=src --cov-fail-under=80
```

## Configuration

### pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
    "slow: marks tests as slow",
    "integration: marks integration tests",
]
addopts = "-v --tb=short"
```

### pytest.ini

```ini
[pytest]
testpaths = tests
markers =
    slow: marks tests as slow
addopts = -v
```

## Common Commands

```bash
# List tests
pytest --collect-only

# Show fixtures
pytest --fixtures

# Re-run last failure
pytest --lf

# Run failed first
pytest --ff

# Verbose with locals
pytest -v -l
```
