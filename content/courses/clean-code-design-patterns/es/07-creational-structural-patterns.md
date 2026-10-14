---
title: "Patrones de creación y estructurales"
description: "Domina los patrones Singleton, Factory, Observer y Adapter con ejemplos en Python y aplicaciones del mundo real"
order: 7
duration: "55 min"
difficulty: "intermediate"
---

# Patrones de creación y estructurales

Los patrones de creación tratan con los mecanismos de creación de objetos, mientras que los patrones estructurales componen clases y objetos en estructuras más grandes. Juntos forman la base de un diseño orientado a objetos flexible y reutilizable.

> [!NOTE]
> Esta lección cubre los patrones más utilizados de las categorías de creación y estructural. Dominar estos cuatro patrones — Singleton, Factory, Observer y Adapter — resolverá la mayoría de los retos de diseño habituales.

## Patrón Singleton

**Propósito**: Garantizar que una clase tenga una sola instancia y ofrecer un punto de acceso global a ella.

### Cuándo usarlo

- Un único pool de conexiones a la base de datos
- Un gestor de configuración compartido
- Un servicio de registro de logs
- Un gestor de caché

### Implementación en Python

```python
class ConfigurationManager:
    """Thread-safe Singleton for application configuration."""

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._config: dict = {}
        self._initialized = True

    def set(self, key: str, value: any) -> None:
        self._config[key] = value

    def get(self, key: str, default: any = None) -> any:
        return self._config.get(key, default)

    def load_from_file(self, path: str) -> None:
        import json
        with open(path) as f:
            self._config.update(json.load(f))


# Usage
config = ConfigurationManager()
config.set("database_url", "postgres://localhost:5432/app")
config.set("debug", True)

# Same instance
another_ref = ConfigurationManager()
assert config is another_ref  # True
print(another_ref.get("database_url"))  # postgres://localhost:5432/app
```

### Diagrama de clases del Singleton

```mermaid
classDiagram
    class Singleton {
        - static instance: Singleton
        - Singleton()
        + static get_instance() Singleton
    }
    class ConfigurationManager {
        - _instance: ConfigurationManager
        - _config: dict
        - _initialized: bool
        + set(key, value)
        + get(key, default)
        + load_from_file(path)
    }
    Singleton <|-- ConfigurationManager
    note for ConfigurationManager "Solo existe una instancia"
```

### Ventajas y desventajas

| Ventaja | Desventaja |
|---------|------------|
| Acceso controlado a la instancia única | El estado global complica las pruebas |
| Menor uso de memoria | Crea dependencias ocultas |
| Permite la inicialización perezosa | Viola el Principio de Responsabilidad Única |
| Evita la contención de recursos | Acoplamiento fuerte con la clase singleton |

> [!WARNING]
> Los Singleton se usan en exceso con frecuencia. En Python, una variable a nivel de módulo suele ser más simple y consigue el mismo objetivo sin toda esa ceremonia.

## Patrón Factory

**Propósito**: Definir una interfaz para crear un objeto, pero dejar que las subclases decidan qué clase instanciar.

### Cuándo usarlo

- Crear objetos a partir de la configuración en tiempo de ejecución
- Desacoplar el código cliente de las clases concretas
- Centralizar la lógica de creación de objetos

### Implementación en Python

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol


# Product interface
class PaymentProcessor(Protocol):
    def charge(self, amount: float) -> str: ...

    def refund(self, transaction_id: str) -> str: ...


# Concrete products
@dataclass
class CreditCardProcessor:
    card_number: str

    def charge(self, amount: float) -> str:
        return f"Charged ${amount:.2f} to card {self.card_number[-4:]}"

    def refund(self, transaction_id: str) -> str:
        return f"Refunded transaction {transaction_id}"


@dataclass
class PayPalProcessor:
    email: str

    def charge(self, amount: float) -> str:
        return f"Charged ${amount:.2f} via PayPal ({self.email})"

    def refund(self, transaction_id: str) -> str:
        return f"Refunded PayPal transaction {transaction_id}"


@dataclass
class StripeProcessor:
    api_key: str

    def charge(self, amount: float) -> str:
        return f"Charged ${amount:.2f} via Stripe"

    def refund(self, transaction_id: str) -> str:
        return f"Refunded Stripe transaction {transaction_id}"


# Factory
class PaymentProcessorFactory:
    """Creates payment processors based on method type."""

    _processors = {
        "credit_card": CreditCardProcessor,
        "paypal": PayPalProcessor,
        "stripe": StripeProcessor,
    }

    @classmethod
    def create(cls, method: str, **kwargs) -> PaymentProcessor:
        processor_class = cls._processors.get(method)
        if not processor_class:
            raise ValueError(f"Unknown payment method: {method}")
        return processor_class(**kwargs)


# Usage
def process_payment(method: str, amount: float, **details) -> str:
    processor = PaymentProcessorFactory.create(method, **details)
    return processor.charge(amount)


print(process_payment("credit_card", 99.99, card_number="4111111111111111"))
print(process_payment("paypal", 49.99, email="user@example.com"))
```

### Diagrama de clases del Factory

```mermaid
classDiagram
    class PaymentProcessor {
        <<interface>>
        + charge(amount) str
        + refund(transaction_id) str
    }
    class CreditCardProcessor {
        + card_number: str
        + charge(amount) str
        + refund(transaction_id) str
    }
    class PayPalProcessor {
        + email: str
        + charge(amount) str
        + refund(transaction_id) str
    }
    class StripeProcessor {
        + api_key: str
        + charge(amount) str
        + refund(transaction_id) str
    }
    class PaymentProcessorFactory {
        + create(method, kwargs) PaymentProcessor
    }
    PaymentProcessor <|.. CreditCardProcessor
    PaymentProcessor <|.. PayPalProcessor
    PaymentProcessor <|.. StripeProcessor
    PaymentProcessorFactory ..> PaymentProcessor : crea
```

## Patrón Observer

**Propósito**: Definir una dependencia uno-a-muchos entre objetos de modo que, cuando un objeto cambie de estado, todos sus dependientes se notifiquen y se actualicen automáticamente.

### Cuándo usarlo

- Sistemas de manejo de eventos
- Actualizaciones de UI a partir de cambios en los datos
- Sistemas de publicación-suscripción
- Flujos de datos en tiempo real

### Implementación en Python

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List


class Observer(ABC):
    """Interface for all observers."""

    @abstractmethod
    def update(self, event_type: str, data: any) -> None: ...


@dataclass
class EmailNotifier(Observer):
    email: str

    def update(self, event_type: str, data: any) -> None:
        print(f"[EMAIL to {self.email}] {event_type}: {data}")


@dataclass
class SMSNotifier(Observer):
    phone: str

    def update(self, event_type: str, data: any) -> None:
        print(f"[SMS to {self.phone}] {event_type}: {data}")


@dataclass
class LoggerObserver(Observer):
    log_file: str

    def update(self, event_type: str, data: any) -> None:
        print(f"[LOG to {self.log_file}] {event_type}: {data}")


class OrderSubject:
    """Subject being observed — an order system."""

    def __init__(self):
        self._observers: List[Observer] = []

    def attach(self, observer: Observer) -> None:
        self._observers.append(observer)

    def detach(self, observer: Observer) -> None:
        self._observers.remove(observer)

    def notify(self, event_type: str, data: any) -> None:
        for observer in self._observers:
            observer.update(event_type, data)


# Usage
order_system = OrderSubject()

# Register observers
order_system.attach(EmailNotifier("admin@shop.com"))
order_system.attach(SMSNotifier("+1234567890"))
order_system.attach(LoggerObserver("orders.log"))

# Trigger events
order_system.notify("order_placed", {"id": 123, "total": 99.99})
order_system.notify("payment_received", {"id": 123, "amount": 99.99})
order_system.notify("order_shipped", {"id": 123, "tracking": "TRACK123"})
```

### Diagrama de secuencia del Observer

```mermaid
sequenceDiagram
    participant Client
    participant OrderSubject
    participant EmailNotifier
    participant SMSNotifier
    participant LoggerObserver

    Client->>OrderSubject: attach(EmailNotifier)
    Client->>OrderSubject: attach(SMSNotifier)
    Client->>OrderSubject: attach(LoggerObserver)
    Client->>OrderSubject: notify("order_placed", data)
    OrderSubject->>EmailNotifier: update("order_placed", data)
    OrderSubject->>SMSNotifier: update("order_placed", data)
    OrderSubject->>LoggerObserver: update("order_placed", data)
    EmailNotifier-->>OrderSubject: correo enviado
    SMSNotifier-->>OrderSubject: SMS enviado
    LoggerObserver-->>OrderSubject: registro escrito
```

## Patrón Adapter

**Propósito**: Convertir la interfaz de una clase en otra interfaz que los clientes esperan. Adapter permite que clases que no podrían trabajar juntas por interfaces incompatibles lo hagan.

### Cuándo usarlo

- Integrar sistemas heredados
- Usar librerías de terceros con interfaces distintas
- Envolver APIs para mantener la consistencia

### Implementación en Python

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass


# Target interface (what the client expects)
class PaymentGateway(ABC):
    @abstractmethod
    def pay(self, amount: float, currency: str) -> str: ...

    @abstractmethod
    def status(self, transaction_id: str) -> str: ...


# Adaptee 1: Third-party library with different interface
class StripeAPI:
    """Stripe's native API (different method names)."""

    def create_charge(self, dollars: int, cents: int, currency_code: str) -> str:
        return f"stripe_txn_{dollars}_{cents}_{currency_code}"

    def get_charge_status(self, charge_id: str) -> str:
        return "completed"


# Adapter for Stripe
class StripeAdapter(PaymentGateway):
    def __init__(self, stripe_api: StripeAPI):
        self._stripe = stripe_api

    def pay(self, amount: float, currency: str) -> str:
        dollars = int(amount)
        cents = int((amount - dollars) * 100)
        return self._stripe.create_charge(dollars, cents, currency)

    def status(self, transaction_id: str) -> str:
        return self._stripe.get_charge_status(transaction_id)


# Adaptee 2: Another library
class PayPalAPI:
    def send_payment(self, usd_amount: float) -> str:
        return f"paypal_{usd_amount}"

    def check_payment(self, payment_id: str) -> str:
        return "success"


class PayPalAdapter(PaymentGateway):
    def __init__(self, paypal_api: PayPalAPI):
        self._paypal = paypal_api

    def pay(self, amount: float, currency: str) -> str:
        if currency != "USD":
            raise ValueError("PayPal only supports USD")
        return self._paypal.send_payment(amount)

    def status(self, transaction_id: str) -> str:
        return self._paypal.check_payment(transaction_id)


# Client code
def process_transaction(gateway: PaymentGateway, amount: float, currency: str) -> None:
    txn_id = gateway.pay(amount, currency)
    print(f"Transaction: {txn_id}")
    print(f"Status: {gateway.status(txn_id)}")


# Usage
stripe_adapter = StripeAdapter(StripeAPI())
paypal_adapter = PayPalAdapter(PayPalAPI())

process_transaction(stripe_adapter, 99.99, "USD")
process_transaction(paypal_adapter, 49.99, "USD")
```

### Diagrama de clases del Adapter

```mermaid
classDiagram
    class PaymentGateway {
        <<interface>>
        + pay(amount, currency) str
        + status(transaction_id) str
    }
    class StripeAPI {
        + create_charge(dollars, cents, currency_code) str
        + get_charge_status(charge_id) str
    }
    class StripeAdapter {
        - _stripe: StripeAPI
        + pay(amount, currency) str
        + status(transaction_id) str
    }
    class PayPalAPI {
        + send_payment(usd_amount) str
        + check_payment(payment_id) str
    }
    class PayPalAdapter {
        - _paypal: PayPalAPI
        + pay(amount, currency) str
        + status(transaction_id) str
    }
    PaymentGateway <|.. StripeAdapter
    PaymentGateway <|.. PayPalAdapter
    StripeAdapter --> StripeAPI : adapta
    PayPalAdapter --> PayPalAPI : adapta
```

## Ejemplo del mundo real: sistema de pedidos de comercio electrónico

Combinando Factory, Observer y Adapter:

```python
from dataclasses import dataclass, field
from typing import List, Protocol


# --- Factory: Creating payment gateways ---
class PaymentGateway(Protocol):
    def charge(self, amount: float) -> str: ...


class StripeGateway:
    def charge(self, amount: float) -> str:
        return f"stripe:{amount}"


class PayPalGateway:
    def charge(self, amount: float) -> str:
        return f"paypal:{amount}"


def create_gateway(method: str) -> PaymentGateway:
    gateways = {"stripe": StripeGateway, "paypal": PayPalGateway}
    return gateways[method]()


# --- Observer: Notifications ---
class Observer(Protocol):
    def update(self, event: str, data: dict) -> None: ...


@dataclass
class OrderManager:
    observers: List[Observer] = field(default_factory=list)

    def attach(self, observer: Observer) -> None:
        self.observers.append(observer)

    def notify(self, event: str, data: dict) -> None:
        for obs in self.observers:
            obs.update(event, data)


# --- Adapter: Legacy inventory system ---
class LegacyInventoryAPI:
    def check_stock(self, sku: str) -> int:
        return 42  # Legacy response

    def reserve_item(self, sku: str) -> bool:
        return True


class InventoryAdapter:
    def __init__(self):
        self._legacy = LegacyInventoryAPI()

    def is_in_stock(self, sku: str) -> bool:
        return self._legacy.check_stock(sku) > 0

    def reserve(self, sku: str) -> bool:
        return self._legacy.reserve_item(sku)


# Usage
order_mgr = OrderManager()
gateway = create_gateway("stripe")
inventory = InventoryAdapter()

if inventory.is_in_stock("PROD-001"):
    gateway.charge(49.99)
    inventory.reserve("PROD-001")
    order_mgr.notify("order_confirmed", {"sku": "PROD-001"})
```

## Flujo de selección de patrones

```mermaid
flowchart TD
    A[Problema de diseño] --> B{¿Creación de objetos?}
    B -->|Instancia única| C[Singleton]
    B -->|Varios objetos relacionados| D[Factory]
    B -->|Construcción compleja| E[Builder]
    B -->|No| F{¿Discrepancia de interfaces?}
    F -->|Sí| G[Adapter]
    F -->|No| H{¿Hay que añadir comportamiento?}
    H -->|Dinámicamente| I[Decorator]
    H -->|No| J{¿Notificación uno a muchos?}
    J -->|Sí| K[Observer]
    J -->|No| L[Considerar otros patrones]
```

> [!SUCCESS]
> Estos cuatro patrones resuelven una cantidad sorprendente de problemas de diseño cotidianos. Practica la implementación de cada uno hasta que puedas reconocer automáticamente cuándo aplicarlos.

## Ejercicios prácticos

1. **Refactoriza a Singleton**: Toma una clase que crea recursos costosos (conexiones a la base de datos, clientes de API) e implémentala como Singleton. Mide el ahorro de memoria.

2. **Amplía el Factory**: Extiende la fábrica de procesadores de pagos para que admita un método nuevo (por ejemplo, `crypto` o `bank_transfer`).

3. **Implementa Observer**: Crea un seguidor de precios de acciones que notifique a varios inversores cuando cambie un precio.

4. **Adapter para código heredado**: Encuentra una librería de terceros con una interfaz incómoda y escribe un Adapter que ofrezca una API limpia.

5. **Patrón combinado**: Crea un sistema de notificaciones que use Factory para crear los canales de notificación (correo, SMS, push) y Observer para distribuir los eventos.

6. **Singleton del mundo real**: Implementa una caché Singleton a prueba de hilos para los resultados de consultas a la base de datos.

7. **Prueba unitaria del Adapter**: Escribe pruebas unitarias para el StripeAdapter que simulen (mock) la StripeAPI.

8. **Filtrado de eventos en Observer**: Extiende el patrón Observer para admitir filtrado de eventos, de modo que los observadores solo reciban los eventos que les interesan.
