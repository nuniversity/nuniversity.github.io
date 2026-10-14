---
title: "Escribir tus primeras pruebas"
description: "Aprende los fundamentos de pytest: escribir pruebas, usar aserciones, crear fixtures y organizar suites de pruebas"
order: 2
duration: "50 min"
difficulty: "intermediate"
---

# Escribir tus primeras pruebas

Ahora que entiendes la mentalidad TDD, es hora de escribir pruebas reales. Usaremos **pytest** — el framework de pruebas más popular de Python — para construir una base sólida de pruebas.

## ¿Por qué pytest?

| Característica | pytest | unittest (integrado) |
|---------|--------|-------------------|
| Sintaxis | Sentencias `assert` simples | `self.assertEqual()`, `self.assertTrue()` |
| Fixtures | Modulares, con inyección de dependencias | Métodos `setUp()` / `tearDown()` |
| Descubrimiento de pruebas | Automático por convención de nombres | Definición manual de la suite |
| Plugins | Más de 1000 plugins del ecosistema | Extensiones integradas limitadas |
| Parametrización | `@pytest.mark.parametrize` | `subTest()` o bucles manuales |
| Introspección de aserciones | Mensajes de fallo detallados | Aprobado/fallido básico |

```python
# unittest style (built-in)
import unittest

class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)

# pytest style (cleaner)
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
```

## Configurar pytest

```bash
# Install pytest
pip install pytest

# Verify installation
pytest --version

# Run tests in current directory
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest test_calculator.py -v

# Stop on first failure
pytest -x

# Run tests matching a pattern
pytest -k "calculator"
```

### Estructura del proyecto

Organiza tus pruebas con claridad:

```
project/
├── src/
│   ├── __init__.py
│   ├── calculator.py
│   └── user_service.py
├── tests/
│   ├── __init__.py
│   ├── test_calculator.py
│   ├── test_user_service.py
│   └── conftest.py          # Shared fixtures
├── setup.py
└── pytest.ini               # pytest configuration
```

Crea un archivo `pytest.ini` con la configuración:

```ini
[pytest]
testpaths = tests
pythonpath = src
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    smoke: marks tests as smoke tests
```

## Aserciones básicas en pytest

pytest usa el `assert` integrado de Python con una **introspección detallada** — cuando una aserción falla, pytest te muestra los valores de todas las expresiones implicadas.

```python
# test_assertions.py

def test_equality():
    """Test equality assertions."""
    assert 2 + 2 == 4
    assert "hello" == "hello"
    assert [1, 2, 3] == [1, 2, 3]

def test_inequality():
    """Test inequality assertions."""
    assert 2 + 2 != 5
    assert "hello" != "world"

def test_truthiness():
    """Test boolean assertions."""
    assert True
    assert 1            # Truthy
    assert [1, 2]       # Non-empty list
    assert not False
    assert not 0        # Falsy
    assert not ""       # Empty string
    assert not []       # Empty list

def test_none():
    """Test None assertions."""
    result = get_nothing()
    assert result is None
    assert result is not None  # Would fail

def test_comparisons():
    """Test comparison assertions."""
    assert 5 > 3
    assert 5 >= 5
    assert 10 < 20
    assert 10 <= 10
    assert 0 < len("hello") < 10

def test_container():
    """Test container assertions."""
    assert "world" in "hello world"
    assert 42 in [42, 43, 44]
    assert "key" in {"key": "value"}
    assert 99 not in [1, 2, 3]

def test_floats():
    """Test floating point assertions."""
    assert 0.1 + 0.2 == pytest.approx(0.3)
    assert 1.0 / 3.0 == pytest.approx(0.3333, rel=1e-3)

def test_exceptions():
    """Test exception assertions."""
    import pytest
    with pytest.raises(ZeroDivisionError):
        1 / 0

    with pytest.raises(ValueError) as exc_info:
        int("not_a_number")
    assert str(exc_info.value) == "invalid literal for int() with base 10: 'not_a_number'"

def get_nothing():
    return None
```

### Precisión de coma flotante

```python
import pytest

class TestFloatComparisons:
    def test_approx_default(self):
        """Default tolerance is 1e-6 relative."""
        assert 0.1 + 0.2 == pytest.approx(0.3)

    def test_approx_absolute(self):
        """Set absolute tolerance."""
        assert 0.12345 == pytest.approx(0.12346, abs=1e-4)

    def test_approx_relative(self):
        """Set relative tolerance."""
        assert 1000.0 == pytest.approx(1001.0, rel=1e-2)
```

> [!WARNING]
> Nunca uses `==` para comparar números de coma flotante. Usa `pytest.approx()` o `math.isclose()`. El clásico `0.1 + 0.2 == 0.3` se evalúa como `False` debido a la representación de coma flotante IEEE 754.

## Flujo de las pruebas con pytest

```mermaid
sequenceDiagram
    participant Dev as Desarrollador
    participant Py as Ejecutor de pytest
    participant File as Archivo de pruebas
    participant Fix as Fixtures
    participant Code as Código de producción
    
    Dev->>Py: pytest -v
    Py->>File: Descubre archivos test_*.py
    File->>Py: Encontradas 3 funciones de prueba
    
    loop Para cada función de prueba
        Py->>Fix: Prepara fixtures (scope=function)
        Fix->>Py: Devuelve los valores de las fixtures
        Py->>Code: Ejecuta la función de prueba
        Code->>Py: Devuelve el resultado
        Py->>Fix: Finaliza las fixtures
        Py->>Py: Registra aprobada/fallida
    end
    
    Py->>Dev: Resumen: 3 aprobadas, 0 fallidas
```

## Fixtures: las dependencias de prueba bien resueltas

Las fixtures reemplazan `setUp()` / `tearDown()` de unittest con un enfoque más limpio y modular:

```python
# conftest.py — shared across all test files
import pytest
import tempfile
import os

@pytest.fixture
def sample_data():
    """Provide sample data for tests."""
    return {"name": "Alice", "age": 30, "email": "alice@example.com"}

@pytest.fixture
def temp_directory():
    """Create a temporary directory for file tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir
    # Directory is automatically cleaned up

@pytest.fixture
def db_connection():
    """Setup and teardown a database connection."""
    conn = create_connection(":memory:")
    yield conn
    conn.close()

# test_fixtures.py
def test_sample_data(sample_data):
    """Using the fixture from conftest."""
    assert sample_data["name"] == "Alice"
    assert sample_data["age"] == 30

def test_temp_file_creation(temp_directory):
    """Using temp_directory fixture."""
    test_file = os.path.join(temp_directory, "test.txt")
    with open(test_file, "w") as f:
        f.write("hello")
    assert os.path.exists(test_file)
```

### Ámbitos de las fixtures

| Ámbito | Cuándo se crea | Cuándo se destruye | Caso de uso |
|-------|-------------|----------------|----------|
| `function` (por defecto) | Antes de cada prueba | Después de cada prueba | Por defecto, el más común |
| `class` | Antes de la primera prueba de la clase | Después de la última prueba de la clase | Recursos compartidos de la clase |
| `module` | Antes de la primera prueba del módulo | Después de la última prueba del módulo | Configuración a nivel de módulo |
| `package` | Antes de la primera prueba del paquete | Después de la última prueba del paquete | Configuración a nivel de paquete |
| `session` | Antes de la primera prueba de la sesión | Después de la última prueba de la sesión | Recursos costosos (base de datos) |

```python
@pytest.fixture(scope="session")
def database():
    """Create database once per test session."""
    db = Database(":memory:")
    db.initialize()
    yield db
    db.close()

@pytest.fixture(scope="module")
def api_client():
    """Create API client once per module."""
    return APIClient(base_url="https://api.example.com")

@pytest.fixture(scope="function")
def fresh_user(db_connection):
    """Create a fresh user for each test."""
    user = User.create(db_connection, "test_user")
    yield user
    User.delete(db_connection, user.id)
```

> [!TIP]
> Usa `scope="session"` para los recursos caros de crear (conexiones a bases de datos, clientes de API). Usa `scope="function"` (por defecto) para todo lo demás y mantén las pruebas aisladas.

### Composición de fixtures

Las fixtures pueden depender de otras fixtures:

```python
@pytest.fixture
def user_data():
    """Base user data."""
    return {"username": "john_doe", "email": "john@example.com"}

@pytest.fixture
def admin_user(user_data):
    """Create admin user by extending base data."""
    data = user_data.copy()
    data["role"] = "admin"
    data["permissions"] = ["read", "write", "delete"]
    return data

@pytest.fixture
def guest_user(user_data):
    """Create guest user by extending base data."""
    data = user_data.copy()
    data["role"] = "guest"
    data["permissions"] = ["read"]
    return data

def test_admin_has_delete_permission(admin_user):
    assert "delete" in admin_user["permissions"]

def test_guest_read_only(guest_user):
    assert "delete" not in guest_user["permissions"]
```

## Pruebas parametrizadas

Prueba múltiples escenarios con una sola función de prueba:

```python
import pytest

# Single parameter
@pytest.mark.parametrize("input_value", [1, 2, 3, 4, 5])
def test_positive_numbers(input_value):
    assert input_value > 0

# Multiple parameters
@pytest.mark.parametrize("a, b, expected", [
    (1, 1, 2),
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
    (100, 200, 300),
])
def test_addition(a, b, expected):
    assert a + b == expected

# Combine with fixtures
@pytest.mark.parametrize("item, quantity, expected_total", [
    ("apple", 3, 3.00),
    ("banana", 2, 1.50),
    ("apple", 0, 0.00),
])
def test_cart_item_total(item, quantity, expected_total, price_map):
    cart = ShoppingCart(price_map)
    cart.add_item(item, quantity)
    assert cart.total() == pytest.approx(expected_total)

# Test a function with many edge cases
def is_even(n: int) -> bool:
    return n % 2 == 0

@pytest.mark.parametrize("n, expected", [
    (0, True),
    (1, False),
    (2, True),
    (3, False),
    (-2, True),
    (-3, False),
    (999, False),
    (1000, True),
])
def test_is_even(n, expected):
    assert is_even(n) == expected
```

### Parametrize con IDs para la legibilidad

```python
@pytest.mark.parametrize("a, b, expected", [
    pytest.param(2, 3, 5, id="positive_positive"),
    pytest.param(-1, 1, 0, id="negative_positive"),
    pytest.param(0, 0, 0, id="zero_zero"),
])
def test_add(a, b, expected):
    assert a + b == expected

# Output:
# test_add[positive_positive] PASSED
# test_add[negative_positive] PASSED
# test_add[zero_zero] PASSED
```

## Marcadores: categorizar las pruebas

```python
import pytest

@pytest.mark.slow
def test_large_dataset_processing():
    """This test takes a long time."""
    data = generate_large_dataset(1_000_000)
    result = process_data(data)
    assert len(result) == 1_000_000

@pytest.mark.integration
def test_database_connection():
    """This test requires a database."""
    conn = connect_to_database()
    assert conn.is_connected

@pytest.mark.smoke
def test_critical_feature():
    """Smoke test for critical path."""
    assert critical_function() == "OK"

@pytest.mark.xfail(reason="Known bug #1234")
def test_known_issue():
    """Test expected to fail."""
    assert buggy_function() == 42

@pytest.mark.skip(reason="Not implemented yet")
def test_future_feature():
    """Test for future implementation."""
    assert future_function() == True

@pytest.mark.skipif(sys.version_info < (3, 10), reason="Requires Python 3.10+")
def test_python_10_feature():
    """Python 3.10+ specific feature."""
    match_statement_test()
```

```bash
# Run only slow tests
pytest -m slow

# Run everything except slow tests
pytest -m "not slow"

# Run smoke or integration tests
pytest -m "smoke or integration"

# Run tests that are not slow and not integration
pytest -m "not slow and not integration"
```

## Pruebas con dependencias externas

```python
# src/weather_service.py
import requests

class WeatherService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.weather.com"

    def get_temperature(self, city: str) -> float:
        response = requests.get(
            f"{self.base_url}/current",
            params={"city": city, "api_key": self.api_key},
        )
        response.raise_for_status()
        return response.json()["temperature"]
```

```python
# Using monkeypatch to mock requests
import pytest

def test_get_temperature(monkeypatch):
    """Mock external API call."""
    def mock_get(url, params=None):
        class MockResponse:
            def raise_for_status(self):
                pass

            def json(self):
                return {"temperature": 25.5}

        return MockResponse()

    monkeypatch.setattr(requests, "get", mock_get)

    service = WeatherService(api_key="test_key")
    temp = service.get_temperature("London")
    assert temp == 25.5
```

> [!NOTE]
> `monkeypatch` es una fixture integrada de pytest. Úsala para modificar temporalmente objetos, diccionarios o variables de entorno durante las pruebas.

## El archivo conftest.py

El archivo `conftest.py` es el lugar central para la configuración compartida de las pruebas:

```python
# tests/conftest.py
import pytest
from typing import Generator

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Runs before every test automatically."""
    print("\n--- Test Setup ---")
    yield
    print("--- Test Teardown ---")

@pytest.fixture
def price_map() -> dict:
    return {
        "apple": 1.00,
        "banana": 0.75,
        "orange": 1.25,
        "milk": 3.50,
    }

@pytest.fixture
def sample_cart(price_map) -> "ShoppingCart":
    from src.cart import ShoppingCart
    cart = ShoppingCart(price_map)
    cart.add_item("apple", 2)
    cart.add_item("banana", 3)
    return cart

# Hook to modify pytest output
def pytest_report_header():
    """Add custom info to pytest header."""
    return "Running tests for Shopping Cart project"

def pytest_runtest_setup(item):
    """Custom setup logic before each test."""
    if "slow" in item.keywords:
        print(f"\nRunning slow test: {item.name}")
```

```mermaid
flowchart TD
    A["pytest descubre las pruebas"] --> B["conftest.py cargado"]
    B --> C["Fixtures con ámbito de sesión"]
    C --> D["Fixtures con ámbito de módulo"]
    D --> E["Para cada función de prueba:"]
    E --> F["Fixtures con ámbito de función"]
    F --> G["Ejecutar la prueba"]
    G --> H{"¿Pasó la prueba?"}
    H -->|"Sí"| I["Finalizar fixtures"]
    H -->|"No"| J["Informar detalles del fallo"]
    J --> I
    I --> K["Siguiente prueba"]
    K --> E
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
    style J fill:#ffcdd2
    style K fill:#f3e5f5
```

## Ejecutar pruebas: patrones habituales

```bash
# Basic run
pytest

# Verbose output
pytest -v

# Show local variables in tracebacks
pytest --showlocals

# No capture (see print statements)
pytest -s

# Stop after first 2 failures
pytest --maxfail=2

# Run tests by keyword
pytest -k "calculate"

# Run tests by marker
pytest -m "slow"

# Generate JUnit XML report
pytest --junitxml=report.xml

# Fail on warnings
pytest -W error

# Collect tests but don't run them
pytest --collect-only

# Re-run last failed tests first
pytest --ff

# Run tests in parallel (needs pytest-xdist)
pytest -n auto
```

### Archivos de configuración

Además de `pytest.ini`, puedes usar `pyproject.toml`:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["src"]
python_files = "test_*.py"
python_functions = "test_*"
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration",
]
filterwarnings = [
    "error",
    "ignore::DeprecationWarning",
]
```

## Ejercicios de práctica

1. **Instala y configura**: Instala pytest y crea un `pytest.ini` que busque las pruebas en un directorio `tests/` con `src/` en el path de Python.

2. **Escribe aserciones**: Crea un archivo de pruebas con pruebas para una función `multiply(a, b)`. Cubre casos positivos, negativos, cero y de coma flotante.

3. **Construye una calculadora**: Escribe pruebas parametrizadas para una clase `Calculator` con `add`, `subtract`, `multiply` y `divide`. Prueba al menos 8 combinaciones de parámetros.

4. **Fixture de archivo**: Escribe una fixture que cree un archivo temporal con contenido específico. Escribe una prueba que lea el archivo y verifique su contenido.

5. **Simula un servicio de API**: Crea una clase `UserService` que llame a una API externa. Escribe pruebas que usen `monkeypatch` para simular la llamada a la API.

6. **Categoriza las pruebas**: Usa marcadores para etiquetar pruebas como `unit`, `integration` o `slow`. Verifica que `pytest -m "integration"` ejecute solo las pruebas correctas.

7. **Prueba el manejo de excepciones**: Escribe pruebas para una función `validate_age(age)` que lance `ValueError` para edades negativas y `TypeError` para entradas que no sean enteras. Prueba los dos tipos de error.

8. **Construye una suite de pruebas**: A partir del siguiente código, escribe una suite de pruebas completa:
   ```python
   class BankAccount:
       def __init__(self, owner: str, balance: float = 0.0):
           self.owner = owner
           self._balance = balance

       @property
       def balance(self) -> float:
           return self._balance

       def deposit(self, amount: float) -> float:
           if amount <= 0:
               raise ValueError("Amount must be positive")
           self._balance += amount
           return self._balance

       def withdraw(self, amount: float) -> float:
           if amount <= 0:
               raise ValueError("Amount must be positive")
           if amount > self._balance:
               raise ValueError("Insufficient funds")
           self._balance -= amount
           return self._balance
   ```

## Resumen

- **pytest** usa sentencias `assert` simples con un reporte de errores rico
- **Las fixtures** reemplazan `setUp()`/`tearDown()` con dependencias modulares y con ámbito
- **Parametrize** reduce la duplicación de código al probar múltiples entradas
- **Los marcadores** categorizan las pruebas para una ejecución selectiva
- **conftest.py** centraliza las fixtures y hooks compartidos
- **monkeypatch** reemplaza objetos en tiempo de ejecución para pruebas aisladas
- **La configuración** mediante `pytest.ini` o `pyproject.toml` controla el descubrimiento de pruebas

> [!SUCCESS]
> Ya tienes todos los fundamentos de pytest: aserciones, fixtures, parametrización, marcadores y mocking. Este conjunto de herramientas te servirá en todos los ciclos de TDD que escribas.
