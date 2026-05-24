---
title: "Variables y Tipos de Datos"
description: "Aprende a almacenar datos usando variables y comprende los tipos de datos fundamentales de Python: int, float, string y bool"
order: 3
duration: "30 minutos"
difficulty: "beginner"
---

# Variables y Tipos de Datos

Las variables son contenedores para almacenar datos. Python tiene tipado dinámico, lo que significa que no necesitas declarar el tipo de una variable — Python lo infiere automáticamente.

## Variables

```python
name = "Alice"        # String
age = 25              # Entero
height = 1.68         # Float
is_student = True     # Booleano
```

### Reglas de Nombrado
- Deben comenzar con una letra o guión bajo
- Pueden contener letras, números y guiones bajos
- Distinguen mayúsculas y minúsculas (`age` ≠ `Age`)
- No pueden usar palabras clave de Python (como `if`, `for`, `while`)

```python
# Nombres válidos
user_name = "Bob"
_user_id = 42
camelCase = "OK"      # Permitido pero no preferido

# Nombres inválidos
2nd_place = "No"      # Comienza con número
my-var = "No"         # No se permite guión
class = "No"          # Palabra reservada
```

### Convenciones de Nombrado (PEP 8)
```python
# Usa snake_case para variables y funciones
user_age = 30
total_price = 99.99

# Usa UPPER_CASE para constantes
PI = 3.14159
MAX_SIZE = 100
```

> [!NOTE]
> Python sigue la guía de estilo PEP 8. Usa `snake_case` para variables, no `camelCase`.

## Tipos Numéricos

### Enteros (`int`)
```python
count = 10
negative = -5
big_number = 1_000_000  # Los guiones bajos mejoran la legibilidad
```

### Flotantes (`float`)
```python
price = 19.99
pi = 3.14159
scientific = 1.5e-4   # 0.00015
```

### Conversión de Tipos
```python
# int a float
x = float(10)       # 10.0

# float a int (trunca)
y = int(3.99)       # 3

# string a int
z = int("42")       # 42
```

## Cadenas de Texto (`str`)

```python
# Comillas simples o dobles
first = 'Hello'
second = "World"

# Cadenas multilínea
poem = """Roses are red,
Violets are blue,
Python is fun,
And so are you."""

# Concatenación de cadenas
greeting = "Hello" + " " + "World"

# Interpolación de cadenas (f-strings)
name = "Alice"
age = 25
message = f"{name} is {age} years old."

# Métodos de cadenas
text = "  Python is FUN  "
print(text.lower())       # "  python is fun  "
print(text.upper())       # "  PYTHON IS FUN  "
print(text.strip())       # "Python is FUN"
print(text.replace("FUN", "awesome"))  # "  Python is awesome  "
```

## Booleanos (`bool`)

```python
is_active = True
is_finished = False

# Los operadores de comparación devuelven booleanos
print(10 > 5)    # True
print(3 == 4)    # False
```

## Tipo None

`None` representa la ausencia de un valor:

```python
result = None
print(result)    # None
```

## Verificando Tipos

```python
print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type("Hello"))   # <class 'str'>
print(type(True))      # <class 'bool'>
print(type(None))      # <class 'NoneType'>
```

## Tipado Dinámico

El tipo de una variable puede cambiar:

```python
x = 10        # x es int
x = "hello"   # x ahora es str
x = 3.14      # x ahora es float
```

> [!WARNING]
> El tipado dinámico es flexible pero puede causar errores. Usa nombres de variables significativos y sé consistente con los tipos.

> [!SUCCESS]
> Recuerda: `int` para números enteros, `float` para decimales, `str` para texto, `bool` para verdadero/falso y `None` para nada.

## Preguntas de Práctica

1. ¿Qué devolverá `type(3.14)`?
2. Convierte `"100"` a un entero.
3. ¿Qué hay de malo con `2nd_place = "Bob"`?
4. Escribe un f-string que diga "Alice is 30 years old".
5. ¿Cuál es la diferencia entre `10` y `10.0`?
6. ¿Qué devuelve `"hello".upper()`?
7. Verdadero o Falso: Python requiere que declares los tipos de las variables.
8. ¿Qué representa `None` en Python?
9. Convierte el float `99.9` a un entero — ¿cuál es el resultado?
10. Escribe un nombre de variable en Python usando snake_case para la dirección de correo electrónico de un usuario.
