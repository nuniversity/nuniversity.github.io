---
title: "Arquitetura Limpa em Python"
description: "Aplique os princípios da Arquitetura Limpa usando ferramentas específicas do Python: Protocols, dataclasses, injeção de dependência e estrutura de projetos"
order: 6
duration: "70 minutos"
difficulty: "intermediário"
---

# Arquitetura Limpa em Python

Python é uma excelente linguagem para Arquitetura Limpa. Sua tipagem dinâmica, classes Protocol e sintaxe simples facilitam a definição de limites, inversão de dependências e manutenção da lógica de negócio pura.

> [!NOTE]
> A filosofia do Python se alinha naturalmente com a Arquitetura Limpa: simplicidade, legibilidade e praticidade. Você não precisa de um contêiner DI pesado — duck typing e dataclasses são suficientes.

## Estrutura de Projeto

```
my_project/
  src/
    entities/              # Regras de negócio empresariais
      __init__.py
      order.py
      customer.py
    use_cases/             # Regras de negócio da aplicação
      __init__.py
      place_order.py
      interfaces.py        # Protocols para repositórios e gateways
    interface_adapters/    # Adaptadores
      controllers/
      presenters/
      repositories/
      gateways/
    frameworks/            # Configuração de framework
      web/
        fastapi_app.py
      config.py
    main.py                # Raiz de composição
  tests/
    test_entities/
    test_use_cases/
    test_adapters/
```

## Usando Protocols para Limites

```python
from typing import Protocol


class OrderRepository(Protocol):
    def save(self, order: "Order") -> None: ...
    def find_by_id(self, order_id: str) -> "Order | None": ...


class CancelOrderUseCase:
    def __init__(self, repo: OrderRepository):
        self._repo = repo

    def execute(self, order_id: str) -> None:
        order = self._repo.find_by_id(order_id)
        if order is None:
            raise ValueError("Pedido não encontrado")
        order.cancel()
        self._repo.save(order)


class PostgresOrderRepository:
    def save(self, order: "Order") -> None:
        ...

    def find_by_id(self, order_id: str) -> "Order | None":
        ...
```

> [!NOTE]
> Diferente de ABCs, Protocols usam **subtipagem estrutural** — um objeto é considerado como implementando o protocolo se tiver os métodos certos, independentemente de sua hierarquia de classe.

## Dataclasses para DTOs e Entidades

```python
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum, auto
from typing import List, Optional
from datetime import datetime


class OrderStatus(Enum):
    PENDING = auto()
    CONFIRMED = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()


@dataclass
class Customer:
    customer_id: str
    name: str
    email: str


@dataclass
class OrderItem:
    product_id: str
    product_name: str
    quantity: int
    unit_price: Decimal

    def total(self) -> Decimal:
        return Decimal(str(self.quantity)) * self.unit_price


@dataclass
class Order:
    order_id: str
    customer: Customer
    items: List[OrderItem] = field(default_factory=list)
    status: OrderStatus = OrderStatus.PENDING

    def confirm(self) -> None:
        if self.status != OrderStatus.PENDING:
            raise ValueError("Apenas pedidos pendentes podem ser confirmados")
        if not self.items:
            raise ValueError("Não pode confirmar pedido vazio")
        self.status = OrderStatus.CONFIRMED

    def cancel(self) -> None:
        if self.status in (OrderStatus.SHIPPED, OrderStatus.DELIVERED):
            raise ValueError("Não pode cancelar pedido enviado ou entregue")
        self.status = OrderStatus.CANCELLED
```

## Injeção de Dependência Sem Framework

```python
# --- composition_root.py ---

def create_place_order_use_case() -> "PlaceOrderUseCase":
    order_repo = PostgresOrderRepository(connection_string="postgresql://localhost:5432/shop")
    customer_repo = PostgresCustomerRepository(connection_string="postgresql://localhost:5432/shop")
    product_repo = PostgresProductRepository(connection_string="postgresql://localhost:5432/shop")
    payment_gateway = StripePaymentGateway(api_key="sk_test_...")
    notification = EmailNotificationService(smtp_host="smtp.example.com")

    return PlaceOrderUseCase(
        customer_repo=customer_repo, product_repo=product_repo,
        order_repo=order_repo, payment_gateway=payment_gateway,
        notification_service=notification,
    )


# Para testes — sem infraestrutura real
def create_test_place_order_use_case() -> "PlaceOrderUseCase":
    return PlaceOrderUseCase(
        customer_repo=InMemoryCustomerRepository(),
        product_repo=InMemoryProductRepository(),
        order_repo=InMemoryOrderRepository(),
        payment_gateway=FakePaymentGateway(),
        notification_service=FakeNotificationService(),
    )
```

```mermaid
flowchart TD
    subgraph Composicao["Raiz de Composição"]
        CR[create_app()]
    end
    subgraph Instancia["Instancia"]
        ORepo[PostgresOrderRepository]
        PGW[StripePaymentGateway]
        NS[EmailNotificationService]
    end
    subgraph Injeta["Injeta Em"]
        UC[PlaceOrderUseCase]
    end
    CR --> ORepo
    CR --> PGW
    CR --> NS
    CR --> UC
    ORepo --> UC
    PGW --> UC
    NS --> UC
    style Composicao fill:#c8e6c9,color:#000
```

## Caso de Uso Completo

```python
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol, Optional
import uuid


class CustomerRepository(Protocol):
    def find_by_id(self, customer_id: str) -> Optional["Customer"]: ...
    def save(self, customer: "Customer") -> None: ...


class ProductRepository(Protocol):
    def find_by_id(self, product_id: str) -> Optional["Product"]: ...


class OrderRepository(Protocol):
    def save(self, order: "Order") -> None: ...
    def find_by_id(self, order_id: str) -> Optional["Order"]: ...


class PaymentGateway(Protocol):
    def charge(self, customer_email: str, amount: Decimal) -> str: ...


@dataclass
class PlaceOrderInput:
    customer_id: str
    items: list[dict]


@dataclass
class PlaceOrderOutput:
    order_id: str
    total: float
    status: str
    item_count: int
    transaction_id: str


class PlaceOrderUseCase:
    def __init__(self, customer_repo: CustomerRepository, product_repo: ProductRepository,
                 order_repo: OrderRepository, payment_gateway: PaymentGateway):
        self._customer_repo = customer_repo
        self._product_repo = product_repo
        self._order_repo = order_repo
        self._payment = payment_gateway

    def execute(self, input_dto: PlaceOrderInput) -> PlaceOrderOutput:
        customer = self._customer_repo.find_by_id(input_dto.customer_id)
        if customer is None:
            raise ValueError(f"Cliente '{input_dto.customer_id}' não encontrado")

        order_id = str(uuid.uuid4())
        order = Order(order_id=order_id, customer=customer)

        for item_data in input_dto.items:
            product = self._product_repo.find_by_id(item_data["product_id"])
            if product is None:
                raise ValueError(f"Produto '{item_data['product_id']}' não encontrado")
            order.add_item(OrderItem(product.product_id, product.name, item_data["quantity"], product.price))

        order.confirm()
        txn_id = self._payment.charge(customer.email, order.total())
        self._order_repo.save(order)

        return PlaceOrderOutput(
            order_id=order_id, total=float(order.total()),
            status=order.status.name, item_count=len(order.items), transaction_id=txn_id,
        )
```

## Testando com In-Memory Repositories

```python
import pytest
from decimal import Decimal


class TestPlaceOrderUseCase:
    @pytest.fixture
    def use_case(self):
        customer_repo = InMemoryCustomerRepository()
        customer_repo.save(Customer(customer_id="C1", name="Alice", email="a@test.com"))
        product_repo = InMemoryProductRepository()
        product_repo.save(Product(product_id="P1", name="Widget", price=Decimal("10.00"), stock=10))
        return PlaceOrderUseCase(
            customer_repo=customer_repo, product_repo=product_repo,
            order_repo=InMemoryOrderRepository(), payment_gateway=FakePaymentGateway(),
        )

    def test_place_order_success(self, use_case):
        output = use_case.execute(PlaceOrderInput(customer_id="C1", items=[{"product_id": "P1", "quantity": 2}]))
        assert output.status == "CONFIRMED"
        assert output.total == 20.0

    def test_place_order_invalid_customer(self, use_case):
        with pytest.raises(ValueError, match="não encontrado"):
            use_case.execute(PlaceOrderInput(customer_id="FAKE", items=[]))
```

## Padrões Específicos do Python

### Gerenciadores de Contexto para Limites

```python
from contextlib import contextmanager
from typing import Iterator


class UnitOfWork:
    def __init__(self, connection_string: str):
        self._conn_string = connection_string

    @contextmanager
    def transaction(self) -> Iterator["Connection"]:
        import psycopg2
        conn = psycopg2.connect(self._conn_string)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
```

### Aliases de Tipo para Clareza

```python
from typing import TypeAlias
from decimal import Decimal

JSON: TypeAlias = dict[str, "JSON"] | list["JSON"] | str | int | float | bool | None
Money: TypeAlias = Decimal
Email: TypeAlias = str

class PaymentGateway(Protocol):
    def charge(self, customer_email: Email, amount: Money) -> str: ...
```

### Exceções Personalizadas

```python
class DomainError(Exception):
    pass


class EntityNotFoundError(DomainError):
    def __init__(self, entity_type: str, entity_id: str):
        super().__init__(f"{entity_type} '{entity_id}' não encontrado")
```

## Comparação: Python vs Outras Linguagens

| Aspecto | Python | Java / C# |
|---------|--------|-----------|
| Interfaces | Protocol / ABC | interface keyword |
| DI | Manual / bibliotecas simples | Spring / Guice |
| Entidades | @dataclass | POJO / record |
| Testes | pytest + in-memory | JUnit + mocks |

## Exercícios Práticos

1. **Protocol boundary**: Defina um Protocol `Logger` com `log(level, message)`. Implemente `StdoutLogger` e `FileLogger`.

2. **Dataclass DTOs**: Crie dataclasses de entrada/saída para um `TransferMoneyUseCase`. Inclua `from_account_id`, `to_account_id`, `amount`, `currency`.

3. **DI manual**: Escreva uma raiz de composição que cria um `ProcessOrderUseCase` com `PostgresOrderRepository`, `StripePaymentGateway` e `EmailNotificationService`.

4. **Repositórios in-memory**: Implemente `InMemoryAccountRepository` com `save`, `find_by_id`, `find_by_owner`. Teste um caso de uso de transferência.

5. **Gerador de projeto**: Crie um script que gera a estrutura de diretórios de um projeto de Arquitetura Limpa.

6. **Refatore para Protocols**: Pegue uma classe que herda de `ABC` e refatore para usar `Protocol`. Mostre ambas as versões.

7. **Validação Pydantic**: Substitua um dataclass DTO simples por um modelo Pydantic que valida formato de email e preços positivos.

8. **Unit of Work**: Implemente um `UnitOfWork` context manager e use-o em um repositório. Escreva um teste que verifica rollback em caso de falha.

> [!SUCCESS]
> Python e Arquitetura Limpa são uma combinação natural. Os Protocols, dataclasses e simplicidade do Python permitem que você foque no que importa — lógica de negócio limpa e testável.
