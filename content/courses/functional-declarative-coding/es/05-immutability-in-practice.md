---
title: "Inmutabilidad en la práctica"
description: "Domina las estructuras de datos inmutables, las colecciones persistentes y las técnicas para evitar la mutación en Python del mundo real"
order: 5
duration: "55 min"
difficulty: "intermediate"
---

# Inmutabilidad en la práctica

La inmutabilidad es una piedra angular de la programación funcional. Cuando los datos no pueden cambiar, los programas se vuelven más fáciles de razonar, probar y paralelizar. Esta lección cubre técnicas prácticas para trabajar con datos inmutables en Python.

## Por qué importa la inmutabilidad

El estado mutable es la fuente de infinidad de errores, especialmente en sistemas con múltiples hilos o sistemas complejos. La inmutabilidad elimina categorías enteras de fallos.

```python
from typing import List, Dict, Any, Tuple
from copy import deepcopy
import threading
import time

# MUTABLE — race condition waiting to happen
class BankAccountMutable:
    def __init__(self, balance: float):
        self.balance = balance

    def withdraw(self, amount: float) -> None:
        if self.balance >= amount:
            # Thread switch here causes race condition!
            self.balance -= amount
            return True
        return False

# IMMUTABLE — thread safe by design
class BankAccountImmutable:
    def __init__(self, balance: float):
        self._balance = balance

    @property
    def balance(self) -> float:
        return self._balance

    def withdraw(self, amount: float) -> Tuple["BankAccountImmutable", bool]:
        if self._balance >= amount:
            return BankAccountImmutable(self._balance - amount), True
        return self, False

# Demonstrate alias bug with mutable data
def alias_bug_demo() -> None:
    original: List[int] = [1, 2, 3]
    alias = original         # Both reference the same list
    original.append(4)       # Oops — alias is also modified!
    print(alias)             # [1, 2, 3, 4] — unexpected!

    # With immutability, this can't happen
    original_tuple = (1, 2, 3)
    alias_tuple = original_tuple
    # original_tuple += (4,)  # Would create a NEW tuple
    print(alias_tuple)       # (1, 2, 3) — unchanged

alias_bug_demo()
```

```mermaid
flowchart TD
    subgraph "Mutable (Shared Reference)"
        A["list_a = [1,2,3]"] --> B["list_b = list_a"]
        B --> C["list_a.append(4)"]
        C --> D["list_b → [1,2,3,4]"]
        D --> E["🐛 ¡Mutación inesperada!"]
    end
    subgraph "Immutable (copy on write)"
        F["tuple_a = (1,2,3)"] --> G["tuple_b = tuple_a"]
        G --> H["tuple_a + (4,)"]
        H --> I["Nuevo: (1,2,3,4)"]
        H --> J["tuple_b → (1,2,3)"]
        J --> K["✅ Referencia estable"]
    end
    style E fill:#ffcdd2
    style K fill:#c8e6c9
```

## Tipos inmutables incorporados de Python

Python ofrece varios tipos inmutables de fábrica.

```python
from typing import Tuple, FrozenSet

# tuple — immutable sequence
point = (3, 4)
# point[0] = 5  # TypeError!

# str — immutable text
name = "Alice"
# name[0] = "B"  # TypeError!
name_upper = name.upper()  # Returns new string
print(name)       # "Alice" — unchanged
print(name_upper) # "ALICE"

# int, float, bool — immutable by nature
x = 5
# x is a reference to an integer object
# 5 is immutable; x = 6 creates a new binding

# frozenset — immutable set
frozen = frozenset([1, 2, 3])
# frozen.add(4)  # AttributeError!

# bytes — immutable byte sequence
data = b"hello"
# data[0] = 104  # TypeError!

# Named tuple — immutable record
from collections import namedtuple

Point = namedtuple("Point", ["x", "y", "z"])
pt = Point(1, 2, 3)
print(pt.x)     # 1
print(pt.y)     # 2
# pt.x = 5      # AttributeError!

# Named tuple with defaults
from typing import NamedTuple

class Student(NamedTuple):
    name: str
    grade: float
    active: bool = True

s = Student("Alice", 85.5)
print(s.name)    # "Alice"
print(s.grade)   # 85.5
# s.grade = 90   # AttributeError!
```

> [!NOTE]
> NamedTuple y `@dataclass(frozen=True)` son las formas más prácticas de crear estructuras de datos inmutables en Python. Ofrecen inmutabilidad, legibilidad y un boilerplate mínimo.

## Dataclasses congeladas

```python
from dataclasses import dataclass
from typing import List, Tuple

@dataclass(frozen=True)
class Product:
    id: int
    name: str
    price: float
    tags: Tuple[str, ...]

p = Product(1, "Laptop", 1200.0, ("electronics", "computers"))
# p.price = 1100.0  # FrozenInstanceError!
print(p)

# Copy with changes
from dataclasses import replace

p_discounted = replace(p, price=1100.0)
print(p_discounted.price)  # 1100.0
print(p.price)             # 1200.0 — original unchanged

@dataclass(frozen=True)
class Order:
    id: int
    customer: str
    items: Tuple[Product, ...]
    total: float

    def apply_discount(self, rate: float) -> "Order":
        new_total = self.total * (1 - rate)
        return replace(self, total=round(new_total, 2))

    def add_item(self, product: Product) -> "Order":
        new_items = self.items + (product,)
        new_total = self.total + product.price
        return replace(self, items=new_items, total=round(new_total, 2))

order = Order(
    id=1001,
    customer="Alice",
    items=(p,),
    total=1200.0,
)

discounted = order.apply_discount(0.1)
expanded = order.add_item(Product(2, "Mouse", 25.0, ("accessories",)))

print(f"Original: ${order.total}")         # $1200.0
print(f"Discounted: ${discounted.total}")  # $1080.0
print(f"Expanded: ${expanded.total}")      # $1225.0
```

## Evitar la mutación en la práctica

```python
from typing import List, Dict, Any, Set
from copy import deepcopy

# BAD: Mutating arguments
def add_score_bad(scores: List[int], new_score: int) -> None:
    scores.append(new_score)  # modifies the caller's list!

# GOOD: Return new collection
def add_score_good(scores: List[int], new_score: int) -> List[int]:
    return scores + [new_score]  # or list(scores) + [new_score]

original = [85, 90, 78]
# add_score_bad(original, 95)  # Would mutate!
result = add_score_good(original, 95)
print(original)  # [85, 90, 78] — unchanged
print(result)    # [85, 90, 78, 95]

# BAD: Removing from list while iterating
def remove_low_scores_bad(scores: List[int]) -> None:
    for s in scores:         # BUG: modifying during iteration
        if s < 60:
            scores.remove(s)

# GOOD: Create new list
def remove_low_scores_good(scores: List[int]) -> List[int]:
    return [s for s in scores if s >= 60]

# BAD: Mutating dictionary in place
def update_user_bad(user: Dict[str, Any], changes: Dict[str, Any]) -> None:
    user.update(changes)

# GOOD: Return new dictionary
def update_user_good(user: Dict[str, Any], changes: Dict[str, Any]) -> Dict[str, Any]:
    return {**user, **changes}

user = {"id": 1, "name": "Alice", "score": 85}
updated = update_user_good(user, {"score": 90, "level": "advanced"})
print(user)     # {"id": 1, "name": "Alice", "score": 85}
print(updated)  # {"id": 1, "name": "Alice", "score": 90, "level": "advanced"}
```

## Inmutabilidad profunda vs. superficial

```python
from typing import List, Dict, Any
from copy import deepcopy

# Shallow immutability: the outer container is immutable,
# but nested mutable objects can still be changed
@dataclass(frozen=True)
class ShallowImmutable:
    data: List[int]  # The list reference is frozen, but the list contents are mutable!

s = ShallowImmutable([1, 2, 3])
# s.data is protected (can't reassign)
# But the list itself is mutable:
# s.data.append(4)  # WORKS! — mutates the list inside an "immutable" object!

# True deep immutability: everything inside is also immutable
@dataclass(frozen=True)
class DeepImmutable:
    data: Tuple[int, ...]  # Tuple is truly immutable

d = DeepImmutable((1, 2, 3))
# d.data[0] = 99  # TypeError!

# Ensuring deep immutability in nested structures
@dataclass(frozen=True)
class Address:
    street: str
    city: str
    zip_code: str

@dataclass(frozen=True)
class Person:
    name: str
    age: int
    address: Address  # All fields are immutable types

    def move(self, new_address: Address) -> "Person":
        return replace(self, address=new_address)

addr = Address("123 Main St", "Springfield", "12345")
person = Person("Alice", 30, addr)

new_addr = Address("456 Oak Ave", "Shelbyville", "67890")
moved_person = person.move(new_addr)

print(person.address.street)        # "123 Main St"
print(moved_person.address.street)  # "456 Oak Ave"

# For deeply nested dicts: use a library like pyrsistent
# or convert to frozen dataclasses
def deep_freeze(d: Dict[str, Any]) -> Tuple[Tuple[str, Any], ...]:
    """Recursively convert dict to immutable structure."""
    return tuple(
        (k, deep_freeze(v) if isinstance(v, dict) else v)
        for k, v in d.items()
    )

nested = {"a": {"b": {"c": 1}}}
frozen = deep_freeze(nested)
print(frozen)  # (('a', (('b', (('c', 1),)),)),)
```

```mermaid
flowchart TD
    A["Profundidad de inmutabilidad"] --> B["Superficial"]
    A --> C["Profunda"]
    B --> D["La referencia de nivel superior\nestá congelada"]
    B --> E["Los objetos mutables anidados\naún pueden cambiar"]
    C --> F["Todos los niveles anidados\nson inmutables"]
    C --> G["Se requiere congelado\nrecursivo"]
    style B fill:#fff9c4
    style C fill:#c8e6c9
    style E fill:#ffcdd2
    style G fill:#e1f5fe
```

## Trabajo con `pyrsistent` (estructuras de datos persistentes)

```python
# pyrsistent provides efficient immutable data structures.
# Install: pip install pyrsistent
try:
    from pyrsistent import pvector, pmap, pset, freeze, thaw
    PYR_INSTALLED = True
except ImportError:
    PYR_INSTALLED = False
    print("Install pyrsistent: pip install pyrsistent")

if PYR_INSTALLED:
    # Persistent vector — like a list
    v1 = pvector([1, 2, 3])
    v2 = v1.append(4)           # New vector with 4 added
    v3 = v2.set(0, 99)          # New vector with index 0 changed
    v4 = v3.remove(2)           # New vector without element at index 2

    print(v1)     # pvector([1, 2, 3])
    print(v2)     # pvector([1, 2, 3, 4])
    print(v3)     # pvector([99, 2, 3, 4])

    # Structural sharing — old versions remain valid and share memory
    assert v2[3] == 4
    assert v1[2] == 3

    # Persistent map — like a dict
    m1 = pmap({"name": "Alice", "score": 85})
    m2 = m1.set("score", 90)    # New map with updated score
    m3 = m2.remove("name")      # New map without name

    print(m1)  # pmap({'name': 'Alice', 'score': 85})
    print(m2)  # pmap({'name': 'Alice', 'score': 90})

    # Structural sharing
    assert m1["name"] == m2["name"]  # Same object in memory!

    # Transform multiple keys at once
    m4 = m1.transform(
        ["score"], 95,
        ["level"], "advanced"
    )
    print(m4)  # pmap({'name': 'Alice', 'score': 95, 'level': 'advanced'})

    # Convert native types to persistent
    data = {"users": [{"name": "Alice"}, {"name": "Bob"}]}
    persistent = freeze(data)
    print(persistent)
    # pmap({'users': pvector([pmap({'name': 'Alice'}), pmap({'name': 'Bob'})])})

    # Convert back
    native = thaw(persistent)
    print(native)
    # {'users': [{'name': 'Alice'}, {'name': 'Bob'}]}
```

## Patrones de datos inmutables para aplicaciones reales

```python
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, replace
from functools import reduce

# Pattern 1: Reducer pattern (like Redux)
@dataclass(frozen=True)
class AppState:
    count: int = 0
    users: Tuple[Dict[str, Any], ...] = ()
    loading: bool = False

def reducer(state: AppState, action: Dict[str, Any]) -> AppState:
    action_type = action.get("type")

    if action_type == "INCREMENT":
        return replace(state, count=state.count + 1)
    elif action_type == "DECREMENT":
        return replace(state, count=state.count - 1)
    elif action_type == "ADD_USER":
        return replace(state, users=state.users + (action["user"],))
    elif action_type == "SET_LOADING":
        return replace(state, loading=action["loading"])
    return state

state = AppState()
state = reducer(state, {"type": "INCREMENT"})
state = reducer(state, {"type": "ADD_USER", "user": {"name": "Alice"}})
state = reducer(state, {"type": "SET_LOADING", "loading": True})
print(state)
# AppState(count=1, users=({'name': 'Alice'},), loading=True)

# Pattern 2: Builder pattern
@dataclass(frozen=True)
class QueryBuilder:
    table: str = ""
    fields: Tuple[str, ...] = ()
    where_clauses: Tuple[Tuple[str, str, Any], ...] = ()
    order_by_field: str = ""
    order_desc: bool = False
    limit_count: Optional[int] = None

    def from_table(self, table: str) -> "QueryBuilder":
        return replace(self, table=table)

    def select(self, *fields: str) -> "QueryBuilder":
        return replace(self, fields=fields)

    def where(self, field: str, op: str, value: Any) -> "QueryBuilder":
        return replace(self, where_clauses=self.where_clauses + ((field, op, value),))

    def order_by(self, field: str, desc: bool = False) -> "QueryBuilder":
        return replace(self, order_by_field=field, order_desc=desc)

    def limit(self, count: int) -> "QueryBuilder":
        return replace(self, limit_count=count)

    def build(self) -> str:
        parts = [f"SELECT {', '.join(self.fields) if self.fields else '*'}"]

        if self.table:
            parts.append(f"FROM {self.table}")

        if self.where_clauses:
            conditions = [
                f"{f} {o} {v!r}" if isinstance(v, str) else f"{f} {o} {v}"
                for f, o, v in self.where_clauses
            ]
            parts.append(f"WHERE {' AND '.join(conditions)}")

        if self.order_by_field:
            direction = "DESC" if self.order_desc else "ASC"
            parts.append(f"ORDER BY {self.order_by_field} {direction}")

        if self.limit_count is not None:
            parts.append(f"LIMIT {self.limit_count}")

        return " ".join(parts)

query = (
    QueryBuilder()
    .from_table("users")
    .select("name", "email", "age")
    .where("age", ">", 18)
    .where("active", "=", True)
    .order_by("name")
    .limit(10)
    .build()
)
print(query)
# SELECT name, email, age FROM users WHERE age > 18 AND active = True ORDER BY name ASC LIMIT 10
```

## Copia defensiva

Cuando debas aceptar o devolver datos mutables, cópialos primero.

```python
from typing import List, Dict, Any
from copy import deepcopy

class ImmutableWrapper:
    def __init__(self, data: Dict[str, Any]):
        # Defensive copy on input
        self._data = deepcopy(data)

    def get_data(self) -> Dict[str, Any]:
        # Defensive copy on output
        return deepcopy(self._data)

    def get_value(self, key: str) -> Any:
        return deepcopy(self._data.get(key))

# Demonstrating protection
original = {"name": "Alice", "scores": [85, 90, 78]}
wrapper = ImmutableWrapper(original)

# Can't affect wrapper through original
original["name"] = "Bob"
original["scores"].append(100)

retrieved = wrapper.get_data()
retrieved["name"] = "Charlie"  # Can't affect wrapper

print(original)   # {'name': 'Bob', 'scores': [85, 90, 78, 100]}
print(wrapper.get_data())  # {'name': 'Alice', 'scores': [85, 90, 78]}

# Decorator for defensive copying
from functools import wraps

def protect_args(func: Callable) -> Callable:
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        protected_args = [deepcopy(a) for a in args]
        protected_kwargs = {k: deepcopy(v) for k, v in kwargs.items()}
        return func(*protected_args, **kwargs)
    return wrapper

@protect_args
def process_data(data: List[int]) -> List[int]:
    # Even if we mutate internally, caller's data is safe
    data.append(999)
    return [x * 2 for x in data]

data = [1, 2, 3]
result = process_data(data)
print(data)    # [1, 2, 3] — protected!
print(result)  # [1, 2, 3, 999, 2, 4, 6] — includes internal mutation
```

## Inmutabilidad y rendimiento

```python
from typing import List
import time

# Performance characteristics of immutable operations

# BAD: Repeated concatenation creates many intermediate copies
def build_list_bad(n: int) -> List[int]:
    result: List[int] = []
    for i in range(n):
        result = result + [i]  # O(n) each time → O(n²) total
    return result

# GOOD: Build mutable locally, freeze at boundary
def build_list_good(n: int) -> Tuple[int, ...]:
    result: List[int] = []
    for i in range(n):
        result.append(i)       # O(1) amortized
    return tuple(result)       # Freeze at boundary

# Benchmark
n = 10000

start = time.perf_counter()
bad = build_list_bad(n)
bad_time = time.perf_counter() - start

start = time.perf_counter()
good = build_list_good(n)
good_time = time.perf_counter() - start

print(f"Bad (repeated concat): {bad_time:.3f}s")
print(f"Good (build then freeze): {good_time:.3f}s")
print(f"Speedup: {bad_time / good_time:.1f}x")
```

## Comparación de inmutabilidad

| Técnica | Rendimiento | Memoria | Seguridad | Caso de uso |
|-----------|-------------|--------|--------|----------|
| **tuple** | Lectura rápida | Baja | Alta | Secuencias fijas |
| **NamedTuple** | Lectura rápida | Baja | Alta | Registros simples |
| **frozen dataclass** | Lectura rápida | Baja | Alta | Datos estructurados |
| **frozenset** | Pertenencia rápida | Media | Alta | Colecciones únicas |
| **str** | Lectura rápida | Baja | Alta | Datos de texto |
| **deepcopy** | Lenta (O(n)) | Alta | Alta | Defensa en la frontera |
| **pyrsistent** | Buena (compartición estructural) | Media | Alta | Colecciones persistentes grandes |
| **Inmutabilidad manual** | Variable | Variable | Variable | Escenarios personalizados |

## Ejercicios de práctica

1. Refactoriza esta clase mutable para que sea inmutable:
   ```python
   class ShoppingCart:
       def __init__(self):
           self.items = []
           self.total = 0.0
       def add_item(self, name, price):
           self.items.append(name)
           self.total += price
   ```

2. Escribe una función `update_in(d, keys, func)` que reciba un diccionario anidado, una lista de claves y una función para aplicar en la clave destino. Debe devolver un nuevo diccionario sin mutar el original:
   ```python
   data = {"a": {"b": {"c": 5}}}
   result = update_in(data, ["a", "b", "c"], lambda x: x * 2)
   # result = {"a": {"b": {"c": 10}}}
   # data should be unchanged
   ```

3. Dada una lista del dataclass congelado `Transaction(id, amount, category)`, escribe un pipeline que:
   - Filtre las transacciones con amount > 100
   - Las agrupe por categoría (devuelve un dict congelado)
   - Devuelva el total por categoría como un nuevo dataclass congelado

4. Implementa un `Stack` con estilo inmutable. `push` y `pop` deben devolver pilas nuevas; la original debe permanecer sin cambios.

5. Crea un decorador `@freeze_args` que convierta todos los argumentos mutables (listas, dicts, sets) a sus equivalentes inmutables (tuples, frozensets, namedtuples) antes de pasarlos a la función decorada.

6. Usa `pyrsistent` (o simúlalo con tuples) para implementar un sistema de deshacer/rehacer donde cada estado es una estructura de datos persistente y las operaciones solo crean nuevas versiones.

7. Compara el rendimiento de construir una lista de 10.000 elementos usando: (a) `+` repetido en tuples, (b) construir una lista y luego convertirla a tuple, (c) `pyrsistent.pvector`. Mide los tiempos de cada una.

8. Dado este código mutable, refactorízalo para usar patrones inmutables en todo el código:
   ```python
   def process_users(users):
       for user in users:
           if user["score"] >= 90:
               user["grade"] = "A"
           elif user["score"] >= 80:
               user["grade"] = "B"
           else:
               user["grade"] = "C"
           if len(user["name"]) > 10:
               user["name"] = user["name"][:10]
       return users
   ```

## Resumen

- **La inmutabilidad** previene errores de alias, simplifica el razonamiento y permite la concurrencia segura
- Python ofrece tipos inmutables incorporados: `tuple`, `frozenset`, `str`, `bytes`, `int`, `float`
- **NamedTuple** y las **dataclasses congeladas** son las herramientas idiomáticas para registros inmutables
- La **compartición estructural** en las estructuras de datos persistentes (pyrsistent) ofrece un buen rendimiento
- La **copia defensiva** protege las fronteras entre el código mutable e inmutable
- La **inmutabilidad superficial** no protege los objetos mutables anidados
- Prefiere inmutable por defecto; usa el estado mutable como una optimización local
- Construye mutable localmente → congela en las fronteras → procesa de forma inmutable

> [!SUCCESS]
> La inmutabilidad no es solo un ideal teórico: es una herramienta práctica que elimina errores, simplifica las pruebas y hace que tu código sea más fácil de razonar. En la próxima lección, combinarás la inmutabilidad con patrones declarativos para lograr la máxima expresividad.
