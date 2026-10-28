---
title: "Funciones"
description: "Domina las funciones de Python: definición, parámetros, valores de retorno, ámbito, docstrings y patrones prácticos de funciones."
order: 7
duration: "60 min"
difficulty: "beginner"
language: "es"
---

# Funciones

Las funciones son bloques de código reutilizables que realizan tareas específicas. Ayudan a organizar el código, a evitar la repetición y a que los programas sean más fáciles de entender y mantener.

## ¿Qué es una función?

Una función es un bloque de código con nombre al que puedes llamar (invocar) para realizar una tarea. Piensa en ella como en una receta: la defines una vez y la usas siempre que la necesites.

```mermaid
flowchart LR
    A[Definición de función] --> B["def greet(name):"]
    B --> C["    return f'Hello, {name}!"]
    
    D[Llamada a la función] --> E["greet('Alice')"]
    E --> F[Resultado: 'Hello, Alice!']
    
    style A fill:#e1f5fe
    style D fill:#e8f5e9
```

## Definir funciones

### Sintaxis básica

```python
def function_name(parameters):
    """Docstring: describes what the function does."""
    # Function body
    result = ...
    return result
```

### Ejemplo simple de una función

```python
def greet(name):
    """Return a greeting message for the given name."""
    return f"Hello, {name}! Welcome to Python."

# Calling the function
message = greet("Alice")
print(message)  # Hello, Alice! Welcome to Python.

message = greet("Bob")
print(message)  # Hello, Bob! Welcome to Python.
```

### Funciones sin valor de retorno

```python
def print_separator(char="-", length=30):
    """Print a separator line."""
    print(char * length)

print_separator()           # ------------------------------
print_separator("=", 20)    # ====================
print_separator("*", 10)    # **********
```

> [!NOTE]
> Las funciones sin sentencia `return` devuelven `None` implícitamente. Así representa Python "nada".

## Parámetros y argumentos

Los parámetros son las variables que aparecen en la definición de la función. Los argumentos son los valores reales que se pasan al llamar a la función.

### Tipos de parámetros

```mermaid
flowchart TD
    A[Parámetros de función] --> B[Posicionales]
    A --> C[Con nombre]
    A --> D[Valores por defecto]
    A --> E[*args: posicionales variables]
    A --> F[**kwargs: con nombre variables]
    
    style B fill:#e1f5fe
    style C fill:#e8f5e9
    style D fill:#fff3e0
    style E fill:#f3e5f5
    style F fill:#fce4ec
```

### Parámetros posicionales

```python
def calculate_area(length, width):
    """Calculate the area of a rectangle."""
    return length * width

# Arguments matched by position
area = calculate_area(10, 5)
print(f"Area: {area}")  # 50

# Order matters!
print(f"10×5 = {calculate_area(10, 5)}")  # 50
print(f"5×10 = {calculate_area(5, 10)}")  # 50 (same result, but different meaning)
```

### Parámetros con valores por defecto

```python
def create_profile(name, age, country="Brazil", language="Python"):
    """Create a user profile with default values."""
    return {
        "name": name,
        "age": age,
        "country": country,
        "language": language
    }

# Using defaults
profile1 = create_profile("Alice", 25)
print(profile1)
# {'name': 'Alice', 'age': 25, 'country': 'Brazil', 'language': 'Python'}

# Overriding defaults
profile2 = create_profile("Bob", 30, "USA", "JavaScript")
print(profile2)
# {'name': 'Bob', 'age': 30, 'country': 'USA', 'language': 'JavaScript'}
```

> [!WARNING]
> Los valores por defecto de los parámetros se evalúan solo una vez, cuando se define la función. Nunca uses valores por defecto mutables (como listas o diccionarios):
> ```python
> # BAD: shared list across calls!
> def add_item(item, items=[]):
>     items.append(item)
>     return items
> 
> # GOOD: create new list each time
> def add_item(item, items=None):
>     if items is None:
>         items = []
>     items.append(item)
>     return items
> ```

### Argumentos con nombre

```python
def create_email(to, subject, body, priority="normal"):
    """Create an email message."""
    return f"To: {to}\nSubject: {subject}\nPriority: {priority}\n\n{body}"

# Using keyword arguments (order doesn't matter)
email = create_email(
    body="Please review the attached document.",
    to="manager@company.com",
    priority="high",
    subject="Document Review"
)
print(email)
```

Salida:
```
To: manager@company.com
Subject: Document Review
Priority: high

Please review the attached document.
```

### *args: argumentos posicionales variables

```python
def calculate_sum(*args):
    """Sum any number of arguments."""
    total = 0
    for num in args:
        total += num
    return total

print(f"Sum of 1, 2, 3: {calculate_sum(1, 2, 3)}")         # 6
print(f"Sum of 10, 20, 30, 40: {calculate_sum(10, 20, 30, 40)}")  # 100
print(f"Sum of nothing: {calculate_sum()}")                  # 0
```

### **kwargs: argumentos con nombre variables

```python
def create_student_record(name, **kwargs):
    """Create a student record with optional fields."""
    record = {"name": name}
    record.update(kwargs)
    return record

student = create_student_record(
    "Maria",
    age=22,
    major="Computer Science",
    gpa=3.8,
    enrolled=True
)
print(student)
# {'name': 'Maria', 'age': 22, 'major': 'Computer Science', 'gpa': 3.8, 'enrolled': True}
```

## Valores de retorno

Las funciones pueden devolver valores usando la sentencia `return`.

### Valor de retorno único

```python
def square(number):
    """Return the square of a number."""
    return number ** 2

result = square(5)
print(f"5² = {result}")  # 25
```

### Múltiples valores de retorno

```python
def divide_with_remain(dividend, divisor):
    """Return quotient and remainder."""
    quotient = dividend // divisor
    remainder = dividend % divisor
    return quotient, remainder  # Returns a tuple

q, r = divide_with_remain(17, 5)
print(f"17 ÷ 5 = {q} remainder {r}")  # 17 ÷ 5 = 3 remainder 2
```

### Retorno anticipado

```python
def classify_age(age):
    """Classify a person's age group."""
    if age < 0:
        return "Invalid age"
    if age < 13:
        return "Child"
    if age < 18:
        return "Teenager"
    if age < 65:
        return "Adult"
    return "Senior"

ages = [-5, 8, 15, 30, 70]
for age in ages:
    print(f"Age {age:3d}: {classify_age(age)}")
```

Salida:
```
Age  -5: Invalid age
Age   8: Child
Age  15: Teenager
Age  30: Adult
Age  70: Senior
```

## Ámbito de las variables

El ámbito determina dónde se puede acceder a una variable.

### Niveles de ámbito

```mermaid
flowchart TD
    A[Regla LEGB] --> B[Local]
    A --> C[Cerrante]
    A --> D[Global]
    A --> E[Integrada]
    
    B --> F[Variables dentro de la función]
    C --> G[Variables en la función externa]
    D --> H[Variables a nivel de módulo]
    E --> I[Integradas de Python: print, len, etc.]
    
    style B fill:#e1f5fe
    style C fill:#e8f5e9
    style D fill:#fff3e0
    style E fill:#f3e5f5
```

### Ejemplos de ámbito

```python
# Global variable
global_var = "I'm global"

def demonstrate_scope():
    # Local variable
    local_var = "I'm local"
    
    # Can read global variable
    print(f"Inside function - global: {global_var}")
    print(f"Inside function - local: {local_var}")

demonstrate_scope()
print(f"Outside function - global: {global_var}")
# print(local_var)  # ERROR: NameError - local_var not defined here
```

### Modificar variables globales

```python
counter = 0

def increment():
    global counter  # Declare we're using the global variable
    counter += 1

increment()
increment()
increment()
print(f"Counter: {counter}")  # 3
```

> [!TIP]
> Evita usar `global` siempre que sea posible. En su lugar, pasa los valores como parámetros y devuelve los resultados:
> ```python
> # Better approach
> def increment_counter(counter):
>     return counter + 1
> 
> counter = 0
> counter = increment_counter(counter)
> ```

## Docstrings

Los docstrings son literales de cadena que aparecen como la primera sentencia de una función. Documentan lo que hace la función.

### Formatos de docstring

```python
def calculate_bmi(weight_kg, height_m):
    """
    Calculate Body Mass Index (BMI).
    
    Args:
        weight_kg: Weight in kilograms (float)
        height_m: Height in meters (float)
    
    Returns:
        float: BMI value
    
    Raises:
        ValueError: If weight or height is not positive
    
    Example:
        >>> calculate_bmi(70, 1.75)
        22.86
    """
    if weight_kg <= 0 or height_m <= 0:
        raise ValueError("Weight and height must be positive")
    
    return weight_kg / (height_m ** 2)

# Access docstring
print(calculate_bmi.__doc__)
# Or use help()
# help(calculate_bmi)
```

### Uso de help()

```python
def fibonacci(n):
    """
    Calculate the nth Fibonacci number.
    
    The Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, ...
    Each number is the sum of the two preceding ones.
    
    Args:
        n: Position in the sequence (non-negative integer)
    
    Returns:
        int: The nth Fibonacci number
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# Display documentation
help(fibonacci)
```

## Funciones lambda

Las funciones lambda son funciones anónimas pequeñas definidas con la palabra clave `lambda`.

### Sintaxis lambda

```python
# Regular function
def square(x):
    return x ** 2

# Equivalent lambda
square_lambda = lambda x: x ** 2

print(f"square(5) = {square(5)}")              # 25
print(f"square_lambda(5) = {square_lambda(5)}") # 25
```

### Casos de uso de lambda

```python
# Sorting with lambda
students = [
    ("Alice", 85),
    ("Bob", 92),
    ("Charlie", 78),
]

# Sort by grade (second element)
by_grade = sorted(students, key=lambda s: s[1])
print("Sorted by grade:", by_grade)

# Sort by name (first element)
by_name = sorted(students, key=lambda s: s[0])
print("Sorted by name:", by_name)

# Using with map()
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
print(f"Squared: {squared}")  # [1, 4, 9, 16, 25]

# Using with filter()
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(f"Evens: {evens}")  # [2, 4]
```

## Ejemplo del mundo real: sistema de conversión de temperatura

```python
# temperature_converter.py
"""
Temperature Converter System
Supports Celsius, Fahrenheit, and Kelvin conversions.
"""

def celsius_to_fahrenheit(c):
    """Convert Celsius to Fahrenheit."""
    return c * 9/5 + 32

def celsius_to_kelvin(c):
    """Convert Celsius to Kelvin."""
    return c + 273.15

def fahrenheit_to_celsius(f):
    """Convert Fahrenheit to Celsius."""
    return (f - 32) * 5/9

def fahrenheit_to_kelvin(f):
    """Convert Fahrenheit to Kelvin."""
    return (f - 32) * 5/9 + 273.15

def kelvin_to_celsius(k):
    """Convert Kelvin to Celsius."""
    return k - 273.15

def kelvin_to_fahrenheit(k):
    """Convert Kelvin to Fahrenheit."""
    return (k - 273.15) * 9/5 + 32

# Conversion map
CONVERSIONS = {
    ("C", "F"): celsius_to_fahrenheit,
    ("C", "K"): celsius_to_kelvin,
    ("F", "C"): fahrenheit_to_celsius,
    ("F", "K"): fahrenheit_to_kelvin,
    ("K", "C"): kelvin_to_celsius,
    ("K", "F"): kelvin_to_fahrenheit,
}

def convert_temperature(value, from_unit, to_unit):
    """
    Convert temperature between units.
    
    Args:
        value: Temperature value (float)
        from_unit: Source unit ('C', 'F', or 'K')
        to_unit: Target unit ('C', 'F', or 'K')
    
    Returns:
        float: Converted temperature
    """
    from_unit = from_unit.upper()
    to_unit = to_unit.upper()
    
    if from_unit == to_unit:
        return value
    
    key = (from_unit, to_unit)
    if key not in CONVERSIONS:
        raise ValueError(f"Invalid conversion: {from_unit} to {to_unit}")
    
    return CONVERSIONS[key](value)

def display_conversion_table():
    """Display a temperature conversion table."""
    print("=" * 55)
    print("     TEMPERATURE CONVERSION TABLE")
    print("=" * 55)
    print(f"{'Celsius':>10} {'Fahrenheit':>12} {'Kelvin':>10}")
    print("-" * 55)
    
    for c in range(-20, 51, 5):
        f = celsius_to_fahrenheit(c)
        k = celsius_to_kelvin(c)
        print(f"{c:10.1f} {f:12.1f} {k:10.1f}")
    
    print("=" * 55)

# Run the converter
display_conversion_table()

# Interactive conversion
print("\nQuick Conversions:")
test_values = [
    (0, "C", "F"),
    (100, "C", "F"),
    (98.6, "F", "C"),
    (37, "C", "K"),
    (0, "K", "C"),
]

for value, frm, to in test_values:
    result = convert_temperature(value, frm, to)
    print(f"  {value}°{frm} = {result:.2f}°{to}")
```

Salida:
```
=======================================================
     TEMPERATURE CONVERSION TABLE
=======================================================
   Celsius   Fahrenheit     Kelvin
-------------------------------------------------------
     -20.0        -4.0      253.2
     -15.0          5.0      258.2
     -10.0         14.0      263.2
      -5.0         23.0      268.2
       0.0         32.0      273.2
       5.0         41.0      278.2
      10.0         50.0      283.2
      15.0         59.0      288.2
      20.0         68.0      293.2
      25.0         77.0      298.2
      30.0         86.0      303.2
      35.0         95.0      308.2
      40.0        104.0      313.2
      45.0        113.0      318.2
      50.0        122.0      323.2
=======================================================

Quick Conversions:
  0°C = 32.00°F
  100°C = 212.00°F
  98.6°F = 37.00°C
  37°C = 310.15K
  0K = -273.15°C
```

## Ejercicios prácticos

### Ejercicio 1: función simple
Escribe una función `is_even(n)` que devuelva `True` si n es par y `False` en caso contrario.

### Ejercicio 2: conversor de temperatura
Escribe una función que convierta Celsius a Fahrenheit y viceversa en función de un parámetro.

### Ejercicio 3: repetidor de cadenas
Escribe una función `repeat_string(text, n)` que devuelva el texto repetido n veces, separado por espacios.

### Ejercicio 4: máximo de tres
Escribe una función `max_of_three(a, b, c)` que devuelva el mayor de tres números sin usar `max()`.

### Ejercicio 5: verificador de palíndromos
Escribe una función `is_palindrome(text)` que devuelva `True` si el texto se lee igual de adelante hacia atrás.

### Ejercicio 6: función con parámetros por defecto
Escribe una función `format_currency(amount, symbol="$", decimals=2)` que formatee un número como moneda.

### Ejercicio 7: secuencia de Fibonacci
Escribe una función `fibonacci_sequence(n)` que devuelva una lista con los primeros n números de Fibonacci.

### Ejercicio 8: funciones de estadística
Escribe las funciones `mean(numbers)`, `median(numbers)` y `mode(numbers)` que calculen estadísticas básicas.

## Resumen

En esta lección has aprendido:
- Cómo definir y llamar funciones con `def`
- Diferentes tipos de parámetros: posicionales, con nombre, por defecto, *args, **kwargs
- Cómo devolver valores únicos y múltiples
- El ámbito de las variables y la regla LEGB
- Cómo escribir docstrings eficaces
- Cómo usar funciones lambda para operaciones sencillas
- Cómo organizar el código en funciones reutilizadas y bien documentadas

Las funciones son los bloques de construcción de la programación modular. Domínalas para escribir código limpio y mantenible.
