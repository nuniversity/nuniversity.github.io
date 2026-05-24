---
title: "Funciones y Ámbito (Scope)"
description: "Crea código reutilizable con funciones: parámetros, valores de retorno, ámbito, argumentos por defecto y mejores prácticas"
order: 9
duration: "30 minutos"
difficulty: "beginner"
---

# Funciones y Ámbito (Scope)

Las funciones son bloques de código reutilizables que realizan una tarea específica. Te ayudan a organizar el código, evitar la repetición y construir programas complejos a partir de piezas simples.

## Definiendo y Llamando Funciones

```python
def greet():
    print("Hello, World!")

greet()  # Llamar a la función
```

## Parámetros y Argumentos

```python
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")  # "Hello, Alice!"
```

### Múltiples Parámetros
```python
def add(a, b):
    result = a + b
    return result

sum_result = add(5, 3)  # 8
```

## La Sentencia return

Las funciones pueden devolver valores (o `None` por defecto):

```python
def square(x):
    return x * x

result = square(4)  # 16

# Múltiples valores de retorno (como tupla)
def divide(a, b):
    quotient = a // b
    remainder = a % b
    return quotient, remainder

q, r = divide(17, 5)  # q=3, r=2
```

## Argumentos por Defecto

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))          # "Hello, Alice!"
print(greet("Bob", "Hi"))      # "Hi, Bob!"
```

> [!WARNING]
> ¡Nunca uses argumentos por defecto mutables (listas, dicts)! Se crean una vez y se comparten entre llamadas.

```python
def bad_append(item, list=[]):  # ¡Incorrecto!
    list.append(item)
    return list

def good_append(item, list=None):  # Correcto
    if list is None:
        list = []
    list.append(item)
    return list
```

## Argumentos por Palabra Clave

```python
def create_user(name, age, country):
    return f"{name}, {age}, from {country}"

# Posicional
user1 = create_user("Alice", 25, "USA")

# Por palabra clave (el orden no importa)
user2 = create_user(age=30, country="Canada", name="Bob")
```

## Ámbito de Variables (Scope)

### Ámbito Local
```python
def my_func():
    x = 10  # Variable local
    print(x)

my_func()     # 10
print(x)      # NameError! x no está definida
```

### Ámbito Global
```python
x = 10  # Variable global

def my_func():
    print(x)  # Puede leer la global

my_func()  # 10
```

### Modificando Globales (¡Usar con Moderación!)
```python
count = 0

def increment():
    global count
    count += 1

increment()
print(count)  # 1
```

> [!NOTE]
| Tipo | Definida | Accesible | Mejor Práctica |
|---|---|---|---|
| Local | Dentro de la función | Solo en esa función | Predeterminado — usa para datos temporales |
| Envolvente | En función externa | Funciones internas | Usa con closures |
| Global | Nivel superior | En todas partes | Evita modificar; usa parámetros en su lugar |
| Incorporada | El propio Python | En todas partes | No sobrescribas |

## Indicadores de Tipo (Documentación)

```python
def add(a: int, b: int) -> int:
    return a + b

def greet(name: str) -> str:
    return f"Hello, {name}"

def process(items: list[str]) -> None:
    for item in items:
        print(item)
```

## Docstrings

Documenta lo que hace tu función:

```python
def calculate_bmi(weight: float, height: float) -> float:
    """Calculate Body Mass Index.
    
    Args:
        weight: Weight in kilograms
        height: Height in meters
        
    Returns:
        BMI value
    """
    return weight / (height ** 2)
```

## Ejemplo del Mundo Real: Funciones de Procesamiento de Datos

```python
def clean_text(text: str) -> str:
    """Remove punctuation and normalize whitespace."""
    import string
    for char in string.punctuation:
        text = text.replace(char, "")
    return " ".join(text.split())

def word_frequency(text: str) -> dict:
    """Count word frequency in text."""
    words = clean_text(text).lower().split()
    freq = {}
    for word in words:
        freq[word] = freq.get(word, 0) + 1
    return freq

def top_words(freq: dict, n: int = 5) -> list:
    """Return the n most common words."""
    return sorted(freq.items(), key=lambda x: x[1], reverse=True)[:n]

# Uso
text = "Hello world! Hello everyone. Welcome to the world of Python."
freq = word_frequency(text)
print(top_words(freq))
```

> [!SUCCESS]
> Las funciones son los bloques de construcción del código mantenible: ocultan complejidad, previenen la repetición y hacen tus programas modulares.

## Preguntas de Práctica

1. Escribe una función que tome dos números y devuelva su producto.
2. ¿Cuál es la diferencia entre `print` y `return` en una función?
3. ¿Qué sucede si una función no tiene una sentencia return?
4. ¿Por qué `def func(x=[])` es problemático?
5. Escribe una función con indicadores de tipo que convierta Celsius a Fahrenheit.
6. ¿Cuál es el ámbito de una variable definida dentro de una función?
7. ¿Cómo devuelves múltiples valores desde una función?
8. Escribe una función recursiva que calcule el factorial.
9. ¿Qué hace `global` dentro de una función?
10. Escribe un docstring para una función que valide una dirección de correo electrónico.
