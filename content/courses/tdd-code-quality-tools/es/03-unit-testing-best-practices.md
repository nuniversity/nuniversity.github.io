---
title: "Mejores prácticas de pruebas unitarias"
description: "Domina el patrón Arrange-Act-Assert, las estrategias de mocking, el aislamiento de pruebas y la escritura de pruebas unitarias mantenibles"
order: 3
duration: "55 min"
difficulty: "intermediate"
---

# Mejores prácticas de pruebas unitarias

Escribir pruebas que pasan es fácil. Escribir pruebas mantenibles, fiables y en las que se pueda confiar es un oficio. Esta lección cubre los patrones y prácticas que separan las grandes suites de pruebas de las mediocres.

## El patrón AAA: Arrange-Act-Assert

Cada prueba debería seguir tres fases claras, separadas por líneas en blanco:

```python
# AAA Pattern in action
def test_withdraw_reduces_balance():
    # Arrange
    account = BankAccount("Alice", 1000.0)

    # Act
    account.withdraw(300.0)

    # Assert
    assert account.balance == 700.0

# Poor test — phases are mixed together
def test_withdraw():
    account = BankAccount("Alice", 1000.0)
    account.withdraw(300.0)
    assert account.balance == 700.0
    account.withdraw(100.0)
    assert account.balance == 500.0
```

### Por qué importa AAA

| Aspecto | Con AAA | Sin AAA |
|--------|----------|-------------|
| **Legibilidad** | Historia clara: Given → When → Then | Varios escenarios mezclados entre sí |
| **Depuración** | Identificas en qué fase falló | No está claro si falla Arrange o Act |
| **Mantenimiento** | Cambias una fase de forma independiente | Cambiar la entrada obliga a reescribir la prueba |
| **Revisión** | El revisor entiende la intención rápidamente | El revisor tiene que analizar toda la prueba |

```python
# Good: One clear scenario per test
def test_deposit_increases_balance():
    """Given an account with $0, when I deposit $100, balance becomes $100."""
    account = BankAccount("Bob")
    account.deposit(100.0)
    assert account.balance == 100.0

def test_deposit_negative_amount_raises_error():
    """Given an account, when I deposit a negative amount, an error is raised."""
    account = BankAccount("Bob", 500.0)
    with pytest.raises(ValueError, match="Amount must be positive"):
        account.deposit(-50.0)

def test_deposit_multiple_times_accumulates():
    """Given an account, when I deposit multiple times, balance accumulates."""
    account = BankAccount("Bob")
    account.deposit(100.0)
    account.deposit(50.0)
    account.deposit(25.0)
    assert account.balance == 175.0
```

> [!TIP]
> Si tu prueba no encaja de forma natural en el patrón AAA, es señal de que la función probada está haciendo demasiado. Plantéate refactorizar el código de producción.

## ¿Una aserción por prueba? No exactamente

Un mito común: "una aserción por prueba". La regla real es **un concepto por prueba**:

```python
# BAD: Testing multiple unrelated behaviors
def test_account_operations():
    account = BankAccount("Alice", 1000.0)
    account.deposit(500.0)
    assert account.balance == 1500.0
    account.withdraw(200.0)
    assert account.balance == 1300.0
    assert account.owner == "Alice"

# GOOD: Group related assertions that test one behavior
def test_account_after_deposit():
    account = BankAccount("Alice", 1000.0)
    account.deposit(500.0)
    assert account.balance == 1500.0
    assert account.transaction_count == 1

# GOOD: Multiple assertions all confirming the same result
def test_user_creation_sets_all_fields():
    user = User(name="Alice", email="alice@test.com", age=30)
    assert user.name == "Alice"
    assert user.email == "alice@test.com"
    assert user.age == 30
    assert user.is_active is True
```

## Nombrar las pruebas: contar una historia

```python
# Descriptive test names
def test_given_empty_cart_when_add_item_then_item_count_is_one():
    cart = ShoppingCart()
    cart.add_item("apple", 1.50)
    assert cart.total_items() == 1

def test_given_item_in_cart_when_remove_item_then_item_count_is_zero():
    cart = ShoppingCart()
    cart.add_item("apple", 1.50)
    cart.remove_item("apple")
    assert cart.total_items() == 0

def test_given_expired_coupon_when_apply_discount_then_raises_error():
    cart = ShoppingCart()
    coupon = Coupon("SAVE10", expires_at=yesterday)
    with pytest.raises(CouponExpiredError):
        cart.apply_coupon(coupon)
```

| Estilo de nombrado | Ejemplo |
|-------------|---------|
| `test_[feature]` | `test_withdraw()` |
| `test_[scenario]_[expected]` | `test_overdraft_raises_error()` |
| `test_given_[context]_when_[action]_then_[result]` | `test_given_insufficient_funds_when_withdraw_then_error()` |
| `test_[method]_[condition]_[result]` | `test_divide_by_zero_raises_exception()` |

> [!SUCCESS]
> Un buen nombre de prueba elimina la necesidad de leer el cuerpo de la prueba. Cuando una compilación de CI falla, deberías saber más o menos qué se rompió solo con el nombre de la prueba.

## Mocking: aislar la unidad bajo prueba

El mocking reemplaza las dependencias reales con sustitutos controlados:

```python
from unittest.mock import Mock, patch, MagicMock
import pytest

# Example: Payment processing
class PaymentProcessor:
    def __init__(self, gateway):
        self.gateway = gateway

    def process_payment(self, user_id: int, amount: float) -> dict:
        if amount <= 0:
            raise ValueError("Amount must be positive")

        user = self.gateway.get_user(user_id)
        if not user["active"]:
            raise RuntimeError("User is not active")

        charge = self.gateway.charge(user["card_token"], amount)
        return {"status": "success", "transaction_id": charge["id"]}

# Test with Mock
def test_process_payment_success():
    # Arrange
    mock_gateway = Mock()
    mock_gateway.get_user.return_value = {
        "id": 1, "active": True, "card_token": "tok_123"
    }
    mock_gateway.charge.return_value = {
        "id": "txn_abc", "amount": 50.0, "status": "captured"
    }

    processor = PaymentProcessor(mock_gateway)

    # Act
    result = processor.process_payment(1, 50.0)

    # Assert
    assert result["status"] == "success"
    assert result["transaction_id"] == "txn_abc"
    mock_gateway.get_user.assert_called_once_with(1)
    mock_gateway.charge.assert_called_once_with("tok_123", 50.0)
```

### Mock frente a Patch frente a MagicMock

```python
from unittest.mock import Mock, patch, MagicMock, PropertyMock

# Mock — basic mock object
mock_obj = Mock()
mock_obj.some_method.return_value = 42
mock_obj.some_method(1, 2, 3)
mock_obj.some_method.assert_called_once_with(1, 2, 3)

# MagicMock — Mock with "magic methods" pre-created
mm = MagicMock()
mm.__len__.return_value = 5
assert len(mm) == 5
mm.__iter__.return_value = iter([1, 2, 3])
assert list(mm) == [1, 2, 3]

# patch — context manager for replacing attributes
with patch("module.ClassName") as MockClass:
    MockClass.return_value.some_method.return_value = 42
    instance = MockClass()
    result = instance.some_method()
    assert result == 42

# patch as decorator
@patch("module.ClassName")
def test_something(MockClass):
    MockClass.return_value.method.return_value = "mocked"
    instance = MockClass()
    assert instance.method() == "mocked"
```

```mermaid
sequenceDiagram
    participant Test as Función de prueba
    participant Unit as Unidad bajo prueba
    participant Mock as Objeto mock
    participant Real as Dependencia real
    
    Test->>Unit: Llama al método
    Unit->>Mock: Interactúa con la dependencia
    Mock->>Unit: Devuelve el valor controlado
    Unit->>Test: Devuelve el resultado
    
    Note over Test,Mock: La prueba verifica tanto el resultado como las interacciones del mock
    
    Test->>Mock: assert_called_once_with(...)
    Test->>Mock: Verifica el número de llamadas y los argumentos
    Mock->>Test: Verificación aprobada/fallida
    
    Note over Mock,Real: La dependencia real nunca se llama
```

### Cuándo (y cuándo no) usar mocks

| Usa mocks cuando... | No uses mocks cuando... |
|-------------|-------------------|
| Llamadas a API externas | Transformaciones simples de datos |
| Operaciones de base de datos | Funciones puras (misma entrada → misma salida) |
| Acceso al sistema de archivos | Validación de la lógica de negocio |
| Peticiones de red | Manipulación de cadenas |
| SDK de terceros | Operaciones matemáticas o algorítmicas |
| Código dependiente del tiempo | Métodos auxiliares internos |

```python
# APPROPRIATE mock: external HTTP call
def test_get_weather():
    mock_response = Mock()
    mock_response.json.return_value = {"temp": 22.5}
    mock_response.raise_for_status.return_value = None

    with patch("requests.get", return_value=mock_response):
        service = WeatherService("fake_key")
        temp = service.get_temperature("London")
        assert temp == 22.5

# INAPPROPRIATE mock: simple math
def test_discount_calculation():
    # Don't mock this! It's a pure function
    result = calculate_discount(100.0, 0.1)
    assert result == 90.0

# BETTER: Don't mock pure logic, test it directly
def test_is_valid_email():
    assert is_valid_email("user@example.com") is True
    assert is_valid_email("not-an-email") is False
    assert is_valid_email("") is False
```

> [!WARNING]
> El sobre-mocking es un antipatrón habitual. Si haces mock de todo, tus pruebas se vuelven frágiles: se rompen cuando cambia la implementación, no cuando se rompe el comportamiento. Haz mock de los límites, no de los internos.

## Aislamiento de pruebas: sin estado compartido

Las pruebas nunca deben depender unas de otras:

```python
# BAD: Tests share state through global variable
items = []

def test_add_item():
    items.append("apple")
    assert len(items) == 1

def test_add_another_item():
    items.append("banana")
    assert len(items) == 1  # Fails! items already has "apple"

# GOOD: Each test creates its own state
def test_add_item():
    cart = ShoppingCart()
    cart.add_item("apple")
    assert cart.total_items() == 1

def test_add_another_item():
    cart = ShoppingCart()
    cart.add_item("banana")
    assert cart.total_items() == 1  # Passes — fresh cart
```

### Reglas de aislamiento

| Regla | Por qué |
|------|-----|
| Sin estado mutable compartido | Las pruebas pasan a depender del orden |
| Sin registros de base de datos compartidos | Los datos de la prueba A corrompen la prueba B |
| Sin variables globales | Una prueba contamina el estado de otra |
| Sin efectos secundarios en el sistema de archivos | La creación de archivos de la prueba A rompe la prueba B |
| Sin lógica dependiente del tiempo | Las pruebas fallan a medianoche o los lunes |
| Fixtures frescas por prueba | `scope="function"` es tu valor por defecto |

```python
# BAD: Shared mutable fixture
test_users = []

@pytest.fixture
def user():
    test_users.append(User("Alice"))
    return test_users[-1]

# GOOD: Fresh state per test
@pytest.fixture
def user():
    return User("Alice")  # Fresh object every time

# BAD: Tests affect each other through DB
def test_create_user(db):
    db.execute("INSERT INTO users VALUES ('Alice')")
    assert db.query("SELECT count(*) FROM users")[0][0] == 1

def test_another_user(db):
    # This will FAIL if test_create_user ran first
    assert db.query("SELECT count(*) FROM users")[0][0] == 0
```

## Probar los casos límite

Las pruebas más valiosas suelen ser los casos límite:

```python
# Edge case patterns
def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        compute(10, 0)

def test_empty_input():
    assert process_list([]) == []

def test_single_element():
    assert process_list([42]) == [42]

def test_none_input():
    with pytest.raises(TypeError):
        process_list(None)

def test_boundary_values():
    assert validate_age(0) is False   # Boundary
    assert validate_age(1) is True    # Just above
    assert validate_age(17) is True   # Below threshold
    assert validate_age(18) is True   # At threshold
    assert validate_age(120) is True  # Upper limit
    assert validate_age(121) is False # Exceeded

def test_negative_values():
    assert process_transaction(-1) == "invalid"

def test_large_values():
    large_text = "a" * 10_000
    result = process_text(large_text)
    assert len(result) == 10_000

def test_special_characters():
    assert sanitize_input("<script>alert('xss')</script>") == ""

def test_unicode():
    assert process_name("José 💻") is not None
```

## Los principios FIRST de las buenas pruebas unitarias

| Principio | Significado | Cómo aplicarlo |
|-----------|---------|-------------|
| **F**ast | Las pruebas se ejecutan rápido | Rango de milisegundos. Sin I/O en las pruebas unitarias. |
| **I**solated | Las pruebas no dependen entre sí | Fixtures frescas, sin estado compartido |
| **R**epeatable | Mismo resultado en cada ejecución | Sin valores aleatorios, sin dependencia del tiempo |
| **S**elf-validating | Aprueban o fallan automáticamente | Sin inspección manual de la salida |
| **T**horough | Cubren los casos límite, no solo el camino feliz | Valores de borde, errores, nulos |

```python
import random
from datetime import datetime

# BAD: Non-repeatable test
def test_random_choice():
    result = random.choice([1, 2, 3])
    assert result > 0  # Weak assertion — always passes

# BAD: Time-dependent test
def test_good_morning_greeting():
    hour = datetime.now().hour
    greeting = get_greeting()
    if 5 <= hour < 12:
        assert greeting == "Good morning"
    else:
        assert greeting != "Good morning"

# GOOD: Controlled inputs
def test_random_choice_with_seed():
    random.seed(42)
    result = random.choice([1, 2, 3])
    assert result == 2  # Deterministic with seed

# GOOD: Inject the time
def test_greeting_at_specific_time():
    assert get_greeting_at(hour=9) == "Good morning"
    assert get_greeting_at(hour=14) == "Good afternoon"
    assert get_greeting_at(hour=20) == "Good evening"
```

## Refactorizar el código de producción para hacerlo comprobable

A veces el código no es comprobable. Así se corrige:

```python
# BEFORE: Untestable — hardcoded dependency
def send_welcome_email(user_email: str) -> None:
    import smtplib
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.login("user@gmail.com", "password")
    server.sendmail("from@test.com", user_email, "Welcome!")
    server.quit()

# AFTER: Testable — dependency injection
class EmailService:
    def __init__(self, smtp_client=None):
        self.smtp = smtp_client or self._default_smtp()

    def send_welcome(self, user_email: str) -> None:
        self.smtp.sendmail("from@test.com", user_email, "Welcome!")

    def _default_smtp(self):
        import smtplib
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.login("user@gmail.com", "password")
        return server

# Test
def test_send_welcome():
    mock_smtp = Mock()
    service = EmailService(smtp_client=mock_smtp)
    service.send_welcome("alice@test.com")
    mock_smtp.sendmail.assert_called_once_with(
        "from@test.com", "alice@test.com", "Welcome!"
    )
```

```mermaid
flowchart TD
    A["¿El código es comprobable?"] --> B{"¿Tiene\ndependencias externas?"}
    B -->|"Sí"| C{"¿Se pueden inyectar\nlas dependencias?"}
    B -->|"No"| D["Probar directamente<br/>(función pura)"]
    C -->|"Sí"| E["Usar inyección de dependencias<br/>+ mock en las pruebas"]
    C -->|"No"| F["Refactorizar: extraer la<br/>dependencia como parámetro"]
    F --> E
    D --> G["Pruebas simples<br/>y rápidas"]
    E --> H["Las pruebas usan mocks<br/>para el aislamiento"]
    G --> I["✅ Suite de pruebas mantenible"]
    H --> I
    
    style A fill:#e1f5fe
    style D fill:#c8e6c9
    style E fill:#bbdefb
    style F fill:#fff9c4
    style I fill:#c8e6c9
```

## Probar excepciones y rutas de error

```python
import pytest

class Validator:
    def validate_user(self, user_data: dict) -> None:
        if not isinstance(user_data, dict):
            raise TypeError("user_data must be a dict")
        if "email" not in user_data:
            raise ValueError("email is required")
        if "@" not in user_data["email"]:
            raise ValueError("Invalid email format")
        if user_data.get("age", 0) < 0:
            raise ValueError("Age cannot be negative")
        if user_data.get("age", 0) > 150:
            raise ValueError("Age seems unrealistic")

class TestValidatorExceptions:
    def test_rejects_non_dict(self):
        with pytest.raises(TypeError, match="must be a dict"):
            Validator().validate_user("not a dict")

    def test_rejects_missing_email(self):
        with pytest.raises(ValueError, match="email is required"):
            Validator().validate_user({"name": "Alice"})

    def test_rejects_invalid_email(self):
        with pytest.raises(ValueError, match="Invalid email"):
            Validator().validate_user({"email": "not-an-email"})

    def test_rejects_negative_age(self):
        with pytest.raises(ValueError, match="negative"):
            Validator().validate_user({"email": "a@b.com", "age": -5})

    def test_rejects_unrealistic_age(self):
        with pytest.raises(ValueError, match="unrealistic"):
            Validator().validate_user({"email": "a@b.com", "age": 200})

    def test_accepts_valid_user(self):
        """Happy path — no exception raised."""
        result = Validator().validate_user({
            "email": "alice@example.com",
            "age": 30,
        })
        assert result is None
```

## Probar código asíncrono

```python
import pytest

# Async function to test
async def fetch_user_data(user_id: int) -> dict:
    await asyncio.sleep(0.1)
    return {"id": user_id, "name": "Alice"}

# Async test
@pytest.mark.asyncio
async def test_fetch_user_data():
    result = await fetch_user_data(1)
    assert result["id"] == 1
    assert result["name"] == "Alice"

# Async with mocking
@pytest.mark.asyncio
async def test_async_service():
    mock_db = AsyncMock()
    mock_db.get_user.return_value = {"id": 1, "name": "Alice"}

    service = UserService(mock_db)
    result = await service.get_user(1)
    assert result["name"] == "Alice"
    mock_db.get_user.assert_called_once_with(1)
```

## Olores de código habituales en las pruebas

```python
# SMELL 1: Testing implementation details
def test_sort_uses_quicksort():
    """BAD: Tests how sort works, not what it does."""
    arr = [3, 1, 2]
    result = sort(arr)
    # Checking internal algorithm is fragile

# SMELL 2: Multiple logic paths in one test
def test_complex():
    """BAD: Tests too many things."""
    if some_condition:
        assert x == 1
    else:
        assert y == 2

# SMELL 3: Test uses production data
def test_with_real_data():
    """BAD: Depends on external, changing data."""
    data = fetch_from_production_api()
    assert len(data) > 0

# SMELL 4: Conditionals in tests
def test_conditional():
    """BAD: Tests should be deterministic."""
    if os.name == "nt":
        assert windows_specific()
    else:
        assert unix_specific()
```

| Olor | Síntoma | Solución |
|-------|---------|-----|
| **Prueba fragmentada** | Prueba muchos comportamientos sin relación | Divídela en pruebas centradas |
| **Prueba perezosa** | Aserciona demasiado poco | Prueba la salida real |
| **Prueba subordinada** | Prueba el auxiliar, no lo principal | Identifica la unidad real |
| **Prueba indecente** | Accede a métodos privados | Prueba a través de la interfaz pública |
| **Invitado misterioso** | Usa estado global | Inyecta dependencias |
| **Optimista de recursos** | Las pruebas no liberan recursos | Usa fixtures con teardown |
| **Héroe local** | Las pruebas dependen de la configuración regional | Configura la región explícitamente |

## Ejercicios de práctica

1. **Refactoriza a AAA**: Toma esta prueba mal estructurada y refactorízala en tres pruebas AAA separadas:
   ```python
   def test_cart():
       cart = ShoppingCart()
       cart.add_item("apple", 1.0)
       assert cart.total() == 1.0
       cart.add_item("banana", 2.0)
       assert cart.total() == 3.0
       cart.remove_item("apple")
       assert cart.total() == 2.0
   ```

2. **Escribe pruebas con mocks**: Crea un `NewsletterService` que llame a una API de correo. Escribe pruebas que simulen la llamada a la API. Verifica que se envían los datos correctos.

3. **Identifica violaciones de aislamiento**: Encuentra y corrige los problemas de estado compartido en esta suite de pruebas:
   ```python
   users = []
   def test_create_user():
       users.append(User("Alice"))
       assert len(users) == 1
   def test_delete_user():
       users.clear()
       assert len(users) == 0
   ```

4. **Cobertura de casos límite**: Escribe pruebas exhaustivas de casos límite para una función `parse_int(s: str) -> int` que maneja números normales, negativos, ceros, ceros a la izquierda, cadenas vacías, cadenas no numéricas y espacios en blanco.

5. **Auditoría FIRST**: Revisa una suite de pruebas de un proyecto real o de ejemplo. Para cada prueba, evalúala según los principios FIRST. ¿Qué pruebas violan qué principios?

6. **Refactor con inyección de dependencias**: Toma este código no comprobable y refactorízalo para hacerlo comprobable; después escribe pruebas:
   ```python
   class ReportGenerator:
       def generate(self):
           import datetime
           now = datetime.datetime.now()
           with open("/var/log/app.log") as f:
               data = f.read()
           return f"Report generated at {now}: {len(data)} bytes"
   ```

7. **Prueba una función de Fibonacci**: Escribe pruebas para una función `fibonacci(n)`. Cubre n=0, n=1, n=2, n=10, n negativo, n no entero y n grande. Usa parametrize.

8. **Mock de una pasarela de pago**: Un `PaymentService` tiene un método `process_payment(user_id, amount)` que llama a una pasarela de pago. Escribe pruebas para los escenarios de éxito, tarjeta rechazada, fondos insuficientes y tiempo de espera usando mocks.

## Resumen

- **Patrón AAA**: Arrange → Act → Assert: una historia clara por prueba
- **Un concepto por prueba**: no una aserción, sino un comportamiento
- **Nombres descriptivos**: `test_given_X_when_Y_then_Z` cuenta la historia completa
- **Haz mock de los límites**: simula las dependencias externas, no la lógica interna
- **Aislamiento**: estado fresco por prueba, sin compartir, sin depender del orden
- **Casos límite**: vacío, nulo, negativo, borde: pruébalos todos
- **FIRST**: Fast, Isolated, Repeatable, Self-validating, Thorough
- **Testabilidad**: diseña el código para que pueda probarse (inyección de dependencias)

> [!SUCCESS]
> Las grandes pruebas son una disciplina de diseño. El patrón AAA, el mocking adecuado y el aislamiento estricto no son coste añadido: son inversiones que hacen que cada refactor futuro sea seguro y que cada informe de bug sea resoluble.
