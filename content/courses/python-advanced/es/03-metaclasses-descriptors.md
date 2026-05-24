---
title: "Metaclases y Descriptores"
description: "Domina la creación de clases con metaclases, el protocolo descriptor y construye frameworks potentes con __new__, __init__, __get__ y __set__"
order: 3
duration: "90 minutos"
difficulty: avanzado
---

# Metaclases y Descriptores

## Todo es un Objeto

En Python, las clases también son objetos — instancias de una metaclase (predeterminado: `type`).

```python
class MyClass:
    pass

print(type(MyClass))     # <class 'type'>
print(type(type))        # <class 'type'>
print(isinstance(MyClass, type))  # True
```

## La Metaclase `type()`

`type(name, bases, namespace)` crea una nueva clase dinámicamente.

```python
# Estas son equivalentes:
class Foo:
    x = 10
    def bar(self):
        return self.x

Foo = type("Foo", (), {"x": 10, "bar": lambda self: self.x})

# Con herencia
Base = type("Base", (), {"greet": lambda self: "hello"})
Child = type("Child", (Base,), {"extra": 42})
obj = Child()
print(obj.greet())  # "hello"
print(obj.extra)    # 42
```

## Metaclases Personalizadas

Una metaclase hereda de `type`. Su `__new__` recibe el nombre, bases y namespace de la futura clase.

```python
class SingletonMeta(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self):
        self.connected = False

db1 = Database()
db2 = Database()
print(db1 is db2)  # True
```

[!NOTE]
`__new__` se llama antes de `__init__`. En metaclases, `__new__` recibe la clase que se está creando, mientras que `__init__` recibe la clase ya creada.

### Metaclase de Validación

```python
class ValidateAttributes(type):
    def __new__(mcs, name, bases, namespace):
        required = namespace.get("__required_attrs__", [])
        for attr in required:
            if attr not in namespace:
                raise TypeError(f"{name} must define '{attr}'")
        return super().__new__(mcs, name, bases, namespace)

class APIEndpoint(metaclass=ValidateAttributes):
    __required_attrs__ = ["path", "method"]

# Esto lanza TypeError:
# class InvalidEndpoint(metaclass=ValidateAttributes):
#     pass

class ValidEndpoint(metaclass=ValidateAttributes):
    __required_attrs__ = ["path", "method"]
    path = "/api/health"
    method = "GET"
```

## `__new__` vs `__init__`

| Método | Cuándo se Llama | Devuelve | Propósito |
|--------|-----------------|----------|-----------|
| `__new__` | Antes de init | Nueva instancia | Creación de objeto (rara vez sobrescrito) |
| `__init__` | Después de `__new__` | None | Inicialización de objeto |

```python
class Custom:
    def __new__(cls, *args, **kwargs):
        instance = super().__new__(cls)
        print(f"Creating instance of {cls.__name__}")
        return instance

    def __init__(self, value):
        print(f"Initialising with {value}")
        self.value = value

obj = Custom(42)
# Creating instance of Custom
# Initialising with 42
```

[!SUCCESS]
Sobrescribe `__new__` para tipos inmutables (str, int, tuple) o patrones singleton/registry. Usa `__init__` para inicialización normal.

## El Protocolo Descriptor

Los descriptores son objetos que definen `__get__`, `__set__` o `__delete__`. Controlan el acceso a atributos.

```python
class ValidatedField:
    def __init__(self, validator):
        self.validator = validator
        self.data = {}

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return self.data.get(id(obj))

    def __set__(self, obj, value):
        if not self.validator(value):
            raise ValueError(f"Invalid value: {value}")
        self.data[id(obj)] = value

class Person:
    age = ValidatedField(lambda v: 0 <= v <= 150)

    def __init__(self, name, age):
        self.name = name
        self.age = age

p = Person("Alice", 30)
print(p.age)  # 30
# p.age = 200  # ValueError
```

## La Implementación de `property()`

`property()` es un descriptor incorporado. Así es como lo implementarías:

```python
class Property:
    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        if doc is None and fget is not None:
            doc = fget.__doc__
        self.__doc__ = doc

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.fget is None:
            raise AttributeError("unreadable attribute")
        return self.fget(obj)

    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError("can't set attribute")
        self.fset(obj, value)

    def __delete__(self, obj):
        if self.fdel is None:
            raise AttributeError("can't delete attribute")
        self.fdel(obj)

    def setter(self, fset):
        return type(self)(self.fget, fset, self.fdel)

    def deleter(self, fdel):
        return type(self)(self.fget, self.fset, fdel)

class Temperature:
    def __init__(self, celsius=0):
        self._celsius = celsius

    @Property
    def fahrenheit(self):
        return self._celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self._celsius = (value - 32) * 5 / 9
```

## Mundo Real: Campo ORM estilo Django

```python
class Field:
    def __init__(self, default=None, nullable=False):
        self.default = default
        self.nullable = nullable
        self.name = None

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name, self.default)

    def __set__(self, obj, value):
        if value is None and not self.nullable:
            raise ValueError(f"{self.name} cannot be null")
        obj.__dict__[self.name] = value

class ModelMeta(type):
    def __new__(mcs, name, bases, namespace):
        fields = {}
        for attr_name, attr_val in namespace.items():
            if isinstance(attr_val, Field):
                fields[attr_name] = attr_val
        cls = super().__new__(mcs, name, bases, namespace)
        cls._fields = fields
        return cls

class Model(metaclass=ModelMeta):
    pass

class User(Model):
    name = Field(default="anonymous")
    email = Field(nullable=False)
    age = Field(default=0)

u = User()
print(u.name)  # "anonymous"
```

## Slots: Optimización de Memoria

`__slots__` declara atributos de instancia explícitamente, eliminando el `__dict__` por instancia.

```python
class Point:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
# p.z = 3  # AttributeError
print(p.x, p.y)
```

[!NOTE]
Los slots interactúan con descriptores de forma interesante: si un descriptor define `__set_name__` y la clase usa `__slots__`, la entrada del slot se usa en lugar del dict de la instancia.

## Mermaid: Jerarquía de Metaclases

```mermaid
flowchart BT
    subgraph INSTANCIAS["Nivel de Instancia"]
        obj1["obj (instancia)"] --> MiClase
    end
    subgraph CLASES["Nivel de Clase"]
        MiClase --> Meta
        OtraClase --> Meta
    end
    subgraph META["Nivel de Metaclase"]
        Meta["MiMeta(type)"] --> type
        type --> type
    end
```

## Preguntas de Práctica

1. ¿Qué es una metaclase? ¿Cómo difiere `type("Name", bases, dict)` de usar la palabra clave `class`?
2. Implementa una metaclase `AutoRepr` que añada automáticamente un método `__repr__` a toda clase que la use.
3. ¿Cuál es la diferencia entre `__new__` y `__init__`? ¿Cuándo sobrescribirías `__new__`?
4. Explica el protocolo descriptor. ¿Cómo interactúan `__get__`, `__set__` y `__delete__`?
5. Reimplementa `@property` de Python usando una clase descriptora personalizada.
6. ¿Cuál es el propósito de `__set_name__`? Muestra un ejemplo donde sea esencial.
7. Construye una metaclase `EnumMeta` que impida nombres de miembros de enumeración duplicados.
8. ¿Cómo afecta `__slots__` el uso de memoria y la velocidad de acceso a atributos? ¿Cuáles son sus limitaciones?
9. Escribe un descriptor `LoggedAttribute` que registre toda lectura y escritura en su valor.
10. ¿Por qué `property()` funciona como decorador? Explica usando descriptores.
