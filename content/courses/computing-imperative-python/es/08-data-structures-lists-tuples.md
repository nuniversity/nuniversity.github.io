---
title: "Estructuras de datos: listas y tuplas"
description: "Domina las listas y las tuplas de Python: creación, indexación, slicing, métodos, mutabilidad y casos de uso prácticos."
order: 8
duration: "60 min"
difficulty: "beginner"
language: "es"
---

# Estructuras de datos: listas y tuplas

Las listas y las tuplas son los tipos de secuencia fundamentales de Python. Almacenan colecciones ordenadas de elementos y se usan en prácticamente cualquier programa de Python.

## ¿Qué son las estructuras de datos?

Las estructuras de datos son formas de organizar y almacenar datos para que puedan accederse y modificarse de forma eficiente. Python proporciona varias estructuras de datos incorporadas.

```mermaid
flowchart TD
    A[Estructuras de datos de Python] --> B[Secuencias]
    A --> C[Asociaciones]
    A --> D[Conjuntos]
    
    B --> E[Lista - mutable]
    B --> F[Tupla - inmutable]
    B --> G[Range - inmutable]
    B --> H[Cadena - inmutable]
    
    C --> I[Diccionario]
    
    D --> J[Conjunto]
    D --> K[Frozenset]
    
    style E fill:#e1f5fe
    style F fill:#e8f5e9
    style I fill:#fff3e0
    style J fill:#f3e5f5
```

## Listas

Las listas son colecciones ordenadas y mutables que pueden contener elementos de cualquier tipo.

### Crear listas

```python
# Empty list
empty = []
empty_alt = list()

# List with items
numbers = [1, 2, 3, 4, 5]
fruits = ["apple", "banana", "cherry"]
mixed = [1, "hello", 3.14, True]  # Different types allowed!

# List from range
evens = list(range(0, 11, 2))
print(f"Evens: {evens}")  # [0, 2, 4, 6, 8, 10]

# List comprehension (preview)
squares = [x ** 2 for x in range(1, 6)]
print(f"Squares: {squares}")  # [1, 4, 9, 16, 25]
```

### Representación en memoria de una lista

```mermaid
classDiagram
    class List {
        +index 0: "apple"
        +index 1: "banana"
        +index 2: "cherry"
        +index 3: "date"
        +length: 4
    }
    
    note for List "Mutable: se pueden añadir, eliminar y cambiar elementos"
```

### Indexación

Accede a elementos individuales por su posición (índice basado en 0).

```python
fruits = ["apple", "banana", "cherry", "date", "elderberry"]

# Positive indexing (from start)
print(f"First:  {fruits[0]}")   # apple
print(f"Second: {fruits[1]}")   # banana
print(f"Third:  {fruits[2]}")   # cherry

# Negative indexing (from end)
print(f"Last:    {fruits[-1]}")   # elderberry
print(f"Second-to-last: {fruits[-2]}")  # date
print(f"Third-to-last: {fruits[-3]}")   # cherry
```

### Slicing

Extrae porciones de una lista usando la notación de rebanadas: `[start:stop:step]`.

```python
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# Basic slicing
print(f"numbers[2:5]   = {numbers[2:5]}")     # [2, 3, 4]
print(f"numbers[:3]    = {numbers[:3]}")      # [0, 1, 2]
print(f"numbers[7:]    = {numbers[7:]}")      # [7, 8, 9]
print(f"numbers[:]     = {numbers[:]}")       # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] (copy)

# With step
print(f"numbers[::2]   = {numbers[::2]}")     # [0, 2, 4, 6, 8]
print(f"numbers[1::2]  = {numbers[1::2]}")    # [1, 3, 5, 7, 9]
print(f"numbers[::-1]  = {numbers[::-1]}")    # [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] (reverse)
```

### Métodos de lista

```mermaid
flowchart LR
    A[Métodos de lista] --> B[Añadir elementos]
    A --> C[Eliminar elementos]
    A --> D[Buscar elementos]
    A --> E[Otros]
    
    B --> B1["append(x)"]
    B --> B2["insert(i, x)"]
    B --> B3["extend(iterable)"]
    
    C --> C1["remove(x)"]
    C --> C2["pop(i)"]
    C --> C3["clear()"]
    
    D --> D1["index(x)"]
    D --> D2["count(x)"]
    
    E --> E1["sort()"]
    E --> E2["reverse()"]
    E --> E3["copy()"]
    
    style B fill:#e1f5fe
    style C fill:#fce4ec
    style D fill:#fff3e0
    style E fill:#e8f5e9
```

### Añadir elementos

```python
fruits = ["apple", "banana"]

# append() - add to end
fruits.append("cherry")
print(f"After append: {fruits}")  # ['apple', 'banana', 'cherry']

# insert() - add at specific position
fruits.insert(1, "apricot")
print(f"After insert: {fruits}")  # ['apple', 'apricot', 'banana', 'cherry']

# extend() - add multiple items
fruits.extend(["date", "elderberry"])
print(f"After extend: {fruits}")  # ['apple', 'apricot', 'banana', 'cherry', 'date', 'elderberry']

# Concatenation with +
more_fruits = fruits + ["fig", "grape"]
print(f"After +: {more_fruits}")
```

### Eliminar elementos

```python
fruits = ["apple", "banana", "cherry", "date", "banana"]

# remove() - remove first occurrence of value
fruits.remove("banana")
print(f"After remove: {fruits}")  # ['apple', 'cherry', 'date', 'banana']

# pop() - remove and return item at index
removed = fruits.pop(2)
print(f"pop(2) returned: {removed}")  # date
print(f"After pop: {fruits}")  # ['apple', 'cherry', 'banana']

# pop() without argument - remove last
last = fruits.pop()
print(f"pop() returned: {last}")  # banana
print(f"After pop: {fruits}")  # ['apple', 'cherry']

# del statement
del fruits[0]
print(f"After del: {fruits}")  # ['cherry']
```

### Ordenar e invertir

```python
numbers = [5, 2, 8, 1, 9, 3]

# sort() - sort in place (modifies original)
numbers.sort()
print(f"Sorted: {numbers}")  # [1, 2, 3, 5, 8, 9]

# sort(reverse=True) - descending
numbers.sort(reverse=True)
print(f"Descending: {numbers}")  # [9, 8, 5, 3, 2, 1]

# sorted() - returns new list (doesn't modify original)
original = [5, 2, 8, 1, 9]
new_sorted = sorted(original)
print(f"Original: {original}")    # [5, 2, 8, 1, 9]
print(f"Sorted:   {new_sorted}")  # [1, 2, 5, 8, 9]

# reverse() - reverse in place
numbers = [1, 2, 3, 4, 5]
numbers.reverse()
print(f"Reversed: {numbers}")  # [5, 4, 3, 2, 1]
```

### Funciones útiles de lista

```python
numbers = [5, 2, 8, 1, 9, 3]

print(f"Length:  {len(numbers)}")    # 6
print(f"Min:     {min(numbers)}")    # 1
print(f"Max:     {max(numbers)}")    # 9
print(f"Sum:     {sum(numbers)}")    # 28
print(f"Average: {sum(numbers)/len(numbers):.2f}")  # 4.67

# Check membership
print(f"5 in numbers: {5 in numbers}")      # True
print(f"10 in numbers: {10 in numbers}")    # False
```

## Tuplas

Las tuplas son colecciones ordenadas e **inmutables**. Una vez creadas, no pueden modificarse.

### Crear tuplas

```python
# Empty tuple
empty = ()
empty_alt = tuple()

# Tuple with items
coordinates = (10, 20)
colors = ("red", "green", "blue")
single = (42,)  # Note the comma! Without it, it's just (42) = 42

# Tuple from other iterable
list_data = [1, 2, 3]
tuple_data = tuple(list_data)
print(f"Tuple from list: {tuple_data}")  # (1, 2, 3)
```

### Tupla frente a lista: diferencias clave

| Característica | Lista | Tupla |
|---------|------|-------|
| Sintaxis | `[1, 2, 3]` | `(1, 2, 3)` |
| Mutable | Sí | No |
| Métodos | Muchos (append, remove, etc.) | Pocos (count, index) |
| Rendimiento | Más lenta | Más rápida |
| Caso de uso | Colecciones que cambian | Datos fijos |
| Hashable | No | Sí (puede ser clave de dict) |

### Operaciones con tuplas

```python
# Indexing (same as lists)
point = (3, 5, 7)
print(f"x: {point[0]}")  # 3
print(f"y: {point[1]}")  # 5
print(f"z: {point[2]}")  # 7

# Slicing (same as lists)
numbers = (0, 1, 2, 3, 4, 5)
print(f"[1:4]: {numbers[1:4]}")    # (1, 2, 3)
print(f"[::2]: {numbers[::2]}")    # (0, 2, 4)

# Concatenation
t1 = (1, 2)
t2 = (3, 4)
combined = t1 + t2
print(f"Combined: {combined}")  # (1, 2, 3, 4)

# Repetition
repeated = (0,) * 5
print(f"Repeated: {repeated}")  # (0, 0, 0, 0, 0)
```

### Inmutabilidad de las tuplas

```python
# Lists are mutable
my_list = [1, 2, 3]
my_list[0] = 99
print(f"List after modification: {my_list}")  # [99, 2, 3]

# Tuples are immutable
my_tuple = (1, 2, 3)
# my_tuple[0] = 99  # ERROR: TypeError!
print(f"Tuple unchanged: {my_tuple}")  # (1, 2, 3)
```

> [!NOTE]
> Aunque las tuplas en sí son inmutables, si contienen objetos mutables (como listas), esos objetos todavía pueden modificarse:
> ```python
> data = ([1, 2], [3, 4])
> data[0].append(3)  # This works!
> print(data)  # ([1, 2, 3], [3, 4])
> ```

### Desempaquetado de tuplas

```python
# Basic unpacking
point = (3, 5)
x, y = point
print(f"x = {x}, y = {y}")  # x = 3, y = 5

# Multiple return values (functions return tuples!)
def divide(a, b):
    return a // b, a % b

quotient, remainder = divide(17, 5)
print(f"17 ÷ 5 = {quotient} remainder {remainder}")

# Swapping variables (Python idiom!)
a = 10
b = 20
print(f"Before: a = {a}, b = {b}")
a, b = b, a
print(f"After:  a = {a}, b = {b}")

# Extended unpacking
numbers = (1, 2, 3, 4, 5)
first, *middle, last = numbers
print(f"First: {first}")       # 1
print(f"Middle: {middle}")     # [2, 3, 4]
print(f"Last: {last}")         # 5
```

## Ejemplos prácticos

### Una lista como pila (stack)

```python
# Stack implementation using list
stack = []

# Push (add to top)
stack.append("Task 1")
stack.append("Task 2")
stack.append("Task 3")
print(f"Stack: {stack}")

# Pop (remove from top)
current = stack.pop()
print(f"Processing: {current}")  # Task 3
print(f"Stack: {stack}")         # ['Task 1', 'Task 2']

# Peek (look at top without removing)
print(f"Next task: {stack[-1]}")  # Task 2
```

### Una lista como cola (queue)

```python
from collections import deque

# Queue implementation
queue = deque(["Alice", "Bob", "Charlie"])

# Enqueue (add to end)
queue.append("Diana")
print(f"Queue: {list(queue)}")

# Dequeue (remove from front)
next_person = queue.popleft()
print(f"Serving: {next_person}")  # Alice
print(f"Queue: {list(queue)}")    # ['Bob', 'Charlie', 'Diana']
```

### Ejemplo del mundo real: sistema de gestión de calificaciones

```python
# grade_manager.py
"""Student grade management using lists and tuples."""

def add_student(students, name, grades):
    """Add a student with their grades as a tuple."""
    students.append((name, tuple(grades)))

def calculate_average(grades):
    """Calculate average of a tuple of grades."""
    return sum(grades) / len(grades)

def get_grade_letter(average):
    """Convert numeric average to letter grade."""
    if average >= 90:
        return "A"
    elif average >= 80:
        return "B"
    elif average >= 70:
        return "C"
    elif average >= 60:
        return "D"
    else:
        return "F"

def display_report(students):
    """Display a grade report for all students."""
    print("=" * 55)
    print("         STUDENT GRADE REPORT")
    print("=" * 55)
    print(f"{'Name':<15} {'Grades':<25} {'Avg':>6} {'Grade':>6}")
    print("-" * 55)
    
    class_total = 0
    for name, grades in students:
        avg = calculate_average(grades)
        letter = get_grade_letter(avg)
        grades_str = ", ".join(str(g) for g in grades)
        print(f"{name:<15} {grades_str:<25} {avg:6.1f} {letter:>6}")
        class_total += avg
    
    class_avg = class_total / len(students)
    print("-" * 55)
    print(f"{'Class Average:':<42} {class_avg:6.1f}")
    print("=" * 55)

# Create student database
students = []
add_student(students, "Alice", [92, 88, 95, 90])
add_student(students, "Bob", [78, 82, 75, 80])
add_student(students, "Charlie", [65, 70, 68, 72])
add_student(students, "Diana", [95, 98, 92, 97])
add_student(students, "Eve", [55, 60, 58, 62])

# Display report
display_report(students)
```

Salida:
```
=======================================================
         STUDENT GRADE REPORT
=======================================================
Name            Grades                     Avg  Grade
-------------------------------------------------------
Alice           92, 88, 95, 90            91.2      A
Bob             78, 82, 75, 80            78.8      C
Charlie         65, 70, 68, 72            68.8      D
Diana           95, 98, 92, 97            95.5      A
Eve             55, 60, 58, 62            58.8      F
-------------------------------------------------------
Class Average:                              78.6
=======================================================
```

## Ejercicios prácticos

### Ejercicio 1: creación de listas
Crea una lista con tus 5 películas favoritas e imprime cada una con su índice.

### Ejercicio 2: slicing de listas
Dado `numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`, escribe rebanadas para obtener:
- Los primeros 3 elementos
- Los últimos 3 elementos
- Cada segundo elemento
- Los elementos del índice 3 al 7

### Ejercicio 3: métodos de lista
Empieza con una lista vacía. Añade 5 números, ordénalos, inviértelos, elimina el menor e inserta 100 en la posición 2.

### Ejercicio 4: desempaquetado de tuplas
Escribe una función que devuelva el mínimo, el máximo y la media de una lista como una tupla. Desempaqueta el resultado.

### Ejercicio 5: eliminar duplicados
Escribe una función que elimine los duplicados de una lista conservando el orden.

### Ejercicio 6: operaciones con matrices
Representa una matriz de 3x3 como una lista de listas. Escribe funciones para:
- Obtener una fila concreta
- Obtener una columna concreta
- Calcular la suma de todos los elementos

### Ejercicio 7: gestor de listas de la compra
Crea un programa que permita a los usuarios añadir, eliminar y ver elementos de una lista de la compra usando un bucle de menú.

### Ejercicio 8: la tupla como registro
Crea una lista de tuplas que representen libros: `(title, author, year, price)`. Escribe funciones para:
- Encontrar el libro más caro
- Encontrar todos los libros de un autor concreto
- Calcular el precio medio

## Resumen

En esta lección has aprendido:
- Cómo crear y manipular listas
- Técnicas de indexación y slicing de listas
- Métodos de lista esenciales: append, insert, remove, pop, sort, etc.
- En qué se diferencian las tuplas de las listas (inmutabilidad)
- El desempaquetado de tuplas y sus usos prácticos
- Cómo usar listas como pilas y colas
- Aplicaciones del mundo real de las listas y las tuplas

Las listas y las tuplas son las herramientas principales de almacenamiento de datos en Python. Domínalas para manejar colecciones de datos de forma eficaz.
