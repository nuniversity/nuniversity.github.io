---
title: "Listas y Tuplas"
description: "Aprende los tipos de secuencia de Python: operaciones con listas, inmutabilidad de tuplas, indexación, segmentación y métodos comunes"
order: 7
duration: "30 minutos"
difficulty: "beginner"
---

# Listas y Tuplas

Las listas y tuplas son las estructuras de datos fundamentales de Python para almacenar colecciones ordenadas de elementos.

## Listas (`list`)

Las listas son secuencias ordenadas **mutables** (se pueden modificar):

```python
# Creando listas
fruits = ["apple", "banana", "cherry"]
mixed = [1, "hello", 3.14, True]
empty = []
nested = [[1, 2], [3, 4]]
```

### Indexación

```python
fruits = ["apple", "banana", "cherry", "date"]
print(fruits[0])      # "apple" (primero)
print(fruits[-1])     # "date" (último)
print(fruits[1:3])    # ["banana", "cherry"] (segmentación)
```

### Modificando Listas

```python
fruits[1] = "blueberry"     # Cambiar elemento
fruits.append("elderberry") # Agregar al final
fruits.insert(0, "avocado") # Insertar en posición
fruits.remove("cherry")     # Eliminar por valor
popped = fruits.pop()       # Eliminar y devolver el último
del fruits[0]               # Eliminar por índice
```

### Métodos de Listas

```python
numbers = [3, 1, 4, 1, 5, 9, 2]
numbers.sort()              # [1, 1, 2, 3, 4, 5, 9]
numbers.reverse()           # [9, 5, 4, 3, 2, 1, 1]
print(len(numbers))         # 7
print(numbers.count(1))     # 2
print(3 in numbers)         # True
```

### Operaciones con Listas

```python
# Concatenación
a = [1, 2] + [3, 4]        # [1, 2, 3, 4]

# Repetición
b = ["ha"] * 3             # ["ha", "ha", "ha"]

# Comprensión de listas (vista previa avanzada)
squares = [x**2 for x in range(5)]  # [0, 1, 4, 9, 16]
```

## Tuplas (`tuple`)

Las tuplas son secuencias ordenadas **inmutables** (no se pueden modificar):

```python
# Creando tuplas
point = (3, 4)
colors = ("red", "green", "blue")
single = (1,)       # ¡Se requiere coma al final!
empty = ()          # Tupla vacía
```

### Accediendo a Elementos de Tupla
```python
point = (3, 4)
x = point[0]    # 3
y = point[1]    # 4
```

### Desempaquetado de Tuplas
```python
point = (3, 4)
x, y = point    # x=3, y=4

# Intercambiar variables elegantemente
a, b = 1, 2
a, b = b, a     # a=2, b=1
```

> [!NOTE]
> Las tuplas son más rápidas que las listas y protegen la integridad de los datos. Úsalas para datos fijos como coordenadas, colores RGB o valores de retorno de funciones.

## Cuándo Usar Cada Una

| Característica | Lista | Tupla |
|---|---|---|
| ¿Mutable? | Sí | No |
| Sintaxis | `[1, 2, 3]` | `(1, 2, 3)` |
| Rendimiento | Más lenta | Más rápida |
| Caso de uso | Datos cambiantes | Datos fijos |
| Métodos | Muchos (`append`, `sort`, etc.) | Pocos (`count`, `index`) |

## Ejemplos del Mundo Real

### Carrito de Compras (Lista — cambia a menudo)
```python
cart = []
cart.append("laptop")
cart.append("mouse")
cart.append("keyboard")
total_items = len(cart)
print(f"Cart has {total_items} items")
```

### Color RGB (Tupla — fijo)
```python
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

def apply_color(pixel, color):
    r, g, b = color
    return (pixel[0] * r // 255, pixel[1] * g // 255, pixel[2] * b // 255)
```

### Calificaciones de Estudiantes
```python
grades = [85, 92, 78, 90, 88]
average = sum(grades) / len(grades)
print(f"Average: {average:.1f}")

max_grade = max(grades)
min_grade = min(grades)
print(f"Range: {min_grade} - {max_grade}")
```

> [!SUCCESS]
> Las listas son para colecciones que cambian. Las tuplas son para colecciones que no cambian. En caso de duda, usa listas.

## Preguntas de Práctica

1. Crea una lista de 5 comidas favoritas. Imprime el tercer elemento.
2. ¿Cuál es la diferencia entre `list.append()` y `list.insert()`?
3. ¿Cómo obtienes el último elemento de una lista?
4. ¿Por qué usarías una tupla en lugar de una lista?
5. ¿Qué produce `[1, 2, 3] * 3`?
6. ¿Cómo creas una tupla con un solo elemento?
7. Escribe código que intercambie `a = 5` y `b = 10` usando desempaquetado de tuplas.
8. ¿Cuál es la salida de `[x*2 for x in range(4)]`?
9. ¿Cómo verificas si un elemento existe en una lista?
10. ¿Qué sucede si intentas `my_tuple[0] = 5`?
