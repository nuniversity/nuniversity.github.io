---
title: "Funciones bien hechas"
description: "Domina el arte de escribir funciones pequeñas y enfocadas, con responsabilidad única, parámetros adecuados y sin efectos secundarios"
order: 3
duration: "50 min"
difficulty: "intermediate"
---

# Funciones bien hechas

Las funciones son los bloques de construcción fundamentales del código legible y mantenible. Una función bien construida cuenta una historia clara sobre qué hace, qué necesita y qué devuelve.

> [!NOTE]
> Robert C. Martin afirma: "La primera regla de las funciones es que deberían ser pequeñas. La segunda regla de las funciones es que deberían ser aún más pequeñas."

## La primera regla: funciones pequeñas

Una función debe hacer una cosa, hacerla bien y hacer solo eso. Si puedes extraer de ella otra función con un nombre significativo, está haciendo demasiado.

```python
# Too large: this function does everything
def process_order(order_data: dict) -> dict:
    # Validate
    if not order_data.get("items"):
        raise ValueError("Order must have items")
    if sum(item["price"] for item in order_data["items"]) <= 0:
        raise ValueError("Total must be positive")

    # Calculate
    subtotal = sum(item["price"] * item["quantity"] for item in order_data["items"])
    tax = subtotal * 0.08
    shipping = 5.99 if subtotal < 50 else 0
    total = subtotal + tax + shipping

    # Save
    with open("orders.txt", "a") as f:
        f.write(f"{order_data['customer']}:{total}\n")

    # Notify
    print(f"Order confirmed for {order_data['customer']}")

    return {"total": total, "status": "confirmed"}

# Refactored: each function does one thing
def validate_order(order_data: dict) -> None:
    if not order_data.get("items"):
        raise ValueError("Order must have items")
    if sum(item["price"] for item in order_data["items"]) <= 0:
        raise ValueError("Total must be positive")

def calculate_total(order_data: dict) -> dict:
    subtotal = sum(item["price"] * item["quantity"] for item in order_data["items"])
    tax = subtotal * TAX_RATE
    shipping = SHIPPING_COST if subtotal < FREE_SHIPPING_THRESHOLD else 0
    total = subtotal + tax + shipping
    return {"subtotal": subtotal, "tax": tax, "shipping": shipping, "total": total}

def save_order(order_data: dict, totals: dict) -> None:
    with open("orders.txt", "a") as f:
        f.write(f"{order_data['customer']}:{totals['total']}\n")

def notify_customer(customer_name: str) -> None:
    print(f"Order confirmed for {customer_name}")

def process_order(order_data: dict) -> dict:
    validate_order(order_data)
    totals = calculate_total(order_data)
    save_order(order_data, totals)
    notify_customer(order_data["customer"])
    return {**totals, "status": "confirmed"}
```

## Principio de responsabilidad única

Una función debe tener una sola razón para cambiar. Si una función mezcla lógica de negocio, E/S y presentación, viola el SRP.

```python
# Violates SRP: mixes calculation, formatting, and I/O
def generate_salary_report(employees: list):
    total = sum(e.salary for e in employees)
    avg = total / len(employees)
    report = f"Total: ${total}\nAverage: ${avg}\n"
    with open("salary_report.txt", "w") as f:
        f.write(report)
    return report

# Follows SRP: each function has one responsibility
def calculate_salary_stats(employees: list) -> dict:
    total = sum(e.salary for e in employees)
    return {"total": total, "average": total / len(employees), "count": len(employees)}

def format_salary_report(stats: dict) -> str:
    return f"Total: ${stats['total']:.2f}\nAverage: ${stats['average']:.2f}\nCount: {stats['count']}"

def write_report_to_file(report: str, filename: str) -> None:
    with open(filename, "w") as f:
        f.write(report)

def generate_salary_report(employees: list, filename: str) -> str:
    stats = calculate_salary_stats(employees)
    report = format_salary_report(stats)
    write_report_to_file(report, filename)
    return report
```

## Parámetros de función

### Minimiza los parámetros

Una función sin parámetros es la más fácil de entender. Uno o dos parámetros está bien. Tres deben justificarse. Más de tres sugiere un problema de diseño.

```python
# Too many parameters
def create_user(name, email, age, address, phone, is_admin, notify):
    pass

# Group related params into an object
@dataclass
class UserProfile:
    name: str
    email: str
    age: int
    address: str
    phone: str

def create_user(profile: UserProfile, is_admin: bool = False, notify: bool = True) -> User:
    pass
```

### Evita los parámetros bandera

Los booleanos en las firmas de funciones indican que la función hace dos cosas.

```python
# Flag parameter: two behaviors
def send_email(to: str, message: str, is_urgent: bool):
    if is_urgent:
        # Send immediately
        pass
    else:
        # Add to queue
        pass

# Better: two functions
def send_immediate_email(to: str, message: str):
    pass

def queue_email(to: str, message: str):
    pass
```

### Prefiere los argumentos con nombre

Los argumentos con nombre hacen que las llamadas a las funciones se autodocumenten.

```python
# Unclear positional args
connect("localhost", 5432, "admin", "secret", "dbname")

# Clear keyword args
connect(
    host="localhost",
    port=5432,
    username="admin",
    password="secret",
    database="dbname",
)
```

## Efectos secundarios

Una función debe hacer algo (comando) o responder algo (consulta), pero no ambas cosas. Los efectos secundarios son cambios ocultos en el estado.

```python
# Side effect: modifies global state
DISCOUNT_MULTIPLIER = 1.0

def apply_discount(price: float) -> float:
    global DISCOUNT_MULTIPLIER
    DISCOUNT_MULTIPLIER = 0.9  # Side effect!
    return price * DISCOUNT_MULTIPLIER

# Pure function: predictable, no side effects
def apply_discount(price: float, discount_multiplier: float = 1.0) -> float:
    return price * discount_multiplier
```

```python
# Side effect: modifies input
def add_to_cart(cart: list, item: dict) -> list:
    cart.append(item)  # Modifies the original list
    return cart

# Explicit: returns new state
def add_to_cart(cart: list, item: dict) -> list:
    return [*cart, item]
```

## Separación entre comandos y consultas

Las funciones deben ser comandos (realizan una acción) o consultas (devuelven datos), no ambas.

```python
# Violates CQS: both modifies and queries
def pop_item(stack: list):
    if not stack:
        return None
    return stack.pop()

# Follows CQS
def is_empty(stack: list) -> bool:
    return len(stack) == 0

def pop_item(stack: list):
    if is_empty(stack):
        return None
    return stack.pop()
```

## Estructura y flujo de una función

```mermaid
flowchart TD
    A[Llamada a una función] --> B[Comprobación de precondiciones]
    B --> C{¿Entrada válida?}
    C -->|No| D[Lanzar / devolver error]
    C -->|Sí| E[Lógica principal]
    E --> F{¿Tiene efectos secundarios?}
    F -->|Sí| G[Producir el efecto secundario]
    F -->|No| H[Cálculo puro]
    G --> I[Devolver resultado]
    H --> I
    D --> I
```

## La regla del escalonamiento

Cada función debe ir seguida de funciones en el siguiente nivel de abstracción. Esto crea una narrativa que se lee de arriba hacia abajo.

```python
# High-level story
def process_payment(order: Order) -> PaymentResult:
    validate_order(order)
    charge_customer(order)
    send_receipt(order)
    return PaymentResult.success()

# Next level of detail
def validate_order(order: Order) -> None:
    if not order.items:
        raise ValueError("Empty order")
    if order.total <= 0:
        raise ValueError("Invalid total")

def charge_customer(order: Order) -> None:
    gateway = PaymentGateway(order.payment_method)
    gateway.charge(order.total)

def send_receipt(order: Order) -> None:
    email = EmailService()
    email.send(
        to=order.customer_email,
        subject="Your Receipt",
        body=f"Total charged: ${order.total:.2f}",
    )
```

## Manejo de errores

El manejo de errores es una cosa más. Una función que maneja errores no debe hacer nada más.

```python
# Mixed: error handling with business logic
def get_user_score(user_id: int) -> int:
    try:
        user = database.find_user(user_id)
        score = calculate_score(user)
        return score
    except DatabaseError:
        return 0
    except ScoreError:
        return 0

# Clean: separate error handling from logic
def get_user_score(user_id: int) -> int:
    try:
        user = database.find_user(user_id)
        return calculate_score(user)
    except (DatabaseError, ScoreError):
        return 0
```

## Funciones puras frente a funciones impuras

| Aspecto | Función pura | Función impura |
|--------|--------------|----------------|
| Misma entrada → misma salida | Siempre | No garantizado |
| Efectos secundarios | Ninguno | Puede tener |
| Pruebas | Triviales | Requiere mocking |
| Segura para hilos | Sí | Depende |
| Cacheable | Sí | No |
| Ejemplo | `sum(a, b)` | `print(message)` |

```python
# Pure function
def add_to_date(start_date: date, days: int) -> date:
    return start_date + timedelta(days=days)

# Impure function (relies on external state)
def get_current_timestamp() -> datetime:
    return datetime.now()
```

## Ejemplo del mundo real: refactorizar un monolito

Antes: una única función de 80 líneas que gestionaba el procesamiento de pagos.

```python
def handle_payment(request):
    # Parse input
    data = json.loads(request.body)
    user_id = data["user_id"]
    amount = data["amount"]
    currency = data.get("currency", "USD")
    method = data["method"]

    # Validate user
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
    if not user:
        return {"error": "User not found"}, 404
    if user["balance"] < amount:
        return {"error": "Insufficient funds"}, 400

    # Process payment
    if method == "credit_card":
        result = credit_card_charge(user["card_token"], amount, currency)
    elif method == "paypal":
        result = paypal_charge(user["paypal_email"], amount, currency)
    else:
        return {"error": "Unknown method"}, 400

    if result["status"] == "success":
        db.query(f"UPDATE users SET balance = balance - {amount} WHERE id = {user_id}")
        send_email(user["email"], "Payment received", f"Amount: {amount}")
        return {"status": "ok", "transaction_id": result["id"]}, 200
    else:
        return {"error": result["message"]}, 500
```

Después: funciones limpias y enfocadas.

```python
@dataclass
class PaymentRequest:
    user_id: int
    amount: Decimal
    currency: str
    method: str

@dataclass
class PaymentResult:
    success: bool
    transaction_id: Optional[str] = None
    error_message: Optional[str] = None


def parse_payment_request(body: str) -> PaymentRequest:
    data = json.loads(body)
    return PaymentRequest(
        user_id=data["user_id"],
        amount=Decimal(str(data["amount"])),
        currency=data.get("currency", "USD"),
        method=data["method"],
    )

def validate_payment(user: User, request: PaymentRequest) -> Optional[str]:
    if user.balance < request.amount:
        return "Insufficient funds"
    return None

def process_payment(user: User, request: PaymentRequest) -> PaymentResult:
    processors = {
        "credit_card": lambda: charge_credit_card(user.card_token, request),
        "paypal": lambda: charge_paypal(user.paypal_email, request),
    }
    processor = processors.get(request.method)
    if not processor:
        return PaymentResult(success=False, error_message="Unknown method")
    return processor()

def charge_credit_card(token: str, request: PaymentRequest) -> PaymentResult:
    gateway = CreditCardGateway(token)
    result = gateway.charge(request.amount, request.currency)
    return PaymentResult(success=result.ok, transaction_id=result.id)

def charge_paypal(email: str, request: PaymentRequest) -> PaymentResult:
    gateway = PayPalGateway(email)
    result = gateway.charge(request.amount, request.currency)
    return PaymentResult(success=result.ok, transaction_id=result.id)

def deduct_balance(user: User, amount: Decimal) -> None:
    user.balance -= amount

def notify_user(user: User, amount: Decimal) -> None:
    send_email(user.email, "Payment received", f"Amount: {amount}")

def handle_payment(request_body: str) -> tuple:
    payment_request = parse_payment_request(request_body)
    user = find_user(payment_request.user_id)
    if not user:
        return {"error": "User not found"}, 404

    error = validate_payment(user, payment_request)
    if error:
        return {"error": error}, 400

    result = process_payment(user, payment_request)
    if not result.success:
        return {"error": result.error_message}, 500

    deduct_balance(user, payment_request.amount)
    notify_user(user, payment_request.amount)
    return {"status": "ok", "transaction_id": result.transaction_id}, 200
```

## Funciones y pruebas

Las funciones limpias son fáciles de probar. Cada función puede probarse de forma aislada.

```python
import pytest

def test_parse_payment_request():
    body = '{"user_id": 1, "amount": "100.00", "method": "credit_card"}'
    result = parse_payment_request(body)
    assert result.user_id == 1
    assert result.amount == Decimal("100.00")

def test_validate_payment_insufficient_funds():
    user = User(balance=Decimal("50.00"))
    request = PaymentRequest(amount=Decimal("100.00"), ...)
    error = validate_payment(user, request)
    assert error == "Insufficient funds"

def test_validate_payment_sufficient_funds():
    user = User(balance=Decimal("200.00"))
    request = PaymentRequest(amount=Decimal("100.00"), ...)
    error = validate_payment(user, request)
    assert error is None
```

## Flujo de decisión sobre funciones

```mermaid
flowchart TD
    A[Escribir una función] --> B{¿Hace una sola cosa?}
    B -->|No, hace varias| C[Dividir en funciones más pequeñas]
    B -->|Sí| D{¿Tiene efectos secundarios?}
    D -->|Sí| E{¿El efecto secundario es obvio?}
    E -->|No| F[Renombrar para indicar el efecto secundario]
    E -->|Sí| G[Mantener como comando]
    D -->|No| H[Mantener como consulta]
    C --> A
    F --> A
    G --> J{¿Más de 3 parámetros?}
    H --> J
    J -->|Sí| K[Agrupar parámetros en un objeto]
    J -->|No| L[Listo]
```

> [!WARNING]
> Un error común es hacer las funciones "un poquito más grandes" para ahorrar unas cuantas líneas. Resiste a eso. Cada línea adicional reduce la legibilidad y aumenta la probabilidad de bugs.

> [!SUCCESS]
> Las funciones pequeñas y enfocadas son la base del código limpio. Practica extraer funciones hasta que se te haga costumbre.

## Ejercicios prácticos

1. **Extrae sin parar**: Toma una función de 100 líneas y sigue extrayendo hasta que ninguna función tenga más de 10 líneas.

2. **Eliminación de banderas**: Encuentra una función con un parámetro booleano y divídela en dos funciones con nombre propio.

3. **Auditoría de parámetros**: Encuentra una función con 4 o más parámetros. Agrupa los parámetros relacionados en una dataclass.

4. **Caza de efectos secundarios**: Encuentra una función que modifique el estado global o sus entradas. Refactorízala para que sea pura (o declara explícitamente los efectos secundarios).

5. **Violación de CQS**: Encuentra una función que a la vez devuelva datos y modifique el estado. Divídela en un comando y una consulta.

6. **Estructura escalonada**: Toma una función compleja y reorganízala para que la lógica de alto nivel se lea primero, seguida de las funciones auxiliares.

7. **Refactorización SRP**: Encuentra una clase con un método grande. Extrae métodos más pequeños y enfocados hasta que la clase cumpla el principio de responsabilidad única.

8. **Refactorización guiada por pruebas**: Antes de refactorizar una función grande, escribe pruebas que capturen su comportamiento. Refactoriza y luego verifica que todas las pruebas siguen pasando.
