---
title: "Frameworks y externalidades"
description: "Trata los frameworks como detalles, no como cimientos. Aprende a aislar las dependencias externas, gestionar la configuración y diseñar sistemas compatibles con plugins"
order: 5
duration: "55 min"
difficulty: "intermediate"
---

# Frameworks y externalidades

En la Arquitectura Limpia, los frameworks y las herramientas externas son **detalles**: son la capa más externa, no la base. Esta lección muestra cómo mantener tu lógica de negocio independiente del framework sin renunciar a herramientas potentes.

> [!NOTE]
> Los frameworks son herramientas, no arquitecturas. Una buena arquitectura te permite usar un framework sin quedar acoplado a él. Deberías poder cambiar Flask por FastAPI sin modificar una sola línea de lógica de negocio.

## Frameworks como plugins

```mermaid
flowchart TD
    subgraph Core["Lógica de negocio principal"]
        E[Entidades]
        UC[Casos de uso]
    end
    subgraph Plugins["Frameworks (plugins)"]
        API[API REST]
        UI[Interfaz web]
        CLI[Herramienta CLI]
        WS[WebSocket]
        Queue[Cola de mensajes]
    end
    
    API -->|"implementa el adaptador"| UC
    UI -->|"implementa el adaptador"| UC
    CLI -->|"implementa el adaptador"| UC
    WS -->|"implementa el adaptador"| UC
    Queue -->|"implementa el adaptador"| UC
    
    style Core fill:#c8e6c9,color:#000
    style Plugins fill:#ffccbc,color:#000
```

Cada framework se convierte en un **plugin** que se comunica con la lógica de negocio mediante adaptadores. La lógica de negocio no sabe, ni le importa, qué framework se está usando.

## Acoplamiento de frameworks: antes y después

```python
# BEFORE: Tightly coupled to Flask
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
db = SQLAlchemy(app)


class UserModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    email = db.Column(db.String(120))


@app.route("/users", methods=["POST"])
def create_user():
    data = request.get_json()
    
    # Business logic mixed with framework code
    if len(data["name"]) < 3:
        return jsonify({"error": "Name too short"}), 400
    
    user = UserModel(name=data["name"], email=data["email"])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"id": user.id, "name": user.name}), 201


# AFTER: Flask is just a plugin
# --- entities.py (pure business logic) ---
from dataclasses import dataclass

@dataclass
class User:
    user_id: str
    name: str
    email: str
    
    def validate(self) -> None:
        if len(self.name) < 3:
            raise ValueError("Name too short")
        if "@" not in self.email:
            raise ValueError("Invalid email")


# --- use_cases.py (pure business logic) ---
class CreateUserUseCase:
    def __init__(self, repo: "UserRepository"):
        self._repo = repo
    
    def execute(self, name: str, email: str) -> User:
        user = User(user_id=self._generate_id(), name=name, email=email)
        user.validate()
        self._repo.save(user)
        return user
    
    def _generate_id(self) -> str:
        import uuid
        return str(uuid.uuid4())


# --- flask_adapter.py (framework-specific adapter) ---
from flask import Blueprint, request, jsonify
from .composition_root import create_user_use_case

users_bp = Blueprint("users", __name__)

@users_bp.route("/users", methods=["POST"])
def create_user():
    use_case = create_user_use_case()
    data = request.get_json()
    
    try:
        user = use_case.execute(name=data["name"], email=data["email"])
        return jsonify({"id": user.user_id, "name": user.name, "email": user.email}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
```

> [!WARNING]
> Cuando los decoradores de framework (`@app.route`, `@db.Model`) aparecen en tu lógica de negocio, has acoplado tu sistema a ese framework. Mantén siempre los decoradores de framework en la capa de adaptador.

## La trampa del framework

| Trampa | Síntoma | Consecuencia |
|------|---------|-------------|
| Diseño framework-first | Empezar con `Flask(__name__)` | La lógica de negocio queda en segundo plano |
| Modelos ORM como entidades | `class User(db.Model)` | No se puede probar sin base de datos |
| Polución de decoradores | `@app.route` en la lógica de negocio | Cambiar de framework = reescribir |
| Acoplamiento de la configuración | `app.config` por todas partes | Se filtra la configuración propia del framework |
| Acoplamiento por extensiones | `flask-mail`, `flask-login` | Atadura al ecosistema de Flask |

```python
# Trap: Using ORM models as domain entities
# You cannot create a User without a database connection!

# myapp/models.py
from django.db import models

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)

    def confirm(self):
        self.status = "confirmed"
        self.save()  # Implicit database access!

# Clean: separate entity from ORM model
# domain/entities.py
@dataclass
class Order:
    order_id: str
    total: float
    status: str = "pending"

    def confirm(self) -> None:
        self.status = "confirmed"

# infrastructure/orm_models.py
from django.db import models

class OrderModel(models.Model):
    order_id = models.CharField(max_length=36, unique=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)

# infrastructure/adapters.py
class DjangoOrderRepository(OrderRepository):
    def save(self, order: Order) -> None:
        OrderModel.objects.update_or_create(
            order_id=order.order_id,
            defaults={"total": order.total, "status": order.status},
        )
```

## La base de datos como detalle

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


# --- Entity ---

@dataclass
class Product:
    product_id: str
    name: str
    price: float
    stock: int

    def reduce_stock(self, quantity: int) -> None:
        if quantity > self.stock:
            raise ValueError("Insufficient stock")
        self.stock -= quantity


# --- Repository Interface (inner) ---

class ProductRepository(ABC):
    @abstractmethod
    def save(self, product: Product) -> None:
        ...

    @abstractmethod
    def find_by_id(self, product_id: str) -> Optional[Product]:
        ...

    @abstractmethod
    def find_all(self) -> list[Product]:
        ...


# --- Concrete: PostgreSQL (outer) ---

class PostgresProductRepository(ProductRepository):
    def __init__(self, connection_string: str):
        self._conn_string = connection_string

    def save(self, product: Product) -> None:
        import psycopg2
        conn = psycopg2.connect(self._conn_string)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO products (id, name, price, stock) VALUES (%s, %s, %s, %s) "
                    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, price=EXCLUDED.price, stock=EXCLUDED.stock",
                    (product.product_id, product.name, product.price, product.stock),
                )
            conn.commit()
        finally:
            conn.close()

    def find_by_id(self, product_id: str) -> Optional[Product]:
        import psycopg2
        conn = psycopg2.connect(self._conn_string)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, price, stock FROM products WHERE id = %s", (product_id,))
                row = cur.fetchone()
                if row:
                    return Product(product_id=row[0], name=row[1], price=row[2], stock=row[3])
                return None
        finally:
            conn.close()

    def find_all(self) -> list[Product]:
        import psycopg2
        conn = psycopg2.connect(self._conn_string)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, price, stock FROM products")
                return [Product(product_id=r[0], name=r[1], price=r[2], stock=r[3]) for r in cur.fetchall()]
        finally:
            conn.close()


# --- Concrete: MongoDB (outer) ---

class MongoProductRepository(ProductRepository):
    def __init__(self, connection_string: str, db_name: str):
        from pymongo import MongoClient
        self._collection = MongoClient(connection_string)[db_name]["products"]

    def save(self, product: Product) -> None:
        self._collection.replace_one(
            {"_id": product.product_id},
            {"_id": product.product_id, "name": product.name, "price": product.price, "stock": product.stock},
            upsert=True,
        )

    def find_by_id(self, product_id: str) -> Optional[Product]:
        doc = self._collection.find_one({"_id": product_id})
        if doc:
            return Product(product_id=doc["_id"], name=doc["name"], price=doc["price"], stock=doc["stock"])
        return None

    def find_all(self) -> list[Product]:
        return [
            Product(product_id=doc["_id"], name=doc["name"], price=doc["price"], stock=doc["stock"])
            for doc in self._collection.find()
        ]


# --- Concrete: In-Memory (testing) ---

class InMemoryProductRepository(ProductRepository):
    def __init__(self):
        self._products: dict[str, Product] = {}

    def save(self, product: Product) -> None:
        self._products[product.product_id] = product

    def find_by_id(self, product_id: str) -> Optional[Product]:
        return self._products.get(product_id)

    def find_all(self) -> list[Product]:
        return list(self._products.values())
```

```mermaid
flowchart LR
    subgraph Inner["Capa interna"]
        IF[<<interface>> ProductRepository]
        UC[Caso de uso]
    end
    subgraph Outer["Capa externa (bases de datos)"]
        PG[PostgresProductRepository]
        MG[MongoProductRepository]
        IM[InMemoryProductRepository]
    end
    
    UC -.->|"depende de"| IF
    PG -->|"implementa"| IF
    MG -->|"implementa"| IF
    IM -->|"implementa"| IF
    
    style Inner fill:#c8e6c9,color:#000
    style Outer fill:#ffccbc,color:#000
```

## Los frameworks web como detalles

```python
# --- fastapi_adapter.py ---

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .composition_root import create_order_use_case

app = FastAPI()


class OrderRequest(BaseModel):
    customer_id: str
    items: list[dict]
    coupon_code: str | None = None


@app.post("/orders")
def place_order(request: OrderRequest):
    use_case = create_order_use_case()
    try:
        result = use_case.execute(
            customer_id=request.customer_id,
            items=request.items,
            coupon_code=request.coupon_code,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- flask_adapter.py ---

from flask import Blueprint, request, jsonify
from .composition_root import create_order_use_case

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/orders", methods=["POST"])
def place_order():
    use_case = create_order_use_case()
    data = request.get_json()
    try:
        result = use_case.execute(
            customer_id=data["customer_id"],
            items=data["items"],
            coupon_code=data.get("coupon_code"),
        )
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
```

> [!TIP]
> El caso de uso es idéntico en ambos ejemplos. Solo cambia el adaptador. Ese es el poder de tratar los frameworks como detalles.

## La configuración como detalle

La configuración debe inyectarse desde fuera, no importarse. Las capas internas nunca deberían leer las variables de entorno por su cuenta.

```python
# BAD: Inner layer reads configuration
import os

class UseCase:
    def execute(self) -> None:
        db_url = os.environ["DATABASE_URL"]  # Inner layer knows about env vars!
        api_key = os.environ["STRIPE_API_KEY"]
        ...


# GOOD: Configuration is injected from the outside

from dataclasses import dataclass


@dataclass
class AppConfig:
    database_url: str
    stripe_api_key: str
    smtp_host: str
    smtp_port: int
    log_level: str


# Composition root reads config and injects it
def create_app_config() -> AppConfig:
    import os
    return AppConfig(
        database_url=os.environ["DATABASE_URL"],
        stripe_api_key=os.environ["STRIPE_API_KEY"],
        smtp_host=os.environ.get("SMTP_HOST", "localhost"),
        smtp_port=int(os.environ.get("SMTP_PORT", "25")),
        log_level=os.environ.get("LOG_LEVEL", "INFO"),
    )


class UseCase:
    def __init__(self, config: AppConfig, repo: ProductRepository):
        self._config = config
        self._repo = repo

    def execute(self) -> None:
        # Use self._config.database_url if needed
        # But really — use cases shouldn't need config directly
        pass
```

## El correo electrónico como detalle

```python
from abc import ABC, abstractmethod


# --- Inner layer: Interface ---

class EmailSender(ABC):
    @abstractmethod
    def send(self, to: str, subject: str, body: str) -> None:
        ...


# --- Outer layer: SMTP Implementation ---

class SmtpEmailSender(EmailSender):
    def __init__(self, host: str, port: int, username: str, password: str):
        self._host = host
        self._port = port
        self._username = username
        self._password = password

    def send(self, to: str, subject: str, body: str) -> None:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["To"] = to
        msg["From"] = self._username

        with smtplib.SMTP(self._host, self._port) as server:
            server.starttls()
            server.login(self._username, self._password)
            server.send_message(msg)


# --- Outer layer: SendGrid Implementation ---

class SendGridEmailSender(EmailSender):
    def __init__(self, api_key: str):
        self._api_key = api_key

    def send(self, to: str, subject: str, body: str) -> None:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email="noreply@example.com",
            to_emails=to,
            subject=subject,
            plain_text_content=body,
        )
        sg = SendGridAPIClient(self._api_key)
        sg.send(message)


# --- Testing: Fake Implementation ---

class FakeEmailSender(EmailSender):
    def __init__(self):
        self.sent_emails: list[dict] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.sent_emails.append({"to": to, "subject": subject, "body": body})
```

## Los frameworks asíncronos como detalles

```python
# --- asyncio adapter ---

import asyncio
from abc import ABC, abstractmethod


# Sync use case (doesn't know about async)
class NotifyUserUseCase:
    def __init__(self, email_sender: EmailSender):
        self._email_sender = email_sender

    def execute(self, user_email: str, message: str) -> None:
        self._email_sender.send(
            to=user_email,
            subject="Notification",
            body=message,
        )


# Adapter makes sync use case work with async framework
class AsyncEmailSender(EmailSender):
    def __init__(self, smtp_host: str):
        self._host = smtp_host

    def send(self, to: str, subject: str, body: str) -> None:
        # Use asyncio.run or thread pool in the adapter
        import asyncio
        asyncio.create_task(self._async_send(to, subject, body))

    async def _async_send(self, to: str, subject: str, body: str) -> None:
        import aiosmtplib
        await aiosmtplib.send(
            body,
            hostname=self._host,
            recipients=[to],
            subject=subject,
        )


# Or wrap the use case for async controllers
class AsyncNotifyUserController:
    def __init__(self, use_case: NotifyUserUseCase):
        self._use_case = use_case

    async def handle(self, user_email: str, message: str) -> dict:
        # Run the sync use case in a thread pool
        await asyncio.to_thread(
            self._use_case.execute, user_email, message
        )
        return {"status": 200, "body": {"sent": True}}
```

> [!NOTE]
> Tu lógica de negocio no debería tener **ninguna opinión** sobre si se ejecuta de forma síncrona o asíncrona. El adaptador se encarga del límite asíncrono.

## El logging como detalle

```python
from abc import ABC, abstractmethod
from enum import Enum


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class Logger(ABC):
    @abstractmethod
    def log(self, level: LogLevel, message: str) -> None:
        ...

    def debug(self, message: str) -> None:
        self.log(LogLevel.DEBUG, message)

    def info(self, message: str) -> None:
        self.log(LogLevel.INFO, message)

    def warning(self, message: str) -> None:
        self.log(LogLevel.WARNING, message)

    def error(self, message: str) -> None:
        self.log(LogLevel.ERROR, message)


class StdoutLogger(Logger):
    def __init__(self, min_level: LogLevel = LogLevel.INFO):
        self._min_level = min_level

    def log(self, level: LogLevel, message: str) -> None:
        if level.value >= self._min_level.value:
            print(f"[{level.value}] {message}")


class PythonLogger(Logger):
    """Adapter for Python's standard logging module."""
    
    def __init__(self, name: str = "app"):
        import logging
        self._logger = logging.getLogger(name)

    def log(self, level: LogLevel, message: str) -> None:
        mapping = {
            LogLevel.DEBUG: logging.DEBUG,
            LogLevel.INFO: logging.INFO,
            LogLevel.WARNING: logging.WARNING,
            LogLevel.ERROR: logging.ERROR,
        }
        self._logger.log(mapping[level], message)


class UseCase:
    def __init__(self, repo, logger: Logger):
        self._repo = repo
        self._logger = logger

    def execute(self) -> None:
        self._logger.info("Starting use case execution")
        try:
            result = self._repo.find_all()
            self._logger.debug(f"Found {len(result)} items")
            return result
        except Exception as e:
            self._logger.error(f"Failed: {e}")
            raise
```

## Pruebas de las decisiones de framework

```python
# Test that the framework doesn't constrain the architecture

def test_use_case_has_no_framework_imports():
    import ast
    import os
    
    use_case_path = "src/use_cases/place_order.py"
    with open(use_case_path) as f:
        tree = ast.parse(f.read())
    
    framework_imports = {"flask", "fastapi", "django", "sqlalchemy", "psycopg2"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root = alias.name.split(".")[0]
                assert root not in framework_imports, \
                    f"Use case imports framework: {alias.name}"
        elif isinstance(node, ast.ImportFrom):
            root = node.module.split(".")[0] if node.module else ""
            assert root not in framework_imports, \
                f"Use case imports framework: {node.module}"


def test_entity_has_orm_free():
    """Entities should not inherit from ORM base classes."""
    entity_path = "src/entities/order.py"
    with open(entity_path) as f:
        content = f.read()
    
    assert "db.Model" not in content
    assert "models.Model" not in content
    assert "Base" not in content or "sqlalchemy" not in content
```

```mermaid
flowchart TD
    subgraph Adapter["Pruebas del adaptador de framework"]
        T1["Prueba: la entidad no importa\nframeworks"]
        T2["Prueba: el caso de uso no importa\nframeworks"]
        T3["Prueba: se puede cambiar la BD\nsin cambiar la lógica"]
    end
    subgraph Benefit["Beneficios"]
        B1["Actualiza el framework\nsin miedo"]
        B2["Cambia la base de datos\nen un solo adaptador"]
        B3["Prueba la lógica de negocio\na la velocidad de la luz"]
    end
    
    T1 --> B1
    T2 --> B2
    T3 --> B3
    
    style Adapter fill:#e1f5fe,color:#000
    style Benefit fill:#c8e6c9,color:#000
```

## Migración de framework en el mundo real

```python
# SCENARIO: Migrating from Flask to FastAPI
# The ONLY files that change:

# BEFORE: flask_adapter.py
from flask import Blueprint, request, jsonify

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    use_case = get_order_use_case()
    try:
        result = use_case.execute(order_id=order_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


# AFTER: fastapi_adapter.py
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/orders/{order_id}")
def get_order(order_id: str):
    use_case = get_order_use_case()
    try:
        result = use_case.execute(order_id=order_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Everything else remains the same:
# - use_cases/get_order.py  → UNCHANGED
# - entities/order.py        → UNCHANGED
# - repositories/*.py        → UNCHANGED
# - tests/*.py                → UNCHANGED
```

> [!SUCCESS]
> Cuando los frameworks se tratan como detalles, migrar de Flask a FastAPI (o a cualquier otro framework) consiste en reescribir un único archivo adaptador: no toda la aplicación.

## Lista de verificación para elegir framework

| Criterio | Pregunta | Por qué importa |
|----------|----------|----------------|
| Acoplamiento | ¿Este framework obliga a mis entidades a heredar de él? | El acoplamiento al ORM = entidades no aptas para pruebas |
| Testabilidad | ¿Puedo probar mi lógica sin ejecutar el framework? | Pruebas lentas = pruebas que se omiten |
| Costo de cambio | ¿Cuántos archivos cambian si cambio de framework? | Menos archivos = mejor arquitectura |
| Comunidad | ¿Seguirá mantenido este framework dentro de 5 años? | Framework abandonado = reescribir |
| Adecuación | ¿Resuelve este framework el problema correcto? | Herramienta equivocada = arquitectura equivocada |

> [!WARNING]
> Evita el desarrollo "framework-first". Nunca inicies un proyecto ejecutando `npx create-react-app` o `django-admin startproject`. Empieza por la lógica de negocio y añade después el framework como un plugin.

## Ejercicios prácticos

1. **Auditoría de frameworks**: Examina un proyecto en el que trabajes. Lista todos los archivos que tendrían que cambiar si cambiaras el framework web. ¿Qué capas están acopladas?

2. **Cambia la base de datos**: Toma un repositorio basado en SQLAlchemy e implementa una versión con MongoDB. El caso de uso no debería cambiar.

3. **Abstract un servicio de correo**: Tienes `send_email(to, subject, body)` usando `smtplib`. Crea una interfaz `EmailSender` y dos implementaciones: `SmtpSender` y `SendGridSender`.

4. **Inyección de configuración**: Refactoriza un caso de uso que lee `os.environ["API_KEY"]` directamente. En su lugar, inyecta la clave de API a través del constructor.

5. **Adaptador de framework**: Crea un adaptador de FastAPI y un adaptador de Flask para el mismo `CreateProductUseCase`. Muestra que comparten el mismo import del caso de uso.

6. **Desacoplamiento del ORM**: Toma un modelo de Django que mezcla lógica de entidad (`class Order(models.Model)` con métodos de negocio) y sepáralo en un par entidad + repositorio.

7. **Límite asíncrono**: Crea un caso de uso que llame a una interfaz `Logger`. Proporciona las implementaciones `SyncLogger` y `AsyncLogger`. Muestra cómo el caso de uso no cambia.

8. **Plan de migración**: Escribe un plan paso a paso para migrar un monolito de Django a la Arquitectura Limpia. Lista qué archivos se crean, cuáles se modifican y cuáles permanecen iguales.

> [!SUCCESS]
> Los frameworks son herramientas, no cimientos. Cuando los tratas como detalles, tu arquitectura sobrevive a actualizaciones de framework, migraciones y cambios de la industria.
